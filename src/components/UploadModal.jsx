import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Folder, 
  Trash2, 
  AlertCircle,
  Plus,
  CheckCircle2,
  Lock,
  Globe,
  RefreshCw
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
  const [selectedItems, setSelectedItems] = useState([]); // [{ id, file, previewUrl, name, size }]
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  const fileInputRef = useRef(null);
  const addMoreInputRef = useRef(null);

  // Dọn dẹp các blob URL khi đóng modal hoặc xóa ảnh để giải phóng RAM
  const revokeUrls = (items) => {
    (items || []).forEach(item => {
      if (item?.previewUrl && item.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
  };

  useEffect(() => {
    if (isOpen) {
      const initialFolderId = activeFolderId && activeFolderId !== 'all' 
        ? activeFolderId 
        : (visibleFolders[0]?.id || '');
      setTargetFolderId(initialFolderId);
      
      const foundFolder = visibleFolders.find(f => f.id === initialFolderId);
      setIsPublic(foundFolder ? foundFolder.isPublic !== false : true);
      
      setSelectedItems([]);
      setErrorMessage('');
      setUploadProgress(0);
      setUploadStatusText('');
    } else {
      setSelectedItems(prev => {
        revokeUrls(prev);
        return [];
      });
    }
  }, [isOpen, activeFolderId]);

  const handleTargetFolderChange = (newFolderId) => {
    setTargetFolderId(newFolderId);
    const selectedF = visibleFolders.find(f => f.id === newFolderId);
    if (selectedF && selectedF.isPublic === false) {
      setIsPublic(false);
    }
  };

  if (!isOpen) return null;

  const handleAddFiles = (filesList) => {
    if (!filesList || filesList.length === 0) return;

    // Chấp nhận mọi loại ảnh: JPG, PNG, WEBP, HEIC/HEIF, GIF, SVG, BMP, AVIF, v.v.
    const validFiles = Array.from(filesList).filter(f => {
      const type = (f.type || '').toLowerCase();
      const name = (f.name || '').toLowerCase();
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
      setSelectedItems(prev => {
        // Tránh trùng lặp file cùng tên và kích cỡ
        const existingKeys = new Set(prev.map(i => `${i.name}_${i.size}_${i.lastModified}`));
        
        const newItems = validFiles
          .filter(f => !existingKeys.has(`${f.name}_${f.size}_${f.lastModified}`))
          .map((f, idx) => ({
            id: `file_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
            file: f,
            name: f.name,
            size: f.size,
            lastModified: f.lastModified,
            previewUrl: URL.createObjectURL(f)
          }));

        const totalCount = prev.length + newItems.length;
        if (speechEnabled) {
          speechAssistant.speak(`Đã chọn tổng cộng ${totalCount} bức ảnh.`);
        }

        return [...prev, ...newItems];
      });

      setErrorMessage('');
    }
  };

  const handleRemoveItem = (idToRemove) => {
    setSelectedItems(prev => {
      const itemToRemove = prev.find(i => i.id === idToRemove);
      if (itemToRemove?.previewUrl) {
        URL.revokeObjectURL(itemToRemove.previewUrl);
      }
      return prev.filter(i => i.id !== idToRemove);
    });
  };

  const handleClearAll = () => {
    revokeUrls(selectedItems);
    setSelectedItems([]);
  };

  const totalRawSizeMB = (
    selectedItems.reduce((acc, i) => acc + (i.size || 0), 0) / (1024 * 1024)
  ).toFixed(1);

  // Xử lý upload đa luồng siêu tốc (Batch Presigned + 5 Workers trực tiếp tới Cloudflare R2)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      setErrorMessage('Vui lòng bấm chọn ít nhất một bức ảnh.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(5);
    setUploadStatusText(`Đang chuẩn bị đường truyền siêu tốc cho ${selectedItems.length} bức ảnh...`);
    setErrorMessage('');

    const targetFolder = visibleFolders.find(f => f.id === targetFolderId);
    const finalIsPublic = targetFolder && targetFolder.isPublic === false ? false : isPublic;

    const uploadedPhotos = [];
    const failedItems = [];
    let completedCount = 0;
    const totalFiles = selectedItems.length;

    try {
      // 1. Tạo trước toàn bộ Presigned URLs hàng loạt chỉ trong 1 request duy nhất (~100ms)
      let presignedMap = new Map();
      try {
        const batchResults = await getPresignedBatchUrls(selectedItems, r2Config);
        if (Array.isArray(batchResults)) {
          batchResults.forEach(res => {
            if (res?.id) presignedMap.set(res.id, res);
          });
        }
      } catch (presignBatchErr) {
        console.warn('Batch presign không khả dụng, sử dụng presign từng ảnh:', presignBatchErr);
      }

      setUploadProgress(10);
      setUploadStatusText(`Đang nén và tải siêu tốc ${totalFiles} ảnh...`);

      // 2. Chạy 5 luồng song song đẩy trực tiếp vào Cloudflare R2 Edge
      const CONCURRENCY_LIMIT = 5;
      const queue = [...selectedItems];

      const worker = async () => {
        while (queue.length > 0) {
          const item = queue.shift();
          if (!item) break;

          const file = item.file;
          const presignedInfo = presignedMap.get(item.id);

          try {
            const result = await uploadToR2(
              file,
              r2Config,
              null,
              presignedInfo
            );

            const newPhoto = {
              id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
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
          } catch (err) {
            console.error(`Lỗi khi tải ảnh ${file.name}:`, err);
            failedItems.push(item);
          } finally {
            completedCount++;
            const overall = Math.round(10 + ((completedCount / totalFiles) * 88));
            setUploadProgress(Math.min(overall, 98));
            setUploadStatusText(`Đang tải ảnh (${completedCount}/${totalFiles}): "${file.name}"...`);
          }
        }
      };

      const workers = Array.from({ length: Math.min(CONCURRENCY_LIMIT, totalFiles) }, () => worker());
      await Promise.all(workers);

      // Nếu có ảnh upload thành công, cập nhật ngay vào kho ảnh
      if (uploadedPhotos.length > 0) {
        onUploadSuccess(uploadedPhotos);
      }

      setUploadProgress(100);

      if (failedItems.length === 0) {
        setUploadStatusText(`Đã tải lên thành công toàn bộ ${uploadedPhotos.length} bức ảnh!`);
        if (speechEnabled) {
          speechAssistant.speak(`Đã tải lên thành công ${uploadedPhotos.length} bức ảnh.`);
        }
        handleClearAll();
        onClose();
      } else {
        // Giữ lại các ảnh bị lỗi để người dùng có thể bấm thử lại
        setSelectedItems(failedItems);
        const errMsg = `Đã tải thành công ${uploadedPhotos.length} ảnh. Có ${failedItems.length} ảnh bị lỗi mạng, bạn có thể bấm "Thử Lại" để tải tiếp.`;
        setErrorMessage(errMsg);
        if (speechEnabled) {
          speechAssistant.speak(`Đã tải xong ${uploadedPhotos.length} ảnh. Còn ${failedItems.length} ảnh lỗi.`);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Có lỗi xảy ra khi tải ảnh.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            <Upload size={22} color="#ea580c" />
            <span>Tải Ảnh Lên (Không Giới Hạn)</span>
          </h2>
          <button className="modal-close-btn" onClick={onClose} disabled={isUploading} title="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="modal-body" style={{ maxHeight: '78vh', overflowY: 'auto' }}>
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
                    <Globe size={15} />
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
                    <Lock size={15} />
                    <span style={{ fontSize: 12 }}>Riêng Tư</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Ô chọn ảnh kéo thả (chỉ hiển thị khi chưa có ảnh nào hoặc bấm thêm) */}
            {selectedItems.length === 0 ? (
              <div
                className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleAddFiles(e.dataTransfer.files || []);
                }}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                style={{ borderColor: isDragging ? '#ea580c' : undefined, minHeight: 140 }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*,.heic,.heif,.webp,.png,.jpg,.jpeg,.gif,.svg,.bmp,.avif"
                  multiple
                  onChange={(e) => {
                    handleAddFiles(e.target.files || []);
                    e.target.value = ''; // Reset input để có thể chọn lại cùng file
                  }}
                  disabled={isUploading}
                />

                <div className="upload-icon-circle" style={{ background: 'rgba(234, 88, 12, 0.1)', color: '#ea580c' }}>
                  <ImageIcon size={26} />
                </div>

                <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--color-primary)' }}>
                  Bấm để chọn nhiều ảnh hoặc kéo thả vào đây
                </h3>
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-sub)', marginTop: 4 }}>
                  Chọn thoải mái không giới hạn số lượng ảnh (JPG, PNG, HEIC iPhone, WebP, GIF...)
                </p>
              </div>
            ) : null}

            {/* Danh sách toàn bộ ảnh đã chọn xem trước */}
            {selectedItems.length > 0 && (
              <div style={{ marginTop: 4 }}>
                {/* Header thanh công cụ danh sách ảnh */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: 10,
                  flexWrap: 'wrap',
                  gap: 8
                }}>
                  <span style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: 'var(--color-text-main)' }}>
                    📸 Đã chọn <strong style={{ color: '#ea580c' }}>{selectedItems.length}</strong> ảnh ({totalRawSizeMB} MB):
                  </span>

                  {!isUploading && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="file"
                        ref={addMoreInputRef}
                        style={{ display: 'none' }}
                        accept="image/*,.heic,.heif,.webp,.png,.jpg,.jpeg,.gif,.svg,.bmp,.avif"
                        multiple
                        onChange={(e) => {
                          handleAddFiles(e.target.files || []);
                          e.target.value = '';
                        }}
                      />
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ height: 30, padding: '0 10px', fontSize: 12, fontWeight: 700 }}
                        onClick={() => addMoreInputRef.current && addMoreInputRef.current.click()}
                      >
                        <Plus size={14} />
                        <span>Chọn Thêm Ảnh</span>
                      </button>

                      <button
                        type="button"
                        style={{ 
                          background: 'transparent', 
                          border: 'none',
                          color: 'var(--color-danger)', 
                          fontSize: 12, 
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        onClick={handleClearAll}
                      >
                        <Trash2 size={13} />
                        <span>Bỏ hết</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Khung cuộn xem trước toàn bộ ảnh */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', 
                  gap: 8,
                  maxHeight: '260px',
                  overflowY: 'auto',
                  padding: '8px',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)'
                }}>
                  {selectedItems.map((item, idx) => (
                    <div 
                      key={item.id || idx} 
                      style={{ 
                        position: 'relative', 
                        height: 85, 
                        borderRadius: 'var(--radius-sm)', 
                        overflow: 'hidden', 
                        border: '1px solid var(--color-border)',
                        background: '#000'
                      }}
                    >
                      <img 
                        src={item.previewUrl} 
                        alt={item.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      
                      {/* Dung lượng file */}
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'rgba(0,0,0,0.65)',
                        color: '#fff',
                        fontSize: 9,
                        padding: '1px 4px',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {(item.size / 1024).toFixed(0)} KB
                      </div>

                      {/* Nút xóa từng ảnh */}
                      {!isUploading && (
                        <button
                          type="button"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleRemoveItem(item.id); 
                          }}
                          style={{
                            position: 'absolute',
                            top: 3,
                            right: 3,
                            background: 'rgba(0,0,0,0.7)',
                            color: '#fff',
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0,
                            cursor: 'pointer',
                            border: 'none'
                          }}
                          title="Bỏ ảnh này"
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
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ea580c' }}>
                    <RefreshCw size={14} className="spin" />
                    <span>{uploadStatusText || 'Đang nén & tải ảnh lên R2...'}</span>
                  </span>
                  <span style={{ color: '#ea580c' }}>{uploadProgress}%</span>
                </div>
                <div style={{ width: '100%', height: 10, background: 'var(--color-border)', borderRadius: 999, overflow: 'hidden' }}>
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
              disabled={isUploading || selectedItems.length === 0}
              style={{ whiteSpace: 'nowrap', background: '#ea580c' }}
            >
              <Upload size={18} />
              <span>
                {isUploading 
                  ? 'Đang Tải Song Song...' 
                  : (selectedItems.length > 0 ? `Tải Lên (${selectedItems.length} Ảnh)` : 'Tải Ảnh Lên')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
