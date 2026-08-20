import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Play, 
  Pause, 
  Download, 
  Heart 
} from 'lucide-react';
import { speechAssistant } from '../services/speech';

export default function PhotoViewer({
  photos = [],
  initialIndex = 0,
  initialAutoPlay = false,
  onClose,
  onToggleFavorite,
  speechEnabled
}) {
  const [photoList, setPhotoList] = useState(photos);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState(initialAutoPlay);
  const [showControls, setShowControls] = useState(true);

  // Cập nhật khi photos prop thay đổi từ cha
  useEffect(() => {
    setPhotoList(photos);
  }, [photos]);

  // Trạng thái cảm ứng vuốt mượt mà (Smooth Touch Swipe)
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const [dragOffset, setDragOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  // Kéo di chuyển ảnh khi phóng to (Pan drag)
  const isDraggingImgRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const contentAreaRef = useRef(null);

  const currentPhoto = photoList[currentIndex] || photos[currentIndex];

  // Xử lý bật/tắt yêu thích tức thì (Instant Optimistic UI)
  const handleFavoriteToggle = (e) => {
    if (e) e.stopPropagation();
    if (!currentPhoto) return;
    const targetId = currentPhoto.id;
    // Cập nhật giao diện ngay lập tức
    setPhotoList(prev => prev.map(p => p && p.id === targetId ? { ...p, isFavorite: !p.isFavorite } : p));
    // Đồng bộ lên component cha (App.jsx)
    if (onToggleFavorite) {
      onToggleFavorite(targetId);
    }
  };

  // Reset zoom, pan & rotation khi chuyển ảnh
  useEffect(() => {
    if (currentPhoto) {
      setZoomLevel(1);
      setRotation(0);
      setDragOffset(0);
      setPanOffset({ x: 0, y: 0 });
    }
  }, [currentIndex, currentPhoto?.id]);

  // Tải trước ngầm ảnh liền kề (trước, sau) để vuốt phóng to chuyển ảnh mượt mà 60fps
  useEffect(() => {
    if (!photoList || photoList.length <= 1) return;
    const nextIdx = (currentIndex + 1) % photoList.length;
    const prevIdx = (currentIndex - 1 + photoList.length) % photoList.length;
    const next2Idx = (currentIndex + 2) % photoList.length;

    [nextIdx, prevIdx, next2Idx].forEach((idx) => {
      const p = photoList[idx];
      if (p?.url) {
        const img = new Image();
        img.src = p.url;
      }
    });
  }, [currentIndex, photoList]);

  // Cuộn chuột để Phóng to / Thu nhỏ (Mouse Wheel Zoom)
  useEffect(() => {
    const el = contentAreaRef.current;
    if (!el) return;

    const onWheelHandler = (e) => {
      e.preventDefault();
      const zoomStep = 0.2;
      if (e.deltaY < 0) {
        // Cuộn lên -> Phóng to
        setZoomLevel((prev) => Math.min(Number((prev + zoomStep).toFixed(2)), 4));
      } else {
        // Cuộn xuống -> Thu nhỏ
        setZoomLevel((prev) => {
          const next = Math.max(Number((prev - zoomStep).toFixed(2)), 0.5);
          if (next <= 1) setPanOffset({ x: 0, y: 0 });
          return next;
        });
      }
    };

    el.addEventListener('wheel', onWheelHandler, { passive: false });
    return () => el.removeEventListener('wheel', onWheelHandler);
  }, []);

  // Kéo chuột để di chuyển ảnh khi đã phóng to
  const handleMouseDown = (e) => {
    if (zoomLevel <= 1 || e.button !== 0) return;
    isDraggingImgRef.current = true;
    dragStartRef.current = {
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y
    };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingImgRef.current || zoomLevel <= 1) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    isDraggingImgRef.current = false;
  };

  // Nhấp đúp chuột để chuyển nhanh 1x <-> 2x
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (zoomLevel > 1) {
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
    } else {
      setZoomLevel(2);
    }
  };

  // Điều hướng Trước / Sau
  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  }, [photos.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  }, [photos.length]);

  // Xử lý cử chỉ vuốt trên màn hình cảm ứng (Real-time Smooth Touch Track)
  const handleTouchStart = (e) => {
    if (zoomLevel > 1) return; // Đang zoom thì không vuốt chuyển ảnh
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping || zoomLevel > 1) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = touch.clientY - touchStartRef.current.y;

    // Chỉ nhận chuyển động vuốt ngang
    if (Math.abs(diffX) > Math.abs(diffY)) {
      let offset = diffX;
      // Hiệu ứng kháng lực (Rubber-band) khi ở 2 mép đầu/cuối
      if ((currentIndex === 0 && diffX > 0) || (currentIndex === photos.length - 1 && diffX < 0)) {
        offset = diffX * 0.35;
      }
      setDragOffset(offset);
    }
  };

  const handleTouchEnd = (e) => {
    if (!isSwiping || zoomLevel > 1) return;
    setIsSwiping(false);
    
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = touch.clientY - touchStartRef.current.y;
    const duration = Date.now() - touchStartRef.current.time;

    const isQuickSwipe = duration < 280 && Math.abs(diffX) > 25;
    const isLongSwipe = Math.abs(diffX) > 55 || Math.abs(diffX) > window.innerWidth * 0.15;

    if ((isQuickSwipe || isLongSwipe) && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        // Vuốt sang trái -> Xem ảnh kế tiếp
        handleNext();
      } else if (diffX > 0) {
        // Vuốt sang phải -> Xem ảnh phía trước
        handlePrev();
      }
    }

    // Reset khoảng dịch chuyển để CSS transition mượt vào vị trí
    setDragOffset(0);
  };

  // Phím tắt bàn phím
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, onClose]);

  // Trình chiếu tự động (Slideshow)
  useEffect(() => {
    let timer;
    if (isPlaying && photos.length > 1) {
      timer = setInterval(() => {
        handleNext();
      }, 4500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, handleNext, photos.length]);

  if (!currentPhoto) return null;

  const handleZoomIn = () => setZoomLevel((z) => Math.min(Number((z + 0.25).toFixed(2)), 4));
  const handleZoomOut = () => setZoomLevel((z) => {
    const next = Math.max(Number((z - 0.25).toFixed(2)), 0.5);
    if (next <= 1) setPanOffset({ x: 0, y: 0 });
    return next;
  });
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const handleDownload = async () => {
    try {
      const response = await fetch(currentPhoto.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${currentPhoto.title || 'anh_ky_niem'}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      if (speechEnabled) {
        speechAssistant.speak('Đã tải ảnh về máy');
      }
    } catch {
      window.open(currentPhoto.url, '_blank');
    }
  };

  const toggleControls = (e) => {
    // Nếu chạm vào chính ảnh hoặc background (không phải nút bấm), ẩn/hiện header trên mobile
    if (
      e.target.tagName === 'IMG' || 
      e.target.classList.contains('lightbox-slide') || 
      e.target.classList.contains('lightbox-slider-track') ||
      e.target.classList.contains('lightbox-content-area') || 
      e.target.classList.contains('lightbox-modal-backdrop')
    ) {
      setShowControls((prev) => !prev);
    }
  };

  return (
    <div 
      className={`lightbox-modal-backdrop ${showControls ? 'show-ui' : 'hide-ui'}`} 
      role="dialog" 
      aria-modal="true"
      onClick={toggleControls}
    >
      {/* THANH ĐIỀU KHIỂN TRÊN CÙNG (FLOATING OVERLAY) */}
      <div className={`lightbox-topbar ${showControls ? 'visible' : 'hidden'}`}>
        {/* Số thứ tự ảnh & Chỉ số zoom */}
        <div className="lightbox-counter-badge">
          <span>{currentIndex + 1} / {photoList.length}</span>
          {zoomLevel !== 1 && (
            <span style={{ marginLeft: 6, opacity: 0.8, fontSize: '12px' }}>
              ({Math.round(zoomLevel * 100)}%)
            </span>
          )}
        </div>

        {/* Cụm công cụ điều khiển */}
        <div className="lightbox-controls">
          {/* Nút Trình chiếu tự động (Chỉ desktop) */}
          <button
            className={`lightbox-ctrl-btn desktop-only ${isPlaying ? 'active' : ''}`}
            onClick={() => setIsPlaying(!isPlaying)}
            title="Tự động chuyển ảnh"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            <span>{isPlaying ? 'Tạm Dừng' : 'Tự Động Chiếu'}</span>
          </button>

          {/* Phóng to / Thu nhỏ / Xoay (Chỉ desktop) */}
          <button className="lightbox-ctrl-btn desktop-only" onClick={handleZoomIn} title="Phóng to (hoặc cuộn chuột lên)">
            <ZoomIn size={20} /> <span className="btn-text">Phóng To</span>
          </button>
          <button className="lightbox-ctrl-btn desktop-only" onClick={handleZoomOut} title="Thu nhỏ (hoặc cuộn chuột xuống)">
            <ZoomOut size={20} /> <span className="btn-text">Thu Nhỏ</span>
          </button>
          <button className="lightbox-ctrl-btn desktop-only" onClick={handleRotate} title="Xoay ảnh 90 độ">
            <RotateCw size={20} /> <span className="btn-text">Xoay</span>
          </button>

          {/* Tải về máy (Chỉ desktop) */}
          <button className="lightbox-ctrl-btn desktop-only" onClick={handleDownload} title="Tải ảnh">
            <Download size={20} /> <span className="btn-text">Tải Về</span>
          </button>

          {/* Yêu thích (Hiện cả Mobile & Desktop với icon to rõ) */}
          <button
            className={`lightbox-ctrl-btn lightbox-fav-btn ${currentPhoto?.isFavorite ? 'active' : ''}`}
            onClick={handleFavoriteToggle}
            title={currentPhoto?.isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}
          >
            <Heart 
              size={24} 
              strokeWidth={2.4}
              fill={currentPhoto?.isFavorite ? '#ef4444' : 'none'} 
              color={currentPhoto?.isFavorite ? '#ef4444' : '#ffffff'} 
            />
            <span className="desktop-only">{currentPhoto?.isFavorite ? 'Đã Thích' : 'Yêu Thích'}</span>
          </button>

          {/* Nút Đóng */}
          <button 
            className="lightbox-close-btn" 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }} 
            title="Đóng (Esc)"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* KHU VỰC HIỂN THỊ ẢNH TOÀN MÀN HÌNH & CAROUSEL SLIDER TRACK */}
      <div 
        ref={contentAreaRef}
        className="lightbox-content-area"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Nút Ảnh trước (Ẩn trên mobile vì đã có vuốt) */}
        <button 
          className="lightbox-nav-btn prev desktop-only" 
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }} 
          title="Ảnh trước (Mũi tên Trái)"
        >
          <ChevronLeft size={40} />
        </button>

        {/* Carousel Slider Track: dịch chuyển mượt mà theo ngón tay */}
        <div 
          className="lightbox-slider-track"
          style={{
            transform: `translate3d(calc(-${currentIndex * 100}% + ${dragOffset}px), 0, 0)`,
            transition: isSwiping ? 'none' : 'transform 0.36s cubic-bezier(0.2, 0.8, 0.25, 1)'
          }}
        >
          {photoList.map((photo, idx) => {
            const isCurrent = idx === currentIndex;
            const isAdjacent = Math.abs(idx - currentIndex) <= 1 || 
              (idx === 0 && currentIndex === photoList.length - 1) || 
              (idx === photoList.length - 1 && currentIndex === 0);

            return (
              <div 
                key={photo.id || idx} 
                className={`lightbox-slide ${isCurrent ? 'active' : ''}`}
              >
                <div
                  className="lightbox-main-img-wrapper"
                  style={{
                    transform: isCurrent 
                      ? `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel}) rotate(${rotation}deg)` 
                      : 'none',
                    transition: isCurrent && !isDraggingImgRef.current ? 'transform 0.15s ease-out' : 'none',
                    cursor: isCurrent && zoomLevel > 1 
                      ? (isDraggingImgRef.current ? 'grabbing' : 'grab') 
                      : 'default'
                  }}
                  onMouseDown={isCurrent ? handleMouseDown : undefined}
                  onMouseMove={isCurrent ? handleMouseMove : undefined}
                  onDoubleClick={isCurrent ? handleDoubleClick : undefined}
                >
                  {isAdjacent ? (
                    <img
                      src={photo.url}
                      alt={photo.title || `Ảnh ${idx + 1}`}
                      className="lightbox-main-img"
                      draggable="false"
                      loading={isCurrent ? 'eager' : 'lazy'}
                    />
                  ) : (
                    <div className="lightbox-img-placeholder" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Nút Ảnh sau (Ẩn trên mobile vì đã có vuốt) */}
        <button 
          className="lightbox-nav-btn next desktop-only" 
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }} 
          title="Ảnh tiếp theo (Mũi tên Phải)"
        >
          <ChevronRight size={40} />
        </button>
      </div>

      {/* Hướng dẫn vuốt tinh tế cho mobile */}
      <div className="lightbox-mobile-swipe-hint">
        <span>👈 Vuốt đổi ảnh 👉</span>
      </div>
    </div>
  );
}


