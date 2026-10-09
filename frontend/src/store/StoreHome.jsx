import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useCart } from './CartContext.jsx';
import { fmtVND } from '../utils/format.js';
import { Icon, ProductCard, CategoryChip, EmptyState, SectionHeading, Truck, ShieldCheck, Clock, Leaf } from './Ui.jsx';

const FALLBACK_IMG = (name) => `https://picsum.photos/seed/${encodeURIComponent(name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}/600/600`;

/* Hero visual: stable picsum seed evoking a dried-food market scene.
   Marked as placeholder in comments; replace with real photography later. */
const HERO_IMG = 'https://picsum.photos/seed/dried-food-market-basket/1200/900';

export default function StoreHome() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addItem } = useCart();
  const [addedId, setAddedId] = useState(null);

  useEffect(() => {
    load();
  }, [q]);

  async function load() {
    try {
      setError('');
      setLoading(true);
      const data = await api.getProducts(q);
      setProducts(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach(p => { if (p.category) set.add(p.category); });
    return [...set].sort();
  }, [products]);

  const visible = useMemo(() => {
    if (!category) return products;
    return products.filter(p => p.category === category);
  }, [products, category]);

  function handleAdd(product) {
    if (product.stock <= 0) return;
    addItem(product, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  }

  return (
    <div className="space-y-14">
      {/* Hero: split-screen, real visual right, message left, CTA visible in viewport */}
      <section className="grid md:grid-cols-2 items-stretch rounded-card overflow-hidden bg-forest-900 text-bone-50 shadow-lift">
        <div className="p-8 md:p-12 lg:p-14 flex flex-col justify-center">
          <h1 className="display text-3xl md:text-4xl lg:text-5xl text-bone-50">
            Thực phẩm khô
            <br />
            <span className="text-amber-brand">chất lượng cao</span>
          </h1>
          <p className="mt-4 text-bone-100/90 text-base leading-relaxed max-w-[42ch]">
            Mì gói, đồ khô, hạt và trái cây sấy chọn lọc. Đặt hàng nhanh, giao tận nơi.
          </p>
          <div className="mt-8 flex items-center gap-3 flex-wrap">
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
        <div className="relative min-h-[240px] md:min-h-full overflow-hidden">
          <img
            src={HERO_IMG}
            alt="Rổ thực phẩm khô tươi ngon"
            loading="eager"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-forest-950/50 via-transparent to-transparent" />
        </div>
      </section>

      {/* Trust strip: real functional value props, no invented claims */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3" aria-label="Cam kết cửa hàng">
        {[
          { icon: Truck, title: 'Giao hàng tận nơi', sub: 'Toàn quốc' },
          { icon: ShieldCheck, title: 'Hàng kiểm soát chất lượng', sub: 'Đóng gói kỹ lưỡng' },
          { icon: Clock, title: 'Đặt hàng nhanh', sub: 'Xác nhận trong ngày' }
        ].map(f => (
          <div key={f.title} className="flex items-center gap-3 rounded-card bg-surface-raised border border-line px-4 py-3.5">
            <f.icon size={22} weight="duotone" className="text-forest-700 shrink-0" />
            <div>
              <div className="text-sm font-bold text-ink">{f.title}</div>
              <div className="text-xs text-ink-faint">{f.sub}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Search + category filter */}
      <section id="danh-muc" className="space-y-4" aria-label="Tìm và lọc sản phẩm">
        <div className="bg-surface-raised rounded-card border border-line p-4">
          <div className="relative max-w-xl">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint">
              <Icon name="MagnifyingGlass" size={18} />
            </span>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Tìm sản phẩm..."
              className="w-full pl-10 pr-4 py-3 rounded-control border border-line-strong bg-surface text-ink text-sm placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1" role="group" aria-label="Chọn danh mục">
          <CategoryChip active={!category} onClick={() => setCategory('')}>Tất cả</CategoryChip>
          {categories.map(c => (
            <CategoryChip key={c} active={category === c} onClick={() => setCategory(c)}>
              {c}
            </CategoryChip>
          ))}
        </div>
      </section>

      {error && (
        <div className="flex items-center gap-3 rounded-control border border-rose-200 bg-rose-50 text-rose-700 p-4 text-sm">
          <Icon name="WarningCircle" size={20} />
          {error}
        </div>
      )}

      {/* Product grid */}
      <section id="san-pham" aria-label="Danh sách sản phẩm">
        <SectionHeading
          title={category || 'Tất cả sản phẩm'}
          sub={visible.length > 0 ? `${visible.length} sản phẩm cho bạn` : undefined}
        />

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" aria-busy="true" aria-label="Đang tải sản phẩm">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="rounded-card border border-line bg-surface-raised overflow-hidden">
                <div className="aspect-square bg-bone-100 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-3 w-1/3 bg-bone-200 rounded" />
                  <div className="h-4 w-4/5 bg-bone-200 rounded" />
                  <div className="h-4 w-2/5 bg-bone-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon="Package"
            title="Không tìm thấy sản phẩm nào phù hợp"
            sub="Thử từ khoá khác hoặc bỏ bộ lọc danh mục nhé."
            action={
              <button
                onClick={() => { setQ(''); setCategory(''); }}
                className="inline-flex items-center gap-1.5 rounded-control bg-forest-800 hover:bg-forest-700 text-bone-50 px-5 py-2.5 text-sm font-bold transition-colors"
              >
                Xem tất cả sản phẩm
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {visible.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onAdd={handleAdd}
                added={addedId === p.id}
                fallbackImg={FALLBACK_IMG}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}