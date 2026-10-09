import React from 'react';

const fmtVND = (v) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(v);

export default function BarChart({ data, height = 220, color = '#1b4437' }) {
  if (!data || data.length === 0) {
    return <div className="text-center text-ink-faint py-10 text-sm">Chưa có dữ liệu</div>;
  }

  const W = 640;
  const H = height;
  const padL = 52;
  const padB = 34;
  const padT = 16;
  const padR = 12;

  const max = Math.max(...data.map(d => d.value), 1);
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const barW = Math.max(10, (innerW / data.length) * 0.55);

  const yTicks = 4;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => (max / yTicks) * i);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Biểu đồ cột">
      <title>Biểu đồ cột</title>
      {/* Grid lines + Y labels */}
      {ticks.map((t, i) => {
        const y = padT + innerH - (t / max) * innerH;
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#e2dccb" strokeDasharray={i === 0 ? '0' : '4 4'} />
            <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#6b7a72">
              {t === 0 ? '0' : fmtVND(t)}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const x = padL + (innerW / data.length) * i + (innerW / data.length - barW) / 2;
        const h = (d.value / max) * innerH;
        const y = padT + innerH - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={Math.max(h, 2)} rx={4} fill={color} />
            <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="10" fontWeight="600" fill="#42534b">
              {d.value > 0 ? fmtVND(d.value) : ''}
            </text>
            <text x={x + barW / 2} y={H - padB + 16} textAnchor="middle" fontSize="10" fill="#6b7a72">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}