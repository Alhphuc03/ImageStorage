import React, { useState } from 'react';
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
  Edit3,
  Zap,
  HardDrive,
  Smartphone,
  Download,
  Share,
  CheckCircle2
} from 'lucide-react';
import { speechAssistant } from '../services/speech';
import { 
  COMPRESSION_PROFILES, 
  getStoredCompressionProfile, 
  saveStoredCompressionProfile 
} from '../services/r2';

export default function SettingsModal({
  isOpen,
  onClose,
  fontSize,
  setFontSize,
  theme,
  setTheme,
  speechEnabled,
  setSpeechEnabled,
  r2Config,
  onOpenR2,
  onResetData,
  onClearAllPhotos,
  isEditMode,
  onToggleEditMode,
  currentUser,
  onOpenUsersModal,
  onLogout,
  installPrompt
}) {
  const [compressionProfile, setCompressionProfile] = useState(() => getStoredCompressionProfile());

  if (!isOpen) return null;

  const isR2Connected = Boolean(r2Config?.bucketName || r2Config?.accountId);
  const isAdmin = currentUser?.role === 'admin';

  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches || 
    window.navigator.standalone === true
  );

  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent || '');

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
      speechAssistant.speak('Đã bật trợ lý đọc');
    }
  };

  const handleThemeChange = (nextTheme, label) => {
    setTheme(nextTheme);
    handleSpeak(`Đã chuyển sang giao diện ${label}`);
  };

  const handleCompressionChange = (profileKey) => {
    setCompressionProfile(profileKey);
    saveStoredCompressionProfile(profileKey);
    handleSpeak(`Đã chọn chế độ ${COMPRESSION_PROFILES[profileKey]?.name || 'nén ảnh'}`);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            <Settings size={22} color="#ea580c" />
            <span>Cài Đặt</span>
          </h2>
          <button className="modal-close-btn" onClick={onClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
          {/* Thông tin tài khoản hiện tại */}
          {currentUser && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--color-bg)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              marginBottom: 14
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{currentUser.avatar || '👤'}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--font-base)' }}>
                    {currentUser.fullName || currentUser.username}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-sub)' }}>
                    Quyền: <strong>{isAdmin ? 'Quản Trị Viên (Admin)' : currentUser.role === 'editor' ? 'Chỉnh Sửa (Editor)' : 'Chỉ Xem (Viewer)'}</strong>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ height: 32, padding: '0 10px', fontSize: 'var(--font-sm)', color: '#dc2626', borderColor: '#dc2626' }}
                onClick={() => {
                  onClose();
                  if (onLogout) onLogout();
                }}
              >
                Đăng Xuất
              </button>
            </div>
          )}

          {/* QUẢN LÝ USER (CHỈ ADMIN) */}
          {isAdmin && onOpenUsersModal && (
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700, color: '#8b5cf6' }}>
                👥 Tài khoản & Phân quyền:
              </label>
              <button
                type="button"
                className="btn-secondary"
                style={{
                  width: '100%',
                  height: 42,
                  justifyContent: 'space-between',
                  padding: '0 16px',
                  borderColor: '#8b5cf6',
                  background: 'rgba(139, 92, 246, 0.08)',
                  color: '#8b5cf6'
                }}
                onClick={() => {
                  onClose();
                  onOpenUsersModal();
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>👑</span>
                  <span style={{ fontWeight: 700 }}>Quản Lý Tài Khoản & Mật Khẩu</span>
                </span>
                <span style={{ fontSize: 'var(--font-sm)', textDecoration: 'underline', fontWeight: 700 }}>
                  Mở &gt;
                </span>
              </button>
            </div>
          )}

          {/* CÁC TÍNH NĂNG R2 & NÉN ẢNH (CHỈ DÀNH CHO ADMIN) */}
          {isAdmin && (
            <>
              {/* 1. Cài đặt Cloudflare R2 */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                  ⚡ Lưu trữ đám mây Cloudflare R2 (10GB Miễn phí):
                </label>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{
                    width: '100%',
                    height: 44,
                    justifyContent: 'space-between',
                    padding: '0 16px',
                    borderColor: isR2Connected ? '#10b981' : '#f6821f',
                    color: isR2Connected ? 'var(--color-text-main)' : '#ea580c'
                  }}
                  onClick={() => {
                    onClose();
                    onOpenR2();
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Cloud size={20} color={isR2Connected ? '#10b981' : '#f6821f'} />
                    <span>{isR2Connected ? 'R2 Cloud: Đã cấu hình' : 'Cấu hình Cloudflare R2'}</span>
                  </span>
                  <span style={{ fontSize: 'var(--font-sm)', textDecoration: 'underline', color: '#ea580c', fontWeight: 700 }}>
                    Thiết lập &gt;
                  </span>
                </button>
              </div>

              {/* 2. Mức độ nén ảnh thông minh */}
              <div className="form-group" style={{ background: 'var(--color-surface-hover)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                <label className="form-label" style={{ marginBottom: 6, fontWeight: 700 }}>
                  <Zap size={16} color="#ea580c" /> Chế độ nén ảnh thông minh (WebP):
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.entries(COMPRESSION_PROFILES).map(([key, item]) => (
                    <div
                      key={key}
                      onClick={() => handleCompressionChange(key)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: `1.5px solid ${compressionProfile === key ? '#ea580c' : 'var(--color-border)'}`,
                        background: compressionProfile === key ? 'rgba(234, 88, 12, 0.08)' : 'var(--color-surface)',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="radio"
                        name="compression"
                        checked={compressionProfile === key}
                        onChange={() => handleCompressionChange(key)}
                        style={{ marginTop: 4, accentColor: '#ea580c' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: compressionProfile === key ? '#ea580c' : 'var(--color-text-main)' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-sub)', marginTop: 2 }}>
                          {item.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 3. Giao diện Sáng / Tối */}
          <div className="form-group">
            <label className="form-label">
              Giao diện:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              <button
                type="button"
                className={`btn-secondary ${theme === 'light' ? 'btn-primary' : ''}`}
                style={{ height: 38, fontSize: 'var(--font-sm)' }}
                onClick={() => handleThemeChange('light', 'Sáng')}
              >
                <Sun size={16} />
                <span>Sáng</span>
              </button>
              <button
                type="button"
                className={`btn-secondary ${theme === 'dark' ? 'btn-primary' : ''}`}
                style={{ height: 38, fontSize: 'var(--font-sm)' }}
                onClick={() => handleThemeChange('dark', 'Tối')}
              >
                <Moon size={16} />
                <span>Tối</span>
              </button>
            </div>
          </div>

          {/* 4. Cỡ chữ */}
          <div className="form-group">
            <label className="form-label">
              <Eye size={16} /> Cỡ chữ:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              <button
                type="button"
                className={`btn-secondary ${fontSize === 'standard' ? 'btn-primary' : ''}`}
                style={{ height: 38, fontSize: 'var(--font-sm)' }}
                onClick={() => handleFontSizeChange('standard', 'Nhỏ')}
              >
                Nhỏ
              </button>
              <button
                type="button"
                className={`btn-secondary ${fontSize === 'large' ? 'btn-primary' : ''}`}
                style={{ height: 38, fontSize: 'var(--font-sm)' }}
                onClick={() => handleFontSizeChange('large', 'Vừa')}
              >
                Vừa
              </button>
              <button
                type="button"
                className={`btn-secondary ${fontSize === 'extra-large' ? 'btn-primary' : ''}`}
                style={{ height: 38, fontSize: 'var(--font-sm)' }}
                onClick={() => handleFontSizeChange('extra-large', 'Lớn')}
              >
                Lớn
              </button>
            </div>
          </div>

          {/* 5. Giọng đọc trợ lý */}
          <div className="form-group">
            <label className="form-label">
              Đọc âm thanh:
            </label>
            <button
              type="button"
              className={`btn-secondary ${speechEnabled ? 'btn-primary' : ''}`}
              style={{ width: '100%', height: 40, justifyContent: 'space-between', padding: '0 16px' }}
              onClick={handleToggleSpeech}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {speechEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                <span>Đọc giọng nói:</span>
              </span>
              <strong>{speechEnabled ? 'BẬT' : 'TẮT'}</strong>
            </button>
          </div>

          {/* 6. Cài đặt App lên Điện thoại / Máy tính (PWA) */}
          <div className="form-group" style={{ background: 'var(--color-bg)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
            <label className="form-label" style={{ fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Smartphone size={18} /> Cài đặt ứng dụng vào điện thoại / PC:
            </label>

            {isStandalone ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontSize: 'var(--font-sm)', fontWeight: 700, padding: '6px 0' }}>
                <CheckCircle2 size={18} />
                <span>Bạn đang sử dụng ứng dụng ở chế độ đã cài đặt!</span>
              </div>
            ) : installPrompt ? (
              <div>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%', height: 42, justifyContent: 'center', gap: 8, fontSize: 'var(--font-sm)' }}
                  onClick={async () => {
                    installPrompt.prompt();
                    const choice = await installPrompt.userChoice;
                    if (choice.outcome === 'accepted') {
                      handleSpeak('Đang cài đặt ứng dụng');
                    }
                  }}
                >
                  <Download size={18} />
                  <span>Cài Đặt Ứng Dụng Ngay (1 Chạm)</span>
                </button>
                <div style={{ fontSize: 12, color: 'var(--color-text-sub)', marginTop: 6, textAlign: 'center' }}>
                  Ứng dụng sẽ xuất hiện trên màn hình chính, mở nhanh 0s và không có thanh URL.
                </div>
              </div>
            ) : isIOS ? (
              <div style={{ fontSize: 13, color: 'var(--color-text-main)', lineHeight: 1.5, background: 'var(--color-surface)', padding: 10, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6, color: '#2563eb' }}>
                  <Share size={15} /> Cách cài đặt trên iPhone / iPad:
                </div>
                <div>1. Bấm vào nút <strong>Chia sẻ (biểu tượng ⎋)</strong> ở thanh công cụ Safari.</div>
                <div>2. Cuộn xuống và chọn <strong>"Thêm vào Màn hình chính (Add to Home Screen)"</strong>.</div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--color-text-main)', lineHeight: 1.5, background: 'var(--color-surface)', padding: 10, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  📥 Cài đặt ứng dụng:
                </div>
                <div>Bấm vào biểu tượng <strong>Cài đặt / Tải xuống</strong> trên thanh địa chỉ hoặc menu (⋮) của trình duyệt ➔ Chọn <strong>"Cài đặt ứng dụng Kho Ảnh"</strong>.</div>
              </div>
            )}
          </div>

          {/* 6. Khôi phục & Quản lý dữ liệu (CHỈ ADMIN) */}
          {isAdmin && (
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14, marginTop: 4 }}>
              <label className="form-label" style={{ marginBottom: 8, color: 'var(--color-text-sub)' }}>
                🛠️ Quản lý dữ liệu:
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
                  <span>Xóa Hết</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="btn-primary" onClick={onClose} style={{ width: '100%' }}>
            <Check size={18} />
            <span>Xong</span>
          </button>
        </div>
      </div>
    </div>
  );
}
