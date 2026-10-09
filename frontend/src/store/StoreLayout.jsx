import React, { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useCart } from './CartContext.jsx';
import CartDrawer from './CartDrawer.jsx';
import { BrandMark, Icon } from './Ui.jsx';

const NAV = [
  { to: '/store', end: true, label: 'Sản phẩm' },
  { to: '/store/orders', end: false, label: 'Đơn của tôi' },
  { to: '/store/profile', end: false, label: 'Hồ sơ' }
];

export default function StoreLayout() {
  const { user, logout, isAuthenticated } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [cartOpen, setCartOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const navClass = ({ isActive }) =>
    `px-3 py-2 rounded-control text-sm font-semibold transition-colors ${
      isActive ? 'bg-forest-100 text-forest-800' : 'text-ink-soft hover:bg-bone-100 hover:text-ink'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-surface text-ink">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-raised border-b border-line">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/store" className="shrink-0" aria-label="DryFood - Trang chủ">
            <BrandMark />
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm" aria-label="Điều hướng chính">
            {NAV.map(n => (
              <NavLink key={n.to} to={n.to} end={n.end} className={navClass}>
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setCartOpen(true)}
              className="relative grid place-items-center w-10 h-10 rounded-control bg-bone-100 hover:bg-bone-200 text-ink transition-colors"
              aria-label={`Mở giỏ hàng${count > 0 ? `, ${count} món` : ''}`}
            >
              <Icon name="ShoppingCartSimple" size={20} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-brand text-white text-[10px] font-bold grid place-items-center tabular">
                  {count}
                </span>
              )}
            </button>

            <div className="relative group">
              {isAuthenticated ? (
                <>
                  <button
                    className="flex items-center gap-2 pl-1 pr-2 h-10 rounded-control hover:bg-bone-100 transition-colors"
                    aria-haspopup="menu"
                    aria-label="Tài khoản"
                  >
                    <span className="grid place-items-center w-8 h-8 rounded-full bg-forest-700 text-bone-50 font-bold text-sm">
                      {(user?.name || '?').charAt(0).toUpperCase()}
                    </span>
                    <span className="text-sm font-semibold text-ink hidden sm:block">
                      {user?.name?.split(' ').slice(-1)[0] || 'Khách'}
                    </span>
                  </button>
                  <div className="absolute right-0 top-full pt-2 hidden group-hover:block group-focus-within:block z-50">
                    <div className="bg-surface-raised rounded-card shadow-pop border border-line p-2 w-56">
                      <div className="px-3 py-2 border-b border-line mb-1">
                        <div className="font-semibold text-ink text-sm">{user?.name}</div>
                        <div className="text-xs text-ink-faint truncate">{user?.email}</div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 rounded-control text-sm text-rose-700 hover:bg-rose-50 font-medium"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => navigate('/login', { state: { from: '/store' } })}
                  className="inline-flex items-center gap-1.5 h-10 px-4 rounded-control bg-forest-800 hover:bg-forest-700 text-bone-50 text-sm font-bold transition-colors"
                >
                  Đăng nhập
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden flex items-center gap-1 pb-2 px-4 overflow-x-auto text-sm" aria-label="Điều hướng chính (di động)">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end} className={navClass}>
              {n.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-line bg-surface-raised">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-faint">
          <span className="inline-flex items-center gap-2">
            <BrandMark className="[&>span:last-child]:hidden" />
            Hệ thống thương mại thực phẩm khô
          </span>
          <span>Spring Boot · React</span>
        </div>
      </footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}