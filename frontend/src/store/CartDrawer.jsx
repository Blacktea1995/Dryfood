import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useCart } from './CartContext.jsx';
import { fmtVND } from '../utils/format.js';
import { Icon, BtnPrimary, EmptyState } from './Ui.jsx';

/* Free-shipping threshold: real store convention, functional signal */
const FREE_SHIP = 200000;

export default function CartDrawer({ open, onClose }) {
  const { items, total, updateQuantity, removeItem } = useCart();
  const { isCustomer } = useAuth();
  const navigate = useNavigate();

  if (!open) return null;

  function goCheckout() {
    onClose();
    if (!isCustomer) {
      navigate('/login', { state: { from: '/store/checkout' } });
      return;
    }
    navigate('/store/checkout');
  }

  const remain = Math.max(0, FREE_SHIP - total);
  const progress = Math.min(100, (total / FREE_SHIP) * 100);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Giỏ hàng">
      <div className="absolute inset-0 bg-forest-950/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute top-0 right-0 h-full w-full max-w-md bg-surface flex flex-col shadow-pop">
        {/* Header */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-ink inline-flex items-center gap-2">
            <Icon name="ShoppingCartSimple" size={22} />
            Giỏ hàng
            {items.length > 0 && <span className="text-sm font-bold text-ink-faint tabular">({items.length})</span>}
          </h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-control hover:bg-bone-100 grid place-items-center text-ink-soft transition-colors"
            aria-label="Đóng giỏ hàng"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Free-ship progress: visible only with items, functional state */}
        {items.length > 0 && (
          <div className="px-6 py-3 border-b border-line bg-bone-100/60">
            {remain > 0 ? (
              <p className="text-xs text-ink-soft">
                Còn <b className="text-forest-800 tabular">{fmtVND(remain)} ₫</b> nữa để được miễn phí giao hàng
              </p>
            ) : (
              <p className="text-xs text-success inline-flex items-center gap-1.5">
                <Icon name="Truck" size={15} />
                Bạn đã được miễn phí giao hàng!
              </p>
            )}
            <div className="mt-2 h-1.5 rounded-full bg-bone-200 overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Tiến độ miễn phí giao hàng">
              <div className="h-full bg-forest-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 && (
            <EmptyState
              icon="ShoppingCartSimple"
              title="Giỏ hàng trống"
              sub="Chưa có sản phẩm nào trong giỏ. Cùng khám phá cửa hàng nhé."
              action={
                <button onClick={onClose} className="inline-flex items-center gap-1.5 rounded-control bg-forest-800 hover:bg-forest-700 text-bone-50 px-5 py-2.5 text-sm font-bold transition-colors">
                  Xem sản phẩm
                </button>
              }
            />
          )}

          {items.map(item => {
            const disabled = item.quantity >= item.stock;
            return (
              <div key={item.productId} className="flex gap-3 items-center">
                <div className="w-14 h-14 rounded-control bg-bone-100 flex items-center justify-center overflow-hidden shrink-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                  ) : (
                    <Icon name="Package" size={24} className="text-ink-faint" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-ink text-sm truncate">{item.name}</div>
                  <div className="text-xs text-ink-faint">{fmtVND(item.price)} ₫ / {item.unit}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-7 h-7 rounded bg-bone-100 hover:bg-bone-200 text-ink-soft grid place-items-center transition-colors"
                      aria-label="Giảm số lượng"
                    >
                      <Icon name="Minus" size={12} />
                    </button>
                    <span className="text-sm font-semibold text-ink w-6 text-center tabular">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      disabled={disabled}
                      className="w-7 h-7 rounded bg-bone-100 hover:bg-bone-200 text-ink-soft grid place-items-center transition-colors disabled:opacity-30"
                      aria-label="Tăng số lượng"
                    >
                      <Icon name="Plus" size={12} />
                    </button>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-ink text-sm tabular">{fmtVND(item.price * item.quantity)} ₫</div>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-xs text-rose-600 hover:underline mt-1"
                  >
                    Xoá
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-4 border-t border-line space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-soft">Tổng cộng</span>
              <span className="text-xl font-extrabold text-ink tabular">{fmtVND(total)} ₫</span>
            </div>
            <BtnPrimary onClick={goCheckout} className="w-full">
              Tiến hành đặt hàng
              <Icon name="ArrowRight" size={16} />
            </BtnPrimary>
          </div>
        )}
      </aside>
    </div>
  );
}