import React, { useState, useEffect, useCallback } from 'react';
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
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isPlaying, setIsPlaying] = useState(initialAutoPlay);

  const currentPhoto = photos[currentIndex];

  // Reset zoom & rotation khi chuyển ảnh
  useEffect(() => {
    if (currentPhoto) {
      setZoomLevel(1);
      setRotation(0);
    }
  }, [currentIndex]);

  // Điều hướng Trước / Sau
  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  }, [photos.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  }, [photos.length]);

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

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.25, 0.5));
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
    } catch (e) {
      window.open(currentPhoto.url, '_blank');
    }
  };

  return (
    <div className="lightbox-modal-backdrop" role="dialog" aria-modal="true">
      {/* THANH ĐIỀU KHIỂN TRÊN CÙNG */}
      <div className="lightbox-topbar">
        <div className="lightbox-counter">
          🖼️ Bức ảnh {currentIndex + 1} / {photos.length}
        </div>

        <div className="lightbox-controls">
          {/* Nút Trình chiếu tự động */}
          <button
            className={`lightbox-ctrl-btn ${isPlaying ? 'active' : ''}`}
            onClick={() => setIsPlaying(!isPlaying)}
            title="Tự động chuyển sang ảnh tiếp theo sau vài giây"
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} />}
            <span>{isPlaying ? 'Tạm Dừng Chiếu' : '▶️ Tự Động Chiếu'}</span>
          </button>

          {/* Phóng to / Thu nhỏ / Xoay */}
          <button className="lightbox-ctrl-btn" onClick={handleZoomIn} title="Phóng to ảnh">
            <ZoomIn size={22} /> Phóng To
          </button>
          <button className="lightbox-ctrl-btn" onClick={handleZoomOut} title="Thu nhỏ ảnh">
            <ZoomOut size={22} /> Thu Nhỏ
          </button>
          <button className="lightbox-ctrl-btn" onClick={handleRotate} title="Xoay ảnh 90 độ">
            <RotateCw size={22} /> Xoay
          </button>

          {/* Yêu thích */}
          <button
            className={`lightbox-ctrl-btn ${currentPhoto.isFavorite ? 'active' : ''}`}
            onClick={() => onToggleFavorite(currentPhoto.id)}
            title={currentPhoto.isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
          >
            <Heart size={22} fill={currentPhoto.isFavorite ? '#ef4444' : 'none'} color={currentPhoto.isFavorite ? '#ef4444' : '#ffffff'} />
            <span>{currentPhoto.isFavorite ? 'Đã Thích' : 'Yêu Thích'}</span>
          </button>

          {/* Tải về máy */}
          <button className="lightbox-ctrl-btn" onClick={handleDownload} title="Tải bức ảnh này về máy tính hoặc điện thoại">
            <Download size={22} /> Tải Về
          </button>

          {/* Nút Đóng to rõ */}
          <button className="lightbox-close-btn" onClick={onClose} title="Đóng chế độ xem ảnh (Phím Esc)">
            <X size={28} />
          </button>
        </div>
      </div>

      {/* KHU VỰC HIỂN THỊ ẢNH TOÀN MÀN HÌNH */}
      <div className="lightbox-content-area" style={{ height: 'calc(100vh - 90px)' }}>
        {/* Nút Ảnh trước */}
        <button className="lightbox-nav-btn prev" onClick={handlePrev} title="Xem ảnh phía trước (Mũi tên Trái)">
          <ChevronLeft size={48} />
        </button>

        {/* Khung ảnh chính full màn hình */}
        <div
          className="lightbox-main-img-wrapper"
          style={{
            maxWidth: '92vw',
            maxHeight: '88vh',
            transform: `scale(${zoomLevel}) rotate(${rotation}deg)`
          }}
        >
          <img
            src={currentPhoto.url}
            alt={currentPhoto.title || 'Ảnh xem to'}
            className="lightbox-main-img"
            style={{
              maxHeight: '86vh',
              maxWidth: '90vw',
              borderRadius: 'var(--radius-lg)'
            }}
          />
        </div>

        {/* Nút Ảnh sau */}
        <button className="lightbox-nav-btn next" onClick={handleNext} title="Xem ảnh tiếp theo (Mũi tên Phải)">
          <ChevronRight size={48} />
        </button>
      </div>
    </div>
  );
}
