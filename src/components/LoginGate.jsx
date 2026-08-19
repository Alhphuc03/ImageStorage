import React, { useState } from 'react';
import {
  LogIn,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  UserPlus,
  CheckCircle2,
  Image as ImageIcon,
  Smile
} from 'lucide-react';
import { authService } from '../services/auth';

export default function LoginGate({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  // State Đăng Nhập
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // State Đăng Ký
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Xử lý Đăng Nhập
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await authService.login(username, password);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.message || 'Tên đăng nhập hoặc mật khẩu không chính xác');
      }
    } catch (err) {
      setErrorMessage('Có lỗi xảy ra khi kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý Đăng Ký
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const cleanU = regUsername.trim().toLowerCase();
    const cleanP = regPassword.trim();
    const cleanConfirm = regConfirmPassword.trim();
    const cleanName = regFullName.trim();

    if (!cleanU || !cleanP) {
      setErrorMessage('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }

    if (cleanU.length < 3) {
      setErrorMessage('Tên đăng nhập cần ít nhất 3 ký tự');
      return;
    }

    if (cleanP.length < 3) {
      setErrorMessage('Mật khẩu cần ít nhất 3 ký tự');
      return;
    }

    if (cleanP !== cleanConfirm) {
      setErrorMessage('Mật khẩu nhập lại không khớp');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await authService.register(cleanU, cleanP, cleanName);
      if (result.success && result.user) {
        setSuccessMessage('Đăng ký thành công! Đang tự động đăng nhập...');
        setTimeout(() => {
          onLoginSuccess(result.user);
        }, 600);
      } else {
        setErrorMessage(result.message || 'Đăng ký không thành công. Tên đăng nhập có thể đã tồn tại.');
      }
    } catch (err) {
      setErrorMessage('Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setErrorMessage('');
    setSuccessMessage('');
  };

  return (
    <div className="login-gate-screen">
      {/* Hiệu ứng nền ánh sáng */}
      <div className="login-bg-glow glow-1" />
      <div className="login-bg-glow glow-2" />

      <div className="login-card-container">
        {/* Header Logo */}
        <div className="login-header">
          <div className="login-logo-circle">
            <ImageIcon size={32} color="#ffffff" />
          </div>
          <h1 className="login-title">KHO ẢNH KỶ NIỆM</h1>
          <p className="login-subtitle">
            {mode === 'login' ? 'Đăng nhập để xem và quản lý ảnh' : 'Tạo tài khoản mới để tải và lưu ảnh'}
          </p>
        </div>

        {/* Tab chuyển đổi Đăng Nhập / Đăng Ký */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 6,
          background: 'var(--color-bg)',
          padding: 4,
          borderRadius: 'var(--radius-md)',
          marginBottom: 20,
          border: '1px solid var(--color-border)'
        }}>
          <button
            type="button"
            onClick={() => switchMode('login')}
            style={{
              height: 38,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: mode === 'login' ? 'var(--color-surface)' : 'transparent',
              color: mode === 'login' ? 'var(--color-primary)' : 'var(--color-text-sub)',
              fontWeight: 700,
              fontSize: 'var(--font-sm)',
              cursor: 'pointer',
              boxShadow: mode === 'login' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            Đăng Nhập
          </button>

          <button
            type="button"
            onClick={() => switchMode('register')}
            style={{
              height: 38,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: mode === 'register' ? 'var(--color-surface)' : 'transparent',
              color: mode === 'register' ? 'var(--color-primary)' : 'var(--color-text-sub)',
              fontWeight: 700,
              fontSize: 'var(--font-sm)',
              cursor: 'pointer',
              boxShadow: mode === 'register' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            Đăng Ký
          </button>
        </div>

        {/* Thông báo lỗi */}
        {errorMessage && (
          <div className="status-callout error login-error-box">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Thông báo thành công */}
        {successMessage && (
          <div className="status-callout success login-error-box" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: '#10b981', color: '#10b981' }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* FORM 1: ĐĂNG NHẬP */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">
                <User size={16} /> Tên đăng nhập
              </label>
              <div className="login-input-wrap">
                <input
                  type="text"
                  placeholder="Nhập tên đăng nhập..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                  autoComplete="username"
                  className="login-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Lock size={16} /> Mật khẩu
              </label>
              <div className="login-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="login-input"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-large-cta login-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <span>Đang Đăng Nhập...</span>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>Đăng Nhập</span>
                </>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: 14, fontSize: 'var(--font-sm)', color: 'var(--color-text-sub)' }}>
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => switchMode('register')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                Đăng ký ngay
              </button>
            </div>
          </form>
        ) : (
          /* FORM 2: ĐĂNG KÝ (QUYỀN EDITOR) */
          <form onSubmit={handleRegisterSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">
                <Smile size={16} /> Tên hiển thị (Tùy chọn)
              </label>
              <div className="login-input-wrap">
                <input
                  type="text"
                  placeholder="Ví dụ: Ba, Mẹ, Chị hai ..."
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  disabled={isLoading}
                  className="login-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <User size={16} /> Tên đăng nhập
              </label>
              <div className="login-input-wrap">
                <input
                  type="text"
                  placeholder="Nhập tên đăng nhập (ít nhất 3 ký tự)..."
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  disabled={isLoading}
                  autoComplete="username"
                  className="login-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Lock size={16} /> Mật khẩu
              </label>
              <div className="login-input-wrap">
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu..."
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="login-input"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  tabIndex={-1}
                >
                  {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Lock size={16} /> Nhập lại mật khẩu
              </label>
              <div className="login-input-wrap">
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  placeholder="Xác nhận lại mật khẩu..."
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="login-input"
                />
              </div>
            </div>

            {/* Ghi chú về quyền Editor */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px',
              fontSize: 12,
              color: 'var(--color-text-sub)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span>✍️</span>
              <span>Tài khoản mới sẽ có quyền <strong>Biên Tập Viên</strong> (Tải ảnh & Tạo album).</span>
            </div>

            <button
              type="submit"
              className="btn-large-cta login-submit-btn"
              disabled={isLoading}
              style={{ background: '#10b981' }}
            >
              {isLoading ? (
                <span>Đang Tạo Tài Khoản...</span>
              ) : (
                <>
                  <UserPlus size={20} />
                  <span>Đăng Ký Tài Khoản</span>
                </>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: 14, fontSize: 'var(--font-sm)', color: 'var(--color-text-sub)' }}>
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                Đăng nhập ngay
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
