import React from 'react';
import { 
  FolderPlus, 
  Upload, 
  Trash2, 
  RotateCcw, 
  Eye, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  Image as ImageIcon,
  Edit3,
  Cloud,
  Settings,
  Users,
  LogOut
} from 'lucide-react';
import { speechAssistant } from '../services/speech';

export default function Header({
  isEditMode,
  onToggleEditMode,
  onOpenNewFolder,
  onOpenUpload,
  onResetData,
  onClearAllPhotos,
  theme,
  onToggleTheme,
  fontSize,
  onChangeFontSize,
  speechEnabled,
  onToggleSpeech,
  onOpenR2,
  isR2Connected,
  onOpenSettings,
  currentUser,
  onLogout,
  onOpenUsersModal
}) {
  const handleSpeak = (text) => {
    if (speechEnabled) {
      speechAssistant.speak(text);
    }
  };

  const handleFontSizeChange = (size, label) => {
    onChangeFontSize(size);
    handleSpeak(`Đã đổi cỡ chữ sang ${label}`);
  };

  const handleThemeChange = (newTheme, label) => {
    if (theme !== newTheme) {
      onToggleTheme();
    }
    handleSpeak(`Đã chuyển sang giao diện ${label}`);
  };

  const isAdmin = currentUser?.role === 'admin';
  const isEditor = currentUser?.role === 'editor';
  const isViewer = currentUser?.role === 'viewer';

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
              onClick={() => handleFontSizeChange('standard', 'Nhỏ')}
              title="Cỡ chữ nhỏ"
            >
              Nhỏ
            </button>
            <button 
              className={`font-btn ${fontSize === 'large' ? 'active' : ''}`}
              onClick={() => handleFontSizeChange('large', 'Vừa')}
              title="Cỡ chữ vừa"
            >
              Vừa
            </button>
            <button 
              className={`font-btn ${fontSize === 'extra-large' ? 'active' : ''}`}
              onClick={() => handleFontSizeChange('extra-large', 'Lớn')}
              title="Cỡ chữ lớn"
            >
              Lớn
            </button>
          </div>
        </div>

        {/* Bật/Tắt Giọng đọc & Giao diện */}
        <div className="accessibility-group">
          <button 
            className={`tool-toggle-btn ${speechEnabled ? 'active' : ''}`}
            onClick={onToggleSpeech}
            title="Đọc to nội dung"
          >
            {speechEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>Đọc: {speechEnabled ? 'BẬT' : 'TẮT'}</span>
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

          {/* Quản lý User (Chỉ Admin) */}
          {isAdmin && (
            <button 
              className="font-btn"
              onClick={onOpenUsersModal}
              title="Quản lý tài khoản & phân quyền"
              style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', borderColor: '#8b5cf6' }}
            >
              <Users size={14} />
              <span>Quản Lý User</span>
            </button>
          )}

          {/* Trạng thái Cloudflare R2 (Chỉ Admin) */}
          {isAdmin && (
            <button 
              className={`cloud-status-badge ${isR2Connected ? 'connected' : 'disconnected'}`}
              onClick={onOpenR2}
              title="Cấu hình Cloudflare R2"
              style={{ borderColor: isR2Connected ? '#10b981' : '#f6821f', color: isR2Connected ? '#10b981' : '#ea580c' }}
            >
              <Cloud size={16} color={isR2Connected ? '#10b981' : '#f6821f'} />
              <span>
                {isR2Connected ? 'R2: Sẵn sàng' : 'Cấu hình R2'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 2. HEADER CHÍNH */}
      <div className="main-header">
        <div className="header-content">
          <div 
            className="logo-area"
            onClick={() => handleSpeak('Kho ảnh')}
          >
            <div className="logo-icon-box">
              <ImageIcon size={24} />
            </div>
            <div className="logo-text">
              <h1>KHO ẢNH</h1>
              <p>Lưu giữ khoảnh khắc</p>
            </div>
          </div>

          <div className="header-actions">
            {/* Huy hiệu người dùng */}
            {currentUser && (
              <div 
                className="user-badge-header"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 600
                }}
              >
                <span>{currentUser.avatar || '👤'}</span>
                <span className="desktop-only" style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.fullName || currentUser.username}
                </span>
                <span 
                  style={{
                    fontSize: 10,
                    padding: '1px 6px',
                    borderRadius: 999,
                    background: isAdmin ? 'rgba(139, 92, 246, 0.15)' : isEditor ? 'rgba(16, 185, 129, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                    color: isAdmin ? '#8b5cf6' : isEditor ? '#10b981' : '#6b7280',
                    fontWeight: 700
                  }}
                >
                  {isAdmin ? 'Admin' : isEditor ? 'Sửa' : 'Xem'}
                </span>
              </div>
            )}

            {/* Nút Cài đặt */}
            <button
              className="btn-secondary"
              onClick={onOpenSettings}
              title="Cài đặt"
              style={{ padding: '0 14px', height: 38 }}
            >
              <Settings size={16} />
              <span>Cài Đặt</span>
            </button>

            {/* Nút chuyển đổi Chế độ Xem / Quản Trị trên Desktop (Ẩn với Viewer) */}
            {!isViewer && (
              <button 
                className={`btn-secondary mode-toggle-btn ${isEditMode ? 'active-mode' : ''}`}
                onClick={onToggleEditMode}
                title="Đổi chế độ"
                style={{
                  borderColor: isEditMode ? 'var(--color-primary)' : 'var(--color-border)',
                  background: isEditMode ? 'var(--color-primary-light)' : 'var(--color-surface)',
                  color: isEditMode ? 'var(--color-primary)' : 'var(--color-text-main)'
                }}
              >
                {isEditMode ? <Edit3 size={16} /> : <Eye size={16} />}
                <span>{isEditMode ? 'Đang Sửa' : 'Chỉ Xem'}</span>
              </button>
            )}

            {/* Các nút quản trị trên desktop (Dành cho Admin hoặc Editor khi isEditMode) */}
            {isEditMode && !isViewer && (
              <>
                <button 
                  className="btn-large-cta"
                  onClick={onOpenUpload}
                  title="Tải ảnh"
                  style={{ background: '#ea580c' }}
                >
                  <Upload size={18} />
                  <span>Tải Ảnh</span>
                </button>

                <button 
                  className="btn-primary"
                  onClick={onOpenNewFolder}
                  title="Tạo album"
                >
                  <FolderPlus size={16} />
                  <span>Thêm Album</span>
                </button>
              </>
            )}

            {/* Các nút chỉ dành riêng cho Admin */}
            {isEditMode && isAdmin && (
              <>
                <button 
                  className="btn-secondary"
                  onClick={onResetData}
                  title="Nạp ảnh mẫu"
                >
                  <RotateCcw size={16} />
                  <span>Ảnh Mẫu</span>
                </button>

                <button 
                  className="btn-secondary"
                  style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                  onClick={onClearAllPhotos}
                  title="Xóa toàn bộ"
                >
                  <Trash2 size={16} />
                  <span>Xóa Hết</span>
                </button>
              </>
            )}

            {/* Nút Đăng Xuất */}
            {currentUser && (
              <button
                className="btn-secondary"
                onClick={onLogout}
                title="Đăng xuất khỏi thiết bị"
                style={{ padding: '0 10px', height: 38, color: 'var(--color-text-sub)' }}
              >
                <LogOut size={16} />
                <span className="desktop-only">Đăng Xuất</span>
              </button>
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
