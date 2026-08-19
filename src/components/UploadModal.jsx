import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Folder, 
  Trash2, 
  AlertCircle,
  Cloud,
  Check,
  Zap,
  Info,
  Globe,
  Lock
} from 'lucide-react';
import { uploadToR2 } from '../services/r2';
import { speechAssistant } from '../services/speech';
import { isFolderVisible } from '../services/auth';

export default function UploadModal({
  isOpen,
  onClose,
  folders = [],
  activeFolderId,
  onUploadSuccess,
  r2Config,
  onOpenR2,
  speechEnabled,
  currentUser
}) {
  const visibleFolders = (folders || []).filter(f => isFolderVisible(f, currentUser));
  
  const [targetFolderId, setTargetFolderId] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const initialFolderId = activeFolderId && activeFolderId !== 'all' 
        ? activeFolderId 
        : (visibleFolders[0]?.id || '');
      setTargetFolderId(initialFolderId);
      
      const foundFolder = visibleFolders.find(f => f.id === initialFolderId);
      setIsPublic(foundFolder ? foundFolder.isPublic !== false : true);
      
      setSelectedFiles([]);
      setPreviewUrls([]);
      setErrorMessage('');
      setUploadProgress(0);
      setUploadStatusText('');
    }
  }, [isOpen, activeFolderId, folders]);

  // Khi người dùng đổi album đích, tự động đồng bộ trạng thái công khai / riêng tư theo album đó
  const handleTargetFolderChange = (newFolderId) => {
    setTargetFolderId(newFolderId);
    const selectedF = visibleFolders.find(f => f.id === newFolderId);
    if (selectedF && selectedF.isPublic === false) {
      setIsPublic(false);
    }
  };

  if (!isOpen) return null;

  const handleFiles = (filesList) => {
    // Chấp nhận mọi loại ảnh: JPG, PNG, WEBP, HEIC/HEIF, GIF, SVG, BMP, AVIF, v.v.
    const validFiles = Array.from(filesList).filter(f => {
      const type = f.type.toLowerCase();
      const name = f.name.toLowerCase();
      return (
        type.startsWith('image/') ||
        name.endsWith('.heic') ||
        name.endsWith('.heif') ||
        name.endsWith('.webp') ||
        name.endsWith('.png') ||
        name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.gif') ||
        name.endsWith('.svg') ||
        name.endsWith('.bmp') ||
        name.endsWith('.avif')
      );
    });

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      setErrorMessage('');
      
      // Tạo preview thumbnails
      const urls = validFiles.slice(0, 8).map(f => URL.createObjectURL(f));
      setPreviewUrls(urls);

      if (speechEnabled) {
        speechAssistant.speak(`Đã chọn ${validFiles.length} bức ảnh.`);
      }
    }
  };

  const handleFileChange = (e) => {
    handleFiles(e.target.files || []);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files || []);
  };

  const handleRemoveFile = (index) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    const updatedUrls = previewUrls.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    setPreviewUrls(updatedUrls);
  };

  const totalRawSizeMB = (
    selectedFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)
  ).toFixed(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setErrorMessage('Vui lòng bấm chọn ít nhất một bức ảnh từ máy tính hoặc điện thoại.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(5);
    setUploadStatusText('Đang bắt đầu nén và tối ưu hóa ảnh...');
    setErrorMessage('');

    try {
      const uploadedPhotos = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadStatusText(`Đang xử lý ảnh ${i + 1}/${selectedFiles.length}: "${file.name}"...`);
        
        const result = await uploadToR2(
          file,
          r2Config,
          (percent) => {
            const overall = Math.round(((i * 100) + percent) / selectedFiles.length);
            setUploadProgress(Math.min(overall, 98));
          }
        );

        const targetFolder = visibleFolders.find(f => f.id === targetFolderId);
        const finalIsPublic = targetFolder && targetFolder.isPublic === false ? false : isPublic;

        const newPhoto = {
          id: `photo_${Date.now()}_${i}`,
          title: file.name.replace(/\.[^/.]+$/, '') || 'Ảnh mới',
          url: result.url,
          folderId: targetFolderId,
          isPublic: finalIsPublic,
          createdBy: currentUser?.username || 'admin',
          createdByName: currentUser?.fullName || currentUser?.username || 'Admin',
          date: new Date().toLocaleDateString('vi-VN'),
          isFavorite: false,
          createdAt: new Date().toISOString(),
          fileSize: result.compressedSize 
            ? `${(result.compressedSize / 1024).toFixed(0)} KB` 
            : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          originalSize: file.size,
          compressedSize: result.compressedSize
        };

        uploadedPhotos.push(newPhoto);
      }

      setUploadProgress(100);
      setUploadStatusText('Hoàn tất tải ảnh!');
      onUploadSuccess(uploadedPhotos);
      
      if (speechEnabled) {
        speechAssistant.speak('Đã lưu ảnh thành công vào album.');
      }
      
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Có lỗi xảy ra khi tải ảnh lên Cloudflare R2.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            <Upload size={22} color="#ea580c" />
            <span>Tải Ảnh Lên</span>
          </h2>
          <button className="modal-close-btn" onClick={onClose} disabled={isUploading} title="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="modal-body">
            {/* Báo lỗi nếu có */}
            {errorMessage && (
              <div className="status-callout error">
                <AlertCircle size={20} style={{ flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  <span>{errorMessage}</span>
                  {onOpenR2 && (
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ fontSize: 'var(--font-sm)', height: 32, padding: '0 12px', alignSelf: 'flex-start' }}
                      onClick={() => {
                        onClose();
                        onOpenR2();
                      }}
                    >
                      ⚙️ Cài đặt lại Cloudflare R2
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Chọn Album & Chế độ riêng tư */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 12 }}>
              {/* Chọn Album */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">
                  <Folder size={16} /> Album lưu:
                </label>
                <select
                  value={targetFolderId || ''}
                  onChange={(e) => handleTargetFolderChange(e.target.value || '')}
                  disabled={isUploading}
                >
                  {visibleFolders.length === 0 ? (
                    <option value="">📁 Kho chung</option>
                  ) : (
                    <>
                      <option value="">🌟 Kho chung</option>
                      {visibleFolders.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.icon || '📁'} {f.name} {f.isPublic === false ? '🔒' : ''}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {/* Quyền xem ảnh */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">
                  Quyền xem ảnh:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: isPublic ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      background: isPublic ? 'var(--color-primary-light)' : 'var(--color-surface)',
                      color: isPublic ? 'var(--color-primary)' : 'var(--color-text-main)',
                      fontWeight: 700,
                      fontSize: 'var(--font-sm)',
                      cursor: 'pointer',
                      height: 42
                    }}
                  >
                    <span>🌐</span>
                    <span style={{ fontSize: 12 }}>Công Khai</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: !isPublic ? '2px solid #8b5cf6' : '1px solid var(--color-border)',
                      background: !isPublic ? 'rgba(139, 92, 246, 0.12)' : 'var(--color-surface)',
                      color: !isPublic ? '#8b5cf6' : 'var(--color-text-main)',
                      fontWeight: 700,
                      fontSize: 'var(--font-sm)',
                      cursor: 'pointer',
                      height: 42
                    }}
                  >
                    <span>🔒</span>
                    <span style={{ fontSize: 12 }}>Riêng Tư</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Ô chọn ảnh kéo thả */}
            <div
              className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              style={{ borderColor: isDragging ? '#ea580c' : undefined }}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*,.heic,.heif,.webp,.png,.jpg,.jpeg,.gif,.svg,.bmp,.avif"
                multiple
                onChange={handleFileChange}
                disabled={isUploading}
              />

              <div className="upload-icon-circle" style={{ background: 'rgba(234, 88, 12, 0.1)', color: '#ea580c' }}>
                <ImageIcon size={26} />
              </div>

              <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--color-primary)' }}>
                Chọn hoặc kéo thả ảnh vào đây
              </h3>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-sub)', marginTop: 4 }}>
                Hỗ trợ JPG, PNG, HEIC iPhone, WebP, GIF, SVG... (Kéo thả hoặc bấm để chọn)
              </p>
            </div>

            {/* Danh sách ảnh đã chọn xem trước */}
            {selectedFiles.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 'var(--font-sm)' }}>
                    Đã chọn {selectedFiles.length} ảnh ({totalRawSizeMB} MB gốc):
                  </span>
                  {!isUploading && (
                    <button
                      type="button"
                      style={{ background: 'transparent', color: 'var(--color-danger)', fontSize: 'var(--font-sm)', cursor: 'pointer' }}
                      onClick={() => { setSelectedFiles([]); setPreviewUrls([]); }}
                    >
                      Bỏ chọn hết
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {previewUrls.map((url, idx) => (
                    <div key={idx} style={{ position: 'relative', height: 75, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                      <img src={url} alt="Xem trước" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {!isUploading && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx); }}
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            background: 'rgba(0,0,0,0.65)',
                            color: '#fff',
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0,
                            cursor: 'pointer'
                          }}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Thanh tiến trình upload */}
            {isUploading && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: 4 }}>
                  <span>⏳ {uploadStatusText || 'Đang tải ảnh lên Cloudflare R2...'}</span>
                  <span style={{ color: '#ea580c' }}>{uploadProgress}%</span>
                </div>
                <div style={{ width: '100%', height: 8, background: 'var(--color-border)', borderRadius: 999, overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${uploadProgress}%`, 
                      height: '100%', 
                      background: 'linear-gradient(90deg, #ea580c, #10b981)', 
                      transition: 'width 0.2s ease' 
                    }} 
                  />
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isUploading}
            >
              Hủy
            </button>

            <button
              type="submit"
              className="btn-large-cta"
              disabled={isUploading || selectedFiles.length === 0}
              style={{ whiteSpace: 'nowrap', background: '#ea580c' }}
            >
              <Upload size={18} />
              <span>{isUploading ? 'Đang Xử Lý & Tải...' : (selectedFiles.length > 0 ? `Tải Lên (${selectedFiles.length} Ảnh)` : 'Tải Ảnh Lên')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
