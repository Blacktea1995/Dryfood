import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useCart } from '../store/CartContext.jsx';
import { fmtVND } from '../utils/format.js';

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

  if (loading) return <div className="text-center text-slate-400 py-20">Đang tải...</div>;
  if (error) return <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4">{error}</div>;
  if (!product) return <div className="text-center text-slate-400 py-20">Không tìm thấy sản phẩm</div>;

  const out = product.stock <= 0;
  const avgRating = product.avgRating || 0;

  return (
    <div className="space-y-8">
      <Link to="/store" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-orange-600 font-medium">
        ← Quay lại cửa hàng
      </Link>

      {/* Main product */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image */}
          <div className="bg-slate-50 flex items-center justify-center p-10">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="max-h-96 object-cover rounded-xl" onError={e => { e.target.style.display = 'none'; }} />
            ) : (
              <span className="text-8xl">🍱</span>
            )}
          </div>

          {/* Info */}
          <div className="p-8">
            <div className="text-xs text-slate-400 mb-2">{product.category || 'Thực phẩm khô'}</div>
            <h1 className="text-2xl font-extrabold text-slate-800">{product.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-amber-500">{"⭐".repeat(Math.round(avgRating))}</span>
              <span className="text-sm text-slate-500">
                {avgRating > 0 ? avgRating.toFixed(1) : 'Chưa có đánh giá'} ({product.ratingCount || 0} đánh giá)
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-orange-600">{fmtVND(product.price)}</span>
              <span className="text-slate-400">₫ / {product.unit}</span>
            </div>

            {product.description && (
              <p className="text-slate-600 text-sm mt-4 leading-relaxed">{product.description}</p>
            )}

            <div className="mt-4 text-sm">
              {out ? (
                <span className="text-rose-500 font-semibold">Hết hàng</span>
              ) : product.stock <= 10 ? (
                <span className="text-amber-600 font-semibold">Chỉ còn {product.stock} {product.unit}</span>
              ) : (
                <span className="text-emerald-600">Còn hàng · Kho: {product.stock} {product.unit}</span>
              )}
            </div>

            {/* Quantity + add */}
            {!out && (
              <div className="mt-6 flex items-center gap-4">
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-2 py-1.5">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold"
                    aria-label="Giảm số lượng"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-bold text-slate-800">{qty}</span>
                  <button
                    onClick={() => setQty(Math.min(product.stock, qty + 1))}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold"
                    aria-label="Tăng số lượng"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={handleAdd}
                  className={`px-6 py-3 rounded-xl font-bold text-sm transition-colors flex-1 ${added ? 'bg-emerald-500 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
                >
                  {added ? '✓ Đã thêm vào giỏ' : '+ Thêm vào giỏ hàng'}
                </button>
              </div>
            )}
            {out && (
              <Link to="/store" className="inline-block mt-6 text-sm text-slate-500 hover:text-orange-600 font-medium">
                ← Quay lại cửa hàng
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Đánh giá ({reviews.length})</h2>

        {reviews.length === 0 && (
          <p className="text-sm text-slate-400">Chưa có đánh giá nào.</p>
        )}
        <div className="space-y-4 mb-6">
          {reviews.map(r => (
            <div key={r.id} className="border-b border-slate-100 pb-4 last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-amber-500">{"⭐".repeat(r.rating)}</span>
                <span className="text-sm font-semibold text-slate-700">{r.user?.name || 'Khách hàng'}</span>
              </div>
              {r.comment && <p className="text-sm text-slate-600 mt-1">{r.comment}</p>}
              <div className="text-xs text-slate-400 mt-1">{timeAgo(r.createdAt)}</div>
            </div>
          ))}
        </div>

        {/* Review form */}
        {isCustomer && !out && (
          <form onSubmit={handleReview} className="bg-slate-50 rounded-xl p-5 space-y-3">
            <h3 className="font-bold text-slate-800 text-sm">Đánh giá sản phẩm này</h3>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <button type="button" key={s} onClick={() => setRating(s)} className="text-2xl" aria-label={`${s} sao`}>
                  {s <= rating ? '⭐' : '☆'}
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={2}
              placeholder="Chia sẻ trải nghiệm của bạn..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
            />
            {reviewError && <div className="text-sm text-rose-600">{reviewError}</div>}
            {reviewMsg && <div className="text-sm text-emerald-600">{reviewMsg}</div>}
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
              Gửi đánh giá
            </button>
          </form>
        )}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">💡 Sản phẩm liên quan</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recommendations.map(r => (
              <div key={r.productId} className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                <Link to={`/store/product/${r.productId}`} className="block">
                  <div className="aspect-square bg-slate-100 flex items-center justify-center">
                    {r.imageUrl ? (
                      <img src={r.imageUrl} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                    ) : <span className="text-4xl">🍱</span>}
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-semibold text-slate-800 truncate">{r.name}</div>
                    <div className="text-sm font-bold text-orange-600 mt-1">{fmtVND(r.price)} ₫</div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
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