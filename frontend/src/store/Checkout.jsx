import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useCart } from './CartContext.jsx';
import { api } from '../api/client.js';
import { fmtVND } from '../utils/format.js';
import { Icon, BtnPrimary, BtnGhost, CheckCircle, EmptyState } from './Ui.jsx';

const PAYMENTS = [
  { value: 'COD', label: 'Thanh toán khi nhận', sub: 'Trả tiền khi nhận hàng (COD)', icon: 'CheckCircle' },
  { value: 'TRANSFER', label: 'Chuyển khoản', sub: 'Chuyển khoản trước khi giao', icon: 'Info' }
];

export default function Checkout() {
  const { user } = useAuth();
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [placed, setPlaced] = useState(null);

  const finalTotal = appliedVoucher ? Math.max(0, total - appliedVoucher.discount) : total;

  if (placed) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-forest-100 grid place-items-center">
          <CheckCircle size={34} className="text-forest-700" />
        </div>
        <h1 className="display text-2xl text-ink">Đặt hàng thành công!</h1>
        <p className="text-ink-soft mt-2">
          Mã đơn: <span className="font-mono font-bold text-ink tabular">{placed.orderCode}</span>
        </p>
        <p className="text-sm text-ink-faint mt-1">
          Tổng tiền: <b className="text-ink tabular">{fmtVND(placed.totalAmount)} ₫</b> · Trạng thái: <b className="text-ink">Chờ xác nhận</b>
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <BtnGhost onClick={() => navigate('/store')}>
            <Icon name="ArrowLeft" size={16} />
            Tiếp tục mua sắm
          </BtnGhost>
          <BtnPrimary onClick={() => navigate('/store/orders')}>
            Xem đơn hàng
          </BtnPrimary>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon="ShoppingCartSimple"
        title="Giỏ hàng trống"
        sub="Thêm sản phẩm vào giỏ trước khi đặt hàng nhé."
        action={
          <Link to="/store" className="inline-flex items-center gap-1.5 rounded-control bg-forest-800 hover:bg-forest-700 text-bone-50 px-5 py-2.5 text-sm font-bold transition-colors">
            <Icon name="ArrowLeft" size={16} />
            Quay lại mua sắm
          </Link>
        }
      />
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

  const inputClass = 'w-full px-3 py-2.5 rounded-control border border-line-strong bg-surface text-ink text-sm placeholder:text-ink-faint focus:ring-2 focus:ring-forest-500 focus:outline-none';
  const labelClass = 'block text-sm font-semibold text-ink mb-1.5';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="display text-2xl md:text-3xl text-ink">Xác nhận đơn hàng</h1>
        <p className="text-sm text-ink-faint mt-2">Kiểm tra thông tin giao hàng và phương thức thanh toán trước khi đặt.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Delivery info */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-surface-raised rounded-card border border-line p-6 space-y-4">
            <h2 className="font-extrabold text-ink inline-flex items-center gap-2">
              <Icon name="MapPin" size={18} />
              Thông tin giao hàng
            </h2>
            <div>
              <label className={labelClass}>Họ tên</label>
              <input value={user?.name || ''} disabled className={inputClass + ' bg-bone-100 text-ink-soft'} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input value={user?.email || ''} disabled className={inputClass + ' bg-bone-100 text-ink-soft'} />
            </div>
            <div>
              <label className={labelClass}>Số điện thoại</label>
              <input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="VD: 0912345678" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Địa chỉ giao hàng</label>
              <input required value={address} onChange={e => setAddress(e.target.value)} placeholder="VD: 12 Le Loi, Q1, TP.HCM" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Ghi chú cho cửa hàng</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="VD: Giao gio hanh chinh" className={inputClass} />
            </div>

            {/* Payment method */}
            <div>
              <label className={labelClass + ' mb-2'}>Phương thức thanh toán</label>
              <div className="grid grid-cols-2 gap-3">
                {PAYMENTS.map(pm => (
                  <button
                    type="button"
                    key={pm.value}
                    onClick={() => setPaymentMethod(pm.value)}
                    className={`p-4 rounded-control border-2 text-left transition-all active:scale-[0.98] ${paymentMethod === pm.value ? 'border-forest-600 bg-forest-50' : 'border-line-strong hover:border-forest-300'}`}
                    aria-pressed={paymentMethod === pm.value}
                  >
                    <div className="text-ink"><Icon name={pm.icon} size={22} /></div>
                    <div className="text-sm font-bold text-ink mt-1.5">{pm.label}</div>
                    <div className="text-xs text-ink-faint mt-0.5">{pm.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Order */}
        <div className="lg:col-span-2">
          <div className="bg-surface-raised rounded-card border border-line p-6 space-y-4 sticky top-24">
            <h2 className="font-extrabold text-ink inline-flex items-center gap-2">
              <Icon name="Package" size={18} />
              Đơn hàng ({items.length} món)
            </h2>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {items.map(item => (
                <div key={item.productId} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-ink truncate">{item.name}</div>
                    <div className="text-xs text-ink-faint">
                      {item.quantity} × {fmtVND(item.price)} ₫
                    </div>
                  </div>
                  <div className="text-sm font-bold text-ink shrink-0 tabular">
                    {fmtVND(item.price * item.quantity)} ₫
                  </div>
                </div>
              ))}
            </div>

            <div className="hairline pt-3 flex items-center justify-between">
              <span className="text-sm text-ink-soft">Tạm tính</span>
              <span className="text-ink font-semibold tabular">{fmtVND(total)} ₫</span>
            </div>

            {appliedVoucher && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-success">Giảm ({appliedVoucher.code})</span>
                <span className="text-success font-semibold tabular">−{fmtVND(appliedVoucher.discount)} ₫</span>
              </div>
            )}

            <div className="hairline pt-3 flex items-center justify-between">
              <span className="text-sm text-ink-soft">Tổng cộng</span>
              <span className="text-xl font-extrabold text-ink tabular">{fmtVND(finalTotal)} ₫</span>
            </div>

            {/* Voucher */}
            <div>
              <label className={labelClass}>Mã giảm giá (nếu có)</label>
              <div className="flex gap-2">
                <input
                  value={voucherCode}
                  onChange={e => setVoucherCode(e.target.value)}
                  placeholder="Nhập mã khuyến mãi"
                  className={inputClass + ' uppercase'}
                />
                <button
                  type="button"
                  onClick={applyVoucher}
                  className="px-4 py-2.5 rounded-control bg-forest-800 hover:bg-forest-700 text-bone-50 text-sm font-semibold transition-colors shrink-0"
                >
                  Áp dụng
                </button>
              </div>
              {appliedVoucher && (
                <div className="mt-2 text-xs text-success bg-success-bg border border-success/20 rounded-control px-3 py-2 inline-flex items-center gap-1">
                  <Icon name="CheckCircle" size={14} />
                  Mã {appliedVoucher.code}: giảm {fmtVND(appliedVoucher.discount)} ₫
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-control border border-rose-200 bg-rose-50 text-danger p-3 text-sm">
                <Icon name="WarningCircle" size={18} />
                {error}
              </div>
            )}

            <BtnPrimary type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Đang đặt hàng...' : 'Đặt hàng'}
            </BtnPrimary>
            <Link to="/store" className="block text-center text-sm text-ink-soft hover:text-forest-800 font-medium">
              ← Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}