import React, { useState, useEffect, useRef } from 'react';
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
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { speechAssistant } from '../services/speech';
import { isPhotoVisible } from '../services/auth';

const PAGE_SIZE = 10; // Phân trang cố định đúng 10 ảnh / trang

export default function PhotoGrid({
  photos = [],
  folders = [],
  activeFolderId = null,
  filterMode: propFilterMode,
  onFilterModeChange,
  onSelectFolder,
  onOpenPhotoViewer,
  onToggleFavorite,
  onDeletePhoto,
  onOpenUpload,
  isEditMode = true,
  speechEnabled,
  currentUser
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [internalFilterMode, setInternalFilterMode] = useState('all'); // 'all' | 'favorites'
  const [currentPage, setCurrentPage] = useState(1);
  const gridTopRef = useRef(null);

  const filterMode = propFilterMode !== undefined ? propFilterMode : internalFilterMode;
  const setFilterMode = (mode) => {
    setInternalFilterMode(mode);
    if (onFilterModeChange) onFilterModeChange(mode);
  };

  const safePhotos = (photos || []).filter(Boolean);
  const safeFolders = (folders || []).filter(Boolean);

  // Lọc ảnh: Nếu chọn Album thì chỉ lọc ảnh của Album đó, ngược lại hiển thị ảnh kho chung / tất cả
  const filteredPhotos = safePhotos.filter((photo) => {
    if (!photo) return false;

    // Kiểm tra quyền xem ảnh (bao gồm ảnh riêng tư và album cha riêng tư)
    if (!isPhotoVisible(photo, currentUser, safeFolders)) {
      return false;
    }

    // Khi chọn vào Album cụ thể, chỉ lấy đúng ảnh của album đó
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
      const matchCreator = (photo.createdByName || photo.createdBy || '').toLowerCase().includes(q);
      return matchTitle || matchDate || matchCreator;
    }

    return true;
  });

  // Reset về trang 1 khi chuyển Album, đổi bộ lọc hoặc tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFolderId, filterMode, searchQuery]);

  // Tính toán phân trang
  const totalPages = Math.ceil(filteredPhotos.length / PAGE_SIZE) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, filteredPhotos.length);
  const currentPhotos = filteredPhotos.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== safeCurrentPage) {
      setCurrentPage(newPage);
      if (gridTopRef.current) {
        gridTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (speechEnabled) {
        speechAssistant.speak(`Trang ${newPage}`);
      }
    }
  };

  const getFolderName = (folderId) => {
    if (filterMode === 'favorites') return '❤️ Ảnh Yêu Thích';
    if (folderId === 'all') return '🌟 Tất Cả Hình Ảnh';
    const found = safeFolders.find(f => f && f.id === folderId);
    return found ? `${found.icon || '📁'} ${found.name || ''}` : 'Album Ảnh';
  };

  const handlePhotoClick = (indexInPage) => {
    if (onOpenPhotoViewer) {
      const globalIndex = startIndex + indexInPage;
      onOpenPhotoViewer(filteredPhotos, globalIndex);
    }
  };

  // Tạo danh sách số trang hiển thị gọn gàng (rút gọn dấu ...)
  const getPaginationNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (safeCurrentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (safeCurrentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="photos-section" ref={gridTopRef}>
      {/* THANH QUAY LẠI KHI Ở TRONG ALBUM */}
      {activeFolderId && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn-secondary"
            onClick={() => {
              if (onSelectFolder) onSelectFolder(null);
              if (speechEnabled) speechAssistant.speak('Quay lại');
            }}
            style={{ height: 36, padding: '0 14px', fontSize: 'var(--font-sm)', fontWeight: 700 }}
          >
            <ArrowLeft size={16} />
            <span>Quay Lại Danh Sách Album</span>
          </button>

          <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-sub)' }}>
            Đang xem: <strong style={{ color: 'var(--color-text-main)' }}>{getFolderName(activeFolderId)}</strong>
          </span>
        </div>
      )}

      {/* THANH TÌM KIẾM & BỘ LỌC */}
      {isEditMode && (
        <div className="filter-toolbar">
          <div className="filter-tabs">
            <button
              className={`filter-tab-btn ${!activeFolderId && filterMode === 'all' ? 'active' : ''}`}
              onClick={() => {
                if (onSelectFolder) onSelectFolder(null);
                setFilterMode('all');
                if (speechEnabled) speechAssistant.speak('Tất cả');
              }}
            >
              <Images size={15} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
              <span>Tất Cả ({safePhotos.length})</span>
            </button>

            <button
              className={`filter-tab-btn ${filterMode === 'favorites' ? 'active' : ''}`}
              onClick={() => {
                setFilterMode('favorites');
                if (speechEnabled) speechAssistant.speak('Yêu thích');
              }}
            >
              <Heart size={15} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} fill="#ef4444" color="#ef4444" />
              <span>Yêu Thích ({safePhotos.filter(p => p && p.isFavorite).length})</span>
            </button>

            {activeFolderId && (
              <button
                className="filter-tab-btn active"
                onClick={() => onSelectFolder && onSelectFolder(null)}
                title="Xem tất cả"
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
              placeholder="Tìm ảnh..."
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
            {activeFolderId ? getFolderName(activeFolderId) : filterMode === 'favorites' ? 'Ảnh Yêu Thích' : 'Tất Cả Ảnh'}
          </span>
          <span className="section-title-badge">
            {filteredPhotos.length > 0
              ? `Trang ${safeCurrentPage}/${totalPages} (${filteredPhotos.length} ảnh)`
              : '0 ảnh'}
          </span>
        </h2>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* NÚT TẢI ẢNH TRONG ALBUM (Hiện khi isEditMode) */}
          {isEditMode && (
            <button
              className="btn-large-cta"
              onClick={onOpenUpload}
              title="Tải ảnh mới"
            >
              <Upload size={16} />
              <span>Tải Ảnh</span>
            </button>
          )}

          {filteredPhotos.length > 0 && (
            <button
              className="btn-secondary"
              onClick={() => onOpenPhotoViewer && onOpenPhotoViewer(filteredPhotos, 0, true)}
              title="Trình chiếu"
            >
              <Play size={16} color="#2563eb" />
              <span>Trình Chiếu</span>
            </button>
          )}
        </div>
      </div>

      {/* LƯỚI 10 ẢNH CỦA TRANG HIỆN TẠI */}
      <div className="photos-grid">
        {/* Thẻ Bấm Tải Ảnh Nhanh (Chỉ hiện khi ở Edit Mode, ở trang 1 và không phải Viewer) */}
        {isEditMode && currentUser?.role !== 'viewer' && safeCurrentPage === 1 && (
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
              Thêm Ảnh
            </h3>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-sub)', marginTop: 4, textAlign: 'center' }}>
              Bấm để tải ảnh lên
            </p>
          </div>
        )}

        {/* Danh sách đúng 10 ảnh của trang hiện tại */}
        {currentPhotos.length > 0 ? (
          currentPhotos.map((photo, idx) => {
            if (!photo) return null;
            const canDelete = isEditMode && currentUser?.role !== 'viewer' && (
              currentUser?.role === 'admin' || photo.createdBy === currentUser?.username
            );

            return (
              <div 
                key={photo.id || `${safeCurrentPage}_${idx}`} 
                className="photo-card" 
                onClick={() => handlePhotoClick(idx)}
                style={{ cursor: 'pointer' }}
              >
                {/* Khung ảnh thumbnail với lazy load và ưu tiên ảnh đầu */}
                <div className="photo-thumb-container">
                  <img 
                    src={photo.url} 
                    alt={photo.title || 'Ảnh'} 
                    className="photo-thumb"
                    loading={idx < 2 ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={idx < 2 ? "high" : "auto"}
                  />

                  {/* Huy hiệu riêng tư 🔒 */}
                  {photo.isPublic === false && (
                    <div 
                      style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        background: 'rgba(0, 0, 0, 0.75)',
                        color: '#c084fc',
                        padding: '2px 6px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        border: '1px solid rgba(192, 132, 252, 0.4)',
                        zIndex: 2
                      }}
                      title={`Ảnh riêng tư của ${photo.createdByName || photo.createdBy || 'bạn'}`}
                    >
                      <span>🔒</span>
                    </div>
                  )}

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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-sm)', color: 'var(--color-text-sub)' }}>
                      <Calendar size={14} />
                      {photo.date || 'Gần đây'}
                    </span>
                    {currentUser?.role === 'admin' && photo.createdByName && (
                      <span style={{ fontSize: 11, color: 'var(--color-text-sub)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Bởi: {photo.createdByName}
                      </span>
                    )}
                  </div>

                  {canDelete && (
                    <button
                      style={{
                        background: 'transparent',
                        padding: 4,
                        borderRadius: 4,
                        color: '#dc2626'
                      }}
                      onClick={() => onDeletePhoto && onDeletePhoto(photo)}
                      title="Xóa ảnh"
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
            <h3 className="empty-state-title">Chưa có ảnh nào</h3>
            <p className="empty-state-desc">
              {isEditMode 
                ? 'Bấm nút "Tải Ảnh" để thêm ảnh.' 
                : 'Mục này hiện chưa có ảnh.'}
            </p>
            {isEditMode && (
              <button className="btn-large-cta" onClick={onOpenUpload}>
                <Upload size={18} />
                <span>Tải Ảnh Ngay</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* THANH ĐIỀU HƯỚNG PHÂN TRANG (PAGINATION BAR) 10 ẢNH / TRANG */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          marginTop: 28,
          marginBottom: 10,
          padding: '16px',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)'
        }}>
          {/* Thông tin dòng */}
          <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-sub)' }}>
            Hiển thị ảnh <strong>{startIndex + 1}</strong> - <strong>{endIndex}</strong> trong tổng số <strong style={{ color: 'var(--color-primary)' }}>{filteredPhotos.length}</strong> bức ảnh
          </div>

          {/* Các nút bấm phân trang */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* Nút Về trang đầu */}
            <button
              type="button"
              className="btn-secondary"
              onClick={() => handlePageChange(1)}
              disabled={safeCurrentPage === 1}
              style={{ width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: safeCurrentPage === 1 ? 0.4 : 1 }}
              title="Trang đầu"
            >
              <ChevronsLeft size={16} />
            </button>

            {/* Nút Trang trước */}
            <button
              type="button"
              className="btn-secondary"
              onClick={() => handlePageChange(safeCurrentPage - 1)}
              disabled={safeCurrentPage === 1}
              style={{ height: 36, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 4, opacity: safeCurrentPage === 1 ? 0.4 : 1 }}
            >
              <ChevronLeft size={16} />
              <span style={{ fontSize: 'var(--font-sm)' }}>Trước</span>
            </button>

            {/* Danh sách các số trang */}
            {getPaginationNumbers().map((p, idx) => {
              if (p === '...') {
                return (
                  <span key={`dots_${idx}`} style={{ padding: '0 6px', color: 'var(--color-text-sub)', fontSize: 14 }}>
                    ...
                  </span>
                );
              }

              const isPageActive = p === safeCurrentPage;
              return (
                <button
                  key={`page_${p}`}
                  type="button"
                  onClick={() => handlePageChange(p)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-sm)',
                    border: isPageActive ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    background: isPageActive ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: isPageActive ? '#ffffff' : 'var(--color-text-main)',
                    fontWeight: isPageActive ? 800 : 600,
                    fontSize: 'var(--font-sm)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {p}
                </button>
              );
            })}

            {/* Nút Trang sau */}
            <button
              type="button"
              className="btn-secondary"
              onClick={() => handlePageChange(safeCurrentPage + 1)}
              disabled={safeCurrentPage === totalPages}
              style={{ height: 36, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 4, opacity: safeCurrentPage === totalPages ? 0.4 : 1 }}
            >
              <span style={{ fontSize: 'var(--font-sm)' }}>Sau</span>
              <ChevronRight size={16} />
            </button>

            {/* Nút Tới trang cuối */}
            <button
              type="button"
              className="btn-secondary"
              onClick={() => handlePageChange(totalPages)}
              disabled={safeCurrentPage === totalPages}
              style={{ width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: safeCurrentPage === totalPages ? 0.4 : 1 }}
              title="Trang cuối"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
