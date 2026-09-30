import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

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

  const inputCls = 'w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🍜</div>
          <h1 className="text-3xl font-extrabold text-slate-800">DryFood</h1>
          <p className="text-slate-500 mt-1">Tạo tài khoản khách hàng mới</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Đăng ký</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Họ tên *</label>
              <input
                required
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="VD: Nguyen Van An"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="ban@example.com"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Số điện thoại</label>
              <input
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="VD: 0912345678"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Địa chỉ giao hàng</label>
              <input
                value={form.address}
                onChange={e => set('address', e.target.value)}
                placeholder="VD: 12 Le Loi, Q1, TP.HCM"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Mật khẩu * (tối thiểu 6 ký tự)</label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="••••••••"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Xác nhận mật khẩu *</label>
              <input
                type="password"
                required
                value={form.confirm}
                onChange={e => set('confirm', e.target.value)}
                placeholder="••••••••"
                className={inputCls}
              />
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors"
            >
              {submitting ? 'Đang tạo tài khoản...' : 'Đăng ký & vào cửa hàng'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-orange-600 font-semibold hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
