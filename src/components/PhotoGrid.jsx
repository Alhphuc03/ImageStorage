import React, { useState } from 'react';
import { 
  Heart, 
  Trash2, 
  Search, 
  X, 
  Calendar, 
  Image as ImageIcon,
  Images,
  Play,
  Upload,
  ArrowLeft
} from 'lucide-react';
import { speechAssistant } from '../services/speech';

export default function PhotoGrid({
  photos = [],
  folders = [],
  activeFolderId,
  onSelectFolder,
  onOpenPhotoViewer,
  onToggleFavorite,
  onDeletePhoto,
  onOpenUpload,
  isEditMode = true,
  speechEnabled
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'favorites'

  const safePhotos = (photos || []).filter(Boolean);
  const safeFolders = (folders || []).filter(Boolean);

  // Lọc ảnh an toàn
  const filteredPhotos = safePhotos.filter((photo) => {
    if (!photo) return false;
    if (activeFolderId && activeFolderId !== 'all') {
      if (photo.folderId !== activeFolderId) return false;
    }

    if (filterMode === 'favorites' && !photo.isFavorite) {
      return false;
    }

    if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (photo.title || '').toLowerCase().includes(q);
      const matchDate = (photo.date || '').toLowerCase().includes(q);
      return matchTitle || matchDate;
    }

    return true;
  });

  const getFolderName = (folderId) => {
    if (folderId === 'all') return '🌟 Tất Cả Hình Ảnh';
    const found = safeFolders.find(f => f && f.id === folderId);
    return found ? `${found.icon || '📁'} ${found.name || ''}` : 'Album Ảnh';
  };

  const handlePhotoClick = (index) => {
    if (onOpenPhotoViewer) {
      onOpenPhotoViewer(filteredPhotos, index);
    }
  };

  return (
    <div className="photos-section">
      {/* THANH QUAY LẠI KHI Ở TRONG ALBUM */}
      {activeFolderId && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn-secondary"
            onClick={() => {
              if (onSelectFolder) onSelectFolder(null);
              if (speechEnabled) speechAssistant.speak('Quay lại danh sách album');
            }}
            style={{ height: 36, padding: '0 14px', fontSize: 'var(--font-sm)', fontWeight: 700 }}
          >
            <ArrowLeft size={16} />
            <span>Quay Lại Album</span>
          </button>

          <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-sub)' }}>
            Đang xem: <strong style={{ color: 'var(--color-text-main)' }}>{getFolderName(activeFolderId)}</strong>
          </span>
        </div>
      )}

      {/* THANH TÌM KIẾM & BỘ LỌC (Hiện khi isEditMode hoặc trên desktop) */}
      {isEditMode && (
        <div className="filter-toolbar">
          <div className="filter-tabs">
            <button
              className={`filter-tab-btn ${!activeFolderId && filterMode === 'all' ? 'active' : ''}`}
              onClick={() => {
                if (onSelectFolder) onSelectFolder(null);
                setFilterMode('all');
                if (speechEnabled) speechAssistant.speak('Hiển thị tất cả hình ảnh');
              }}
            >
              <Images size={15} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
              <span>Tất Cả ({safePhotos.length})</span>
            </button>

            <button
              className={`filter-tab-btn ${filterMode === 'favorites' ? 'active' : ''}`}
              onClick={() => {
                setFilterMode('favorites');
                if (speechEnabled) speechAssistant.speak('Hiển thị ảnh yêu thích');
              }}
            >
              <Heart size={15} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} fill="#ef4444" color="#ef4444" />
              <span>Yêu Thích ({safePhotos.filter(p => p && p.isFavorite).length})</span>
            </button>

            {activeFolderId && (
              <button
                className="filter-tab-btn active"
                onClick={() => onSelectFolder && onSelectFolder(null)}
                title="Quay lại xem tất cả"
              >
                <span>{getFolderName(activeFolderId)}</span>
                <X size={16} style={{ marginLeft: 4, display: 'inline', verticalAlign: '-2px' }} />
              </button>
            )}
          </div>

          {/* Ô Tìm Kiếm */}
          <div className="search-box-wrapper">
            <Search size={18} className="search-icon-inside" />
            <input
              type="text"
              className="search-input"
              placeholder="Tìm kiếm ảnh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  color: 'var(--color-text-sub)'
                }}
                onClick={() => setSearchQuery('')}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* TIÊU ĐỀ KHU VỰC ẢNH & NÚT TRÌNH CHIẾU / TẢI ẢNH */}
      <div className="section-header">
        <h2 className="section-title">
          <ImageIcon size={22} color="#059669" />
          <span>
            {activeFolderId ? getFolderName(activeFolderId) : filterMode === 'favorites' ? 'Ảnh Yêu Thích' : 'Tất Cả Hình Ảnh'}
          </span>
          <span className="section-title-badge">{filteredPhotos.length} Bức ảnh</span>
        </h2>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* NÚT TẢI ẢNH TRONG ALBUM (Hiện khi isEditMode) */}
          {isEditMode && (
            <button
              className="btn-large-cta"
              onClick={onOpenUpload}
              title={activeFolderId ? `Tải ảnh vào album ${getFolderName(activeFolderId)}` : 'Tải ảnh mới'}
            >
              <Upload size={16} />
              <span>Tải Ảnh Vào {activeFolderId && activeFolderId !== 'all' ? getFolderName(activeFolderId) : 'Kho'}</span>
            </button>
          )}

          {filteredPhotos.length > 0 && (
            <button
              className="btn-secondary"
              onClick={() => onOpenPhotoViewer && onOpenPhotoViewer(filteredPhotos, 0, true)}
              title="Trình chiếu tự động"
            >
              <Play size={16} color="#2563eb" />
              <span>Trình Chiếu</span>
            </button>
          )}
        </div>
      </div>

      {/* LƯỚI ẢNH GỌN GÀNG & ĐẸP */}
      <div className="photos-grid">
        {/* Thẻ Bấm Tải Ảnh Nhanh (Chỉ hiện khi ở Edit Mode) */}
        {isEditMode && (
          <div 
            className="photo-card"
            onClick={onOpenUpload}
            style={{
              border: '1.5px dashed var(--color-primary)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 180,
              background: 'var(--color-surface)',
              cursor: 'pointer',
              padding: 16
            }}
          >
            <div className="upload-icon-circle" style={{ width: 42, height: 42, marginBottom: 8, background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              <Upload size={20} />
            </div>
            <h3 style={{ fontSize: 'var(--font-base)', color: 'var(--color-primary)', fontWeight: 700, textAlign: 'center' }}>
              Thêm Ảnh Mới
            </h3>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-sub)', marginTop: 4, textAlign: 'center' }}>
              Bấm để tải vào {activeFolderId && activeFolderId !== 'all' ? getFolderName(activeFolderId) : 'kho ảnh'}
            </p>
          </div>
        )}

        {/* Danh sách ảnh */}
        {filteredPhotos.length > 0 ? (
          filteredPhotos.map((photo, idx) => {
            if (!photo) return null;
            return (
              <div 
                key={photo.id || idx} 
                className="photo-card" 
                onClick={() => handlePhotoClick(idx)}
                style={{ cursor: 'pointer' }}
              >
                {/* Khung ảnh thumbnail */}
                <div className="photo-thumb-container">
                  <img 
                    src={photo.url} 
                    alt={photo.title || 'Ảnh'} 
                    className="photo-thumb"
                    loading="lazy"
                  />

                  <div className="photo-overlay-badge" onClick={(e) => e.stopPropagation()}>
                    <button
                      className={`fav-btn ${photo.isFavorite ? 'is-fav' : ''}`}
                      onClick={() => onToggleFavorite && onToggleFavorite(photo.id)}
                      title={photo.isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                    >
                      <Heart size={16} fill={photo.isFavorite ? '#ef4444' : 'none'} />
                    </button>
                  </div>
                </div>

                {/* Chân ảnh */}
                <div 
                  className="photo-card-footer" 
                  onClick={(e) => e.stopPropagation()}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-sm)', color: 'var(--color-text-sub)' }}>
                    <Calendar size={14} />
                    {photo.date || 'Gần đây'}
                  </span>

                  {isEditMode && (
                    <button
                      style={{
                        background: 'transparent',
                        padding: 4,
                        borderRadius: 4,
                        color: '#dc2626'
                      }}
                      onClick={() => onDeletePhoto && onDeletePhoto(photo)}
                      title="Xóa bức ảnh này"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state-box" style={{ gridColumn: '1 / -1', margin: '10px 0', padding: '30px 16px' }}>
            <div className="empty-state-icon">🖼️</div>
            <h3 className="empty-state-title">Chưa có bức ảnh nào trong album này</h3>
            <p className="empty-state-desc">
              {isEditMode 
                ? 'Hãy bấm nút "Tải Ảnh Lên" bên dưới để thêm ảnh vào album.' 
                : 'Album hiện chưa có ảnh. Bạn có thể bấm chuyển sang chế độ "Đang Sửa" để tải ảnh mới lên.'}
            </p>
            {isEditMode && (
              <button className="btn-large-cta" onClick={onOpenUpload}>
                <Upload size={18} />
                <span>Tải Ảnh Vào Đây Ngay</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
