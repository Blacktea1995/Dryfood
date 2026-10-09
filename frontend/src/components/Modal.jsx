import React from 'react';
import { Icon } from '../store/Ui.jsx';

export default function Modal({ open, title, onClose, children, width = 'max-w-lg' }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-forest-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-surface-raised rounded-card shadow-pop w-full ${width} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-line sticky top-0 bg-surface-raised rounded-t-card">
          <h3 className="display text-lg text-ink">{title}</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-control hover:bg-bone-100 grid place-items-center text-ink-soft transition-colors"
            aria-label="Đóng"
          >
            <Icon name="X" size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}