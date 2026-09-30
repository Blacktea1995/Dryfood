import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useCart } from './CartContext.jsx';
import { fmtVND } from '../utils/format.js';

export default function CartDrawer({ open, onClose }) {
  const { items, total, updateQuantity, removeItem } = useCart();
  const { isCustomer } = useAuth();
  const navigate = useNavigate();

  if (!open) return null;

  function goCheckout() {
    onClose();
    if (!isCustomer) {
      navigate('/login');
      return;
    }
    navigate('/store/checkout');
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Giỏ hàng 🛒</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 && (
            <div className="text-center text-slate-400 py-16">
              <div className="text-4xl mb-3">🛒</div>
              Giỏ hàng trống
              <div className="text-sm mt-1">
                <button onClick={onClose} className="text-orange-600 font-semibold hover:underline">
                  Xem sản phẩm
                </button>
              </div>
            </div>
          )}

          {items.map(item => {
            const disabled = item.quantity >= item.stock;
            return (
              <div key={item.productId} className="flex gap-3 items-center">
                <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                  ) : (
                    <span className="text-2xl">🍱</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 text-sm truncate">{item.name}</div>
                  <div className="text-xs text-slate-400">{fmtVND(item.price)} ₫ / {item.unit}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold"
                      aria-label="Giảm số lượng"
                    >
                      −
                    </button>
                    <span className="text-sm font-semibold text-slate-700 w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      disabled={disabled}
                      className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold disabled:opacity-30"
                      aria-label="Tăng số lượng"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-slate-800 text-sm">{fmtVND(item.price * item.quantity)} ₫</div>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-xs text-rose-500 hover:underline mt-1"
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
          <div className="px-6 py-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Tổng cộng</span>
              <span className="text-xl font-extrabold text-slate-800">{fmtVND(total)} ₫</span>
            </div>
            <button
              onClick={goCheckout}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold text-sm shadow-sm transition-colors"
            >
              Tiến hành đặt hàng →
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}