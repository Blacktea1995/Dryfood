import React from 'react';

const STYLES = {
  PENDING: 'bg-warning-bg text-warning',
  CONFIRMED: 'bg-forest-100 text-forest-800',
  SHIPPING: 'bg-forest-200 text-forest-900',
  DELIVERED: 'bg-success-bg text-success',
  CANCELLED: 'bg-danger-bg text-danger'
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
