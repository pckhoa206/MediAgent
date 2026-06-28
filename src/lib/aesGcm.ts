/**
 * AES-GCM Encryption and Decryption using the Browser Web Crypto API.
 * Conforms to Zero-Trust PII Masking requirements in AGENTS.md.
 */

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/**
 * Derives an AES-GCM CryptoKey from a user-supplied string secret key.
 * Uses SHA-256 to hash the key material to a standard 256-bit key length.
 */
async function deriveKey(secretKey: string): Promise<CryptoKey> {
  const rawKey = textEncoder.encode(secretKey || 'mediagent-default-secret-key-32-chars');
  const keyDigest = await crypto.subtle.digest('SHA-256', rawKey);
  
  return crypto.subtle.importKey(
    'raw',
    keyDigest,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plain text string using AES-256-GCM.
 * Returns a URL-safe Base64 encoded string representing: IV (12 bytes) + Ciphertext + Auth Tag.
 */
export async function encryptData(plainText: string, secretKey: string): Promise<string> {
  if (!plainText) return '';
  try {
    const key = await deriveKey(secretKey);
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 bytes IV is standard for GCM
    const encodedPlain = textEncoder.encode(plainText);
    
    const ciphertextBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encodedPlain
    );
    
    // Combine IV and Ciphertext (which includes the 16-byte GCM authentication tag at the end)
    const ciphertextArray = new Uint8Array(ciphertextBuffer);
    const combined = new Uint8Array(iv.length + ciphertextArray.length);
    combined.set(iv, 0);
    combined.set(ciphertextArray, iv.length);
    
    // Convert to URL-safe Base64 representation
    const binString = String.fromCharCode(...combined);
    return btoa(binString)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (error) {
    console.error('[aesGcm.ts] Encryption failed:', error);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypts a URL-safe Base64 encoded AES-256-GCM ciphertext.
 */
export async function decryptData(encryptedText: string, secretKey: string): Promise<string> {
  if (!encryptedText) return '';
  try {
    const key = await deriveKey(secretKey);
    
    // Restore standard Base64 string and decode
    let base64 = encryptedText.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    
    const binString = atob(base64);
    const combined = new Uint8Array(binString.length);
    for (let i = 0; i < binString.length; i++) {
      combined[i] = binString.charCodeAt(i);
    }
    
    if (combined.length < 28) { // 12 bytes IV + at least 16 bytes auth tag
      throw new Error('Ciphertext is too short');
    }
    
    // Extract IV (first 12 bytes) and ciphertext (remaining bytes)
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      ciphertext
    );
    
    return textDecoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('[aesGcm.ts] Decryption failed:', error);
    throw new Error('Decryption failed');
  }
}
