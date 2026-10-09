import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCartSimple, UserCircle, Package, MapPin, NotePencil, Tag, ArrowLeft, ArrowRight, Plus, Minus, X, Star, CheckCircle, WarningCircle, Info, CaretRight } from '@phosphor-icons/react';

/* Phosphor icon set — one family, consistent stroke, one size scale */
export { CheckCircle };

export function Icon({ name, size = 18, weight = 'regular' }) {
  const Icons = { ShoppingCartSimple, UserCircle, Package, MapPin, NotePencil, Tag, ArrowLeft, ArrowRight, Plus, Minus, X, Star, CheckCircle, WarningCircle, Info, CaretRight };
  const C = Icons[name];
  if (!C) return null;
  return <C size={size} weight={weight} aria-hidden="true" />;
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

/* Mark: drawn mark (not emoji) + wordmark */
export function BrandMark({ className = '' }) {
  return (
    <span className={'inline-flex items-center gap-2 ' + className}>
      <span className="relative grid place-items-center w-9 h-9 rounded-xl bg-forest-800 text-bone-50">
        <span aria-hidden="true" className="text-lg leading-none font-extrabold">D</span>
        <span aria-hidden="true" className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-brand" />
      </span>
      <span className="leading-tight">
        <span className="block font-extrabold text-[17px] tracking-tight text-ink">DryFood</span>
        <span className="block text-[10px] uppercase tracking-[0.16em] text-ink-faint">Thực phẩm khô</span>
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
export function BackLink({ to = '/store', children = 'Quay lại cửa hàng' }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-forest-800 transition-colors">
      <Icon name="ArrowLeft" size={16} />
      {children}
    </Link>
  );
}

/* Consistent page heading */
export function PageHeading({ title, sub }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-ink">{title}</h1>
      {sub && <p className="mt-1 text-sm text-ink-faint">{sub}</p>}
    </div>
  );
}
