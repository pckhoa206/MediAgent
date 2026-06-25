import { encryptData, decryptData } from './aesGcm';

const DB_NAME = 'MedConciergeSecureDB';
const DB_VERSION = 1;
const STORE_NAME = 'encrypted_chats';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB is only available in browser environments.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export interface EncryptedRecord {
  id: string;
  ciphertext: string;
  iv: string;
  timestamp: number;
}

/**
 * Encrypts and saves a message block in IndexedDB.
 */
export async function saveEncryptedMessage(
  id: string,
  content: string,
  key: CryptoKey
): Promise<void> {
  const db = await openDatabase();
  const { ciphertext, iv } = await encryptData(content, key);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const record: EncryptedRecord = {
      id,
      ciphertext,
      iv,
      timestamp: Date.now()
    };

    const request = store.put(record);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Decrypts and loads all stored chat messages from IndexedDB.
 */
export async function loadDecryptedMessages(
  key: CryptoKey
): Promise<{ id: string; content: string }[]> {
  const db = await openDatabase();

  const records: EncryptedRecord[] = await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  // Decrypt each record in parallel
  const decryptedPromises = records.map(async (record) => {
    try {
      const content = await decryptData(record.ciphertext, record.iv, key);
      return { id: record.id, content };
    } catch (e) {
      console.error(`Failed to decrypt record ${record.id}:`, e);
      return { id: record.id, content: '[DECRYPTION_FAILED_MALFORMED_KEY]' };
    }
  });

  return Promise.all(decryptedPromises);
}

/**
 * Clears all encrypted chat records in IndexedDB (used on Logout).
 */
export async function clearSecureDb(): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
