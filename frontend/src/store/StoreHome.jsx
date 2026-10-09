import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useCart } from './CartContext.jsx';
import { fmtVND } from '../utils/format.js';
import { Icon, Stars } from './Ui.jsx';

const FALLBACK_IMG = (name) => `https://picsum.photos/seed/${encodeURIComponent(name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}/600/600`;

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
    <div className="space-y-10">
      {/* Hero: prove-don't-claim */}
      <section className="rounded-card overflow-hidden bg-forest-900 text-bone-50 grid md:grid-cols-2 shadow-lift">
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            Thực phẩm khô chất lượng
          </h1>
          <p className="text-bone-100/90 mt-3 max-w-md text-base leading-relaxed">
            Mì gói, đồ khô, hạt và trái cây sấy chọn lọc. Đặt hàng nhanh, giao tận nơi.
          </p>
          <div className="mt-7">
            <Link
              to="#san-pham"
              className="inline-flex items-center gap-2 rounded-control bg-amber-brand text-forest-950 font-bold text-sm px-5 py-3 transition-all hover:bg-amber-deep hover:text-white active:scale-[0.98]"
            >
              Mua sắm ngay
              <Icon name="ArrowRight" size={16} />
            </Link>
          </div>
        </div>
        <div className="hidden md:block relative bg-forest-800 min-h-[280px] overflow-hidden">
          <div aria-hidden="true" className="absolute inset-0 opacity-40"
            style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(201,138,43,0.5), transparent 45%), radial-gradient(circle at 75% 70%, rgba(107,167,143,0.5), transparent 50%)' }} />
          <div className="absolute inset-0 grid place-items-center">
            <div className="relative w-40 h-40">
              <div className="absolute inset-0 rounded-full bg-forest-600/60" />
              <div className="absolute inset-4 rounded-full bg-forest-500/70" />
              <div className="absolute inset-8 rounded-full bg-forest-400/80 grid place-items-center">
                <span className="text-forest-950 font-extrabold text-2xl">D</span>
              </div>
              <span className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-brand grid place-items-center text-forest-950 font-bold text-xs">
                ✓
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Search + filter */}
      <section className="bg-surface-raised rounded-card border border-line p-4 space-y-3" aria-label="Tìm và lọc sản phẩm">
        <div className="relative max-w-xl">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint">
            <Icon name="Info" size={18} />
          </span>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Tìm sản phẩm..."
            className="w-full pl-10 pr-4 py-2.5 rounded-control border border-line-strong bg-surface text-ink text-sm placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-forest-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setCategory('')}
            className={`px-3 py-1.5 rounded-control text-xs font-bold transition-colors ${!category ? 'bg-forest-800 text-bone-50' : 'bg-bone-100 text-ink-soft hover:bg-bone-200'}`}
          >
            Tất cả
          </button>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-control text-xs font-bold transition-colors ${category === c ? 'bg-forest-800 text-bone-50' : 'bg-bone-100 text-ink-soft hover:bg-bone-200'}`}
            >
              {c}
            </button>
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
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" aria-busy="true" aria-label="Đang tải sản phẩm">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="rounded-card border border-line bg-surface-raised overflow-hidden">
                <div className="aspect-square bg-bone-100 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-3 w-1/3 bg-bone-200 rounded animate-pulse" />
                  <div className="h-4 w-4/5 bg-bone-200 rounded animate-pulse" />
                  <div className="h-4 w-2/5 bg-bone-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {visible.map(p => {
              const out = p.stock <= 0;
              const low = p.stock > 0 && p.stock <= 10;
              return (
                <article
                  key={p.id}
                  className="rounded-card border border-line bg-surface-raised overflow-hidden hover:shadow-lift transition-shadow flex flex-col"
                >
                  <Link to={`/store/product/${p.id}`} className="block relative aspect-square bg-bone-100 overflow-hidden">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={e => { e.currentTarget.src = FALLBACK_IMG(p.name); }}
                      />
                    ) : (
                      <img
                        src={FALLBACK_IMG(p.name)}
                        alt={p.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    )}
                    {p.avgRating > 0 && (
                      <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-control bg-bone-50/90 px-2 py-0.5 text-xs font-bold text-ink shadow-sm">
                        <Stars value={p.avgRating} size={12} />
                        {p.avgRating.toFixed(1)}
                      </span>
                    )}
                  </Link>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="text-[11px] uppercase tracking-[0.12em] text-ink-faint mb-1">{p.category || 'Thực phẩm khô'}</div>
                    <Link to={`/store/product/${p.id}`}>
                      <h3 className="font-bold text-ink text-sm leading-snug line-clamp-2 hover:text-forest-700">{p.name}</h3>
                    </Link>
                    {p.description && (
                      <p className="text-xs text-ink-faint mt-1 line-clamp-2">{p.description}</p>
                    )}
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-lg font-extrabold text-forest-800 tabular">{fmtVND(p.price)}</span>
                      <span className="text-xs text-ink-faint">₫ / {p.unit}</span>
                    </div>
                    <div className="mt-1 text-xs">
                      {out ? (
                        <span className="text-rose-600 font-semibold">Hết hàng</span>
                      ) : low ? (
                        <span className="text-amber-deep font-semibold">Còn {p.stock} {p.unit}</span>
                      ) : (
                        <span className="text-forest-600">Còn hàng</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAdd(p)}
                      disabled={out}
                      className={`mt-3 w-full py-2 rounded-control text-sm font-bold transition-all active:scale-[0.98] ${
                        out
                          ? 'bg-bone-100 text-ink-faint cursor-not-allowed'
                          : addedId === p.id
                            ? 'bg-forest-500 text-white'
                            : 'bg-forest-800 hover:bg-forest-700 text-bone-50'
                      }`}
                    >
                      {addedId === p.id ? '✓ Đã thêm' : out ? 'Hết hàng' : '+ Thêm vào giỏ'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && visible.length === 0 && (
          <div className="text-center py-20 text-ink-faint">
            <Icon name="Package" size={40} className="mx-auto mb-3" />
            Không tìm thấy sản phẩm nào phù hợp
          </div>
        )}
      </section>
    </div>
  );
}