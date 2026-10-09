import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { BrandMark, Leaf, Icon } from '../store/Ui.jsx';

const SIDE_IMG = 'https://picsum.photos/seed/dryfood-market-herbs/1000/1400';

const EMPTY = { name: '', email: '', phone: '', address: '', password: '', confirm: '' };

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Xác nhận mật khẩu không khớp');
      return;
    }
    setSubmitting(true);
    try {
      const data = await register({
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        address: form.address || null,
        password: form.password
      });
      if (data.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/store', { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-control border border-line-strong bg-surface text-ink text-sm placeholder:text-ink-faint focus:ring-2 focus:ring-forest-500 focus:outline-none';

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-surface">
      {/* Brand side */}
      <div className="relative hidden md:block overflow-hidden">
        <img src={SIDE_IMG} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/40 to-forest-950/20" />
        <div className="relative z-10 h-full flex flex-col justify-between p-10 text-bone-50">
          <BrandMark light />
          <div className="max-w-sm">
            <div className="inline-flex items-center gap-2 text-amber-brand font-bold text-xs uppercase tracking-[0.16em] mb-3">
              <Leaf size={16} weight="duotone" />
              Thực phẩm khô chọn lọc
            </div>
            <h2 className="display text-3xl text-bone-50">
              Đồ khô, hạt và trái cây sấy cho bữa ăn mỗi ngày
            </h2>
            <p className="mt-3 text-bone-50/70 text-sm leading-relaxed">
              Tạo tài khoản để theo dõi đơn hàng và nhận ưu đãi dành riêng cho thành viên.
            </p>
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-4 md:p-10">
        <div className="w-full max-w-md">
          <div className="md:hidden mb-8 flex justify-center">
            <BrandMark className="justify-center" />
          </div>

          <h1 className="display text-3xl text-ink">Đăng ký</h1>
          <p className="text-ink-soft mt-2 text-sm">Tạo tài khoản khách hàng mới.</p>

          <div className="bg-surface-raised rounded-card shadow-lift border border-line p-8 mt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Họ tên *</label>
                <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="VD: Nguyen Van An" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Email *</label>
                <input type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="ban@example.com" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Số điện thoại</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="VD: 0912345678" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Địa chỉ giao hàng</label>
                <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="VD: 12 Le Loi, Q1, TP.HCM" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Mật khẩu * (tối thiểu 6 ký tự)</label>
                <input type="password" required minLength={6} value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Xác nhận mật khẩu *</label>
                <input type="password" required value={form.confirm} onChange={e => set('confirm', e.target.value)} placeholder="••••••••" className={inputCls} />
              </div>

              {error && <div className="rounded-control border border-rose-200 bg-rose-50 text-danger p-3 text-sm">{error}</div>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-forest-800 hover:bg-forest-700 disabled:opacity-50 text-bone-50 py-3 rounded-control font-bold text-sm transition-all active:scale-[0.98]"
              >
                {submitting ? 'Đang tạo tài khoản...' : 'Đăng ký & vào cửa hàng'}
              </button>
            </form>

            <p className="text-center text-sm text-ink-soft mt-5">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-forest-700 font-semibold hover:underline">
                Đăng nhập
              </Link>
            </p>
          </div>

          <div className="text-center mt-4">
            <Link to="/store" className="text-sm text-ink-soft hover:text-forest-700 font-medium inline-flex items-center gap-1">
              <Icon name="ArrowLeft" size={14} />
              Tiếp tục xem cửa hàng
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}