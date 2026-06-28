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

/**
 * Saves a ChatMessage to IndexedDB, keyed by the active user's ID.
 */
export async function saveMessageToDB(message: ChatMessage, userId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // Inject the userId into the record prior to saving
      const record = {
        ...message,
        userId: userId
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
 * Retrieves all chat messages from IndexedDB belonging strictly to the active user.
 */
export async function getMessagesFromDB(userId: string): Promise<ChatMessage[]> {
  try {
    const db = await openDB();
    return new Promise<ChatMessage[]>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result || [];
        // Filter records strictly by the active user's ID
        const filtered = results.filter((record: any) => record.userId === userId);
        resolve(filtered);
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
