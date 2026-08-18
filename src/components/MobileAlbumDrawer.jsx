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
  speechEnabled
}) {
  if (!isOpen) return null;

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
              Danh Mục Album ({safeFolders.length})
            </h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Thao tác thêm album nếu đang ở Edit Mode */}
        {isEditMode && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
            <button 
              className="btn-primary" 
              style={{ width: '100%', height: 38, fontSize: 'var(--font-sm)' }}
              onClick={() => { onClose(); onOpenNewFolder(); }}
            >
              <FolderPlus size={16} />
              <span>Thêm Album Mới</span>
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
              <div className="drawer-album-name">Tất Cả Album & Ảnh</div>
              <div className="drawer-album-meta">{safePhotos.length} bức ảnh</div>
            </div>
            <ChevronRight size={18} color="var(--color-text-sub)" />
          </div>

          {safeFolders.map((folder) => {
            if (!folder || !folder.id) return null;
            const count = getPhotoCount(folder.id);
            const isActive = activeFolderId === folder.id;
            const coverUrl = getFolderCover(folder);

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
                  <div className="drawer-album-name">{folder.name || 'Album'}</div>
                  <div className="drawer-album-meta">{count} ảnh</div>
                </div>

                {isEditMode ? (
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
