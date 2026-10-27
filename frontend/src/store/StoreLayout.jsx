import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useCart } from './CartContext.jsx';
import CartDrawer from './CartDrawer.jsx';
import AssistantChat from './AssistantChat.jsx';
import { BrandMark, Icon, Storefront, CheckCircle } from './Ui.jsx';
import { TOP_CATEGORIES, CATEGORY_GROUPS, CATEGORY_GROUPS_3 } from './categories.js';
import { FOOTER_COLS } from './footerContent.js';
import { InfoModalProvider, useInfoModal } from './InfoModal.jsx';

const NAV = [
  { to: '/store', end: true, label: 'Sản phẩm' },
  { to: '/store/orders', end: false, label: 'Đơn của tôi' },
  { to: '/store/profile', end: false, label: 'Hồ sơ' }
];

const AREAS = ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng'];

function StoreLayoutInner() {
  const { user, logout, isAuthenticated } = useAuth();
  const { count, lastAdded, clearLastAdded } = useCart();
  const { open: openInfo } = useInfoModal();
  const navigate = useNavigate();
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const [area, setArea] = useState('Hà Nội');
  const [areaOpen, setAreaOpen] = useState(false);
  const [showTop, setShowTop] = useState(true);
  const [activeMega, setActiveMega] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileSub, setMobileSub] = useState(null);
  const sentinelRef = useRef(null);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  function submitSearch(e) {
    e.preventDefault();
    const q = search.trim();
    const params = new URLSearchParams(searchParams);
    if (q) params.set('q', q); else params.delete('q');
    navigate('/store?' + params.toString());
  }

  // Header collapse: sentinel + IntersectionObserver (no scroll listener)
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver !== 'function') return;
    const io = new IntersectionObserver(([entry]) => {
      setShowTop(entry.isIntersecting);
    }, { rootMargin: '0px 0px -90px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const navClass = ({ isActive }) =>
    `px-3.5 py-2 rounded-control text-sm font-semibold transition-colors ${
      isActive ? 'bg-forest-100 text-forest-800' : 'text-ink-soft hover:bg-bone-100 hover:text-ink'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-surface text-ink">
      {/* Top bar: utility strip */}
      <div className={`bg-forest-950 text-bone-50/80 text-xs transition-all duration-300 ${showTop ? 'max-h-10 py-2 opacity-100' : 'max-h-0 py-0 opacity-0 overflow-hidden'}`}>
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <Icon name="Storefront" size={13} />
              <span className="hidden sm:inline">Hệ thống cửa hàng</span>
              <span className="sm:hidden">DryFood</span>
            </span>
            <div className="relative">
              <button
                onClick={() => setAreaOpen(o => !o)}
                className="inline-flex items-center gap-1 whitespace-nowrap text-bone-50/80 hover:text-bone-50"
                aria-haspopup="listbox"
                aria-expanded={areaOpen}
              >
                <span className="hidden sm:inline">Bạn đang ở: </span>
                <b className="text-bone-50">{area}</b>
                <Icon name="CaretDown" size={12} />
              </button>
              {areaOpen && (
                <div className="absolute left-0 top-full mt-1 w-40 mega-panel p-1 z-50" role="listbox" aria-label="Chọn khu vực">
                  {AREAS.map(a => (
                    <button
                      key={a}
                      onClick={() => { setArea(a); setAreaOpen(false); }}
                      className={`block w-full text-left px-3 py-1.5 rounded-control text-xs font-semibold ${a === area ? 'bg-forest-100 text-forest-800' : 'text-ink-soft hover:bg-bone-100'}`}
                      role="option"
                      aria-selected={a === area}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <nav className="hidden lg:flex items-center gap-4 whitespace-nowrap" aria-label="Liên kết công ty">
            <a href="#" onClick={e => e.preventDefault()} className="hover:text-bone-50">Về chúng tôi</a>
            <a href="#" onClick={e => e.preventDefault()} className="hover:text-bone-50">Phương thức thanh toán</a>
            <a href="#" onClick={e => e.preventDefault()} className="hover:text-bone-50">Tin tức</a>
          </nav>
        </div>
      </div>

      {/* Main header: sticky, one line */}
      <header className="sticky top-0 z-40 bg-surface-raised border-b border-line">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-[72px] flex items-center gap-2 sm:gap-3 md:gap-4">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="lg:hidden w-10 h-10 rounded-control hover:bg-bone-100 grid place-items-center text-ink-soft shrink-0"
            aria-label="Mở danh mục"
          >
            <Icon name="List" size={22} />
          </button>

          <Link to="/store" className="shrink-0" aria-label="DryFood - Trang chủ">
            <BrandMark />
          </Link>

          <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-md mx-auto items-center gap-2 rounded-control border border-line-strong bg-bone-50 px-3 focus-within:ring-2 focus-within:ring-forest-500" role="search" aria-label="Tìm kiếm sản phẩm">
            <Icon name="MagnifyingGlass" size={18} className="text-ink-faint shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Bạn cần tìm đồ khô gì hôm nay?"
              className="w-full py-2.5 bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
            />
            <button type="submit" className="shrink-0 rounded-control bg-forest-800 hover:bg-forest-700 text-bone-50 text-sm font-bold px-4 py-2 transition-colors">
              Tìm
            </button>
          </form>

          <div className="ml-auto flex items-center gap-2 md:gap-3 shrink-0">
            <div className="hidden xl:flex items-center gap-2 mr-1">
              <span className="grid place-items-center w-10 h-10 rounded-full bg-forest-100 text-forest-800">
                <Icon name="Phone" size={18} />
              </span>
              <div className="leading-tight">
                <a href="tel:19000000" className="block font-extrabold text-ink text-sm">1900 0000</a>
                <span className="block text-[10px] text-ink-faint">08h - 20h (T2 - CN)</span>
              </div>
            </div>

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
                    <div className="mega-panel p-2 w-56">
                      <div className="px-3 py-2 border-b border-line mb-1">
                        <div className="font-semibold text-ink text-sm">{user?.name}</div>
                        <div className="text-xs text-ink-faint truncate">{user?.email}</div>
                      </div>
                      <NavLink to="/store/orders" className="block w-full text-left px-3 py-2 rounded-control text-sm text-ink-soft hover:bg-bone-100 font-medium">
                        Đơn của tôi
                      </NavLink>
                      <NavLink to="/store/profile" className="block w-full text-left px-3 py-2 rounded-control text-sm text-ink-soft hover:bg-bone-100 font-medium">
                        Hồ sơ
                      </NavLink>
                      <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-control text-sm text-rose-700 hover:bg-rose-50 font-medium">
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => navigate('/login', { state: { from: '/store' } })}
                  className="inline-flex items-center justify-center gap-1.5 h-10 px-2 sm:px-4 rounded-control bg-forest-800 hover:bg-forest-700 text-bone-50 text-sm font-bold transition-colors"
                >
                  <Icon name="UserCircle" size={16} />
                  <span className="hidden sm:inline">Đăng nhập</span>
                </button>
              )}
            </div>

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
          </div>
        </div>

        {/* Mobile search row */}
        <form onSubmit={submitSearch} className="md:hidden px-4 pb-2.5 flex items-center gap-2" role="search" aria-label="Tìm kiếm sản phẩm">
          <div className="flex-1 flex items-center gap-2 rounded-control border border-line-strong bg-bone-50 px-3 focus-within:ring-2 focus-within:ring-forest-500">
            <Icon name="MagnifyingGlass" size={16} className="text-ink-faint shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm sản phẩm..."
              className="w-full py-2.5 bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
            />
          </div>
        </form>
      </header>

      {/* Mega menu (desktop) */}
      <nav className="hidden lg:block bg-surface-raised border-b border-line" aria-label="Danh mục sản phẩm">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-1" onMouseLeave={() => setActiveMega(null)}>
          <NavLink
            to="/store"
            end
            className={`inline-flex items-center gap-2 px-3.5 h-11 text-sm font-bold transition-colors ${activeMega === 'home' ? 'text-forest-700' : 'text-ink hover:text-forest-700'}`}
            onMouseEnter={() => setActiveMega('home')}
          >
            <Icon name="House" size={16} />
            Trang chủ
          </NavLink>
          {TOP_CATEGORIES.map(c => (
            <div key={c.key} className="relative" onMouseEnter={() => setActiveMega(c.key)}>
              <button
                className={`inline-flex items-center gap-1 px-3.5 h-11 text-sm font-bold transition-colors ${activeMega === c.key ? 'text-forest-700' : 'text-ink hover:text-forest-700'}`}
                aria-haspopup="true"
                aria-expanded={activeMega === c.key}
              >
                {c.label}
                <Icon name="CaretDown" size={12} />
              </button>
              {activeMega === c.key && (
                <div className="absolute left-0 top-full pt-1 z-50 w-[560px]">
                  <div className="mega-panel p-5">
                    <p className="text-xs text-ink-faint mb-3">{c.sub}</p>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                      {(CATEGORY_GROUPS[c.key] || []).map(g => (
                        <div key={g}>
                          <button
                            onClick={() => { setActiveMega(null); navigate('/store?category=' + encodeURIComponent(c.key)); }}
                            className="text-sm font-bold text-ink hover:text-forest-700 transition-colors"
                          >
                            {g}
                          </button>
                          {(CATEGORY_GROUPS_3[g] || []).slice(0, 3).map(s3 => (
                            <button
                              key={s3}
                              onClick={() => { setActiveMega(null); navigate('/store?category=' + encodeURIComponent(c.key)); }}
                              className="block w-full text-left text-[13px] text-ink-soft hover:text-forest-700 py-0.5"
                            >
                              {s3}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Mobile category drawer */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Danh mục sản phẩm">
          <div className="absolute inset-0 bg-forest-950/50 backdrop-blur-sm" onClick={() => { setMobileNavOpen(false); setMobileSub(null); }} />
          <aside className="absolute top-0 left-0 h-full w-80 max-w-[85vw] bg-surface-raised flex flex-col shadow-pop">
            <div className="flex items-center justify-between px-4 h-14 border-b border-line">
              <span className="font-extrabold text-ink">Danh mục</span>
              <button
                onClick={() => { setMobileNavOpen(false); setMobileSub(null); }}
                className="w-9 h-9 rounded-control hover:bg-bone-100 grid place-items-center text-ink-soft"
                aria-label="Đóng danh mục"
              >
                <Icon name="X" size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {mobileSub === null ? (
                <div className="space-y-1">
                  <button
                    onClick={() => { setMobileNavOpen(false); navigate('/store'); }}
                    className="flex items-center gap-3 w-full px-3 py-3 rounded-control text-sm font-bold text-ink hover:bg-bone-100"
                  >
                    <Icon name="House" size={18} />
                    Trang chủ
                  </button>
                  {TOP_CATEGORIES.map(c => (
                    <div key={c.key}>
                      <button
                        onClick={() => setMobileSub(c.key)}
                        className="flex items-center justify-between w-full px-3 py-3 rounded-control text-sm font-bold text-ink hover:bg-bone-100"
                        aria-expanded={mobileSub === c.key}
                      >
                        {c.label}
                        <Icon name="CaretRight" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => setMobileSub(null)}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 mb-2"
                  >
                    <Icon name="ArrowLeft" size={16} />
                    Danh mục
                  </button>
                  <p className="text-xs text-ink-faint mb-3">{TOP_CATEGORIES.find(c => c.key === mobileSub)?.sub}</p>
                  <div className="space-y-1">
                    {(CATEGORY_GROUPS[mobileSub] || []).map(g => (
                      <div key={g}>
                        <button
                          onClick={() => { setMobileNavOpen(false); navigate('/store?category=' + encodeURIComponent(mobileSub)); }}
                          className="w-full text-left px-3 py-2.5 rounded-control text-sm font-bold text-ink hover:bg-bone-100"
                        >
                          {g}
                        </button>
                        <div className="pl-4">
                          {(CATEGORY_GROUPS_3[g] || []).slice(0, 3).map(s3 => (
                            <button
                              key={s3}
                              onClick={() => { setMobileNavOpen(false); navigate('/store?category=' + encodeURIComponent(mobileSub)); }}
                              className="block w-full text-left px-3 py-1.5 rounded-control text-[13px] text-ink-soft hover:text-forest-700"
                            >
                              {s3}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Scroll sentinel: above content, drives top-bar collapse */}
      <div ref={sentinelRef} className="h-px" aria-hidden="true" />

      {/* Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 md:py-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-line bg-forest-950 text-bone-50/80">
        <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <BrandMark light />
            <p className="text-sm text-bone-50/60 mt-4 max-w-[26ch]">
              Hệ thống thương mại thực phẩm khô: đồ khô, hạt, trái cây sấy chọn lọc, giao tận nơi.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" onClick={e => e.preventDefault()} className="grid place-items-center w-9 h-9 rounded-full bg-forest-800 hover:bg-forest-700 text-bone-50 transition-colors" aria-label="Facebook">
                <Icon name="FacebookLogo" size={16} />
              </a>
              <a href="#" onClick={e => e.preventDefault()} className="grid place-items-center w-9 h-9 rounded-full bg-forest-800 hover:bg-forest-700 text-bone-50 transition-colors" aria-label="Zalo">
                <Icon name="ChatCircleDots" size={16} />
              </a>
              <a href="#" onClick={e => e.preventDefault()} className="grid place-items-center w-9 h-9 rounded-full bg-forest-800 hover:bg-forest-700 text-bone-50 transition-colors" aria-label="YouTube">
                <Icon name="YoutubeLogo" size={16} />
              </a>
            </div>
          </div>
          {FOOTER_COLS.map(col => (
            <div key={col.title}>
              <h3 className="text-sm font-bold text-bone-50 mb-3">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map(l => (
                  <li key={l.slug}>
                    <button
                      type="button"
                      onClick={e => openInfo(l.slug, e.currentTarget)}
                      className="text-sm text-bone-50/60 hover:text-bone-50 transition-colors text-left"
                    >
                      {l.label}
                    </button>
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
            <span className="inline-flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="CheckCircle" size={14} />
                VNPAY-QR
              </span>
              <span>Tiền mặt khi nhận</span>
              <span>Chuyển khoản</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Floating action buttons: chat moved up to avoid overlap with cart toast */}
      <FloatingButtons />
      <AssistantChat />

      {/* Add-to-cart toast: sits above the floating action stack so nothing overlaps */}
      {lastAdded && (
        <div className="fixed bottom-24 md:bottom-44 left-4 right-4 md:left-auto md:right-24 z-[60] w-auto md:w-80 max-w-[calc(100vw-2rem)] toast-enter" role="status" aria-live="polite">
          <div className="mega-panel p-4">
            <div className="flex items-start gap-3">
              <span className="grid place-items-center w-9 h-9 rounded-full bg-success-bg text-success shrink-0">
                <CheckCircle size={18} weight="bold" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-ink">Đã thêm vào giỏ hàng</p>
                <p className="text-xs text-ink-faint truncate">{lastAdded.name}</p>
              </div>
              <button
                onClick={clearLastAdded}
                className="text-ink-faint hover:text-ink shrink-0"
                aria-label="Đóng thông báo"
              >
                <Icon name="X" size={16} />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { clearLastAdded(); setCartOpen(true); }}
                className="flex-1 rounded-control bg-forest-800 hover:bg-forest-700 text-bone-50 text-sm font-bold py-2 transition-colors"
              >
                Xem giỏ hàng
              </button>
              <button
                onClick={() => { clearLastAdded(); navigate('/store/checkout'); }}
                className="flex-1 rounded-control bg-amber-brand hover:bg-amber-deep text-forest-950 text-sm font-bold py-2 transition-colors"
              >
                Thanh toán
              </button>
            </div>
          </div>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}

/* Floating Zalo / Messenger / back-to-top, kept under the chat so nothing overlaps */
function FloatingButtons() {
  const [showTopBtn, setShowTopBtn] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver !== 'function') return;
    const io = new IntersectionObserver(([entry]) => {
      setShowTopBtn(!entry.isIntersecting);
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="fixed right-4 bottom-24 z-[55] flex flex-col items-end gap-2" aria-label="Liên hệ nhanh">
      {showTopBtn && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fab w-11 h-11 rounded-full bg-forest-800 text-bone-50 grid place-items-center"
          aria-label="Lên đầu trang"
        >
          <Icon name="ArrowUp" size={20} weight="bold" />
        </button>
      )}
      <a href="#" onClick={e => e.preventDefault()} className="fab w-11 h-11 rounded-full bg-forest-700 text-bone-50 grid place-items-center" aria-label="Chat Zalo">
        <Icon name="ChatCircleDots" size={22} />
      </a>
      <a href="#" onClick={e => e.preventDefault()} className="fab w-11 h-11 rounded-full bg-amber-brand text-forest-950 grid place-items-center" aria-label="Chat Messenger">
        <Icon name="FacebookLogo" size={22} />
      </a>
      <div ref={sentinelRef} className="h-px w-px" aria-hidden="true" />
    </div>
  );
}

/* Provider wrapper: makes footer info modals available across the store. */
export default function StoreLayout() {
  return (
    <InfoModalProvider>
      <StoreLayoutInner />
    </InfoModalProvider>
  );
}
