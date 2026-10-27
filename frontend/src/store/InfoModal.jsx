import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Icon } from './Ui.jsx';
import { FOOTER_CONTENT } from './footerContent.js';

const InfoModalContext = createContext(null);

export function useInfoModal() {
  return useContext(InfoModalContext);
}

/** Renders a single text/list/faq/links section inside the modal. */
function SectionBlock({ s }) {
  return (
    <div className="space-y-2">
      {s.h && <h3 className="font-bold text-ink text-sm">{s.h}</h3>}
      {s.p && <p className="text-sm text-ink-soft leading-relaxed">{s.p}</p>}
      {s.to && <InlineNavLink to={s.to} label={s.toLabel} />}
      {s.list && (
        <ul className="space-y-1.5">
          {s.list.map((li, i) => (
            <li key={i} className="text-sm text-ink-soft leading-relaxed flex gap-2">
              <span className="text-forest-700 shrink-0" aria-hidden="true">•</span>
              <span>{li}</span>
            </li>
          ))}
        </ul>
      )}
      {s.steps && (
        <ol className="space-y-1.5">
          {s.steps.map((st, i) => (
            <li key={i} className="text-sm text-ink-soft leading-relaxed flex gap-2.5">
              <span className="grid place-items-center w-5 h-5 rounded-full bg-forest-100 text-forest-800 text-[11px] font-bold shrink-0 tabular">{i + 1}</span>
              <span>{st}</span>
            </li>
          ))}
        </ol>
      )}
      {s.links && (
        <ul className="space-y-1">
          {s.links.map(ln => (
            <li key={ln.slug}>
              <InfoLink slug={ln.slug} label={ln.label} />
            </li>
          ))}
        </ul>
      )}
      {s.faqs && <FaqList faqs={s.faqs} />}
    </div>
  );
}

/* One open at a time, pure state + CSS (no library). */
function FaqList({ faqs }) {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <div className="divide-y divide-line border-t border-line">
      {faqs.map((f, i) => (
        <div key={i}>
          <button
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            aria-expanded={openIdx === i}
            className="flex items-center justify-between gap-3 w-full text-left py-3 text-sm font-semibold text-ink hover:text-forest-700 transition-colors"
          >
            {f.q}
            <Icon name={openIdx === i ? 'Minus' : 'Plus'} size={16} className="text-forest-700 shrink-0" />
          </button>
          {openIdx === i && (
            <p className="pb-3 text-sm text-ink-soft leading-relaxed -mt-1">{f.a}</p>
          )}
        </div>
      ))}
    </div>
  );
}

/* In-modal switch to another section without closing/reopening. */
function InfoLink({ slug, label }) {
  const { open } = useInfoModal();
  return (
    <button
      onClick={() => open(slug)}
      className="inline-flex items-center gap-1.5 text-sm font-bold text-forest-700 hover:text-amber-deep transition-colors"
    >
      {label}
      <Icon name="CaretRight" size={14} />
    </button>
  );
}

/* Router link that navigates and closes the modal (e.g. "Đơn của tôi"). */
function InlineNavLink({ to, label }) {
  const { close } = useInfoModal();
  return (
    <Link
      to={to}
      onClick={close}
      className="inline-flex items-center gap-1.5 rounded-control bg-forest-800 hover:bg-forest-700 text-bone-50 text-sm font-bold px-4 py-2 transition-colors"
    >
      {label}
      <Icon name="ArrowRight" size={14} weight="bold" />
    </Link>
  );
}

export function InfoModalProvider({ children }) {
  const [slug, setSlug] = useState(null);
  const [searchParams] = useSearchParams();
  const panelRef = useRef(null);
  const returnFocusRef = useRef(null);

  const content = slug ? FOOTER_CONTENT[slug] : null;

  function open(nextSlug, triggerEl) {
    if (!FOOTER_CONTENT[nextSlug]) return; // invalid slug ignored
    returnFocusRef.current = triggerEl || null;
    setSlug(nextSlug);
  }

  function close() {
    setSlug(null);
    // Return focus to the element that opened the modal
    requestAnimationFrame(() => {
      returnFocusRef.current?.focus?.();
    });
  }

  // Sync ?info=slug -> modal (replaceState, no history entry)
  useEffect(() => {
    const info = searchParams.get('info');
    if (info && FOOTER_CONTENT[info]) {
      setSlug(info);
    }
  }, [searchParams]);

  // Update the URL query without pushing history while the modal is open
  useEffect(() => {
    if (!slug) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('info') !== slug) {
      url.searchParams.set('info', slug);
      window.history.replaceState(null, '', url.toString());
    }
    return () => {
      const u = new URL(window.location.href);
      if (u.searchParams.get('info')) {
        u.searchParams.delete('info');
        window.history.replaceState(null, '', u.toString());
      }
    };
  }, [slug]);

  // Body scroll lock + focus trap + Esc
  useEffect(() => {
    if (!slug) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const panel = panelRef.current;
    const focusables = () => panel
      ? Array.from(panel.querySelectorAll('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      : [];

    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setSlug(null);
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const els = focusables();
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKey);
    // Move focus into the panel when opened
    requestAnimationFrame(() => panel?.focus?.());
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [slug]);

  const value = useMemo(() => ({ open, close, slug, content }), [slug, content]);

  return (
    <InfoModalContext.Provider value={value}>
      {children}
      {slug && content && (
        <InfoModalShell
          title={content.title}
          onClose={() => { setSlug(null); requestAnimationFrame(() => returnFocusRef.current?.focus?.()); }}
          panelRef={panelRef}
        >
          <p className="text-sm text-ink-soft leading-relaxed">{content.intro}</p>
          <div className="space-y-5 mt-4">
            {content.sections.map((s, i) => (
              <SectionBlock key={i} s={s} />
            ))}
          </div>
        </InfoModalShell>
      )}
    </InfoModalContext.Provider>
  );
}

function InfoModalShell({ title, onClose, panelRef, children }) {
  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby="info-modal-title" ref={panelRef} tabIndex={-1}>
      {/* Overlay: click to close */}
      <div
        className="absolute inset-0 bg-forest-950/60 backdrop-blur-sm modal-fade"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel: desktop centered card, mobile bottom sheet */}
      <div
        className="absolute inset-x-0 bottom-0 sm:inset-x-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:bottom-auto sm:max-w-[720px] sm:w-[92vw] max-h-[85dvh] bg-surface-raised rounded-t-card sm:rounded-card shadow-pop flex flex-col modal-slide"
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-line shrink-0">
          <h2 id="info-modal-title" className="display text-lg text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-control hover:bg-bone-100 grid place-items-center text-ink-soft transition-colors"
            aria-label="Đóng"
          >
            <Icon name="X" size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
