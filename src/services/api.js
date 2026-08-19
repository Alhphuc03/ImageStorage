/**
 * Dịch vụ API Frontend giao tiếp với Netlify Functions & MongoDB
 */

const API_BASE = '/api';

// --- FOLDERS (ALBUMS) ---

export const fetchFoldersApi = async () => {
  try {
    const res = await fetch(`${API_BASE}/folders`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const result = await res.json();
    return result.success && Array.isArray(result.data) ? result.data : null;
  } catch (error) {
    console.warn('Không thể kết nối API /api/folders, sử dụng dữ liệu cục bộ:', error.message);
    return null;
  }
};

export const saveFolderApi = async (folder) => {
  try {
    const res = await fetch(`${API_BASE}/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(folder)
    });
    const result = await res.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error('Lỗi khi lưu folder qua API:', error);
    return null;
  }
};

export const deleteFolderApi = async (folderId) => {
  try {
    const res = await fetch(`${API_BASE}/folders?id=${encodeURIComponent(folderId)}`, {
      method: 'DELETE'
    });
    const result = await res.json();
    return result.success;
  } catch (error) {
    console.error('Lỗi khi xóa folder qua API:', error);
    return false;
  }
};

export const saveAllFoldersApi = async (folders) => {
  try {
    const res = await fetch(`${API_BASE}/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(folders)
    });
    const result = await res.json();
    return result.success;
  } catch (error) {
    console.error('Lỗi khi lưu danh sách folders qua API:', error);
    return false;
  }
};

export const clearAllFoldersApi = async () => {
  try {
    const res = await fetch(`${API_BASE}/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([])
    });
    const result = await res.json();
    return result.success;
  } catch (error) {
    console.error('Lỗi khi dọn sạch albums qua API:', error);
    return false;
  }
};

// --- PHOTOS ---

export const fetchPhotosApi = async () => {
  try {
    const res = await fetch(`${API_BASE}/photos`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const result = await res.json();
    return result.success && Array.isArray(result.data) ? result.data : null;
  } catch (error) {
    console.warn('Không thể kết nối API /api/photos, sử dụng dữ liệu cục bộ:', error.message);
    return null;
  }
};

export const addPhotosApi = async (photos) => {
  try {
    const res = await fetch(`${API_BASE}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(photos)
    });
    const result = await res.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error('Lỗi khi thêm photos qua API:', error);
    return null;
  }
};

export const updatePhotoApi = async (photo) => {
  try {
    const res = await fetch(`${API_BASE}/photos`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(photo)
    });
    const result = await res.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error('Lỗi khi cập nhật photo qua API:', error);
    return null;
  }
};

export const deletePhotoApi = async (photoId) => {
  try {
    const res = await fetch(`${API_BASE}/photos?id=${encodeURIComponent(photoId)}`, {
      method: 'DELETE'
    });
    const result = await res.json();
    return result.success;
  } catch (error) {
    console.error('Lỗi khi xóa photo qua API:', error);
    return false;
  }
};

export const clearAllPhotosApi = async () => {
  try {
    const res = await fetch(`${API_BASE}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'bulk_save', photos: [] })
    });
    const result = await res.json();
    return result.success;
  } catch (error) {
    console.error('Lỗi khi dọn sạch ảnh qua API:', error);
    return false;
  }
};

export const deleteR2FileApi = async (urlOrKey) => {
  try {
    const res = await fetch(`${API_BASE}/r2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', url: urlOrKey })
    });
    return res.ok;
  } catch (err) {
    console.warn('Lỗi xóa R2:', err);
    return false;
  }
};

export const clearAllR2FilesApi = async () => {
  try {
    const res = await fetch(`${API_BASE}/r2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear_all' })
    });
    return res.ok;
  } catch (err) {
    console.warn('Lỗi xóa toàn bộ R2:', err);
    return false;
  }
};

export const bulkSavePhotosApi = async (photos) => {
  try {
    const res = await fetch(`${API_BASE}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'bulk_save', photos })
    });
    const result = await res.json();
    return result.success;
  } catch (error) {
    console.error('Lỗi khi bulk save photos qua API:', error);
    return false;
  }
};
