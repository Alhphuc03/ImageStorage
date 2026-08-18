import React from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  FolderPlus, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  Eye, 
  Cloud, 
  RotateCcw, 
  Edit3, 
  Settings 
} from 'lucide-react';
import { speechAssistant } from '../services/speech';

export default function Header({
  fontSize,
  setFontSize,
  theme,
  setTheme,
  speechEnabled,
  setSpeechEnabled,
  cloudinaryConfig,
  isEditMode,
  onToggleEditMode,
  onOpenUpload,
  onOpenNewFolder,
  onOpenCloudinary,
  onOpenSettings,
  onResetData,
  onClearAllPhotos
}) {
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
      speechAssistant.speak('Đã bật trợ lý giọng nói');
    }
  };

  const handleThemeChange = (nextTheme, label) => {
    setTheme(nextTheme);
    handleSpeak(`Đã chuyển sang giao diện ${label}`);
  };

  return (
    <header>
      {/* 1. THANH TRỢ NĂNG (Chỉ hiển thị trên máy tính để bàn, ẩn trên Mobile) */}
      <div className="top-accessibility-bar">
        {/* Điều chỉnh cỡ chữ */}
        <div className="accessibility-group">
          <span className="accessibility-label">
            <Eye size={16} /> Cỡ chữ:
          </span>
          <div className="font-size-btn-group">
            <button 
              className={`font-btn ${fontSize === 'standard' ? 'active' : ''}`}
              onClick={() => handleFontSizeChange('standard', 'Tiêu chuẩn')}
              title="Cỡ chữ tiêu chuẩn"
            >
              A Nhỏ
            </button>
            <button 
              className={`font-btn ${fontSize === 'large' ? 'active' : ''}`}
              onClick={() => handleFontSizeChange('large', 'Lớn')}
              title="Cỡ chữ vừa phải"
            >
              A+ Vừa
            </button>
            <button 
              className={`font-btn ${fontSize === 'extra-large' ? 'active' : ''}`}
              onClick={() => handleFontSizeChange('extra-large', 'Rất lớn')}
              title="Cỡ chữ rất lớn"
            >
              A++ To
            </button>
          </div>
        </div>

        {/* Bật/Tắt Giọng đọc & Giao diện */}
        <div className="accessibility-group">
          <button 
            className={`tool-toggle-btn ${speechEnabled ? 'active' : ''}`}
            onClick={handleToggleSpeech}
            title="Đọc to nội dung khi bấm"
          >
            {speechEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>Đọc tiếng: {speechEnabled ? 'BẬT' : 'TẮT'}</span>
          </button>

          {/* Đổi giao diện Sáng / Tối */}
          <div className="font-size-btn-group">
            <button 
              className={`font-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => handleThemeChange('light', 'Sáng')}
              title="Giao diện Sáng"
            >
              <Sun size={14} /> Sáng
            </button>
            <button 
              className={`font-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => handleThemeChange('dark', 'Tối')}
              title="Giao diện Tối"
            >
              <Moon size={14} /> Tối
            </button>
          </div>

          {/* Trạng thái Cloudinary */}
          <button 
            className={`cloud-status-badge ${isCloudConnected ? 'connected' : 'disconnected'}`}
            onClick={onOpenCloudinary}
            title="Cấu hình tài khoản Cloudinary"
          >
            <Cloud size={16} />
            <span>
              {isCloudConnected ? 'Cloud: Sẵn sàng' : 'Cài đặt Cloud'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. HEADER CHÍNH */}
      <div className="main-header">
        <div className="header-content">
          <div 
            className="logo-area"
            onClick={() => handleSpeak('Kho ảnh kỷ niệm')}
          >
            <div className="logo-icon-box">
              <ImageIcon size={24} />
            </div>
            <div className="logo-text">
              <h1>KHO ẢNH KỶ NIỆM</h1>
              <p>Lưu trữ & ngắm lại hình ảnh gia đình dễ dàng</p>
            </div>
          </div>

          <div className="header-actions">
            {/* Nút Cài đặt (Mở Settings Modal) */}
            <button
              className="btn-secondary"
              onClick={onOpenSettings}
              title="Cài đặt giao diện, cỡ chữ và trợ năng"
              style={{ padding: '0 14px', height: 38 }}
            >
              <Settings size={16} />
              <span>Cài Đặt</span>
            </button>

            {/* Nút chuyển đổi Chế độ Xem / Quản Trị trên Desktop */}
            <button 
              className={`btn-secondary mode-toggle-btn ${isEditMode ? 'active-mode' : ''}`}
              onClick={onToggleEditMode}
              title="Bật/Tắt chế độ thêm sửa xóa"
              style={{
                borderColor: isEditMode ? 'var(--color-primary)' : 'var(--color-border)',
                background: isEditMode ? 'var(--color-primary-light)' : 'var(--color-surface)',
                color: isEditMode ? 'var(--color-primary)' : 'var(--color-text-main)'
              }}
            >
              {isEditMode ? <Edit3 size={16} /> : <Eye size={16} />}
              <span>{isEditMode ? 'Đang Quản Trị' : 'Chế Độ Chỉ Xem'}</span>
            </button>

            {/* Các nút quản trị trên desktop */}
            {isEditMode && (
              <>
                <button 
                  className="btn-large-cta"
                  onClick={onOpenUpload}
                  title="Tải ảnh mới lên"
                >
                  <Upload size={18} />
                  <span>Tải Ảnh</span>
                </button>

                <button 
                  className="btn-primary"
                  onClick={onOpenNewFolder}
                  title="Thêm thư mục mới"
                >
                  <FolderPlus size={16} />
                  <span>Thêm Album</span>
                </button>

                <button 
                  className="btn-secondary"
                  onClick={onResetData}
                  title="Khôi phục ảnh mẫu"
                >
                  <RotateCcw size={16} />
                  <span>Ảnh Mẫu</span>
                </button>

                <button 
                  className="btn-secondary"
                  style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                  onClick={onClearAllPhotos}
                  title="Xóa toàn bộ ảnh cũ"
                >
                  <span>Xóa Hết Ảnh</span>
                </button>
              </>
            )}
          </div>

          {/* Nút Settings riêng trên Mobile Header */}
          <button 
            className="mobile-header-settings-btn"
            onClick={onOpenSettings}
            title="Cài đặt & Trợ năng"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
