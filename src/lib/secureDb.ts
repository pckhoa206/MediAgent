import { ChatMessage } from '@/store/useChatStore';

const DB_NAME = 'mediagent_secure_db';
const DB_VERSION = 1;
const STORE_NAME = 'chat_messages';

/**
 * Opens and initializes the IndexedDB database.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB is only available in browser environments'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[secureDb.ts] Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

import { encryptData, decryptData } from './aesGcm';

const getCryptoSecretForUser = (userId: string): string => {
  const baseSecret = typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_CRYPTO_SECRET
    ? process.env.NEXT_PUBLIC_CRYPTO_SECRET
    : 'mediagent-default-secret-key-32-chars';
  return `${baseSecret}_${userId}`;
};

/**
 * Saves a ChatMessage to IndexedDB, keyed by the active user's ID and session ID.
 */
export async function saveMessageToDB(message: ChatMessage, userId: string, sessionId: string): Promise<void> {
  try {
    const db = await openDB();
    const secretKey = getCryptoSecretForUser(userId);
    const encryptedContent = await encryptData(message.content, secretKey);

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // Inject the userId and sessionId into the record prior to saving and encrypt content
      const record = {
        ...message,
        content: encryptedContent,
        isEncrypted: true,
        userId: userId,
        sessionId: sessionId
      };
      
      const request = store.put(record);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('[secureDb.ts] Error saving message:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[secureDb.ts] saveMessageToDB failed:', error);
  }
}

/**
 * Retrieves all chat messages from IndexedDB belonging strictly to the active user and session.
 */
export async function getMessagesFromDB(userId: string, sessionId?: string): Promise<ChatMessage[]> {
  try {
    const db = await openDB();
    const secretKey = getCryptoSecretForUser(userId);

    return new Promise<ChatMessage[]>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = async () => {
        const results = request.result || [];
        // Filter records strictly by the active user's ID and session ID
        const filtered = results.filter((record: any) => 
          record.userId === userId && (!sessionId || record.sessionId === sessionId)
        );
        
        // Decrypt records in parallel
        const decrypted = await Promise.all(
          filtered.map(async (record: any) => {
            if (record.isEncrypted && record.content) {
              try {
                const plainText = await decryptData(record.content, secretKey);
                return {
                  ...record,
                  content: plainText
                };
              } catch (e) {
                console.error(`[secureDb.ts] Failed to decrypt message ${record.id}:`, e);
                return {
                  ...record,
                  content: '[Mất khóa giải mã - Tin nhắn được bảo mật]'
                };
              }
            }
            return record;
          })
        );

        resolve(decrypted);
      };

      request.onerror = () => {
        console.error('[secureDb.ts] Error fetching messages:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[secureDb.ts] getMessagesFromDB failed:', error);
    return [];
  }
}

/**
 * Clears chat messages for a specific user from IndexedDB.
 */
export async function clearMessagesFromDB(userId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as any).result;
        if (cursor) {
          if (cursor.value.userId === userId) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => {
        console.error('[secureDb.ts] Error clearing database:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[secureDb.ts] clearMessagesFromDB failed:', error);
  }
}

/**
 * Deletes a specific chat session for a user from IndexedDB.
 */
export async function deleteSessionFromDB(userId: string, sessionId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as any).result;
        if (cursor) {
          if (cursor.value.userId === userId && cursor.value.sessionId === sessionId) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => {
        console.error('[secureDb.ts] Error deleting session from DB:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[secureDb.ts] deleteSessionFromDB failed:', error);
  }
}
