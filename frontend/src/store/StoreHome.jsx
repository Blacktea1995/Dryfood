import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useCart } from './CartContext.jsx';
import { Icon, ProductCard, CategoryChip, EmptyState, SectionHeading } from './Ui.jsx';
import HeroCarousel from './sections/HeroCarousel.jsx';
import {
  UspsStrip, CategoryIconRow, BannerStrip, MiniBanners,
  NewsSection, StoreLocatorSection
} from './sections/Sections.jsx';
import { TOP_CATEGORIES } from './categories.js';
import {
  SECTION_GAP, PAGE_SIZE, CAROUSEL_LIMIT, HOME_CATEGORY_BLOCKS, SORT_OPTIONS
} from './siteConfig.js';

const CATEGORY_ORDER = ['Mi - bun', 'Thit', 'Hai san', 'Hat - an vat', 'Trai cay kho', 'Rau cu', 'Gia vi', 'Banh keo'];

export default function StoreHome() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [shown, setShown] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addItem } = useCart();
  const [addedId, setAddedId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    setQ(searchParams.get('q') || '');
    setCategory(searchParams.get('category') || '');
  }, [searchParams]);

  useEffect(() => {
    load();
  }, [q]);

  async function load() {
    try {
      setError('');
      setLoading(true);
      const data = await api.getProducts(q);
      setProducts(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach(p => { if (p.category) set.add(p.category); });
    // Keep the shop's own category order where possible
    return [...set].sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a);
      const ib = CATEGORY_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }, [products]);

  const countsByCategory = useMemo(() => {
    const m = {};
    products.forEach(p => { if (p.category) m[p.category] = (m[p.category] || 0) + 1; });
    return m;
  }, [products]);

  const topCategories = useMemo(() => {
    return [...categories]
      .sort((a, b) => (countsByCategory[b] || 0) - (countsByCategory[a] || 0))
      .slice(0, HOME_CATEGORY_BLOCKS);
  }, [categories, countsByCategory]);

  function sortList(list) {
    const arr = [...list];
    if (sort === 'price-asc') arr.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') arr.sort((a, b) => b.price - a.price);
    else arr.sort((a, b) => (b.id || 0) - (a.id || 0)); // newest by id (no createdAt in API)
    return arr;
  }

  const filtered = useMemo(() => {
    const base = category ? products.filter(p => p.category === category) : products;
    return sortList(base);
  }, [products, category, sort]);

  const visible = filtered.slice(0, shown);

  function pickCategory(cat) {
    setCategory(cat);
    setShown(PAGE_SIZE);
    const next = new URLSearchParams(searchParams);
    if (cat) next.set('category', cat); else next.delete('category');
    setSearchParams(next, { replace: true });
  }

  function onSearch(value) {
    setQ(value);
    setShown(PAGE_SIZE);
    const next = new URLSearchParams(searchParams);
    if (value) next.set('q', value); else next.delete('q');
    setSearchParams(next, { replace: true });
  }

  function clearFilters() {
    setQ('');
    setCategory('');
    setShown(PAGE_SIZE);
    setSearchParams({}, { replace: true });
  }

  function handleAdd(product) {
    if (product.stock <= 0) return;
    addItem(product, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  }

  const isFiltered = !!q || !!category;

  return (
    <div className={SECTION_GAP}>
      {/* Hero + mini banners */}
      <HeroCarousel />
      <MiniBanners />

      {/* USP strip: one scrollable row on mobile */}
      <UspsStrip />

      {/* Category icon rail */}
      <CategoryIconRow categories={categories} counts={countsByCategory} onPick={pickCategory} />

      {/* Curated category carousels: hidden while filtering so results lead */}
      {!isFiltered && (
        <div className="bg-surface-raised rounded-card border border-line p-4 md:p-6 space-y-8">
          {topCategories.map(key => {
            const meta = TOP_CATEGORIES.find(c => c.key === key);
            const items = sortList(products.filter(p => p.category === key)).slice(0, CAROUSEL_LIMIT);
            if (items.length === 0) return null;
            return (
              <section key={key} aria-label={meta?.label || key}>
                <SectionHeading
                  title={meta?.label || key}
                  sub={meta?.sub}
                  action={
                    <Link
                      to={`/store?category=${encodeURIComponent(key)}`}
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-forest-700 hover:text-amber-deep transition-colors shrink-0"
                    >
                      Xem tất cả
                      <Icon name="ArrowRight" size={14} weight="bold" />
                    </Link>
                  }
                />
                <div className="snap-row -mx-1 px-1">
                  {items.map(p => (
                    <div key={p.id} className="snap-item w-[46%] sm:w-[31%] lg:w-[23.5%]">
                      <ProductCard product={p} onAdd={handleAdd} added={addedId === p.id} />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Mid-page banner */}
      {!isFiltered && <BannerStrip />}

      {/* Main shop area */}
      <section id="san-pham" aria-label="Tất cả sản phẩm">
        <div className="shop-toolbar -mx-4 px-4 py-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none">
                <Icon name="MagnifyingGlass" size={16} />
              </span>
              <input
                value={q}
                onChange={e => onSearch(e.target.value)}
                placeholder="Tìm sản phẩm..."
                aria-label="Tìm sản phẩm"
                className="w-full pl-9 pr-3 py-2 rounded-control border border-line-strong bg-surface-raised text-ink text-sm placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <label className="shrink-0 inline-flex items-center gap-1.5">
              <span className="sr-only">Sắp xếp</span>
              <Icon name="SortAscending" size={16} className="text-ink-faint" />
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                aria-label="Sắp xếp sản phẩm"
                className="rounded-control border border-line-strong bg-surface-raised text-ink text-sm font-semibold py-2 pl-2 pr-7 focus:outline-none focus:ring-2 focus:ring-forest-500"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar" role="group" aria-label="Chọn danh mục">
            <CategoryChip active={!category} onClick={() => pickCategory('')}>Tất cả</CategoryChip>
            {categories.map(c => (
              <CategoryChip key={c} active={category === c} onClick={() => pickCategory(c)}>
                {c}
              </CategoryChip>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mt-4 mb-4">
          <h2 className="display text-xl md:text-2xl text-ink">
            {category || 'Tất cả sản phẩm'}
          </h2>
          {!loading && (
            <span className="text-xs text-ink-soft tabular shrink-0">
              Đang xem {visible.length} / {filtered.length} sản phẩm
            </span>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-control border border-rose-200 bg-rose-50 text-rose-700 p-4 text-sm mb-4">
            <Icon name="WarningCircle" size={20} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" aria-busy="true" aria-label="Đang tải sản phẩm">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="rounded-card border border-line bg-surface-raised overflow-hidden">
                <div className="aspect-square bg-bone-100 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-3 w-1/3 bg-bone-200 rounded" />
                  <div className="h-4 w-4/5 bg-bone-200 rounded" />
                  <div className="h-4 w-2/5 bg-bone-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="Package"
            title="Không tìm thấy sản phẩm"
            sub="Thử từ khoá khác hoặc bỏ bộ lọc danh mục nhé."
            action={
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 rounded-control bg-forest-800 hover:bg-forest-700 text-bone-50 px-5 py-2.5 text-sm font-bold transition-colors"
              >
                Xóa bộ lọc
              </button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {visible.map(p => (
                <ProductCard key={p.id} product={p} onAdd={handleAdd} added={addedId === p.id} />
              ))}
            </div>
            {filtered.length > shown && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setShown(s => s + PAGE_SIZE)}
                  className="inline-flex items-center gap-2 rounded-control border border-line-strong bg-surface-raised hover:border-forest-400 hover:text-forest-800 text-ink font-bold text-sm px-6 py-3 transition-colors"
                >
                  Xem thêm {Math.min(PAGE_SIZE, filtered.length - shown)} sản phẩm
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* News + store locator */}
      <NewsSection />
      <StoreLocatorSection />
    </div>
  );
}
