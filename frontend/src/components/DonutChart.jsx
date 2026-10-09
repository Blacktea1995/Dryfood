import React from 'react';

const PALETTE = ['#1b4437', '#3f826c', '#c98a2b', '#6ba78f', '#a86f1d', '#143128', '#245647', '#9fc6b3'];

export default function DonutChart({ data, size = 180, thickness = 26 }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return <div className="text-center text-ink-faint py-10 text-sm">Chưa có dữ liệu</div>;
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
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="#e2dccb" strokeWidth={thickness} />
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
        <text x={size / 2} y={size / 2 - 4} textAnchor="middle" fontSize="13" fontWeight="700" fill="#18231f">
          {total}
        </text>
        <text x={size / 2} y={size / 2 + 14} textAnchor="middle" fontSize="10" fill="#6b7a72">
          đơn hàng
        </text>
      </svg>

      <div className="space-y-1.5">
        {arcs.map((a, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: a.color }} />
            <span className="text-ink-soft">{a.label}</span>
            <span className="font-semibold text-ink ml-auto tabular">{a.value}</span>
            <span className="text-ink-faint text-xs w-10 text-right tabular">({Math.round(a.frac * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}