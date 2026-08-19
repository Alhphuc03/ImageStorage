import React from 'react';
import { 
  X, 
  FolderPlus, 
  Images, 
  Edit3, 
  Trash2, 
  ChevronRight,
  Folder
} from 'lucide-react';
import { speechAssistant } from '../services/speech';
import { isFolderVisible, isPhotoVisible } from '../services/auth';

export default function MobileAlbumDrawer({
  isOpen,
  onClose,
  folders = [],
  photos = [],
  activeFolderId,
  onSelectFolder,
  onOpenNewFolder,
  onEditFolder,
  onDeleteFolder,
  isEditMode,
  speechEnabled,
  currentUser
}) {
  if (!isOpen) return null;

  const safeFolders = (folders || []).filter(Boolean);
  const safePhotos = (photos || []).filter(Boolean);

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

  const handleFolderClick = (folderId, folderName) => {
    onSelectFolder(folderId);
    onClose();
    if (speechEnabled) {
      const count = getPhotoCount(folderId);
      speechAssistant.speak(`Đã mở album ${folderName}, có ${count} ảnh.`);
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="drawer-sidebar" onClick={(e) => e.stopPropagation()}>
        {/* Header Drawer */}
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Folder size={22} color="#2563eb" />
            <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, color: 'var(--color-text-main)' }}>
              Album ({visibleFolders.length})
            </h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Thao tác thêm album nếu đang ở Edit Mode */}
        {isEditMode && currentUser?.role !== 'viewer' && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
            <button 
              className="btn-primary" 
              style={{ width: '100%', height: 38, fontSize: 'var(--font-sm)' }}
              onClick={() => { onClose(); onOpenNewFolder(); }}
            >
              <FolderPlus size={16} />
              <span>Thêm Album</span>
            </button>
          </div>
        )}

        {/* Danh sách Album cuộn mượt mà */}
        <div className="drawer-body">
          {/* Mục Xem Tất Cả */}
          <div 
            className={`drawer-album-item ${!activeFolderId ? 'active' : ''}`}
            onClick={() => { onSelectFolder(null); onClose(); }}
          >
            <div className="drawer-album-icon">🌟</div>
            <div style={{ flex: 1 }}>
              <div className="drawer-album-name">Tất Cả Ảnh</div>
              <div className="drawer-album-meta">{safePhotos.length} ảnh</div>
            </div>
            <ChevronRight size={18} color="var(--color-text-sub)" />
          </div>

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
                className={`drawer-album-item ${isActive ? 'active' : ''}`}
                onClick={() => handleFolderClick(folder.id, folder.name)}
              >
                <div className="drawer-album-thumb-wrap">
                  {coverUrl ? (
                    <img src={coverUrl} alt={folder.name} className="drawer-album-thumb" />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-primary-light)', fontSize: 20 }}>
                      {folder.icon || '📁'}
                    </div>
                  )}
                  <span className="drawer-album-badge">{folder.icon || '📁'}</span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="drawer-album-name">
                    {folder.name || 'Album'} {folder.isPublic === false ? '🔒' : ''}
                  </div>
                  <div className="drawer-album-meta">{count} ảnh</div>
                </div>

                {canManage ? (
                  <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="folder-actions-btn"
                      onClick={() => { onClose(); onEditFolder(folder); }}
                      title="Sửa album"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      className="folder-actions-btn"
                      onClick={() => { onClose(); onDeleteFolder(folder); }}
                      title="Xóa album"
                    >
                      <Trash2 size={16} color="#dc2626" />
                    </button>
                  </div>
                ) : (
                  <ChevronRight size={18} color="var(--color-text-sub)" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
