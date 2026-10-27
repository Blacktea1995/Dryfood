import React from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { TrendUp, TrendDown, Minus } from '@phosphor-icons/react';

/** Dinh dang so gọn: >=1e9 -> "x,x tỷ ₫", >=1e6 -> "x,x triệu ₫", con lai so day du. */
export function formatCompact(v, currency = false) {
  const n = Number(v) || 0;
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  let s;
  if (abs >= 1e9) {
    s = (abs / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' tỷ';
  } else if (abs >= 1e6) {
    s = (abs / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' triệu';
  } else {
    s = abs.toLocaleString('vi-VN', { maximumFractionDigits: 0 });
  }
  return sign + s + (currency ? ' ₫' : '');
}

/** Component KPI chung: so gọn + tooltip day du, % thay doi, sparkline, nhan xet AI. */
export default function KpiCard({ label, value, changePct = null, sparkData = [], insight, currency = false, accent = 'forest' }) {
  const spark = (sparkData || []).map((v, i) => ({ i, v: Number(v) || 0 }));
  const Arrow = changePct === null ? Minus : changePct >= 0 ? TrendUp : TrendDown;
  const arrowColor = changePct === null ? 'text-ink-faint' : changePct >= 0 ? 'text-emerald-600' : 'text-rose-600';

  return (
    <div className="bg-surface-raised rounded-card border border-line shadow-sm p-4 min-w-0 hover:shadow-lift transition-shadow">
      <p className="text-xs font-semibold text-ink-soft truncate" title={label}>{label}</p>
      <p
        className="mt-1 font-extrabold text-ink tabular leading-none text-[clamp(1.05rem,2.1vw,1.55rem)]"
        title={currency ? (Number(value) || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' ₫' : (Number(value) || 0).toLocaleString('vi-VN')}
      >
        {formatCompact(value, currency)}
      </p>
      <div className="mt-1.5 flex items-center gap-2 min-w-0">
        {changePct !== null && (
          <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${arrowColor}`}>
            <Arrow size={12} weight="bold" />
            {changePct >= 0 ? '+' : ''}{changePct.toFixed(1)}%
          </span>
        )}
        {insight && <span className="text-[11px] text-ink-faint truncate" title={insight}>{insight}</span>}
      </div>
      {spark.length > 1 && (
        <div className="mt-2 h-9 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <Area type="monotone" dataKey="v" stroke="#1b4437" strokeWidth={1.5} fill="#6ba78f" fillOpacity={0.2} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}