import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useCart } from './CartContext.jsx';
import { fmtVND } from '../utils/format.js';
import { Icon, Stars, BackLink, BtnPrimary, BtnGhost, SectionHeading, EmptyState } from './Ui.jsx';

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
            <div className="h-3 w-1/4 bg-bone-200 rounded" />
            <div className="h-8 w-3/4 bg-bone-200 rounded" />
            <div className="h-5 w-1/3 bg-bone-200 rounded" />
            <div className="h-24 w-full bg-bone-200 rounded" />
          </div>
        </div>
      </div>
    );
  }
  if (error) return <div className="rounded-control border border-rose-200 bg-rose-50 text-rose-700 p-4 text-sm">{error}</div>;
  if (!product) return <EmptyState icon="Package" title="Không tìm thấy sản phẩm" sub="Sản phẩm có thể đã bị xoá hoặc liên kết sai." action={<BackLink />} />;

  const out = product.stock <= 0;
  const avgRating = product.avgRating || 0;

  return (
    <div className="space-y-10">
      <BackLink />

      {/* Main product: gallery + info */}
      <section className="grid md:grid-cols-2 gap-6 lg:gap-12">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="rounded-card border border-line bg-surface-raised overflow-hidden aspect-square">
            <img
              src={product.imageUrl || FALLBACK_IMG(product.name)}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={e => { e.currentTarget.src = FALLBACK_IMG(product.name); }}
            />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`rounded-control border overflow-hidden aspect-square bg-bone-100 ${i === 0 ? 'border-forest-600 ring-1 ring-forest-600' : 'border-line'}`}>
                <img
                  src={product.imageUrl || FALLBACK_IMG(product.name)}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover opacity-70"
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="text-xs uppercase tracking-[0.14em] text-ink-faint mb-2">{product.category || 'Thực phẩm khô'}</div>
          <h1 className="display text-2xl md:text-3xl text-ink">{product.name}</h1>

          <div className="flex items-center gap-2 mt-3">
            <Stars value={avgRating} />
            <span className="text-sm text-ink-faint">
              {avgRating > 0 ? `${avgRating.toFixed(1)} (${product.ratingCount || 0} đánh giá)` : 'Chưa có đánh giá'}
            </span>
          </div>

          <div className="mt-6 flex items-baseline gap-1.5 rounded-control bg-forest-50 border border-forest-100 px-4 py-3">
            <span className="text-3xl font-extrabold text-forest-800 tabular">{fmtVND(product.price)}</span>
            <span className="text-ink-faint">₫ / {product.unit}</span>
          </div>

          {product.description && (
            <p className="text-ink-soft text-sm mt-5 leading-relaxed max-w-[65ch]">{product.description}</p>
          )}

          {/* Real stock state, one semantic signal */}
          <div className="mt-4 text-sm">
            {out ? (
              <span className="text-danger font-semibold inline-flex items-center gap-1.5">
                <Icon name="WarningCircle" size={16} />
                Hết hàng
              </span>
            ) : product.stock <= 10 ? (
              <span className="text-warning font-semibold inline-flex items-center gap-1.5">
                <Icon name="Clock" size={16} />
                Chỉ còn {product.stock} {product.unit}
              </span>
            ) : (
              <span className="text-success font-semibold inline-flex items-center gap-1.5">
                <Icon name="CheckCircle" size={16} />
                Còn hàng · Kho: {product.stock} {product.unit}
              </span>
            )}
          </div>

          {/* Quantity + add */}
          <div className="mt-7 flex items-center gap-4 flex-wrap">
            {!out && (
              <div className="flex items-center gap-1 rounded-control border border-line-strong px-1.5 py-1.5">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-10 h-10 rounded-lg bg-bone-100 hover:bg-bone-200 text-ink grid place-items-center transition-colors"
                  aria-label="Giảm số lượng"
                >
                  <Icon name="Minus" size={16} />
                </button>
                <span className="w-8 text-center font-bold text-ink tabular" aria-live="polite">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  className="w-10 h-10 rounded-lg bg-bone-100 hover:bg-bone-200 text-ink grid place-items-center transition-colors"
                  aria-label="Tăng số lượng"
                >
                  <Icon name="Plus" size={16} />
                </button>
              </div>
            )}
            <BtnPrimary
              onClick={handleAdd}
              disabled={out}
              className={`flex-1 sm:flex-none sm:min-w-[240px] ${added ? 'bg-forest-500 hover:bg-forest-500' : ''}`}
            >
              {added ? (
                <>
                  <Icon name="CheckCircle" size={18} weight="bold" />
                  Đã thêm vào giỏ
                </>
              ) : (
                <>
                  <Icon name="Plus" size={16} weight="bold" />
                  Thêm vào giỏ hàng
                </>
              )}
            </BtnPrimary>
          </div>
          {out && <BackLink className="mt-6" />}

          {/* Spec cards instead of a hairline spec table */}
          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-control bg-bone-100 px-4 py-3">
              <div className="text-xs text-ink-faint">Đơn vị</div>
              <div className="font-bold text-ink">{product.unit}</div>
            </div>
            <div className="rounded-control bg-bone-100 px-4 py-3">
              <div className="text-xs text-ink-faint">Danh mục</div>
              <div className="font-bold text-ink">{product.category || 'Thực phẩm khô'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-surface-raised rounded-card border border-line p-6 md:p-8">
        <SectionHeading title={`Đánh giá (${reviews.length})`} sub={reviews.length === 0 ? 'Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ!' : undefined} />

        <div className="space-y-5 mb-8">
          {reviews.map(r => (
            <div key={r.id} className="hairline pt-4 first:pt-0">
              <div className="flex items-center gap-2.5">
                <span className="grid place-items-center w-9 h-9 rounded-full bg-forest-100 text-forest-800 font-bold text-sm shrink-0">
                  {(r.user?.name || 'K').charAt(0).toUpperCase()}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <Stars value={r.rating} size={14} />
                    <span className="text-sm font-semibold text-ink">{r.user?.name || 'Khách hàng'}</span>
                  </div>
                  <div className="text-xs text-ink-faint">{timeAgo(r.createdAt)}</div>
                </div>
              </div>
              {r.comment && <p className="text-sm text-ink-soft mt-2 ml-11">{r.comment}</p>}
            </div>
          ))}
        </div>

        {/* Review form */}
        {isCustomer && !out && (
          <form onSubmit={handleReview} className="bg-bone-100 rounded-card p-5 md:p-6 space-y-4">
            <h3 className="font-bold text-ink text-sm">Đánh giá sản phẩm này</h3>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map(s => (
                <button type="button" key={s} onClick={() => setRating(s)} aria-label={`${s} sao`} className="transition-transform hover:scale-110">
                  <Stars value={s} size={24} />
                </button>
              ))}
              <span className="text-sm text-ink-faint ml-2">{rating}/5</span>
            </div>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              placeholder="Chia sẻ trải nghiệm của bạn..."
              className="w-full px-3 py-2.5 rounded-control border border-line-strong bg-surface text-ink text-sm placeholder:text-ink-faint focus:ring-2 focus:ring-forest-500 focus:outline-none"
            />
            {reviewError && <div className="text-sm text-danger">{reviewError}</div>}
            {reviewMsg && <div className="text-sm text-success inline-flex items-center gap-1.5"><Icon name="CheckCircle" size={16} />{reviewMsg}</div>}
            <BtnPrimary type="submit" className="px-5 py-2.5 text-sm">Gửi đánh giá</BtnPrimary>
          </form>
        )}
      </section>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section>
          <SectionHeading title="Sản phẩm liên quan" sub="Có thể bạn cũng sẽ thích" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recommendations.map(r => (
              <Link
                key={r.productId}
                to={`/store/product/${r.productId}`}
                className="group rounded-card border border-line overflow-hidden hover:shadow-lift hover:border-line-strong transition-all bg-surface-raised"
              >
                <div className="aspect-square bg-bone-100 overflow-hidden">
                  <img
                    src={r.imageUrl || FALLBACK_IMG(r.name)}
                    alt={r.name}
                    loading="lazy"
                    className="img-zoom w-full h-full object-cover"
                    onError={e => { e.currentTarget.src = FALLBACK_IMG(r.name); }}
                  />
                </div>
                <div className="p-3.5">
                  <div className="text-sm font-semibold text-ink truncate group-hover:text-forest-700 transition-colors">{r.name}</div>
                  <div className="text-sm font-bold text-forest-800 mt-1 tabular">{fmtVND(r.price)} ₫</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sticky add-to-cart on mobile: real commerce pattern */}
      {!out && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-raised border-t border-line px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-ink-faint truncate">{product.name}</div>
            <div className="font-extrabold text-forest-800 tabular">{fmtVND(product.price)} ₫</div>
          </div>
          <button
            onClick={handleAdd}
            className={`inline-flex items-center gap-1.5 rounded-control px-5 py-3 text-sm font-bold transition-all active:scale-[0.98] ${added ? 'bg-forest-500 text-white' : 'bg-forest-800 hover:bg-forest-700 text-bone-50'}`}
          >
            {added ? (
              <>
                <Icon name="CheckCircle" size={16} weight="bold" />
                Đã thêm
              </>
            ) : (
              <>
                <Icon name="Plus" size={16} weight="bold" />
                Thêm vào giỏ
              </>
            )}
          </button>
        </div>
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
