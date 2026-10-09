import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-control text-sm font-medium transition-colors ${
      isActive
        ? 'bg-amber-brand text-forest-950 font-bold'
        : 'text-bone-50/80 hover:bg-forest-800 hover:text-bone-50'
    }`;

  const SidebarContent = (
    <>
      <div className="px-5 py-5 border-b border-forest-800">
        <BrandMark light />
        <div className="text-[11px] text-bone-50/60 mt-1">Quản trị viên</div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Điều hướng quản trị">
        {NAV_ITEMS.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass} onClick={() => setMobileOpen(false)}>
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
    </>
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 bg-forest-950 text-bone-50 flex-col fixed inset-y-0">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu quản trị">
          <div className="absolute inset-0 bg-forest-950/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute top-0 left-0 h-full w-64 bg-forest-950 text-bone-50 flex flex-col shadow-pop">
            <div className="flex justify-end p-3">
              <button
                onClick={() => setMobileOpen(false)}
                className="w-9 h-9 rounded-control hover:bg-forest-800 grid place-items-center text-bone-50/70"
                aria-label="Đóng menu"
              >
                <Icon name="X" size={18} />
              </button>
            </div>
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="lg:ml-60 flex flex-col min-h-screen">
        {/* Topbar: breadcrumb + context */}
        <header className="sticky top-0 z-30 bg-surface-raised border-b border-line px-4 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-10 h-10 rounded-control hover:bg-bone-100 grid place-items-center text-ink-soft"
              aria-label="Mở menu"
            >
              <Icon name="List" size={20} />
            </button>
            <div className="text-sm text-ink-faint">
              <span className="hidden sm:inline">Quản trị</span>
              <span className="mx-1.5 hidden sm:inline">/</span>
              <span className="text-ink font-semibold">{NAV_ITEMS.find(i => matchActive(i))?.label || 'Hệ thống'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/store"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-control border border-line-strong text-ink text-sm font-semibold hover:border-forest-400 hover:text-forest-800 transition-colors"
            >
              <Icon name="ShoppingCartSimple" size={16} />
              Xem cửa hàng
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );

  function matchActive(item) {
    if (item.end) return location.pathname === item.to;
    return location.pathname.startsWith(item.to);
  }
}