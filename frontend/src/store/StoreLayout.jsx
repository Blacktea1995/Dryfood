import React, { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useCart } from './CartContext.jsx';
import CartDrawer from './CartDrawer.jsx';

export default function StoreLayout() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [cartOpen, setCartOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/store" className="flex items-center gap-2 shrink-0">
            <span className="text-3xl">🍜</span>
            <div>
              <div className="font-extrabold text-lg leading-tight text-slate-800">DryFood</div>
              <div className="text-[11px] text-slate-400 -mt-0.5">Thực phẩm khô</div>
            </div>
          </Link>

          <nav className="flex items-center gap-1 text-sm font-medium">
            <NavLink
              to="/store"
              end
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-orange-100 text-orange-700' : 'text-slate-600 hover:bg-slate-100'}`
              }
            >
              Sản phẩm
            </NavLink>
            <NavLink
              to="/store/orders"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-orange-100 text-orange-700' : 'text-slate-600 hover:bg-slate-100'}`
              }
            >
              Đơn của tôi
            </NavLink>
            <NavLink
              to="/store/profile"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-orange-100 text-orange-700' : 'text-slate-600 hover:bg-slate-100'}`
              }
            >
              Hồ sơ
            </NavLink>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors"
              aria-label="Mở giỏ hàng"
            >
              🛒
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[10px] font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>

            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors text-sm">
                <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm">
                  {(user?.name || '?').charAt(0).toUpperCase()}
                </span>
                <span className="text-slate-700 font-semibold hidden sm:block">
                  {user?.name?.split(' ').slice(-1)[0] || 'Khách'}
                </span>
              </button>
              <div className="absolute right-0 top-full pt-2 hidden group-hover:block z-50">
                <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-2 w-56">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <div className="font-semibold text-slate-800 text-sm">{user?.name}</div>
                    <div className="text-xs text-slate-400 truncate">{user?.email}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50 font-medium"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        🍜 DryFood — Hệ thống thương mại thực phẩm khô · Spring Boot + React
      </footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
