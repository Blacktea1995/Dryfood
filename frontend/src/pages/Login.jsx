import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { BrandMark, Icon, Leaf } from '../store/Ui.jsx';

const SIDE_IMG = 'https://picsum.photos/seed/dryfood-market-herbs/1000/1400';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await login(email, password);
      const from = location.state?.from;
      if (data.role === 'ADMIN') {
        navigate(from && from.startsWith('/admin') ? from : '/admin', { replace: true });
      } else {
        navigate(from && from.startsWith('/store') ? from : '/store', { replace: true });
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
      {/* Brand side: real market visual, one moment */}
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
              Đặt hàng nhanh, giao tận nơi, kiểm soát chất lượng từ khâu chọn nguyên liệu.
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

          <h1 className="display text-3xl text-ink">Đăng nhập</h1>
          <p className="text-ink-soft mt-2 text-sm">Chào mừng quay lại DryFood.</p>

          <div className="bg-surface-raised rounded-card shadow-lift border border-line p-8 mt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="ban@example.com" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Mật khẩu</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={inputCls} />
              </div>

              {error && <div className="rounded-control border border-rose-200 bg-rose-50 text-danger p-3 text-sm">{error}</div>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-forest-800 hover:bg-forest-700 disabled:opacity-50 text-bone-50 py-3 rounded-control font-bold text-sm transition-all active:scale-[0.98]"
              >
                {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>

            <p className="text-center text-sm text-ink-soft mt-5">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-forest-700 font-semibold hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </div>

          <div className="mt-4 rounded-card border border-amber-brand/25 bg-amber-brand/10 p-4 text-sm text-amber-deep">
            <div className="font-bold mb-1 inline-flex items-center gap-1.5">
              <Icon name="Info" size={16} />
              Tài khoản demo
            </div>
            <div className="flex flex-col gap-0.5">
              <span><b>Admin:</b> admin@dryfood.vn / admin123</span>
              <span>Khách hàng: đăng ký tài khoản mới ở trên</span>
            </div>
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