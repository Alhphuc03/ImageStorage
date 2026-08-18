import React from 'react';
import { 
  X, 
  Settings, 
  Sun, 
  Moon, 
  Eye, 
  Volume2, 
  VolumeX, 
  Cloud, 
  RotateCcw, 
  Trash2, 
  Check, 
  Sparkles,
  Edit3
} from 'lucide-react';
import { speechAssistant } from '../services/speech';

export default function SettingsModal({
  isOpen,
  onClose,
  fontSize,
  setFontSize,
  theme,
  setTheme,
  speechEnabled,
  setSpeechEnabled,
  cloudinaryConfig,
  onOpenCloudinary,
  onResetData,
  onClearAllPhotos,
  isEditMode,
  onToggleEditMode
}) {
  if (!isOpen) return null;

  const isCloudConnected = Boolean(cloudinaryConfig?.cloudName && cloudinaryConfig?.uploadPreset);

  const handleSpeak = (text) => {
    if (speechEnabled) {
      speechAssistant.speak(text);
    }
  };

  const handleFontSizeChange = (size, label) => {
    setFontSize(size);
    handleSpeak(`Đã chọn cỡ chữ ${label}`);
  };

  const handleToggleSpeech = () => {
    const nextState = !speechEnabled;
    setSpeechEnabled(nextState);
    speechAssistant.setEnabled(nextState);
    if (nextState) {
      speechAssistant.speak('Đã bật trợ lý đọc to thành tiếng');
    }
  };

  const handleThemeChange = (nextTheme, label) => {
    setTheme(nextTheme);
    handleSpeak(`Đã chuyển sang giao diện ${label}`);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            <Settings size={22} color="#2563eb" />
            <span>Cài Đặt & Trợ Năng</span>
          </h2>
          <button className="modal-close-btn" onClick={onClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* 1. Giao diện Sáng / Tối */}
          <div className="form-group">
            <label className="form-label">
              🎨 Giao diện màu sắc:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              <button
                type="button"
                className={`btn-secondary ${theme === 'light' ? 'btn-primary' : ''}`}
                style={{ height: 38, fontSize: 'var(--font-sm)' }}
                onClick={() => handleThemeChange('light', 'Sáng')}
              >
                <Sun size={16} />
                <span>Sáng Dịu Mắt</span>
              </button>
              <button
                type="button"
                className={`btn-secondary ${theme === 'dark' ? 'btn-primary' : ''}`}
                style={{ height: 38, fontSize: 'var(--font-sm)' }}
                onClick={() => handleThemeChange('dark', 'Tối')}
              >
                <Moon size={16} />
                <span>Tối Êm Mắt</span>
              </button>
            </div>
          </div>

          {/* 2. Cỡ chữ */}
          <div className="form-group">
            <label className="form-label">
              <Eye size={16} /> Cỡ chữ hiển thị:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              <button
                type="button"
                className={`btn-secondary ${fontSize === 'standard' ? 'btn-primary' : ''}`}
                style={{ height: 38, fontSize: 'var(--font-sm)' }}
                onClick={() => handleFontSizeChange('standard', 'Tiêu chuẩn')}
              >
                A Nhỏ
              </button>
              <button
                type="button"
                className={`btn-secondary ${fontSize === 'large' ? 'btn-primary' : ''}`}
                style={{ height: 38, fontSize: 'var(--font-sm)' }}
                onClick={() => handleFontSizeChange('large', 'Lớn')}
              >
                A+ Vừa
              </button>
              <button
                type="button"
                className={`btn-secondary ${fontSize === 'extra-large' ? 'btn-primary' : ''}`}
                style={{ height: 38, fontSize: 'var(--font-sm)' }}
                onClick={() => handleFontSizeChange('extra-large', 'Rất lớn')}
              >
                A++ To
              </button>
            </div>
          </div>

          {/* 3. Giọng đọc trợ lý */}
          <div className="form-group">
            <label className="form-label">
              🔊 Trợ lý đọc to thành tiếng:
            </label>
            <button
              type="button"
              className={`btn-secondary ${speechEnabled ? 'btn-primary' : ''}`}
              style={{ width: '100%', height: 40, justifyContent: 'space-between', padding: '0 16px' }}
              onClick={handleToggleSpeech}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {speechEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                <span>Đọc to hướng dẫn:</span>
              </span>
              <strong>{speechEnabled ? 'ĐANG BẬT' : 'ĐÃ TẮT'}</strong>
            </button>
          </div>

          {/* 4. Cài đặt Cloudinary */}
          <div className="form-group">
            <label className="form-label">
              ☁️ Lưu trữ đám mây Cloudinary:
            </label>
            <button
              type="button"
              className="btn-secondary"
              style={{
                width: '100%',
                height: 42,
                justifyContent: 'space-between',
                padding: '0 16px',
                borderColor: isCloudConnected ? 'var(--color-secondary)' : 'var(--color-accent)',
                color: isCloudConnected ? 'var(--color-secondary)' : 'var(--color-accent)'
              }}
              onClick={() => {
                onClose();
                onOpenCloudinary();
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Cloud size={18} />
                <span>{isCloudConnected ? 'Cloud: Đã kết nối' : 'Cấu hình Cloudinary'}</span>
              </span>
              <span style={{ fontSize: 'var(--font-sm)', textDecoration: 'underline' }}>Chỉnh sửa &gt;</span>
            </button>
          </div>

          {/* 5. Khôi phục & Quản lý dữ liệu */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14, marginTop: 4 }}>
            <label className="form-label" style={{ marginBottom: 8, color: 'var(--color-text-sub)' }}>
              🛠️ Quản lý kho ảnh:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ height: 38, fontSize: 'var(--font-sm)' }}
                onClick={() => {
                  onClose();
                  onResetData();
                }}
              >
                <RotateCcw size={15} />
                <span>Ảnh Mẫu</span>
              </button>

              <button
                type="button"
                className="btn-secondary"
                style={{ height: 38, fontSize: 'var(--font-sm)', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                onClick={() => {
                  onClose();
                  onClearAllPhotos();
                }}
              >
                <Trash2 size={15} />
                <span>Xóa Hết Ảnh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="btn-primary" onClick={onClose} style={{ width: '100%' }}>
            <Check size={18} />
            <span>Xong & Đóng</span>
          </button>
        </div>
      </div>
    </div>
  );
}
