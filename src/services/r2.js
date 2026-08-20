/**
 * Dịch vụ nén ảnh thông minh và lưu trữ siêu tốc lên Cloudflare R2 Object Storage
 * Hỗ trợ tải trực tiếp qua Pre-signed URL (tốc độ cao) và fallback Netlify Direct
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
 * Xử lý file ảnh trước khi nén (chuyển đổi HEIC của iPhone sang JPEG trước)
 */
const prepareImageFile = async (file) => {
  const fileName = (file.name || '').toLowerCase();
  const fileType = (file.type || '').toLowerCase();

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
        quality: 0.90
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
 * Nén ảnh thông minh tại Client sang định dạng WebP siêu nhẹ, không tạo base64 rác
 * @param {File} rawFile - File ảnh ban đầu
 * @param {string} profileKey - Mức nén
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
    return {
      blob: file,
      width: 1200,
      height: 800,
      originalSize: file.size,
      compressedSize: file.size,
      filename: fileName,
      contentType: file.type || 'image/jpeg',
      isOriginal: true
    };
  }

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

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const outputFormat = 'image/webp';

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve({
                blob: file,
                width: img.width,
                height: img.height,
                originalSize: file.size,
                compressedSize: file.size,
                filename: fileName,
                contentType: file.type || 'image/jpeg',
                isOriginal: true
              });
            }

            const cleanName = fileName.replace(/\.[^/.]+$/, '') + '.webp';
            resolve({
              blob,
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
 * Lấy danh sách Presigned URLs hàng loạt trong 1 request duy nhất
 */
export const getPresignedBatchUrls = async (fileItems, customConfig = null) => {
  const localConfig = customConfig || getStoredR2Config();
  const apiEndpoint = '/.netlify/functions/r2';

  const filesPayload = fileItems.map(item => ({
    id: item.id,
    filename: `img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}_${item.name.replace(/\.[^/.]+$/, '')}.webp`,
    contentType: 'image/webp',
    folder: localConfig.folder || 'photos'
  }));

  const res = await fetch(apiEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'presign_batch',
      files: filesPayload,
      config: {
        accountId: localConfig.accountId || '',
        accessKeyId: localConfig.accessKeyId || '',
        secretAccessKey: localConfig.secretAccessKey || '',
        bucketName: localConfig.bucketName || '',
        publicDomain: localConfig.publicDomain || '',
        folder: localConfig.folder || 'photos'
      }
    })
  });

  const data = await res.json();
  if (res.ok && data.success && Array.isArray(data.results)) {
    return data.results;
  }
  return null;
};

/**
 * Tải 1 ảnh lên Cloudflare R2 với tốc độ cao nhất (Ưu tiên Direct Pre-signed PUT, fallback Direct Netlify)
 */
export const uploadToR2 = async (file, customConfig = null, onProgress = null, presignedInfo = null) => {
  if (onProgress) onProgress(20);
  const compressed = await compressImageSmart(file);
  if (onProgress) onProgress(50);

  const localConfig = customConfig || getStoredR2Config();
  const apiEndpoint = '/.netlify/functions/r2';

  // 1. Nếu có sẵn presigned URL hoặc tạo mới presigned URL: Upload trực tiếp vào Cloudflare R2 Edge (Cực nhanh, ~100-200ms)
  let uploadUrl = presignedInfo?.uploadUrl;
  let publicUrl = presignedInfo?.publicUrl;
  let key = presignedInfo?.key;

  if (!uploadUrl) {
    try {
      const presignRes = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'presign',
          filename: `img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}_${compressed.filename}`,
          contentType: compressed.contentType,
          folder: localConfig.folder || 'photos',
          config: localConfig
        })
      });

      const presignData = await presignRes.json();
      if (presignRes.ok && presignData.success && presignData.uploadUrl) {
        uploadUrl = presignData.uploadUrl;
        publicUrl = presignData.publicUrl;
        key = presignData.key;
      }
    } catch (err) {
      console.warn('Lấy presign URL thất bại, chuyển sang direct payload:', err);
    }
  }

  // Thực hiện PUT trực tiếp lên Cloudflare R2
  if (uploadUrl) {
    try {
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': compressed.contentType
        },
        body: compressed.blob
      });

      if (putRes.ok) {
        if (onProgress) onProgress(100);
        return {
          url: publicUrl,
          key: key,
          public_id: key,
          originalSize: compressed.originalSize,
          compressedSize: compressed.compressedSize,
          width: compressed.width,
          height: compressed.height,
          isLocal: false
        };
      }
    } catch (putErr) {
      console.warn('Direct PUT lên R2 gặp lỗi CORS/Network, chuyển sang Netlify direct upload:', putErr);
    }
  }

  // 2. Fallback: Nếu không upload trực tiếp được, chuyển sang Netlify direct upload
  const base64Data = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(compressed.blob);
  });

  const res = await fetch(apiEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'upload_direct',
      filename: `img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}_${compressed.filename}`,
      contentType: compressed.contentType,
      folder: localConfig.folder || 'photos',
      base64: base64Data,
      config: localConfig
    })
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
 * Kiểm tra kết nối tới R2
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
 * Kiểm tra trạng thái máy chủ R2
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
