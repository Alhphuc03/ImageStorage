/**
 * Dịch vụ cơ sở dữ liệu IndexedDB lưu trữ ảnh và thư mục
 * Hỗ trợ lưu trữ dung lượng lớn không giới hạn 5MB của LocalStorage
 */

const DB_NAME = 'StorageImageDB';
const DB_VERSION = 1;
const STORE_PHOTOS = 'photos';
const STORE_FOLDERS = 'folders';

let dbInstance = null;

const getDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      return resolve(dbInstance);
    }

    if (typeof window === 'undefined' || !window.indexedDB) {
      return resolve(null);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_PHOTOS)) {
        db.createObjectStore(STORE_PHOTOS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_FOLDERS)) {
        db.createObjectStore(STORE_FOLDERS, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('Lỗi khi khởi tạo IndexedDB:', event.target.error);
      resolve(null);
    };
  });
};

const SAMPLE_PHOTO_IDS = new Set([
  'photo-1', 'photo-2', 'photo-3', 'photo-4', 
  'photo-5', 'photo-6', 'photo-7', 'photo-8'
]);

const SAMPLE_FOLDER_IDS = new Set([
  'family', 'travel', 'garden', 'memories', 'tet'
]);

export const loadPhotosFromDB = async () => {
  try {
    const db = await getDB();
    if (!db) return null;

    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_PHOTOS], 'readonly');
      const store = transaction.objectStore(STORE_PHOTOS);
      const request = store.getAll();

      request.onsuccess = () => {
        const result = request.result;
        if (Array.isArray(result)) {
          const realPhotos = result.filter(p => p && p.id && !SAMPLE_PHOTO_IDS.has(p.id));
          return resolve(realPhotos);
        }
        resolve([]);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (e) {
    console.error('Lỗi khi tải ảnh từ IndexedDB:', e);
    return null;
  }
};

export const savePhotosToDB = async (photos) => {
  try {
    const db = await getDB();
    if (!db) return false;

    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_PHOTOS], 'readwrite');
      const store = transaction.objectStore(STORE_PHOTOS);

      store.clear().onsuccess = () => {
        const safePhotos = Array.isArray(photos) ? photos.filter(Boolean) : [];
        if (safePhotos.length === 0) {
          return resolve(true);
        }

        let added = 0;
        safePhotos.forEach((photo) => {
          if (photo && photo.id) {
            store.put(photo);
          }
          added++;
          if (added === safePhotos.length) {
            resolve(true);
          }
        });
      };

      transaction.onerror = () => resolve(false);
    });
  } catch (e) {
    console.error('Lỗi khi lưu ảnh vào IndexedDB:', e);
    return false;
  }
};

export const loadFoldersFromDB = async () => {
  try {
    const db = await getDB();
    if (!db) return null;

    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_FOLDERS], 'readonly');
      const store = transaction.objectStore(STORE_FOLDERS);
      const request = store.getAll();

      request.onsuccess = () => {
        const result = request.result;
        if (Array.isArray(result)) {
          const realFolders = result.filter(f => f && f.id && !SAMPLE_FOLDER_IDS.has(f.id));
          return resolve(realFolders);
        }
        resolve([]);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (e) {
    console.error('Lỗi khi tải thư mục từ IndexedDB:', e);
    return null;
  }
};

export const saveFoldersToDB = async (folders) => {
  try {
    const db = await getDB();
    if (!db) return false;

    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_FOLDERS], 'readwrite');
      const store = transaction.objectStore(STORE_FOLDERS);

      store.clear().onsuccess = () => {
        const safeFolders = Array.isArray(folders) ? folders.filter(Boolean) : [];
        if (safeFolders.length === 0) {
          return resolve(true);
        }

        let added = 0;
        safeFolders.forEach((folder) => {
          if (folder && folder.id) {
            store.put(folder);
          }
          added++;
          if (added === safeFolders.length) {
            resolve(true);
          }
        });
      };

      transaction.onerror = () => resolve(false);
    });
  } catch (e) {
    console.error('Lỗi khi lưu thư mục vào IndexedDB:', e);
    return false;
  }
};
