import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useCart } from './CartContext.jsx';
import { api } from '../api/client.js';
import { fmtVND } from '../utils/format.js';

export default function Checkout() {
  const { user } = useAuth();
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null); // {code, discount}
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [placed, setPlaced] = useState(null); // don da dat thanh cong

  const finalTotal = appliedVoucher ? Math.max(0, total - appliedVoucher.discount) : total;

  if (placed) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-extrabold text-slate-800">Đặt hàng thành công!</h1>
        <p className="text-slate-500 mt-2">
          Mã đơn: <span className="font-mono font-bold text-slate-700">{placed.orderCode}</span>
        </p>
        <p className="text-sm text-slate-400 mt-1">
          Tổng tiền: <b>{fmtVND(placed.totalAmount)} ₫</b> · Trạng thái: <b>Chờ xác nhận</b>
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link
            to="/store"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold"
          >
            ← Tiếp tục mua sắm
          </Link>
          <Link
            to="/store/orders"
            className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold"
          >
            Xem đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        <div className="text-5xl mb-4">🛒</div>
        Giỏ hàng trống
        <div className="mt-4">
          <Link to="/store" className="text-orange-600 font-semibold hover:underline text-sm">
            ← Quay lại mua sắm
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const body = {
        note: note || null,
        paymentMethod,
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity }))
      };
      if (appliedVoucher) body.voucherCode = appliedVoucher.code;
      const order = await api.createOrder(body);
      clearCart();
      setPlaced(order);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function applyVoucher() {
    setError('');
    if (!voucherCode.trim()) return;
    try {
      const res = await api.previewVoucher(voucherCode, total);
      if (res.discount > 0) {
        setAppliedVoucher({ code: voucherCode.trim().toUpperCase(), discount: res.discount });
      } else {
        setAppliedVoucher(null);
        setError('Mã giảm giá không hợp lệ hoặc chưa đủ điều kiện.');
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Xác nhận đơn hàng</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Thong tin giao hang */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-slate-800">Thông tin giao hàng</h2>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Họ tên</label>
              <input
                value={user?.name || ''}
                disabled
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-600"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
              <input
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-600"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Số điện thoại</label>
              <input
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="VD: 0912345678"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Địa chỉ giao hàng</label>
              <input
                required
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="VD: 12 Le Loi, Q1, TP.HCM"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Ghi chú cho cửa hàng</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                placeholder="VD: Giao gio hanh chinh"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>

            {/* Phuong thuc thanh toan */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Phương thức thanh toán</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-3 rounded-xl border-2 text-left transition-colors ${paymentMethod === 'COD' ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className="text-lg">💵</div>
                  <div className="text-sm font-bold text-slate-800 mt-1">Thanh toán khi nhận</div>
                  <div className="text-xs text-slate-400">COD</div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('TRANSFER')}
                  className={`p-3 rounded-xl border-2 text-left transition-colors ${paymentMethod === 'TRANSFER' ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className="text-lg">🏦</div>
                  <div className="text-sm font-bold text-slate-800 mt-1">Chuyển khoản</div>
                  <div className="text-xs text-slate-400">Chuyển trước</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Don hang */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 sticky top-24">
            <h2 className="font-bold text-slate-800">Đơn hàng ({items.length} món)</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {items.map(item => (
                <div key={item.productId} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">{item.name}</div>
                    <div className="text-xs text-slate-400">
                      {item.quantity} × {fmtVND(item.price)} ₫
                    </div>
                  </div>
                  <div className="text-sm font-bold text-slate-800 shrink-0">
                    {fmtVND(item.price * item.quantity)} ₫
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
              <span className="text-sm text-slate-500">Tạm tính</span>
              <span className="text-slate-800 font-semibold">{fmtVND(total)} ₫</span>
            </div>

            {appliedVoucher && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-600">Giảm ({appliedVoucher.code})</span>
                <span className="text-emerald-600 font-semibold">−{fmtVND(appliedVoucher.discount)} ₫</span>
              </div>
            )}

            <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
              <span className="text-sm text-slate-500">Tổng cộng</span>
              <span className="text-xl font-extrabold text-slate-800">{fmtVND(finalTotal)} ₫</span>
            </div>

            {/* Voucher */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Mã giảm giá (nếu có)</label>
              <div className="flex gap-2">
                <input
                  value={voucherCode}
                  onChange={e => setVoucherCode(e.target.value)}
                  placeholder="Nhập mã khuyến mãi"
                  className="flex-1 px-3 py-2.5 border border-slate-300 rounded-xl text-sm uppercase focus:ring-2 focus:ring-orange-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={applyVoucher}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold"
                >
                  Áp dụng
                </button>
              </div>
              {appliedVoucher && (
                <div className="mt-2 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  ✓ Mã {appliedVoucher.code}: giảm {fmtVND(appliedVoucher.discount)} ₫
                </div>
              )}
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-sm shadow-sm transition-colors"
            >
              {submitting ? 'Đang đặt hàng...' : 'Đặt hàng'}
            </button>
            <Link to="/store" className="block text-center text-sm text-slate-500 hover:text-orange-600 font-medium">
              ← Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
