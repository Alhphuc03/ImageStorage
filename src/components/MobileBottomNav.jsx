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
  activeTab, // 'all' | 'favorites' | 'folder'
  activeFolderId,
  folders = [],
  photos = [],
  isEditMode,
  onToggleEditMode,
  onOpenAlbumDrawer,
  onSelectAllPhotos,
  onSelectFavorites,
  onOpenUpload,
  speechEnabled
}) {
  const favoriteCount = (photos || []).filter(p => p && p.isFavorite).length;

  const handleTabClick = (action, label) => {
    action();
    if (speechEnabled) {
      speechAssistant.speak(label);
    }
  };

  return (
    <nav className="mobile-bottom-nav">
      {/* 1. Mở danh sách Album */}
      <button 
        className={`mobile-nav-btn ${activeFolderId ? 'active' : ''}`}
        onClick={() => handleTabClick(onOpenAlbumDrawer, 'Mở danh sách thư mục ảnh')}
      >
        <Folder size={20} />
        <span>Album</span>
        {activeFolderId && <span className="nav-dot" />}
      </button>

      {/* 2. Tất cả ảnh */}
      <button 
        className={`mobile-nav-btn ${!activeFolderId && activeTab === 'all' ? 'active' : ''}`}
        onClick={() => handleTabClick(onSelectAllPhotos, 'Xem tất cả ảnh')}
      >
        <Images size={20} />
        <span>Tất Cả</span>
      </button>

      {/* 3. Nút Tải ảnh chính giữa (Nổi bật) */}
      <button 
        className="mobile-nav-cta-btn"
        onClick={() => handleTabClick(onOpenUpload, 'Mở cửa sổ tải ảnh')}
        title="Tải ảnh mới lên"
      >
        <Upload size={22} />
      </button>

      {/* 4. Yêu thích */}
      <button 
        className={`mobile-nav-btn ${activeTab === 'favorites' ? 'active' : ''}`}
        onClick={() => handleTabClick(onSelectFavorites, 'Xem ảnh yêu thích')}
      >
        <Heart size={20} fill={activeTab === 'favorites' ? '#ef4444' : 'none'} color={activeTab === 'favorites' ? '#ef4444' : 'currentColor'} />
        <span>Yêu Thích</span>
        {favoriteCount > 0 && <span className="nav-badge">{favoriteCount}</span>}
      </button>

      {/* 5. Chuyển đổi Chế độ Xem / Chế độ Sửa */}
      <button 
        className={`mobile-nav-btn ${isEditMode ? 'mode-active' : ''}`}
        onClick={() => {
          const next = !isEditMode;
          onToggleEditMode();
          if (speechEnabled) {
            speechAssistant.speak(next ? 'Đã bật chế độ quản lý sửa xóa ảnh' : 'Đã chuyển sang chế độ xem ảnh');
          }
        }}
      >
        {isEditMode ? <Edit3 size={20} color="#3b82f6" /> : <Eye size={20} />}
        <span style={{ color: isEditMode ? 'var(--color-primary)' : 'inherit', fontWeight: isEditMode ? 800 : 600 }}>
          {isEditMode ? 'Đang Sửa' : 'Chỉ Xem'}
        </span>
      </button>
    </nav>
  );
}
