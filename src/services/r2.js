/**
 * Dịch vụ nén ảnh thông minh và lưu trữ lên Cloudflare R2 Object Storage
 * Hỗ trợ mọi loại ảnh: JPG, PNG, WEBP, HEIC/HEIF (iPhone), GIF, SVG, BMP, AVIF
 */
import heic2any from 'heic2any';

export const R2_STORAGE_KEY = 'storage_cloudflare_r2_config_v1';
export const COMPRESSION_SETTING_KEY = 'storage_image_compression_quality_v1';

// Mức nén ảnh
export const COMPRESSION_PROFILES = {
  max_saver: {
    name: 'Siêu tiết kiệm dung lượng (Khuyên dùng)',
    description: 'Chứa hơn 50.000 ảnh. Nén WebP ~150KB, sắc nét chuẩn Full HD',
    maxDimension: 1800,
    quality: 0.80,
    format: 'image/webp'
  },
  balanced: {
    name: 'Cân bằng & Sắc nét 2K',
    description: 'Chứa ~30.000 ảnh. Nén WebP ~280KB, độ phân giải 2K',
    maxDimension: 2200,
    quality: 0.85,
    format: 'image/webp'
  },
  high_quality: {
    name: 'Chất lượng cao nhất 4K',
    description: 'Chứa ~15.000 ảnh. Nén WebP ~500KB, độ phân giải cao',
    maxDimension: 2800,
    quality: 0.90,
    format: 'image/webp'
  },
  original: {
    name: 'Giữ nguyên gốc (Không nén)',
    description: 'Tải nguyên file gốc lên R2 không qua nén',
    maxDimension: null,
    quality: 1,
    format: null
  }
};

export const getStoredCompressionProfile = () => {
  try {
    const saved = localStorage.getItem(COMPRESSION_SETTING_KEY);
    if (saved && COMPRESSION_PROFILES[saved]) {
      return saved;
    }
  } catch (e) {
    // ignore
  }
  return 'max_saver';
};

export const saveStoredCompressionProfile = (profileKey) => {
  try {
    if (COMPRESSION_PROFILES[profileKey]) {
      localStorage.setItem(COMPRESSION_SETTING_KEY, profileKey);
      return true;
    }
  } catch (e) {
    // ignore
  }
  return false;
};

export const DEFAULT_R2_CONFIG = {
  accountId: 'bdf74f1e508bfad4f11f52b52840d3cf',
  accessKeyId: '6f6eceef3545145fb0c84f36e1b01a3d',
  secretAccessKey: 'c7cba26a4298b44bd1de2c0063c80b7831939c7ca655872f54a299681dfd9b42',
  bucketName: 'storage-photos',
  publicDomain: 'https://pub-9dfda764c3f34e2fa79777a1b8087fa2.r2.dev',
  folder: 'photos'
};

export const getStoredR2Config = () => {
  try {
    const data = localStorage.getItem(R2_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        return {
          accountId: parsed.accountId || '',
          accessKeyId: parsed.accessKeyId || '',
          secretAccessKey: parsed.secretAccessKey || '',
          bucketName: parsed.bucketName || '',
          publicDomain: parsed.publicDomain || '',
          folder: parsed.folder || 'photos'
        };
      }
    }
  } catch (e) {
    console.error('Lỗi khi đọc cấu hình R2:', e);
  }
  return DEFAULT_R2_CONFIG;
};

export const saveR2Config = (config) => {
  try {
    localStorage.setItem(R2_STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch (e) {
    console.error('Lỗi khi lưu cấu hình R2:', e);
    return false;
  }
};

/**
 * Xử lý file ảnh trước khi nén (chuyển đổi HEIC của iPhone sang JPEG/PNG trước)
 */
const prepareImageFile = async (file) => {
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  // 1. Nếu là ảnh HEIC/HEIF từ iPhone / iPad
  if (
    fileType === 'image/heic' || 
    fileType === 'image/heif' || 
    fileName.endsWith('.heic') || 
    fileName.endsWith('.heif')
  ) {
    try {
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.92
      });
      const singleBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      return new File([singleBlob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
        type: 'image/jpeg'
      });
    } catch (err) {
      console.warn('Lỗi khi chuyển đổi HEIC, tiếp tục thử bằng FileReader:', err);
    }
  }

  return file;
};

/**
 * Nén ảnh thông minh tại Client sang định dạng WebP siêu nhẹ
 * @param {File} rawFile - File ảnh ban đầu
 * @param {string} profileKey - Mức nén (max_saver, balanced, high_quality, original)
 * @returns {Promise<{ blob: Blob, dataUrl: string, width: number, height: number, originalSize: number, compressedSize: number, filename: string, contentType: string }>}
 */
export const compressImageSmart = async (rawFile, profileKey = null) => {
  const file = await prepareImageFile(rawFile);
  const profileName = profileKey || getStoredCompressionProfile();
  const profile = COMPRESSION_PROFILES[profileName] || COMPRESSION_PROFILES.max_saver;

  const fileName = file.name;
  const isSvg = file.type === 'image/svg+xml' || fileName.toLowerCase().endsWith('.svg');
  const isGif = file.type === 'image/gif' || fileName.toLowerCase().endsWith('.gif');

  // SVG hoặc GIF ảnh động hoặc chế độ Original -> Giữ nguyên file gốc
  if (isSvg || isGif || profileName === 'original') {
    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });

    return {
      blob: file,
      dataUrl,
      width: 1200,
      height: 800,
      originalSize: file.size,
      compressedSize: file.size,
      filename: fileName,
      contentType: file.type || 'image/jpeg',
      isOriginal: true
    };
  }

  // Tối ưu các định dạng ảnh raster thông thường (JPG, PNG, WebP, BMP, v.v.)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const maxDim = profile.maxDimension || 1800;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Bật làm mịn ảnh
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Xuất ra WebP với chất lượng tối ưu
        const outputFormat = 'image/webp';
        const dataUrl = canvas.toDataURL(outputFormat, profile.quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Không thể nén ảnh thành công'));
            }

            const cleanName = fileName.replace(/\.[^/.]+$/, '') + '.webp';
            resolve({
              blob,
              dataUrl,
              width,
              height,
              originalSize: rawFile.size,
              compressedSize: blob.size,
              filename: cleanName,
              contentType: outputFormat,
              isOriginal: false
            });
          },
          outputFormat,
          profile.quality
        );
      };

      img.onerror = () => {
        resolve({
          blob: file,
          dataUrl: e.target.result,
          width: 1200,
          height: 800,
          originalSize: file.size,
          compressedSize: file.size,
          filename: fileName,
          contentType: file.type || 'image/jpeg',
          isOriginal: true
        });
      };

      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('Không thể đọc file ảnh'));
    reader.readAsDataURL(file);
  });
};

/**
 * Tải ảnh lên Cloudflare R2 thông qua Netlify Serverless API
 * @param {File} file - File ảnh
 * @param {Object} customConfig - Cấu hình R2 (tùy chọn)
 * @param {Function} onProgress - Callback tiến độ (0 - 100)
 */
export const uploadToR2 = async (file, customConfig = null, onProgress = null) => {
  // 1. Tiến hành nén ảnh thông minh trước (WebP ~150KB)
  if (onProgress) onProgress(20);
  const compressed = await compressImageSmart(file);
  if (onProgress) onProgress(45);

  const localConfig = customConfig || getStoredR2Config();

  // 2. Gửi dữ liệu nén trực tiếp lên R2 thông qua Serverless Function (Khắc phục hoàn toàn lỗi CORS trình duyệt)
  const apiEndpoint = '/.netlify/functions/r2';
  const uploadPayload = {
    action: 'upload_direct',
    filename: `img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}_${compressed.filename}`,
    contentType: compressed.contentType,
    folder: localConfig.folder || 'photos',
    base64: compressed.dataUrl,
    config: {
      accountId: localConfig.accountId || '',
      accessKeyId: localConfig.accessKeyId || '',
      secretAccessKey: localConfig.secretAccessKey || '',
      bucketName: localConfig.bucketName || '',
      publicDomain: localConfig.publicDomain || '',
      folder: localConfig.folder || 'photos'
    }
  };

  if (onProgress) onProgress(65);

  const res = await fetch(apiEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(uploadPayload)
  });

  const resData = await res.json();

  if (!res.ok || !resData.success || !resData.publicUrl) {
    throw new Error(resData.message || 'Tải ảnh lên Cloudflare R2 thất bại');
  }

  if (onProgress) onProgress(100);

  return {
    url: resData.publicUrl,
    key: resData.key,
    public_id: resData.key,
    originalSize: compressed.originalSize,
    compressedSize: compressed.compressedSize,
    width: compressed.width,
    height: compressed.height,
    isLocal: false
  };
};

/**
 * Kiểm tra trạng thái máy chủ R2 hoặc cấu hình tùy chỉnh
 */
export const testR2Connection = async (config = null) => {
  const targetConfig = config || getStoredR2Config();

  try {
    const res = await fetch('/.netlify/functions/r2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'test',
        config: targetConfig
      })
    });

    const data = await res.json();
    return data;
  } catch (e) {
    return {
      success: false,
      message: 'Không thể kết nối tới máy chủ Netlify/Cloudflare R2: ' + e.message
    };
  }
};

/**
 * Lấy trạng thái biến môi trường R2 từ Server
 */
export const checkServerR2Status = async () => {
  try {
    const res = await fetch('/.netlify/functions/r2?action=get_status');
    const data = await res.json();
    return data;
  } catch (e) {
    return { success: false, hasServerConfig: false };
  }
};
