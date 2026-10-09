import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCartSimple, UserCircle, Package, MapPin, NotePencil, Tag, ArrowLeft, ArrowRight,
  Plus, Minus, X, Star, CheckCircle, WarningCircle, Info, CaretRight, MagnifyingGlass,
  Truck, ShieldCheck, Clock, Leaf, Storefront, List, Basket, Bank, TrendUp, TrendDown,
  Users, Receipt, Percent, ChartLineUp, Export, PencilSimple, Trash, Image
} from '@phosphor-icons/react';

/* Phosphor icon set: one family, consistent stroke, one size scale */
export { CheckCircle, WarningCircle, MagnifyingGlass, Truck, ShieldCheck, Clock, Leaf, Storefront, List, Basket, Bank, TrendUp, TrendDown, Users, Receipt, Percent, ChartLineUp, Export, PencilSimple, Trash, Image };

export function Icon({ name, size = 18, weight = 'regular', className = '' }) {
  const Icons = {
    ShoppingCartSimple, UserCircle, Package, MapPin, NotePencil, Tag, ArrowLeft, ArrowRight,
    Plus, Minus, X, Star, CheckCircle, WarningCircle, Info, CaretRight, MagnifyingGlass,
    Truck, ShieldCheck, Clock, Leaf, Storefront, List, Basket, Bank, TrendUp, TrendDown,
    Users, Receipt, Percent, ChartLineUp, Export, PencilSimple, Trash, Image
  };
  const C = Icons[name];
  if (!C) return null;
  return <C size={size} weight={weight} className={className} aria-hidden="true" />;
}

/* Small rating display using drawn stars, not emoji */
export function Stars({ value, max = 5, size = 16, className = '' }) {
  const rounded = Math.round(value);
  return (
    <span className={'inline-flex items-center gap-0.5 ' + className} role="img" aria-label={`${value}/5 sao`}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={size}
          weight={i < rounded ? 'fill' : 'regular'}
          className={i < rounded ? 'text-amber-brand' : 'text-line-strong'}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

/* Mark: drawn leaf mark (SVG geometry, no emoji) + wordmark */
export function BrandMark({ className = '', light = false }) {
  return (
    <span className={'inline-flex items-center gap-2.5 ' + className}>
      <span className="relative grid place-items-center w-9 h-9 rounded-xl bg-forest-800 text-bone-50 shrink-0">
        {/* Leaf mark: crisp vector geometry */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 21c0-6 0-9-4.5-13C6 6.5 6 4 12 3c6 1 6 3.5 4.5 5C14 10.5 12 11 12 15"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M12 21V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span aria-hidden="true" className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-brand" />
      </span>
      <span className="leading-tight">
        <span className={`block font-extrabold text-[17px] tracking-tight ${light ? 'text-bone-50' : 'text-ink'}`}>
          DryFood
        </span>
        <span className={`block text-[10px] uppercase tracking-[0.16em] ${light ? 'text-bone-50/60' : 'text-ink-faint'}`}>
          Thực phẩm khô
        </span>
      </span>
    </span>
  );
}

/* Primary / secondary buttons with tactile states and one-line labels */
export function BtnPrimary({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={
        'inline-flex items-center justify-center gap-2 rounded-control bg-forest-800 text-bone-50 font-bold text-sm ' +
        'px-5 py-3 transition-all hover:bg-forest-700 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ' +
        className
      }
    >
      {children}
    </button>
  );
}

export function BtnGhost({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={
        'inline-flex items-center justify-center gap-2 rounded-control border border-line-strong bg-transparent ' +
        'text-ink font-semibold text-sm px-5 py-3 transition-all hover:border-forest-400 hover:text-forest-800 ' +
        'active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ' +
        className
      }
    >
      {children}
    </button>
  );
}

/* Back link used across store pages */
export function BackLink({ to = '/store', children = 'Quay lại cửa hàng', className = '' }) {
  return (
    <Link to={to} className={'inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-forest-800 transition-colors ' + className}>
      <Icon name="ArrowLeft" size={16} />
      {children}
    </Link>
  );
}

/* Consistent page heading */
export function PageHeading({ title, sub }) {
  return (
    <div className="mb-8">
      <h1 className="display text-2xl md:text-3xl text-ink">{title}</h1>
      {sub && <p className="mt-2 text-sm text-ink-faint max-w-[65ch]">{sub}</p>}
    </div>
  );
}

/* Section heading with one consistent rhythm (no eyebrow spam: use sparingly) */
export function SectionHeading({ title, sub, action, className = '' }) {
  return (
    <div className={'flex items-end justify-between gap-4 mb-6 ' + className}>
      <div>
        <h2 className="display text-xl md:text-2xl text-ink">{title}</h2>
        {sub && <p className="mt-1.5 text-sm text-ink-faint max-w-[65ch]">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* Category chip: active / inactive pill for filters */
export function CategoryChip({ active, children, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={
        'px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-[0.97] whitespace-nowrap ' +
        (active
          ? 'bg-forest-800 text-bone-50 shadow-lift'
          : 'bg-bone-100 text-ink-soft hover:bg-bone-200 hover:text-ink') +
        ' ' + className
      }
    >
      {children}
    </button>
  );
}

/* Beautifully composed empty state (no bare text) */
export function EmptyState({ icon = 'Package', title = 'Không có dữ liệu', sub, action }) {
  return (
    <div className="text-center py-20 px-6">
      <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-forest-100 grid place-items-center">
        <Icon name={icon} size={30} className="text-forest-700" />
      </div>
      <p className="font-bold text-ink">{title}</p>
      {sub && <p className="text-sm text-ink-faint mt-1 max-w-sm mx-auto">{sub}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* Product card: the bread-and-butter of a selling storefront.
   Image, category, name, rating, price, stock state, add-to-cart. */
export function ProductCard({ product, onAdd, added = false, fallbackImg }) {
  const out = product.stock <= 0;
  const low = product.stock > 0 && product.stock <= 10;
  const img = product.imageUrl || fallbackImg(product.name);

  return (
    <article className="group relative rounded-card border border-line bg-surface-raised overflow-hidden hover:shadow-lift hover:border-line-strong transition-all flex flex-col">
      <Link to={`/store/product/${product.id}`} className="block relative aspect-square bg-bone-100 overflow-hidden" aria-label={product.name}>
        <img
          src={img}
          alt={product.name}
          loading="lazy"
          className="img-zoom w-full h-full object-cover"
          onError={e => { e.currentTarget.src = fallbackImg(product.name); }}
        />
        {/* Stock ribbon (real semantic state, one per card) */}
        {out ? (
          <span className="absolute top-2 left-2 rounded-full bg-forest-950/85 text-bone-50 px-2.5 py-1 text-[11px] font-bold">
            Hết hàng
          </span>
        ) : (
          low && (
            <span className="absolute top-2 left-2 rounded-full bg-amber-brand text-forest-950 px-2.5 py-1 text-[11px] font-bold">
              Còn {product.stock} {product.unit}
            </span>
          )
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1 gap-1">
        <div className="text-[11px] uppercase tracking-[0.12em] text-ink-faint">{product.category || 'Thực phẩm khô'}</div>
        <Link to={`/store/product/${product.id}`} className="block">
          <h3 className="font-bold text-ink text-sm leading-snug line-clamp-2 group-hover:text-forest-700 transition-colors">
            {product.name}
          </h3>
        </Link>

        {product.avgRating > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-faint">
            <Stars value={product.avgRating} size={13} />
            <span className="tabular">{product.avgRating.toFixed(1)}</span>
          </span>
        ) : (
          <span className="text-xs text-ink-faint">Chưa có đánh giá</span>
        )}

        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-lg font-extrabold text-forest-800 tabular">{fmtVNDLocal(product.price)}</span>
          <span className="text-xs text-ink-faint">₫ / {product.unit}</span>
        </div>

        <button
          onClick={() => onAdd(product)}
          disabled={out}
          aria-label={out ? 'Hết hàng' : `Thêm ${product.name} vào giỏ`}
          className={`mt-3 w-full py-2.5 rounded-control text-sm font-bold transition-all active:scale-[0.98] ${
            out
              ? 'bg-bone-100 text-ink-faint cursor-not-allowed'
              : added
                ? 'bg-forest-500 text-white'
                : 'bg-forest-800 hover:bg-forest-700 text-bone-50'
          }`}
        >
          <span className="inline-flex items-center gap-1.5 justify-center">
            {added ? (
              <>
                <CheckCircle size={16} weight="bold" />
                Đã thêm
              </>
            ) : out ? (
              'Hết hàng'
            ) : (
              <>
                <Plus size={16} weight="bold" />
                Thêm vào giỏ
              </>
            )}
          </span>
        </button>
      </div>
    </article>
  );
}

function fmtVNDLocal(v) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(v);
}
