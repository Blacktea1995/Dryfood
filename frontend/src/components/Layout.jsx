import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/admin', label: 'Tổng quan', icon: '📊', end: true },
  { to: '/admin/products', label: 'Sản phẩm', icon: '📦' },
  { to: '/admin/customers', label: 'Khách hàng', icon: '👥' },
  { to: '/admin/orders', label: 'Đơn hàng', icon: '🧾' }
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-slate-900 text-slate-100 flex flex-col fixed inset-y-0">
        <div className="px-5 py-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🍜</span>
            <div>
              <div className="font-bold text-lg leading-tight">DryFood</div>
              <div className="text-xs text-slate-400">Quản trị viên</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-slate-700 space-y-2">
          <NavLink
            to="/store"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <span>🛍️</span>
            Xem cửa hàng
          </NavLink>
          <div className="flex items-center justify-between px-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Admin'}</div>
              <div className="text-[10px] text-slate-500 truncate">{user?.email || ''}</div>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-slate-400 hover:text-rose-400 font-medium shrink-0"
              aria-label="Đăng xuất"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-60 p-8 bg-slate-50 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
