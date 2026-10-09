import React, { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useCart } from './CartContext.jsx';
import CartDrawer from './CartDrawer.jsx';
import { BrandMark, Icon, Storefront } from './Ui.jsx';

const NAV = [
  { to: '/store', end: true, label: 'Sản phẩm' },
  { to: '/store/orders', end: false, label: 'Đơn của tôi' },
  { to: '/store/profile', end: false, label: 'Hồ sơ' }
];

const FOOTER_COLS = [
  {
    title: 'Về DryFood',
    links: ['Câu chuyện của chúng tôi', 'Hệ thống cửa hàng', 'Tuyển dụng']
  },
  {
    title: 'Hỗ trợ khách hàng',
    links: ['Trung tâm trợ giúp', 'Theo dõi đơn hàng', 'Hướng dẫn mua hàng', 'Câu hỏi thường gặp']
  },
  {
    title: 'Chính sách',
    links: ['Chính sách bảo mật', 'Chính sách đổi trả', 'Chính sách vận chuyển', 'Điều khoản sử dụng']
  }
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
    `px-3.5 py-2 rounded-control text-sm font-semibold transition-colors ${
      isActive ? 'bg-forest-100 text-forest-800' : 'text-ink-soft hover:bg-bone-100 hover:text-ink'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-surface text-ink">
      {/* Announcement bar: real value prop, functional */}
      <div className="bg-forest-950 text-bone-50/90 text-center text-xs py-2 px-4">
        Miễn phí giao hàng cho đơn từ 200.000 ₫ · Gọi 1900 0000 để được tư vấn
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-raised border-b border-line">
        <div className="max-w-6xl mx-auto px-4 h-[72px] flex items-center justify-between gap-4">
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
                      <NavLink
                        to="/store/orders"
                        className="block w-full text-left px-3 py-2 rounded-control text-sm text-ink-soft hover:bg-bone-100 font-medium"
                      >
                        Đơn của tôi
                      </NavLink>
                      <NavLink
                        to="/store/profile"
                        className="block w-full text-left px-3 py-2 rounded-control text-sm text-ink-soft hover:bg-bone-100 font-medium"
                      >
                        Hồ sơ
                      </NavLink>
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
        <nav className="md:hidden flex items-center gap-1 pb-2 px-4 overflow-x-auto no-scrollbar text-sm" aria-label="Điều hướng chính (di động)">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end} className={navClass}>
              {n.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-10">
        <Outlet />
      </main>

      {/* Footer: selling-store footer, 4 columns */}
      <footer className="border-t border-line bg-forest-950 text-bone-50/80">
        <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <BrandMark light />
            <p className="text-sm text-bone-50/60 mt-4 max-w-[26ch]">
              Hệ thống thương mại thực phẩm khô: đồ khô, hạt, trái cây sấy chọn lọc, giao tận nơi.
            </p>
          </div>
          {FOOTER_COLS.map(col => (
            <div key={col.title}>
              <h3 className="text-sm font-bold text-bone-50 mb-3">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map(l => (
                  <li key={l}>
                    <a href="#" onClick={e => e.preventDefault()} className="text-sm text-bone-50/60 hover:text-bone-50 transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-forest-800">
          <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-bone-50/50">
            <span className="inline-flex items-center gap-2">
              <Storefront size={16} />
              DryFood © 2024 · Đồ án tốt nghiệp
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="CheckCircle" size={14} />
              Spring Boot · React
            </span>
          </div>
        </div>
      </footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}