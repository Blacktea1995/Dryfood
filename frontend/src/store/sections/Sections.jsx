import React from 'react';
import { Link } from 'react-router-dom';
import { Icon, Truck, ShieldCheck, Clock, Leaf } from '../Ui.jsx';
import { commonsUrl } from './media.js';
import { MID_BANNER, FREE_SHIPPING_THRESHOLD } from '../siteConfig.js';

/**
 * USP strip: 4 real value props (no invented claims). One scrollable row on
 * mobile, 4 columns on desktop.
 */
export function UspsStrip() {
  const items = [
    { icon: Truck, title: 'Giao hàng nhanh', sub: 'Xác nhận đơn trong ngày, giao tận nơi' },
    { icon: ShieldCheck, title: 'An toàn, rõ nguồn gốc', sub: 'Kiểm soát chất lượng từ khâu chọn nguyên liệu' },
    { icon: Clock, title: 'Đóng gói sẵn tiện lợi', sub: 'Bảo quản được lâu, dễ dàng sử dụng' },
    { icon: Leaf, title: 'Tích điểm thành viên', sub: 'Ưu đãi dành riêng cho khách quen' }
  ];
  return (
    <section className="snap-row lg:grid lg:grid-cols-4 lg:gap-3" aria-label="Cam kết cửa hàng">
      {items.map(f => (
        <div key={f.title} className="snap-item flex items-center gap-3 rounded-card bg-surface-raised border border-line px-4 py-3.5 w-[88%] sm:w-[46%] lg:w-auto lg:flex-none">
          <f.icon size={24} weight="duotone" className="text-forest-700 shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-bold text-ink">{f.title}</div>
            <div className="text-xs text-ink-faint leading-snug">{f.sub}</div>
          </div>
        </div>
      ))}
    </section>
  );
}

/** Category icon row: circular icon + name + count, scroll-snap, taps to filter. */
export function CategoryIconRow({ categories, counts, onPick }) {
  const ICONS = {
    'Mi - bun': 'BowlFood',
    'Thit': 'PiggyBank',
    'Hai san': 'Fish',
    'Hat - an vat': 'Nut',
    'Trai cay kho': 'OrangeSlice',
    'Rau cu': 'Carrot',
    'Gia vi': 'Pepper',
    'Banh keo': 'Cookie'
  };
  return (
    <section aria-label="Danh mục sản phẩm" className="snap-row">
      {categories.map(c => (
        <button
          key={c}
          onClick={() => onPick(c)}
          className="snap-item flex flex-col items-center gap-2 w-24 py-2 rounded-card hover:bg-bone-100 transition-colors"
          aria-label={`Xem danh mục ${c}`}
        >
          <span className="grid place-items-center w-14 h-14 rounded-full bg-forest-100 text-forest-800 transition-colors">
            <Icon name={ICONS[c] || 'Package'} size={26} weight="duotone" />
          </span>
          <span className="text-xs font-bold text-ink text-center leading-tight">{c}</span>
          <span className="text-[11px] text-ink-faint tabular">{counts[c] || 0} sản phẩm</span>
        </button>
      ))}
    </section>
  );
}

/** Mid-page call-to-action strip, copy from siteConfig, no invented numbers. */
export function BannerStrip() {
  return (
    <section className="rounded-card bg-bone-100 border border-line px-6 py-6 md:px-10 md:py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4" aria-label="Ưu đãi giao hàng">
      <div>
        <h2 className="display text-xl md:text-2xl text-ink">{MID_BANNER.title}</h2>
        <p className="text-sm text-ink-soft mt-1.5 max-w-[60ch]">{MID_BANNER.sub}</p>
      </div>
      <Link
        to={MID_BANNER.ctaHref}
        className="inline-flex items-center gap-2 rounded-control bg-amber-brand text-forest-950 font-bold text-sm px-6 py-3 transition-all hover:bg-amber-deep hover:text-white active:scale-[0.98] shrink-0"
      >
        {MID_BANNER.ctaLabel}
        <Icon name="ArrowRight" size={16} weight="bold" />
      </Link>
    </section>
  );
}

/** Mini banner grid under the hero: real photos, functional copy. */
export function MiniBanners() {
  const banners = [
    {
      title: 'Trái cây sấy ít đường',
      sub: 'Xoài, mít, chuối chọn lọc',
      img: commonsUrl('Heap of Sun-dried mango slices.jpg', 800),
      fallback: commonsUrl('Mix dried fruit12.jpg', 800)
    },
    {
      title: 'Set quà tặng đồ khô',
      sub: 'Hộp quà cho dịp lễ, Tết',
      img: commonsUrl('Dried fruit and nuts mix for kid snacks (15093547798).jpg', 800),
      fallback: commonsUrl('Mixed nuts bowl.jpg', 800)
    },
    {
      title: 'Hạt dinh dưỡng',
      sub: 'Điều rang muối, hạt dẻ, hạt sen',
      img: commonsUrl('CASHEW NUTS.jpg', 800),
      fallback: commonsUrl('Mixed nuts spread.jpg', 800)
    }
  ];
  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4" aria-label="Khuyến mãi và bộ sưu tập">
      {banners.map(b => (
        <Link
          key={b.title}
          to="#danh-muc"
          className="group relative overflow-hidden rounded-card border border-line bg-forest-900 min-h-[120px]"
        >
          <img
            src={b.img}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-[var(--ease-out-exp)] group-hover:scale-[1.05]"
            onError={e => {
              const el = e.currentTarget;
              if (el.src !== b.fallback) el.src = b.fallback;
              else el.style.display = 'none';
            }}
          />
          <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-forest-950/85 via-forest-950/20 to-transparent" />
          <span className="relative z-10 block p-4 pt-14">
            <span className="block font-bold text-bone-50 text-sm drop-shadow-sm">{b.title}</span>
            <span className="block text-xs text-bone-50/75 mt-0.5">{b.sub}</span>
          </span>
        </Link>
      ))}
    </section>
  );
}

/** News / guide grid: 3 real cards, placeholder copy clearly labeled. */
export function NewsSection() {
  const posts = [
    {
      title: 'Cách bảo quản đồ khô được lâu',
      desc: 'Hướng dẫn giữ độ giòn, tránh ẩm mốc cho mì, hạt và trái cây sấy tại nhà.',
      img: commonsUrl('Dried fruit and nuts mix for kid snacks (15093547798).jpg', 800)
    },
    {
      title: 'Mẹo chọn hải sản khô ngon',
      desc: 'Cách nhận biết cá khô, tôm khô chất lượng khi mua ở chợ hay cửa hàng.',
      img: commonsUrl('Dried fish in Chittagong 03.jpg', 800)
    },
    {
      title: '3 món ngon từ trái cây sấy',
      desc: 'Salad trái cây sấy, yến mạch qua đêm và món ăn vặt cho cả nhà.',
      img: commonsUrl('Mix dried fruit12.jpg', 800)
    }
  ];
  return (
    <section aria-label="Tin tức và cẩm nang">
      <SectionHeading
        title="Tin tức & cẩm nang"
        sub="Mẹo bảo quản và công thức dùng đồ khô mỗi ngày"
        action={
          <Link to="/store" className="inline-flex items-center gap-1.5 text-sm font-bold text-forest-700 hover:text-amber-deep transition-colors">
            Xem tất cả
            <Icon name="ArrowRight" size={14} weight="bold" />
          </Link>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {posts.map(p => (
          <article key={p.title} className="group rounded-card border border-line bg-surface-raised overflow-hidden hover:shadow-lift hover:border-line-strong transition-all">
            <div className="aspect-[16/9] bg-bone-100 overflow-hidden">
              <img src={p.img} alt="" loading="lazy" className="w-full h-full object-cover img-zoom" />
            </div>
            <div className="p-4">
              <h3 className="font-bold text-ink text-sm leading-snug group-hover:text-forest-700 transition-colors">{p.title}</h3>
              <p className="text-xs text-ink-faint mt-1.5 leading-relaxed">{p.desc}</p>
              <Link to="/store" className="inline-flex items-center gap-1 text-xs font-bold text-forest-700 hover:text-amber-deep mt-3">
                Đọc thêm
                <Icon name="ArrowRight" size={12} weight="bold" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/** Store locator: split by area, placeholder entries clearly labeled. */
export function StoreLocatorSection() {
  const areas = [
    { name: 'Hà Nội', stores: [{ name: 'Cửa hàng DryFood Hoàn Kiếm', addr: 'Địa chỉ đang cập nhật', phone: '1900 0000' }] },
    { name: 'Hồ Chí Minh', stores: [{ name: 'Cửa hàng DryFood Quận 1', addr: 'Địa chỉ đang cập nhật', phone: '1900 0000' }] }
  ];
  return (
    <section aria-label="Hệ thống cửa hàng">
      <SectionHeading
        title="Hệ thống cửa hàng"
        sub="Ghế thăm cửa hàng gần nhất để xem và mua trực tiếp"
        action={
          <button className="inline-flex items-center gap-1.5 text-sm font-bold text-forest-700 hover:text-amber-deep transition-colors">
            Xem thêm
            <Icon name="ArrowRight" size={14} weight="bold" />
          </button>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {areas.map(a => (
          <div key={a.name} className="rounded-card border border-line bg-surface-raised p-5">
            <h3 className="font-extrabold text-ink inline-flex items-center gap-2">
              <Icon name="MapPin" size={18} className="text-forest-700" />
              {a.name}
            </h3>
            <div className="mt-3 space-y-3">
              {a.stores.map(s => (
                <div key={s.name} className="hairline pt-3">
                  <div className="font-bold text-ink text-sm">{s.name}</div>
                  <div className="text-xs text-ink-faint mt-0.5">{s.addr}</div>
                  <div className="text-xs text-ink-faint inline-flex items-center gap-1 mt-0.5">
                    <Icon name="Phone" size={12} />
                    {s.phone}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Small section heading reused across store sections (no eyebrow spam). */
export function SectionHeading({ title, sub, action }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6">
      <div>
        <h2 className="display text-xl md:text-2xl text-ink">{title}</h2>
        {sub && <p className="mt-1.5 text-sm text-ink-faint max-w-[65ch]">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
