import React from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { BrandMark, Icon } from '../store/Ui.jsx';

const NAV_ITEMS = [
  { to: '/admin', label: 'Tổng quan', icon: 'Info', end: true },
  { to: '/admin/products', label: 'Sản phẩm', icon: 'Package' },
  { to: '/admin/customers', label: 'Khách hàng', icon: 'UserCircle' },
  { to: '/admin/orders', label: 'Đơn hàng', icon: 'NotePencil' },
  { to: '/admin/vouchers', label: 'Mã giảm giá', icon: 'Tag' },
  { to: '/admin/analytics', label: 'Phân tích & AI', icon: 'CaretRight' }
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-forest-950 text-bone-50 flex flex-col fixed inset-y-0">
        <div className="px-5 py-5 border-b border-forest-800">
          <BrandMark className="[&>span:last-child]:text-bone-50/90 [&>span:last-child>span:first-child]:text-bone-50" />
          <div className="text-[11px] text-bone-50/60 mt-1">Quản trị viên</div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-control text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-brand text-forest-950 font-bold'
                    : 'text-bone-50/80 hover:bg-forest-800 hover:text-bone-50'
                }`
              }
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-forest-800 space-y-2">
          <Link
            to="/store"
            className="flex items-center gap-3 px-3 py-2.5 rounded-control text-sm font-medium text-bone-50/80 hover:bg-forest-800 hover:text-bone-50 transition-colors"
          >
            <Icon name="ShoppingCartSimple" size={18} />
            Xem cửa hàng
          </Link>
          <div className="flex items-center justify-between px-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-bone-50 truncate">{user?.name || 'Admin'}</div>
              <div className="text-[10px] text-bone-50/50 truncate">{user?.email || ''}</div>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-bone-50/70 hover:text-amber-brand font-medium shrink-0"
              aria-label="Đăng xuất"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-60 p-8 bg-surface min-w-0">
        <Outlet />
      </main>
    </div>
  );
}