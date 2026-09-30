import React from 'react';

const STYLES = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  SHIPPING: 'bg-violet-100 text-violet-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-rose-100 text-rose-800'
};

const LABELS = {
  PENDING: 'Chờ xử lý',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã huỷ'
};

export default function StatusBadge({ status }) {
  const cls = STYLES[status] || 'bg-slate-100 text-slate-700';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {LABELS[status] || status}
    </span>
  );
}

export { LABELS, STYLES };
