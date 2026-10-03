import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useCart } from './CartContext.jsx';
import { fmtVND } from '../utils/format.js';

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
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-400 rounded-3xl p-8 text-white shadow-md">
        <h1 className="text-3xl font-extrabold">Thực phẩm khô chất lượng 🍜</h1>
        <p className="text-orange-50 mt-2 max-w-xl">
          Mì gói, đồ khô, hạt – trái cây sấy và nhiều đặc sản khác. Đặt hàng nhanh, giao tận nơi.
        </p>
      </div>

      {/* Search + filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="relative max-w-xl">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Tìm sản phẩm..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setCategory('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${!category ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Tất cả
          </button>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${category === c ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 text-sm">{error}</div>}

      {/* Product grid */}
      {loading ? (
        <div className="text-center text-slate-400 py-16 animate-pulse">Đang tải sản phẩm...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visible.map(p => {
            const out = p.stock <= 0;
            const low = p.stock > 0 && p.stock <= 10;
            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col"
              >
                <Link to={`/store/product/${p.id}`} className="block">
                  <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                    ) : (
                      <span className="text-5xl">🍱</span>
                    )}
                  </div>
                </Link>
                <div className="p-4 flex flex-col flex-1">
                  <div className="text-[11px] text-slate-400 mb-1">{p.category || 'Thực phẩm khô'}</div>
                  <Link to={`/store/product/${p.id}`}>
                    <div className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 hover:text-orange-600">{p.name}</div>
                  </Link>
                  {p.description && (
                    <div className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description}</div>
                  )}
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-lg font-extrabold text-orange-600">{fmtVND(p.price)}</span>
                    <span className="text-xs text-slate-400">₫ / {p.unit}</span>
                  </div>
                  <div className="mt-1 text-xs">
                    {out ? (
                      <span className="text-rose-500 font-semibold">Hết hàng</span>
                    ) : low ? (
                      <span className="text-amber-600 font-semibold">Còn {p.stock} {p.unit}</span>
                    ) : (
                      <span className="text-emerald-600">Còn hàng</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleAdd(p)}
                    disabled={out}
                    className={`mt-3 w-full py-2 rounded-xl text-sm font-bold transition-colors ${
                      out
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : addedId === p.id
                          ? 'bg-emerald-500 text-white'
                          : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}
                  >
                    {addedId === p.id ? '✓ Đã thêm' : out ? 'Hết hàng' : '+ Thêm vào giỏ'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && visible.length === 0 && (
        <div className="text-center text-slate-400 py-16">
          Không tìm thấy sản phẩm nào phù hợp
        </div>
      )}
    </div>
  );
}
