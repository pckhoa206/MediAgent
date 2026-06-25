/**
 * Web Crypto API AES-256-GCM Helper
 * Implements hardware-backed, non-extractable session encryption pipelines.
 */

// Helper to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return typeof window !== 'undefined' ? window.btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
}

// Helper to convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = typeof window !== 'undefined' ? window.atob(base64) : Buffer.from(base64, 'base64').toString('binary');
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generates an ephemeral, non-extractable AES-256-GCM CryptoKey.
 */
export async function generateSessionKey(): Promise<CryptoKey> {
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error('Web Crypto API is not supported in this environment.');
  }

  return await cryptoObj.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    false, // extractable = false (key bytes cannot be read by JS)
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts cleartext string using AES-GCM 256.
 */
export async function encryptData(
  plainText: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);

  // AES-GCM standard recommends 12 bytes IV
  const iv = cryptoObj.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await cryptoObj.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  );

  return {
    ciphertext: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

/**
 * Decrypts ciphertext using AES-GCM 256.
 */
export async function decryptData(
  ciphertextBase64: string,
  ivBase64: string,
  key: CryptoKey
): Promise<string> {
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
  const decoder = new TextDecoder();

  const data = base64ToArrayBuffer(ciphertextBase64);
  const iv = base64ToArrayBuffer(ivBase64);

  const decryptedBuffer = await cryptoObj.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(iv),
    },
    key,
    data
  );

  return decoder.decode(decryptedBuffer);
}
