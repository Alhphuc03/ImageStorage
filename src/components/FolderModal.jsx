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
  speechEnabled
}) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📁');
  const [error, setError] = useState('');

  useEffect(() => {
    if (folderToEdit) {
      setName(folderToEdit.name || '');
      setIcon(folderToEdit.icon || '📁');
    } else {
      setName('');
      setIcon('👨‍👩‍👧‍👦');
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
            {folderToEdit ? <Edit3 size={24} color="#2563eb" /> : <FolderPlus size={24} color="#2563eb" />}
            <span>{folderToEdit ? 'Đổi Tên Album' : 'Tạo Album Mới'}</span>
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
                Tên album kỷ niệm:
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
                  placeholder="Ví dụ: Đi chơi Đà Lạt, Đám cưới Út..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ flex: 1 }}
                  autoFocus
                />
              </div>
            </div>

            {/* Gợi ý chọn nhanh 1 chạm */}
            <div>
              <label className="form-label" style={{ marginBottom: 8 }}>
                💡 Hoặc bấm chọn nhanh tên có sẵn:
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
              <span>{folderToEdit ? 'Lưu Tên Mới' : 'Tạo Album Ngay'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
