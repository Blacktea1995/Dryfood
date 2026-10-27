import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../Ui.jsx';
import { commonsUrl } from './media.js';
/**
 * Hero banner carousel: 3 real market photographs, dots + arrows,
 * auto-advance every 5s (disabled under prefers-reduced-motion).
 */

const SLIDES = [
  {
    title: 'Đồ khô chọn lọc cho bữa ăn mỗi ngày',
    sub: 'Mì, hạt, trái cây sấy và hải sản khô từ những vùng nguyên liệu tin cậy.',
    img: commonsUrl('Dried fruit stall in the open.jpg', 1400),
    fallback: commonsUrl('Food and Drink Dried Fruits Stall (54504416713).jpg', 1400)
  },
  {
    title: 'Hải sản khô nguyên chất, đóng gói sạch',
    sub: 'Cá khô, tôm khô, mực rim được kiểm soát độ ẩm và đóng gói kỹ lưỡng.',
    img: commonsUrl('Dried fish in Chittagong 03.jpg', 1400),
    fallback: commonsUrl('ShreddedSquidSingleStrand.jpg', 1400)
  },
  {
    title: 'Trái cây sấy và hạt dinh dưỡng',
    sub: 'Xoài sấy, hạt điều rang muối, trà chiều hay bữa ăn vặt lành mạnh.',
    img: commonsUrl('Mix dried fruit12.jpg', 1400),
    fallback: commonsUrl('CASHEW NUTS.jpg', 1400)
  }
];

export default function HeroCarousel() {
  const [idx, setIdx] = useState(0);
  const reduce = useMemo(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  , []);
  const timerRef = useRef(null);

  useEffect(() => {
    if (reduce) return;
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % SLIDES.length), 5000);
    return () => clearInterval(timerRef.current);
  }, [reduce, idx]);

  function go(i) {
    setIdx((i + SLIDES.length) % SLIDES.length);
  }

  return (
    <div className="relative rounded-card overflow-hidden bg-forest-900 shadow-lift">
      <div className="relative aspect-[4/3] sm:aspect-[16/7] md:aspect-[16/6] overflow-hidden" aria-live="polite">
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-500 ${i === idx ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            aria-hidden={i !== idx}
          >
            <img
              src={s.img}
              alt=""
              loading={i === 0 ? 'eager' : 'lazy'}
              className="absolute inset-0 w-full h-full object-cover"
              onError={e => {
                const el = e.currentTarget;
                if (el.src !== s.fallback) el.src = s.fallback;
                else { el.style.opacity = '0.4'; }
              }}
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-forest-950/85 via-forest-950/40 to-transparent" />
            <div className="relative z-10 h-full flex flex-col justify-center max-w-xl px-6 md:px-10 py-8 md:py-12 text-bone-50">
              <h1 className="display text-2xl md:text-4xl text-bone-50 max-w-[16ch]">{s.title}</h1>
              <p className="mt-3 text-bone-100/90 text-sm md:text-base max-w-[46ch]">{s.sub}</p>
              <div className="mt-6 flex items-center gap-3">
                <Link
                  to="#san-pham"
                  className="inline-flex items-center gap-2 rounded-control bg-amber-brand text-forest-950 font-bold text-sm px-6 py-3 transition-all hover:bg-amber-deep hover:text-white active:scale-[0.98]"
                >
                  Mua sắm ngay
                  <Icon name="ArrowRight" size={16} weight="bold" />
                </Link>
                <Link
                  to="#danh-muc"
                  className="inline-flex items-center gap-2 rounded-control border border-bone-50/25 text-bone-50 font-semibold text-sm px-6 py-3 transition-all hover:border-bone-50/60 hover:bg-bone-50/10 active:scale-[0.98]"
                >
                  Xem danh mục
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Arrows */}
      <button
        onClick={() => go(idx - 1)}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-forest-950/40 hover:bg-forest-950/70 text-bone-50 grid place-items-center transition-colors"
        aria-label="Banner trước"
      >
        <Icon name="ArrowLeft" size={18} weight="bold" />
      </button>
      <button
        onClick={() => go(idx + 1)}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-forest-950/40 hover:bg-forest-950/70 text-bone-50 grid place-items-center transition-colors"
        aria-label="Banner sau"
      >
        <Icon name="ArrowRight" size={18} weight="bold" />
      </button>

      {/* Dots: semantic, single accent */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2" role="tablist" aria-label="Chọn banner">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className={`carousel-dot ${i === idx ? 'is-active' : ''}`}
            role="tab"
            aria-selected={i === idx}
            aria-label={`Banner ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
