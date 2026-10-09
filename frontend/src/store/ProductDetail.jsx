import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useCart } from '../store/CartContext.jsx';
import { fmtVND } from '../utils/format.js';
import { Icon, Stars, BackLink, BtnPrimary, BtnGhost } from './Ui.jsx';

const FALLBACK_IMG = (name) => `https://picsum.photos/seed/${encodeURIComponent(name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}/600/600`;

export default function ProductDetail() {
  const { id } = useParams();
  const { user, isCustomer } = useAuth();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewMsg, setReviewMsg] = useState('');
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    try {
      setLoading(true);
      const [p, r, rec] = await Promise.all([
        api.getProduct(id),
        api.getReviews(id),
        api.getRecommendations(id, 4)
      ]);
      setProduct(p);
      setReviews(r);
      setRecommendations(rec);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleAdd() {
    if (!product || product.stock <= 0) return;
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  async function handleReview(e) {
    e.preventDefault();
    setReviewError('');
    setReviewMsg('');
    try {
      await api.createReview({ productId: product.id, rating, comment: comment || null });
      setComment('');
      setReviewMsg('Cảm ơn bạn đã đánh giá!');
      const [p, r] = await Promise.all([api.getProduct(id), api.getReviews(id)]);
      setProduct(p);
      setReviews(r);
    } catch (err) {
      setReviewError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <BackLink />
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-bone-100 rounded-card animate-pulse" />
          <div className="space-y-4">
            <div className="h-3 w-1/4 bg-bone-200 rounded animate-pulse" />
            <div className="h-8 w-3/4 bg-bone-200 rounded animate-pulse" />
            <div className="h-5 w-1/3 bg-bone-200 rounded animate-pulse" />
            <div className="h-24 w-full bg-bone-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }
  if (error) return <div className="rounded-control border border-rose-200 bg-rose-50 text-rose-700 p-4 text-sm">{error}</div>;
  if (!product) return <div className="text-center py-20 text-ink-faint">Không tìm thấy sản phẩm</div>;

  const out = product.stock <= 0;
  const avgRating = product.avgRating || 0;

  return (
    <div className="space-y-8">
      <BackLink />

      {/* Main product */}
      <section className="grid md:grid-cols-2 gap-6 lg:gap-10">
        {/* Image */}
        <div className="rounded-card border border-line bg-surface-raised overflow-hidden">
          <div className="aspect-square bg-bone-100 flex items-center justify-center overflow-hidden">
            <img
              src={product.imageUrl || FALLBACK_IMG(product.name)}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={e => { e.currentTarget.src = FALLBACK_IMG(product.name); }}
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="text-xs uppercase tracking-[0.14em] text-ink-faint mb-2">{product.category || 'Thực phẩm khô'}</div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-ink">{product.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Stars value={avgRating} />
            <span className="text-sm text-ink-faint">
              {avgRating > 0 ? avgRating.toFixed(1) : 'Chưa có đánh giá'} ({product.ratingCount || 0} đánh giá)
            </span>
          </div>

          <div className="mt-5 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-forest-800 tabular">{fmtVND(product.price)}</span>
            <span className="text-ink-faint">₫ / {product.unit}</span>
          </div>

          {product.description && (
            <p className="text-ink-soft text-sm mt-4 leading-relaxed max-w-[65ch]">{product.description}</p>
          )}

          <div className="mt-4 text-sm">
            {out ? (
              <span className="text-rose-600 font-semibold">Hết hàng</span>
            ) : product.stock <= 10 ? (
              <span className="text-amber-deep font-semibold">Chỉ còn {product.stock} {product.unit}</span>
            ) : (
              <span className="text-forest-600">Còn hàng · Kho: {product.stock} {product.unit}</span>
            )}
          </div>

          {/* Quantity + add */}
          <div className="mt-6 flex items-center gap-4 flex-wrap">
            {!out && (
              <div className="flex items-center gap-1 rounded-control border border-line-strong px-1.5 py-1.5">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-9 h-9 rounded-lg bg-bone-100 hover:bg-bone-200 text-ink grid place-items-center transition-colors"
                  aria-label="Giảm số lượng"
                >
                  <Icon name="Minus" size={16} />
                </button>
                <span className="w-8 text-center font-bold text-ink tabular" aria-live="polite">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  className="w-9 h-9 rounded-lg bg-bone-100 hover:bg-bone-200 text-ink grid place-items-center transition-colors"
                  aria-label="Tăng số lượng"
                >
                  <Icon name="Plus" size={16} />
                </button>
              </div>
            )}
            <BtnPrimary
              onClick={handleAdd}
              disabled={out}
              className={`flex-1 sm:flex-none sm:min-w-[220px] ${added ? 'bg-forest-500 hover:bg-forest-500' : ''}`}
            >
              {added ? '✓ Đã thêm vào giỏ' : '+ Thêm vào giỏ hàng'}
            </BtnPrimary>
          </div>
          {out && (
            <BackLink className="mt-6" />
          )}
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-surface-raised rounded-card border border-line p-6">
        <h2 className="text-lg font-extrabold text-ink mb-4">Đánh giá ({reviews.length})</h2>

        {reviews.length === 0 && (
          <p className="text-sm text-ink-faint mb-6">Chưa có đánh giá nào.</p>
        )}
        <div className="space-y-4 mb-6">
          {reviews.map(r => (
            <div key={r.id} className="border-b border-line pb-4 last:border-0">
              <div className="flex items-center gap-2">
                <Stars value={r.rating} size={14} />
                <span className="text-sm font-semibold text-ink">{r.user?.name || 'Khách hàng'}</span>
              </div>
              {r.comment && <p className="text-sm text-ink-soft mt-1">{r.comment}</p>}
              <div className="text-xs text-ink-faint mt-1">{timeAgo(r.createdAt)}</div>
            </div>
          ))}
        </div>

        {/* Review form */}
        {isCustomer && !out && (
          <form onSubmit={handleReview} className="bg-bone-100 rounded-card p-5 space-y-3">
            <h3 className="font-bold text-ink text-sm">Đánh giá sản phẩm này</h3>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <button type="button" key={s} onClick={() => setRating(s)} className="text-2xl" aria-label={`${s} sao`}>
                  <Stars value={s} size={22} />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={2}
              placeholder="Chia sẻ trải nghiệm của bạn..."
              className="w-full px-3 py-2 rounded-control border border-line-strong bg-surface text-ink text-sm placeholder:text-ink-faint focus:ring-2 focus:ring-forest-500 focus:outline-none"
            />
            {reviewError && <div className="text-sm text-rose-600">{reviewError}</div>}
            {reviewMsg && <div className="text-sm text-emerald-700">{reviewMsg}</div>}
            <BtnPrimary type="submit" className="px-4 py-2 text-sm">Gửi đánh giá</BtnPrimary>
          </form>
        )}
      </section>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section className="bg-surface-raised rounded-card border border-line p-6">
          <h2 className="text-lg font-extrabold text-ink mb-4">Sản phẩm liên quan</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recommendations.map(r => (
              <Link
                key={r.productId}
                to={`/store/product/${r.productId}`}
                className="rounded-control border border-line overflow-hidden hover:shadow-lift transition-shadow bg-surface-raised"
              >
                <div className="aspect-square bg-bone-100 flex items-center justify-center overflow-hidden">
                  <img
                    src={r.imageUrl || FALLBACK_IMG(r.name)}
                    alt={r.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={e => { e.currentTarget.src = FALLBACK_IMG(r.name); }}
                  />
                </div>
                <div className="p-3">
                  <div className="text-sm font-semibold text-ink truncate">{r.name}</div>
                  <div className="text-sm font-bold text-forest-800 mt-1 tabular">{fmtVND(r.price)} ₫</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function timeAgo(iso) {
  if (!iso) return '';
  const then = new Date(iso);
  const diff = (Date.now() - then.getTime()) / 1000;
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return then.toLocaleDateString('vi-VN');
}