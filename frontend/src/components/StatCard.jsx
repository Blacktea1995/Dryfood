import React from 'react';

const ACCENT = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-emerald-500 to-emerald-600',
  orange: 'from-orange-500 to-amber-500',
  red: 'from-rose-500 to-rose-600',
  violet: 'from-violet-500 to-violet-600'
};

export default function StatCard({ title, value, sub, icon, accent = 'blue', currency = false }) {
  const formatted = currency
    ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value)
    : value;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2 text-slate-800">
            {formatted}
            {currency && <span className="text-base font-semibold text-slate-400 ml-1">₫</span>}
          </p>
          {sub && <p className="text-xs text-slate-400 mt-2">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${ACCENT[accent] || ACCENT.blue} flex items-center justify-center text-xl shrink-0`}>
          <span>{icon}</span>
        </div>
      </div>
    </div>
  );
}
