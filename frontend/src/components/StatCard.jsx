import React from 'react';

const ACCENT = {
  blue: 'bg-forest-700',
  green: 'bg-emerald-600',
  orange: 'bg-amber-brand',
  red: 'bg-rose-600',
  violet: 'bg-forest-600'
};

const ACCENT_TEXT = {
  blue: 'text-bone-50',
  green: 'text-white',
  orange: 'text-forest-950',
  red: 'text-white',
  violet: 'text-bone-50'
};

export default function StatCard({ title, value, sub, icon, accent = 'blue', currency = false }) {
  const formatted = currency
    ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value)
    : value;

  return (
    <div className="bg-surface-raised rounded-card border border-line p-5 shadow-sm hover:shadow-lift transition-shadow">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm text-ink-soft font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2 text-ink tabular">
            {formatted}
            {currency && <span className="text-base font-semibold text-ink-faint ml-1">₫</span>}
          </p>
          {sub && <p className="text-xs text-ink-faint mt-2">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-control ${ACCENT[accent] || ACCENT.blue} grid place-items-center text-xl shrink-0 ${ACCENT_TEXT[accent] || ACCENT_TEXT.blue}`}>
          <span>{icon}</span>
        </div>
      </div>
    </div>
  );
}