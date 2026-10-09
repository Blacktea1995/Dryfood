import React from 'react';

const STYLES = {
  PENDING: 'bg-amber-brand/15 text-amber-deep',
  CONFIRMED: 'bg-forest-100 text-forest-800',
  SHIPPING: 'bg-forest-200 text-forest-900',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-rose-100 text-rose-700'
};

const LABELS = {
  PENDING: 'Chờ xử lý',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã huỷ'
};

export default function StatusBadge({ status }) {
  const cls = STYLES[status] || 'bg-bone-100 text-ink-soft';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {LABELS[status] || status}
    </span>
  );
}

export { LABELS, STYLES };
