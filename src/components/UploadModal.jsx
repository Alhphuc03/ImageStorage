import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Folder, 
  CheckCircle, 
  AlertCircle, 
  Plus,
  Trash2
} from 'lucide-react';
import { uploadToCloudinary } from '../services/cloudinary';
import { speechAssistant } from '../services/speech';

export default function UploadModal({
  isOpen,
  onClose,
  folders = [],
  activeFolderId,
  onUploadSuccess,
  cloudinaryConfig,
  onOpenCloudinary,
  speechEnabled
}) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [targetFolderId, setTargetFolderId] = useState(
    activeFolderId && activeFolderId !== 'all' ? activeFolderId : (folders[0]?.id || '')
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTargetFolderId(
        activeFolderId && activeFolderId !== 'all' ? activeFolderId : (folders[0]?.id || '')
      );
      setSelectedFiles([]);
      setPreviewUrls([]);
      setErrorMessage('');
      setUploadProgress(0);
    }
  }, [isOpen, activeFolderId, folders]);

  if (!isOpen) return null;

  const handleFiles = (filesList) => {
    const files = Array.from(filesList).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      setSelectedFiles(files);
      setErrorMessage('');
      
      // Tạo preview thumbnails
      const urls = files.slice(0, 8).map(f => URL.createObjectURL(f));
      setPreviewUrls(urls);

      if (speechEnabled) {
        speechAssistant.speak(`Đã chọn ${files.length} bức ảnh.`);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setErrorMessage('Vui lòng bấm chọn ít nhất một bức ảnh từ máy tính hoặc điện thoại.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setErrorMessage('');

    try {
      const uploadedPhotos = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        const result = await uploadToCloudinary(
          file,
          cloudinaryConfig,
          (percent) => {
            const overall = Math.round(((i * 100) + percent) / selectedFiles.length);
            setUploadProgress(overall);
          }
        );

        const newPhoto = {
          id: `photo_${Date.now()}_${i}`,
          title: file.name.replace(/\.[^/.]+$/, '') || 'Ảnh mới',
          url: result.secure_url || result.url,
          folderId: targetFolderId,
          date: new Date().toLocaleDateString('vi-VN'),
          isFavorite: false,
          createdAt: new Date().toISOString(),
          fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        };

        uploadedPhotos.push(newPhoto);
      }

      setUploadProgress(100);
      onUploadSuccess(uploadedPhotos);
      
      if (speechEnabled) {
        speechAssistant.speak('Đã lưu ảnh thành công vào album.');
      }
      
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Có lỗi xảy ra khi tải ảnh.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
        {/* Header Modal */}
        <div className="modal-header">
          <h2 className="modal-title">
            <Upload size={24} color="#059669" />
            <span>Tải Ảnh Lên Album</span>
          </h2>
          <button className="modal-close-btn" onClick={onClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="modal-body">
            {/* Báo lỗi nếu có */}
            {errorMessage && (
              <div className="status-callout error">
                <AlertCircle size={20} style={{ flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  <span>{errorMessage}</span>
                  {onOpenCloudinary && (
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ fontSize: 'var(--font-sm)', height: 32, padding: '0 12px', alignSelf: 'flex-start' }}
                      onClick={() => {
                        onClose();
                        onOpenCloudinary();
                      }}
                    >
                      ⚙️ Cài đặt lại Cloudinary
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Chọn Album muốn bỏ ảnh vào */}
            <div className="form-group">
              <label className="form-label">
                <Folder size={16} /> Chọn Album muốn lưu ảnh:
              </label>
              <select
                value={targetFolderId || ''}
                onChange={(e) => setTargetFolderId(e.target.value || null)}
                disabled={isUploading}
              >
                {(folders || []).length === 0 ? (
                  <option value="">📁 Kho chung (Chưa phân album)</option>
                ) : (
                  <>
                    <option value="">🌟 Kho ảnh chung</option>
                    {(folders || []).map(f => (
                      <option key={f.id} value={f.id}>
                        {f.icon || '📁'} {f.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {/* Ô chọn ảnh kéo thả */}
            <div
              className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={isUploading}
              />

              <div className="upload-icon-circle">
                <ImageIcon size={26} />
              </div>

              <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--color-primary)' }}>
                Bấm vào đây để chọn ảnh
              </h3>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-sub)', marginTop: 4 }}>
                Hoặc kéo thả file ảnh từ máy tính vào khung này
              </p>
            </div>

            {/* Danh sách ảnh đã chọn xem trước */}
            {selectedFiles.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 'var(--font-sm)' }}>
                    Đã chọn {selectedFiles.length} bức ảnh:
                  </span>
                  {!isUploading && (
                    <button
                      type="button"
                      style={{ background: 'transparent', color: 'var(--color-danger)', fontSize: 'var(--font-sm)' }}
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
                            padding: 0
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
                  <span>⏳ Đang tải ảnh lên Cloudinary...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div style={{ width: '100%', height: 8, background: 'var(--color-border)', borderRadius: 999, overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${uploadProgress}%`, 
                      height: '100%', 
                      background: 'linear-gradient(90deg, #2563eb, #10b981)', 
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
              style={{ whiteSpace: 'nowrap' }}
            >
              <Upload size={18} />
              <span>{isUploading ? 'Đang Tải Lên...' : (selectedFiles.length > 0 ? `Tải Lên (${selectedFiles.length} Ảnh)` : 'Tải Ảnh Lên')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
