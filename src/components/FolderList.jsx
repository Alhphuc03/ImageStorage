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
import { isFolderVisible, isPhotoVisible } from '../services/auth';

export default function FolderList({
  folders = [],
  photos = [],
  activeFolderId,
  onSelectFolder,
  onOpenNewFolder,
  onEditFolder,
  onDeleteFolder,
  isEditMode = true,
  speechEnabled,
  currentUser
}) {
  const safeFolders = (folders || []).filter(Boolean);
  const safePhotos = (photos || []).filter(Boolean);

  // Lọc Album và Ảnh được phép xem theo phân quyền
  const visibleFolders = safeFolders.filter(f => isFolderVisible(f, currentUser));
  const visiblePhotos = safePhotos.filter(p => isPhotoVisible(p, currentUser, safeFolders));

  const getPhotoCount = (folderId) => {
    return visiblePhotos.filter(p => p.folderId === folderId).length;
  };

  const getFolderCover = (folder) => {
    if (folder?.coverImage) return folder.coverImage;
    const firstPhoto = visiblePhotos.find(p => p.folderId === folder?.id);
    return firstPhoto?.url || null;
  };

  const handleCardClick = (folderId, folderName) => {
    onSelectFolder(folderId);
    if (speechEnabled) {
      const count = folderId === 'all' ? visiblePhotos.length : getPhotoCount(folderId);
      speechAssistant.speak(`Đã mở ${folderName || 'album'}, có ${count} bức ảnh.`);
    }
  };

  return (
    <div className="folders-section">
      <div className="section-header">
        <h2 className="section-title">
          <Folder size={22} color="#2563eb" />
          <span>Album ({visibleFolders.length})</span>
        </h2>

        {isEditMode && currentUser?.role !== 'viewer' && (
          <button 
            className="btn-primary" 
            onClick={onOpenNewFolder}
            style={{ height: 36, fontSize: 'var(--font-sm)' }}
          >
            <FolderPlus size={16} />
            <span>Thêm Album</span>
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
              {visiblePhotos[0]?.url ? (
                <img 
                  src={visiblePhotos[0].url} 
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
              <h3 className="folder-name" style={{ color: 'var(--color-primary)' }}>Tất Cả Ảnh</h3>
              <p className="folder-desc">Toàn bộ ảnh trong kho</p>
            </div>

            <div className="folder-footer">
              <span className="photo-count-chip">
                <Images size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
                {visiblePhotos.length} ảnh
              </span>
            </div>
          </div>
        )}

        {/* Danh sách các Album */}
        {visibleFolders.map((folder) => {
          if (!folder || !folder.id) return null;
          const count = getPhotoCount(folder.id);
          const isActive = activeFolderId === folder.id;
          const coverUrl = getFolderCover(folder);
          const canManage = isEditMode && currentUser?.role !== 'viewer' && (
            currentUser?.role === 'admin' || folder.createdBy === currentUser?.username
          );

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

                {/* Huy hiệu riêng tư 🔒 */}
                {folder.isPublic === false && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: 'rgba(0, 0, 0, 0.7)',
                      color: '#c084fc',
                      padding: '2px 6px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      backdropFilter: 'blur(4px)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      border: '1px solid rgba(192, 132, 252, 0.4)'
                    }}
                    title="Album riêng tư"
                  >
                    <span>🔒</span>
                    <span>Riêng tư</span>
                  </div>
                )}
              </div>

              {/* Thông tin thư mục */}
              <div className="folder-meta">
                <h3 className="folder-name">{folder.name || 'Chưa đặt tên'}</h3>
                {folder.description && (
                  <p className="folder-desc">{folder.description}</p>
                )}
                {currentUser?.role === 'admin' && folder.createdByName && (
                  <div style={{ fontSize: 11, color: 'var(--color-text-sub)', marginTop: 2 }}>
                    Tạo bởi: {folder.createdByName}
                  </div>
                )}
              </div>

              {/* Chân thẻ */}
              <div className="folder-footer" onClick={(e) => e.stopPropagation()}>
                <span className="photo-count-chip">
                  <Images size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
                  {count} ảnh
                </span>

                {canManage && (
                  <div className="folder-actions-group">
                    <button 
                      className="folder-actions-btn"
                      onClick={() => onEditFolder(folder)}
                      title="Sửa album"
                    >
                      <Edit3 size={15} />
                      <span className="folder-action-text">Sửa</span>
                    </button>
                    <button 
                      className="folder-actions-btn delete-btn"
                      onClick={() => onDeleteFolder(folder)}
                      title="Xóa album"
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
              Tạo album mới
            </p>
          </div>
        )}

        {/* Trạng thái chưa có album nào khi ở Chế độ Xem */}
        {!isEditMode && safeFolders.length === 0 && (
          <div className="empty-state-box" style={{ gridColumn: '1 / -1', margin: '10px 0', padding: '30px 16px' }}>
            <div className="empty-state-icon">📁</div>
            <h3 className="empty-state-title">Chưa có album nào</h3>
            <p className="empty-state-desc">
              Chuyển sang "Đang Sửa" để thêm album mới.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
