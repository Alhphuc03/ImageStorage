import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Xác nhận xóa',
  message = 'Bạn có chắc chắn muốn xóa không?',
  onClose,
  onConfirm
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ color: 'var(--color-danger)' }}>
            <AlertTriangle size={22} />
            <span>{title}</span>
          </h2>
          <button className="modal-close-btn" onClick={onClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: 'var(--font-base)', lineHeight: 1.5, color: 'var(--color-text-main)' }}>
            {message}
          </p>

          <div style={{
            background: 'var(--color-danger-light)',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            fontSize: 'var(--font-sm)',
            color: 'var(--color-danger)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 600
          }}>
            <span>⚠️ Không thể hoàn tác sau khi xóa.</span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Hủy
          </button>
          <button className="btn-danger" onClick={onConfirm}>
            <Trash2 size={18} />
            <span>Đồng Ý</span>
          </button>
        </div>
      </div>
    </div>
  );
}

