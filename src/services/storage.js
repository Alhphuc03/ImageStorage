import { INITIAL_FOLDERS, INITIAL_PHOTOS } from '../data/sampleData';

const FOLDERS_KEY = 'storage_app_folders_v2';
const PHOTOS_KEY = 'storage_app_photos_v2';
const PREFS_KEY = 'storage_app_prefs_v1';
const LEGACY_FOLDERS_KEY = 'storage_app_folders_v1';
const LEGACY_PHOTOS_KEY = 'storage_app_photos_v1';

// IDs của ảnh và album mẫu Unsplash để loại bỏ hoàn toàn
const SAMPLE_PHOTO_IDS = new Set([
  'photo-1', 'photo-2', 'photo-3', 'photo-4', 
  'photo-5', 'photo-6', 'photo-7', 'photo-8'
]);

const SAMPLE_FOLDER_IDS = new Set([
  'family', 'travel', 'garden', 'memories', 'tet'
]);

// Lấy danh sách thư mục thực tế từ LocalStorage (Lọc bỏ toàn bộ 5 album mẫu cũ)
export const getStoredFolders = () => {
  try {
    let data = localStorage.getItem(FOLDERS_KEY);
    if (data === null) {
      data = localStorage.getItem(LEGACY_FOLDERS_KEY);
    }

    if (data !== null) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        const realFolders = parsed.filter(f => f && typeof f === 'object' && f.id && !SAMPLE_FOLDER_IDS.has(f.id));
        return realFolders;
      }
    }
  } catch (e) {
    console.error('Lỗi khi đọc thư mục từ LocalStorage:', e);
  }

  // Mặc định là danh sách rỗng để người dùng tự do tạo album của riêng mình
  return [];
};

// Lưu danh sách thư mục
export const saveFolders = (folders) => {
  try {
    const safeFolders = Array.isArray(folders) ? folders.filter(Boolean) : [];
    const realFolders = safeFolders.filter(f => f && !SAMPLE_FOLDER_IDS.has(f.id));
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(realFolders));
  } catch (e) {
    console.error('Lỗi khi lưu thư mục vào LocalStorage:', e);
  }
};

// Lấy danh sách ảnh thực tế từ LocalStorage (Lọc bỏ data mẫu)
export const getStoredPhotos = () => {
  try {
    let data = localStorage.getItem(PHOTOS_KEY);
    if (data === null) {
      data = localStorage.getItem(LEGACY_PHOTOS_KEY);
    }

    if (data !== null) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        // Lọc bỏ các ảnh mẫu Unsplash ảo và các ảnh gắn với album mẫu đã bị xóa
        const realPhotos = parsed.filter(p => p && typeof p === 'object' && p.id && p.url && !SAMPLE_PHOTO_IDS.has(p.id));
        return realPhotos;
      }
    }
  } catch (e) {
    console.error('Lỗi khi đọc ảnh từ LocalStorage:', e);
  }

  return [];
};

// Lưu danh sách ảnh vào LocalStorage an toàn
export const savePhotos = (photos) => {
  try {
    const safePhotos = Array.isArray(photos) ? photos.filter(Boolean) : [];
    const realPhotos = safePhotos.filter(p => p && !SAMPLE_PHOTO_IDS.has(p.id));
    
    try {
      localStorage.setItem(PHOTOS_KEY, JSON.stringify(realPhotos));
    } catch (quotaError) {
      console.warn('LocalStorage vượt dung lượng, dữ liệu đầy đủ được bảo vệ an toàn trong IndexedDB.');
      const lightweightPhotos = realPhotos.map(p => ({
        ...p,
        url: p.url && p.url.length > 5000 ? p.url.slice(0, 200) + '...' : p.url
      }));
      localStorage.setItem(PHOTOS_KEY, JSON.stringify(lightweightPhotos));
    }
  } catch (e) {
    console.error('Lỗi khi lưu ảnh vào LocalStorage:', e);
  }
};

// Lấy tùy chọn người dùng
export const getStoredPrefs = () => {
  try {
    const data = localStorage.getItem(PREFS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Lỗi khi đọc tùy chọn:', e);
  }
  return {
    fontSize: 'large',
    theme: 'light',
    speechEnabled: true
  };
};

// Lưu tùy chọn người dùng
export const savePrefs = (prefs) => {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error('Lỗi khi lưu tùy chọn:', e);
  }
};

// Khôi phục dữ liệu mẫu ban đầu (chỉ khi người dùng chủ động bấm yêu cầu trong Cài Đặt)
export const resetToSampleData = () => {
  saveFolders(INITIAL_FOLDERS);
  savePhotos(INITIAL_PHOTOS);
  return {
    folders: INITIAL_FOLDERS,
    photos: INITIAL_PHOTOS
  };
};

// Xóa sạch toàn bộ ảnh
export const clearAllData = () => {
  try {
    localStorage.removeItem(PHOTOS_KEY);
    localStorage.removeItem(LEGACY_PHOTOS_KEY);
    localStorage.removeItem(FOLDERS_KEY);
    localStorage.removeItem(LEGACY_FOLDERS_KEY);
  } catch (e) {
    console.error(e);
  }
};
