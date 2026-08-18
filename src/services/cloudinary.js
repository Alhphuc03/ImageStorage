/**
 * Dịch vụ tải ảnh trực tiếp lên Cloudinary (Client-side Unsigned Upload)
 */

export const CLOUDINARY_STORAGE_KEY = 'storage_cloudinary_config_v1';

export const DEFAULT_CLOUDINARY_CONFIG = {
  cloudName: 'dojsevb9v',
  uploadPreset: 'storage_preset',
  folder: 'storage_photos'
};

export const getStoredCloudinaryConfig = () => {
  try {
    const data = localStorage.getItem(CLOUDINARY_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        return {
          cloudName: parsed.cloudName || DEFAULT_CLOUDINARY_CONFIG.cloudName,
          uploadPreset: parsed.uploadPreset || DEFAULT_CLOUDINARY_CONFIG.uploadPreset,
          folder: parsed.folder || DEFAULT_CLOUDINARY_CONFIG.folder
        };
      }
    }
  } catch (e) {
    console.error('Error reading Cloudinary config:', e);
  }
  return DEFAULT_CLOUDINARY_CONFIG;
};

export const saveCloudinaryConfig = (config) => {
  try {
    localStorage.setItem(CLOUDINARY_STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch (e) {
    console.error('Error saving Cloudinary config:', e);
    return false;
  }
};

/**
 * Tải ảnh trực tiếp lên Cloudinary bằng Unsigned Preset
 * @param {File} file - File ảnh từ máy
 * @param {Object} options - { cloudName, uploadPreset, folder }
 * @param {Function} onProgress - Callback tiến độ (0 - 100)
 * @returns {Promise<Object>} Thông tin ảnh tải lên
 */
export const uploadToCloudinary = (file, options = {}, onProgress = null) => {
  return new Promise((resolve, reject) => {
    const config = {
      ...getStoredCloudinaryConfig(),
      ...options
    };

    // Nếu chưa cấu hình Cloudinary, nén và lưu trữ cục bộ vào bộ nhớ IndexedDB/LocalStorage
    if (!config.cloudName || !config.uploadPreset) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Tính toán kích thước tối ưu (tối đa 1600px cho chất lượng sắc nét nhưng nhẹ)
          const MAX_DIM = 1600;
          let width = img.width;
          let height = img.height;

          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Nén ảnh JPEG chất lượng cao 85%
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

          if (onProgress) onProgress(100);

          resolve({
            url: compressedDataUrl,
            secure_url: compressedDataUrl,
            public_id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            format: 'jpeg',
            bytes: Math.round(compressedDataUrl.length * 0.75),
            width,
            height,
            created_at: new Date().toISOString(),
            isLocal: true
          });
        };

        img.onerror = () => {
          // Fallback nếu ảnh không vẽ được lên canvas
          resolve({
            url: e.target.result,
            secure_url: e.target.result,
            public_id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            format: file.name.split('.').pop() || 'jpg',
            bytes: file.size,
            width: 1200,
            height: 800,
            created_at: new Date().toISOString(),
            isLocal: true
          });
        };

        img.src = e.target.result;
      };

      reader.onerror = () => reject(new Error('Không thể đọc file ảnh từ máy'));
      reader.readAsDataURL(file);
      return;
    }

    // Tải lên Cloudinary API chính thức
    const url = `https://api.cloudinary.com/v1_1/${config.cloudName.trim()}/image/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', config.uploadPreset.trim());
    if (config.folder) {
      formData.append('folder', config.folder.trim());
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({
            url: response.url,
            secure_url: response.secure_url,
            public_id: response.public_id,
            format: response.format,
            bytes: response.bytes,
            width: response.width,
            height: response.height,
            created_at: response.created_at || new Date().toISOString(),
            isLocal: false
          });
        } catch (err) {
          reject(new Error('Lỗi phản hồi dữ liệu từ Cloudinary'));
        }
      } else {
        try {
          const errRes = JSON.parse(xhr.responseText);
          const rawMsg = errRes.error?.message || '';
          
          let friendlyMsg = rawMsg;
          if (rawMsg.toLowerCase().includes('cloud_name is disabled')) {
            friendlyMsg = `Tên Cloud "${config.cloudName}" đang bị vô hiệu hóa hoặc chưa kích hoạt trên Cloudinary. Vui lòng kiểm tra lại tài khoản Cloudinary hoặc đổi sang Cloud Name khác.`;
          } else if (rawMsg.toLowerCase().includes('upload preset') || rawMsg.toLowerCase().includes('preset')) {
            friendlyMsg = `Upload Preset "${config.uploadPreset}" không hợp lệ hoặc chưa được chuyển sang chế độ "Unsigned". Vui lòng kiểm tra lại cài đặt Preset trên Cloudinary.`;
          } else if (rawMsg.toLowerCase().includes('not found')) {
            friendlyMsg = `Không tìm thấy tài khoản Cloud Name "${config.cloudName}". Vui lòng kiểm tra lại chính xác tên Cloud Name trong Dashboard Cloudinary.`;
          } else if (!friendlyMsg) {
            friendlyMsg = `Lỗi tải lên (${xhr.status}). Vui lòng kiểm tra lại Cloud Name và Upload Preset.`;
          }

          const error = new Error(friendlyMsg);
          error.rawMessage = rawMsg;
          error.status = xhr.status;
          reject(error);
        } catch (e) {
          reject(new Error(`Tải lên thất bại với mã lỗi ${xhr.status}. Vui lòng thử lại.`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Không thể kết nối tới máy chủ Cloudinary. Vui lòng kiểm tra mạng Internet.'));
    };

    xhr.send(formData);
  });
};

/**
 * Tối ưu hóa đường dẫn ảnh Cloudinary (Tự động nén, đổi định dạng webp nhẹ, điều chỉnh kích thước)
 */
export const getOptimizedImageUrl = (url, width = 800) => {
  if (!url || typeof url !== 'string') return '';
  if (!url.includes('cloudinary.com')) return url;

  // Chèn transformation f_auto,q_auto,w_{width},c_limit vào trước /v... hoặc /upload/
  if (url.includes('/upload/')) {
    const parts = url.split('/upload/');
    return `${parts[0]}/upload/f_auto,q_auto,w_${width},c_limit/${parts[1]}`;
  }
  return url;
};

/**
 * Thử nghiệm kết nối tới Cloudinary
 */
export const testCloudinaryConnection = async (cloudName, uploadPreset) => {
  if (!cloudName || !uploadPreset) {
    return { success: false, message: 'Vui lòng nhập đầy đủ Tên Cloud (Cloud Name) và Preset tải lên (Upload Preset)!' };
  }

  try {
    // Tạo 1 canvas 1x1 pixel nhỏ để test upload
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, 0, 1, 1);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    const testFile = new File([blob], 'test_connection.png', { type: 'image/png' });

    await uploadToCloudinary(testFile, { cloudName, uploadPreset });
    return { success: true, message: 'Kết nối Cloudinary thành công rực rỡ! Bạn có thể lưu và sử dụng ngay.' };
  } catch (error) {
    return { success: false, message: error.message || 'Kết nối không thành công. Hãy đảm bảo Preset ở trạng thái "Unsigned".' };
  }
};
