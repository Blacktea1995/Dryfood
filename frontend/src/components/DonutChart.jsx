import React from 'react';

const PALETTE = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#eab308', '#14b8a6', '#f43f5e'];

export default function DonutChart({ data, size = 180, thickness = 26 }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return <div className="text-center text-slate-400 py-10 text-sm">Chưa có dữ liệu</div>;
  }

  const R = (size - thickness) / 2;
  const C = 2 * Math.PI * R;
  let offset = 0;

  const arcs = data.map((d, i) => {
    const frac = d.value / total;
    const dash = frac * C;
    const arc = {
      strokeDasharray: `${dash} ${C - dash}`,
      strokeDashoffset: -offset,
      color: PALETTE[i % PALETTE.length],
      label: d.label,
      value: d.value,
      frac
    };
    offset += dash;
    return arc;
  });

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Biểu đồ tròn">
        <title>Biểu đồ tròn</title>
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="#f1f5f9" strokeWidth={thickness} />
        {arcs.map((a, i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={R}
            fill="none"
            stroke={a.color}
            strokeWidth={thickness}
            strokeDasharray={a.strokeDasharray}
            strokeDashoffset={a.strokeDashoffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ))}
        <text x={size / 2} y={size / 2 - 4} textAnchor="middle" fontSize="13" fontWeight="700" fill="#334155">
          {total}
        </text>
        <text x={size / 2} y={size / 2 + 14} textAnchor="middle" fontSize="10" fill="#94a3b8">
          đơn hàng
        </text>
      </svg>

      <div className="space-y-1.5">
        {arcs.map((a, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: a.color }} />
            <span className="text-slate-600">{a.label}</span>
            <span className="font-semibold text-slate-800 ml-auto">{a.value}</span>
            <span className="text-slate-400 text-xs w-10 text-right">({Math.round(a.frac * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
