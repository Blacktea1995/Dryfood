import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { BrandMark } from '../store/Ui.jsx';

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
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <BrandMark className="justify-center mb-3" />
          <h1 className="text-3xl font-extrabold text-ink tracking-tight">DryFood</h1>
          <p className="text-ink-soft mt-1">Hệ thống thương mại thực phẩm khô</p>
        </div>

        <div className="bg-surface-raised rounded-card shadow-lift border border-line p-8">
          <h2 className="text-xl font-extrabold text-ink mb-6">Đăng nhập</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-ink mb-1">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="ban@example.com" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-1">Mật khẩu</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={inputCls} />
            </div>

            {error && <div className="rounded-control border border-rose-200 bg-rose-50 text-rose-700 p-3 text-sm">{error}</div>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-forest-800 hover:bg-forest-700 disabled:opacity-50 text-bone-50 py-2.5 rounded-control font-bold text-sm transition-all active:scale-[0.98]"
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
          <div className="font-bold mb-1">Tài khoản demo</div>
          <div className="flex flex-col gap-0.5">
            <span><b>Admin:</b> admin@dryfood.vn / admin123</span>
            <span>Khách hàng: đăng ký tài khoản mới ở trên</span>
          </div>
        </div>

        <div className="text-center mt-4">
          <Link to="/store" className="text-sm text-ink-soft hover:text-forest-700 font-medium inline-flex items-center gap-1">
            ← Tiếp tục xem cửa hàng
          </Link>
        </div>
      </div>
    </div>
  );
}