import React from 'react';
import { 
  FolderPlus, 
  Edit3, 
  Trash2, 
  Images, 
  Folder,
  Sparkles
} from 'lucide-react';
import { speechAssistant } from '../services/speech';

export default function FolderList({
  folders = [],
  photos = [],
  activeFolderId,
  onSelectFolder,
  onOpenNewFolder,
  onEditFolder,
  onDeleteFolder,
  isEditMode = true,
  speechEnabled
}) {
  const safeFolders = (folders || []).filter(Boolean);
  const safePhotos = (photos || []).filter(Boolean);

  const getPhotoCount = (folderId) => {
    return safePhotos.filter(p => p && p.folderId === folderId).length;
  };

  const getFolderCover = (folder) => {
    if (folder?.coverImage) return folder.coverImage;
    const firstPhoto = safePhotos.find(p => p && p.folderId === folder?.id);
    return firstPhoto?.url || null;
  };

  const handleCardClick = (folderId, folderName) => {
    onSelectFolder(folderId);
    if (speechEnabled) {
      const count = folderId === 'all' ? safePhotos.length : getPhotoCount(folderId);
      speechAssistant.speak(`Đã mở ${folderName || 'album'}, có ${count} bức ảnh.`);
    }
  };

  return (
    <div className="folders-section">
      <div className="section-header">
        <h2 className="section-title">
          <Folder size={22} color="#2563eb" />
          <span>Danh Sách Album ({safeFolders.length})</span>
        </h2>

        {isEditMode && (
          <button 
            className="btn-primary" 
            onClick={onOpenNewFolder}
            style={{ height: 36, fontSize: 'var(--font-sm)' }}
          >
            <FolderPlus size={16} />
            <span>Tạo Album Mới</span>
          </button>
        )}
      </div>

      <div className="folders-grid">
        {/* Thẻ Tất Cả Ảnh khi ở Chế độ Xem */}
        {!isEditMode && (
          <div
            className={`folder-card ${activeFolderId === 'all' ? 'active' : ''}`}
            onClick={() => handleCardClick('all', 'Tất cả ảnh')}
            role="button"
            tabIndex={0}
            style={{ borderColor: 'var(--color-primary)' }}
          >
            <div className="folder-cover-wrapper">
              {safePhotos[0]?.url ? (
                <img 
                  src={safePhotos[0].url} 
                  alt="Tất cả ảnh"
                  className="folder-cover-img"
                  loading="lazy"
                />
              ) : (
                <div className="folder-cover-placeholder">
                  <span className="folder-placeholder-icon">🌟</span>
                </div>
              )}
              <div className="folder-icon-badge">
                🌟
              </div>
            </div>

            <div className="folder-meta">
              <h3 className="folder-name" style={{ color: 'var(--color-primary)' }}>Tất Cả Hình Ảnh</h3>
              <p className="folder-desc">Xem toàn bộ ảnh trong kho</p>
            </div>

            <div className="folder-footer">
              <span className="photo-count-chip">
                <Images size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
                {safePhotos.length} ảnh
              </span>
            </div>
          </div>
        )}

        {/* Danh sách các Album */}
        {safeFolders.map((folder) => {
          if (!folder || !folder.id) return null;
          const count = getPhotoCount(folder.id);
          const isActive = activeFolderId === folder.id;
          const coverUrl = getFolderCover(folder);

          return (
            <div
              key={folder.id}
              className={`folder-card ${isActive ? 'active' : ''}`}
              onClick={() => handleCardClick(folder.id, folder.name)}
              role="button"
              tabIndex={0}
            >
              {/* Ảnh bìa thư mục */}
              <div className="folder-cover-wrapper">
                {coverUrl ? (
                  <img 
                    src={coverUrl} 
                    alt={folder.name || 'Thư mục'}
                    className="folder-cover-img"
                    loading="lazy"
                  />
                ) : (
                  <div className="folder-cover-placeholder">
                    <span className="folder-placeholder-icon">{folder.icon || '📁'}</span>
                  </div>
                )}
                <div className="folder-icon-badge">
                  {folder.icon || '📁'}
                </div>
              </div>

              {/* Thông tin thư mục */}
              <div className="folder-meta">
                <h3 className="folder-name">{folder.name || 'Chưa đặt tên'}</h3>
                {folder.description && (
                  <p className="folder-desc">{folder.description}</p>
                )}
              </div>

              {/* Chân thẻ */}
              <div className="folder-footer" onClick={(e) => e.stopPropagation()}>
                <span className="photo-count-chip">
                  <Images size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
                  {count} ảnh
                </span>

                {isEditMode && (
                  <div className="folder-actions-group">
                    <button 
                      className="folder-actions-btn"
                      onClick={() => onEditFolder(folder)}
                      title="Đổi tên album"
                    >
                      <Edit3 size={15} />
                      <span className="folder-action-text">Sửa</span>
                    </button>
                    <button 
                      className="folder-actions-btn delete-btn"
                      onClick={() => onDeleteFolder(folder)}
                      title="Xóa album này"
                    >
                      <Trash2 size={15} color="#dc2626" />
                      <span className="folder-action-text" style={{ color: '#dc2626' }}>Xóa</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Nút bấm Tạo thư mục mới (chỉ hiện khi ở Edit Mode) */}
        {isEditMode && (
          <div 
            className="folder-card add-folder-card"
            onClick={onOpenNewFolder}
            role="button"
            tabIndex={0}
          >
            <div className="add-folder-icon-circle">
              <FolderPlus size={28} />
            </div>
            <h3 className="folder-name" style={{ color: 'var(--color-primary)' }}>Thêm Album</h3>
            <p className="folder-desc" style={{ marginTop: 4 }}>
              Tạo album mới để lưu ảnh
            </p>
          </div>
        )}

        {/* Trạng thái chưa có album nào khi ở Chế độ Xem */}
        {!isEditMode && safeFolders.length === 0 && (
          <div className="empty-state-box" style={{ gridColumn: '1 / -1', margin: '10px 0', padding: '30px 16px' }}>
            <div className="empty-state-icon">📁</div>
            <h3 className="empty-state-title">Chưa có album nào</h3>
            <p className="empty-state-desc">
              Hãy tạo album để bắt đầu phân loại các bức ảnh kỷ niệm của bạn.
            </p>
            <button className="btn-primary" onClick={onOpenNewFolder} style={{ marginTop: 12 }}>
              <FolderPlus size={18} />
              <span>Tạo Album Mới</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
