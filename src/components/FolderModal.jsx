import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Edit3, Check } from 'lucide-react';
import { speechAssistant } from '../services/speech';

const QUICK_SUGGESTIONS = [
  { name: 'Gia Đình', icon: '👨‍👩‍👧‍👦' },
  { name: 'Con Cháu', icon: '👶' },
  { name: 'Đám Cưới & Tiệc', icon: '💍' },
  { name: 'Đi Du Lịch', icon: '✈️' },
  { name: 'Ngày Tết', icon: '🧧' },
  { name: 'Cây Cảnh & Vườn', icon: '🌸' },
  { name: 'Kỷ Niệm Xưa', icon: '📷' },
  { name: 'Họp Mặt Bạn Bè', icon: '☕' }
];

export default function FolderModal({
  isOpen,
  folderToEdit = null,
  onClose,
  onSaveFolder,
  speechEnabled,
  currentUser
}) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📁');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (folderToEdit) {
      setName(folderToEdit.name || '');
      setIcon(folderToEdit.icon || '📁');
      setIsPublic(folderToEdit.isPublic !== false);
    } else {
      setName('');
      setIcon('👨‍👩‍👧‍👦');
      setIsPublic(true);
    }
    setError('');
  }, [folderToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSelectSuggestion = (sug) => {
    setName(sug.name);
    setIcon(sug.icon);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập hoặc chọn một tên album ở bên dưới!');
      return;
    }

    const folderData = {
      id: folderToEdit ? folderToEdit.id : `folder_${Date.now()}`,
      name: name.trim(),
      icon,
      isPublic,
      createdBy: folderToEdit ? folderToEdit.createdBy : (currentUser?.username || 'admin'),
      createdByName: folderToEdit ? folderToEdit.createdByName : (currentUser?.fullName || currentUser?.username || 'Admin'),
      createdAt: folderToEdit ? folderToEdit.createdAt : new Date().toISOString()
    };

    onSaveFolder(folderData);
    if (speechEnabled) {
      speechAssistant.speak(`Đã ${folderToEdit ? 'đổi tên' : 'tạo'} album ${name}`);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h2 className="modal-title">
            {folderToEdit ? <Edit3 size={22} color="#2563eb" /> : <FolderPlus size={22} color="#2563eb" />}
            <span>{folderToEdit ? 'Sửa Album' : 'Tạo Album'}</span>
          </h2>
          <button className="modal-close-btn" onClick={onClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="modal-body">
            {error && (
              <div className="status-callout error">
                <span>⚠️ {error}</span>
              </div>
            )}

            {/* Ô nhập tên */}
            <div className="form-group">
              <label className="form-label">
                Tên album:
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div 
                  style={{ 
                    fontSize: '22px', 
                    width: '42px', 
                    height: '40px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: 'var(--color-bg)',
                    border: '1.5px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  {icon}
                </div>
                <input
                  type="text"
                  placeholder="Nhập tên album..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ flex: 1 }}
                  autoFocus
                />
              </div>
            </div>

            {/* Chế độ hiển thị: Công khai vs Riêng tư */}
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label" style={{ marginBottom: 6 }}>
                Quyền xem album:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: isPublic ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    background: isPublic ? 'var(--color-primary-light)' : 'var(--color-surface)',
                    color: isPublic ? 'var(--color-primary)' : 'var(--color-text-main)',
                    fontWeight: 700,
                    fontSize: 'var(--font-sm)',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: 18 }}>🌐</span>
                  <div style={{ textAlign: 'left' }}>
                    <div>Công Khai</div>
                    <div style={{ fontSize: 11, fontWeight: 400, color: 'var(--color-text-sub)' }}>Mọi người đều xem</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: !isPublic ? '2px solid #8b5cf6' : '1px solid var(--color-border)',
                    background: !isPublic ? 'rgba(139, 92, 246, 0.12)' : 'var(--color-surface)',
                    color: !isPublic ? '#8b5cf6' : 'var(--color-text-main)',
                    fontWeight: 700,
                    fontSize: 'var(--font-sm)',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: 18 }}>🔒</span>
                  <div style={{ textAlign: 'left' }}>
                    <div>Riêng Tư</div>
                    <div style={{ fontSize: 11, fontWeight: 400, color: 'var(--color-text-sub)' }}>Chỉ mình bạn xem</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Gợi ý chọn nhanh 1 chạm */}
            <div>
              <label className="form-label" style={{ marginBottom: 8 }}>
                Gợi ý tên:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {QUICK_SUGGESTIONS.map((sug) => {
                  const isSelected = name === sug.name;
                  return (
                    <button
                      key={sug.name}
                      type="button"
                      onClick={() => handleSelectSuggestion(sug)}
                      style={{
                        background: isSelected ? 'var(--color-primary-light)' : 'var(--color-surface)',
                        border: `1.5px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        color: isSelected ? 'var(--color-primary)' : 'var(--color-text-main)',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--font-sm)',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        gap: 8,
                        minHeight: 38
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>{sug.icon}</span>
                      <span>{sug.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              <Check size={18} />
              <span>{folderToEdit ? 'Lưu' : 'Tạo Album'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
