import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Trash2, Edit3, Check, Shield, Lock, User, AlertCircle, RefreshCw } from 'lucide-react';
import { authService } from '../services/auth';

const AVATAR_LIST = ['👑', '✍️', '👁️', '👨‍👩‍👧‍👦', '👵', '👴', '👩', '👨', '👧', '👦', '🌟', '💖'];

export default function UserManagementModal({ isOpen, onClose, currentUser }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('viewer');
  const [avatar, setAvatar] = useState('👤');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await authService.getUsers();
      setUsers(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setUsername('');
    setPassword('');
    setFullName('');
    setRole('viewer');
    setAvatar('👤');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleStartEdit = (u) => {
    setIsEditing(true);
    setEditId(u.id);
    setUsername(u.username);
    setPassword(u.password || '');
    setFullName(u.fullName || '');
    setRole(u.role || 'viewer');
    setAvatar(u.avatar || '👤');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('Vui lòng nhập tên đăng nhập');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Vui lòng nhập mật khẩu');
      return;
    }

    const userData = {
      id: editId,
      username: username.trim().toLowerCase(),
      password: password.trim(),
      fullName: fullName.trim() || username.trim(),
      role,
      avatar
    };

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const res = await authService.saveUser(userData);
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg(`Đã ${editId ? 'cập nhật' : 'tạo mới'} người dùng "${username}" thành công!`);
      resetForm();
      loadUsers();
    } else {
      setErrorMsg(res.message || 'Lỗi khi lưu người dùng');
    }
  };

  const handleDelete = async (u) => {
    if (u.username === 'admin') {
      alert('Không thể xóa tài khoản Admin chính');
      return;
    }
    if (!window.confirm(`Bạn có chắc muốn xóa tài khoản "${u.fullName || u.username}" không?`)) {
      return;
    }

    setIsLoading(true);
    const res = await authService.deleteUser(u.id);
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg(`Đã xóa tài khoản "${u.username}"`);
      loadUsers();
    } else {
      setErrorMsg(res.message || 'Lỗi khi xóa tài khoản');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            <Users size={22} color="#2563eb" />
            <span>Quản Lý Người Dùng & Phân Quyền</span>
          </h2>
          <button className="modal-close-btn" onClick={onClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          {/* Thông báo */}
          {errorMsg && (
            <div className="status-callout error" style={{ marginBottom: 12 }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="status-callout success" style={{ marginBottom: 12 }}>
              <Check size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Thêm / Sửa */}
          <div style={{ background: 'var(--color-bg)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: 20 }}>
            <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-primary)' }}>
              {isEditing ? <Edit3 size={18} /> : <UserPlus size={18} />}
              <span>{isEditing ? `Sửa Người Dùng: ${username}` : 'Thêm Người Dùng Mới'}</span>
            </h3>

            <form onSubmit={handleSaveUser}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label"><User size={14} /> Tên đăng nhập:</label>
                  <input
                    type="text"
                    placeholder="ví dụ: anhba, meyeu..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isEditing && username === 'admin'}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label"><Lock size={14} /> Mật khẩu:</label>
                  <input
                    type="text"
                    placeholder="Nhập mật khẩu..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tên hiển thị:</label>
                  <input
                    type="text"
                    placeholder="ví dụ: Anh Ba, Mẹ Hiền..."
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label"><Shield size={14} /> Vai trò & Quyền:</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={isEditing && username === 'admin'}
                  >
                    <option value="admin">👑 Admin (Toàn quyền)</option>
                    <option value="editor">✍️ Editor (Thêm/Sửa/Xóa ảnh)</option>
                    <option value="viewer">👁️ Viewer (Chỉ xem ảnh)</option>
                  </select>
                </div>
              </div>

              {/* Chọn Avatar Emoji */}
              <div style={{ marginTop: 10 }}>
                <label className="form-label" style={{ marginBottom: 6 }}>Biểu tượng đại diện:</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {AVATAR_LIST.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setAvatar(av)}
                      style={{
                        fontSize: 20,
                        width: 38,
                        height: 38,
                        borderRadius: 8,
                        border: avatar === av ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        background: avatar === av ? 'var(--color-primary-light)' : 'var(--color-surface)',
                        cursor: 'pointer'
                      }}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                {isEditing && (
                  <button type="button" className="btn-secondary" onClick={resetForm}>
                    Hủy sửa
                  </button>
                )}
                <button type="submit" className="btn-primary" disabled={isLoading}>
                  <Check size={16} />
                  <span>{isEditing ? 'Lưu Thay Đổi' : 'Tạo Người Dùng'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Danh sách người dùng hiện có */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700 }}>
                Danh Sách Tài Khoản ({users.length})
              </h3>
              <button
                type="button"
                className="btn-secondary"
                style={{ height: 32, padding: '0 10px', fontSize: 'var(--font-sm)' }}
                onClick={loadUsers}
                disabled={isLoading}
              >
                <RefreshCw size={14} />
                <span>Tải lại</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {users.map((u) => {
                const roleBadge = 
                  u.role === 'admin' ? { label: 'Admin', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' } :
                  u.role === 'editor' ? { label: 'Chỉnh Sửa', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' } :
                  { label: 'Chỉ Xem', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.12)' };

                return (
                  <div
                    key={u.id || u.username}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      gap: 10
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 24 }}>{u.avatar || '👤'}</span>
                      <div>
                        <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{u.fullName || u.username}</span>
                          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-sub)', fontWeight: 400 }}>
                            (@{u.username})
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 999,
                              color: roleBadge.color,
                              background: roleBadge.bg
                            }}
                          >
                            {roleBadge.label}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--color-text-sub)' }}>
                            Mật khẩu: <code>{u.password ? '••••••' : 'Chưa đặt'}</code>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn-secondary"
                        style={{ height: 32, padding: '0 10px', fontSize: 'var(--font-sm)' }}
                        onClick={() => handleStartEdit(u)}
                        title="Sửa / Đổi mật khẩu"
                      >
                        <Edit3 size={14} />
                        <span>Sửa</span>
                      </button>
                      {u.username !== 'admin' && (
                        <button
                          className="btn-secondary"
                          style={{ height: 32, padding: '0 8px', color: '#dc2626', borderColor: '#dc2626' }}
                          onClick={() => handleDelete(u)}
                          title="Xóa tài khoản này"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
