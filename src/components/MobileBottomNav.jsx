import React from 'react';
import { 
  Folder, 
  Images, 
  Heart, 
  Upload, 
  Edit3, 
  Eye, 
  Menu
} from 'lucide-react';
import { speechAssistant } from '../services/speech';

export default function MobileBottomNav({
  activeTab, // 'album' | 'all' | 'favorites'
  activeFolderId,
  filterMode,
  folders = [],
  photos = [],
  isEditMode,
  onToggleEditMode,
  onOpenAlbumDrawer,
  onSelectAllPhotos,
  onSelectFavorites,
  onOpenUpload,
  speechEnabled,
  currentUser
}) {
  const favoriteCount = (photos || []).filter(p => p && p.isFavorite).length;

  const handleTabClick = (action, label) => {
    action();
    if (speechEnabled) {
      speechAssistant.speak(label);
    }
  };

  const isAlbumActive = activeTab === 'album' || (!activeFolderId && !filterMode) || (activeFolderId && activeFolderId !== 'all');
  const isAllActive = (activeTab === 'all' || activeFolderId === 'all') && filterMode !== 'favorites';
  const isFavActive = activeTab === 'favorites' || filterMode === 'favorites';
  const isViewer = currentUser?.role === 'viewer';

  return (
    <nav className={`mobile-bottom-nav ${!isEditMode || isViewer ? 'viewer-mode-nav' : ''}`}>
      {/* 1. Mở danh sách Album */}
      <button 
        className={`mobile-nav-btn ${isAlbumActive ? 'active' : ''}`}
        onClick={() => handleTabClick(onOpenAlbumDrawer, 'Album')}
      >
        <Folder size={20} />
        <span>Album</span>
        {activeFolderId && activeFolderId !== 'all' && <span className="nav-dot" />}
      </button>

      {/* 2. Tất cả ảnh */}
      <button 
        className={`mobile-nav-btn ${isAllActive ? 'active' : ''}`}
        onClick={() => handleTabClick(onSelectAllPhotos, 'Tất cả')}
      >
        <Images size={20} />
        <span>Tất Cả</span>
      </button>

      {/* 3. Nút Tải ảnh chính giữa (Chỉ hiển thị khi đang sửa và không phải Viewer) */}
      {isEditMode && !isViewer && (
        <button 
          className="mobile-nav-cta-btn"
          onClick={() => handleTabClick(onOpenUpload, 'Tải ảnh')}
          title="Tải ảnh mới"
        >
          <Upload size={22} />
        </button>
      )}

      {/* 4. Yêu thích */}
      <button 
        className={`mobile-nav-btn ${isFavActive ? 'active' : ''}`}
        onClick={() => handleTabClick(onSelectFavorites, 'Yêu thích')}
      >
        <Heart size={20} fill={isFavActive ? '#ef4444' : 'none'} color={isFavActive ? '#ef4444' : 'currentColor'} />
        <span>Yêu Thích</span>
        {favoriteCount > 0 && <span className="nav-badge">{favoriteCount}</span>}
      </button>

      {/* 5. Chuyển đổi Chế độ Xem / Chế độ Sửa (Ẩn nếu là Viewer) */}
      {!isViewer && (
        <button 
          className={`mobile-nav-btn ${isEditMode ? 'mode-active' : ''}`}
          onClick={() => {
            const next = !isEditMode;
            onToggleEditMode();
            if (speechEnabled) {
              speechAssistant.speak(next ? 'Đang sửa' : 'Chỉ xem');
            }
          }}
        >
          {isEditMode ? <Edit3 size={20} color="#3b82f6" /> : <Eye size={20} />}
          <span style={{ color: isEditMode ? 'var(--color-primary)' : 'inherit', fontWeight: isEditMode ? 800 : 600 }}>
            {isEditMode ? 'Đang Sửa' : 'Chỉ Xem'}
          </span>
        </button>
      )}
    </nav>
  );
}
