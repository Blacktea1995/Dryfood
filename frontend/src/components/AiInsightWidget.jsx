import React, { useEffect, useState } from 'react';
import { Sparkle, X, CheckCircle, WarningCircle, Info, Clock } from '@phosphor-icons/react';

/** Box thong bao goc duoi ben phai: alert/anomaly/recommendation cua AI.
 *  Mac dinh thu gon; bam vao moi mo panel. Badge = so canh bao chua doc. */
export default function AiInsightWidget({ snapshot, loading, onOpenChange }) {
  const [open, setOpen] = useState(false);
  const [readAt, setReadAt] = useState(null);

  const payload = snapshot?.payload || null;
  const anomalies = (payload?.anomalies || []).filter(Boolean);
  const recommendations = (payload?.recommendations || []).filter(Boolean);
  const createdAt = snapshot?.createdAt || payload?.created_at || null;

  // Neu snapshot moi hon readAt -> co canh bao chua doc
  const hasUnread = anomalies.length > 0 && createdAt && readAt !== createdAt;
  const unreadCount = anomalies.length;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && createdAt) setReadAt(createdAt);
    if (onOpenChange) onOpenChange(next);
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        setOpen(false);
        if (onOpenChange) onOpenChange(false);
      }
    }
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  const levelStyle = {
    critical: { icon: WarningCircle, cls: 'text-rose-600', chip: 'bg-rose-100 text-rose-700', label: 'Nghiêm trọng' },
    warning: { icon: Info, cls: 'text-amber-deep', chip: 'bg-amber-brand/15 text-amber-deep', label: 'Cảnh báo' },
    info: { icon: CheckCircle, cls: 'text-forest-700', chip: 'bg-forest-100 text-forest-800', label: 'Thông tin' }
  };
  const prioStyle = {
    high: 'bg-rose-100 text-rose-700',
    medium: 'bg-amber-brand/15 text-amber-deep',
    low: 'bg-forest-100 text-forest-800'
  };
  const prioLabel = { high: 'Ưu tiên cao', medium: 'Ưu tiên vừa', low: 'Ưu tiên thấp' };

  return (
    <>
      {/* Nut tron goc phai */}
      <button
        onClick={toggle}
        className="fixed bottom-5 right-5 z-50 grid place-items-center w-13 h-13 rounded-full bg-forest-800 hover:bg-forest-700 text-bone-50 shadow-pop transition-all active:scale-95"
        style={{ width: 52, height: 52 }}
        aria-label={open ? 'Đóng thông báo AI' : 'Mở thông báo AI'}
        aria-expanded={open}
      >
        <Sparkle size={24} weight="fill" className="text-amber-brand" />
        {hasUnread && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full bg-rose-600 text-white text-[11px] font-bold grid place-items-center tabular">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-20 right-5 z-50 w-[min(360px,calc(100vw-2.5rem))] max-h-[70dvh] rounded-card bg-surface-raised border border-line shadow-pop overflow-hidden flex flex-col"
          role="dialog"
          aria-label="Thông báo & khuyến nghị từ AI"
        >
          <div className="px-4 py-3 bg-forest-900 text-bone-50 flex items-center gap-2.5">
            <span className="grid place-items-center w-9 h-9 rounded-full bg-amber-brand text-forest-950 shrink-0">
              <Sparkle size={18} weight="fill" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-bold leading-tight">Thông báo &amp; khuyến nghị</div>
              <div className="text-[11px] text-bone-100/80 truncate">
                {createdAt ? `Cập nhật lúc ${new Date(createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : 'Chưa có dữ liệu'}
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto w-8 h-8 rounded-control hover:bg-bone-50/10 grid place-items-center shrink-0" aria-label="Đóng">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {loading ? (
              <p className="text-sm text-ink-faint animate-pulse">Đang tải phân tích...</p>
            ) : !payload ? (
              <p className="text-sm text-ink-faint">Chưa có dữ liệu. Nhấn "Phân tích lại" ở dashboard để tạo bản phân tích.</p>
            ) : (
              <>
                {payload.summary && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-ink-faint mb-1">Tóm tắt</h3>
                    <p className="text-sm leading-relaxed text-ink">{payload.summary}</p>
                  </div>
                )}

                {anomalies.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-ink-faint mb-2">Cảnh báo ({anomalies.length})</h3>
                    <ul className="space-y-2">
                      {anomalies.map((a, i) => {
                        const s = levelStyle[a.level] || levelStyle.info;
                        const Icon = s.icon;
                        return (
                          <li key={i} className="flex gap-2.5 rounded-control border border-line p-2.5">
                            <Icon size={18} className={`shrink-0 mt-0.5 ${s.cls}`} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-ink">{a.title}</span>
                                <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${s.chip}`}>{s.label}</span>
                              </div>
                              {a.detail && <p className="text-xs text-ink-soft mt-0.5">{a.detail}</p>}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {recommendations.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-ink-faint mb-2">Khuyến nghị hành động</h3>
                    <ul className="space-y-2">
                      {recommendations.map((r, i) => (
                        <li key={i} className="rounded-control border border-line p-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${prioStyle[r.priority] || prioStyle.low}`}>
                              {prioLabel[r.priority] || r.priority}
                            </span>
                            <span className="text-sm font-bold text-ink">{r.title}</span>
                          </div>
                          {r.detail && <p className="text-xs text-ink-soft mt-1">{r.detail}</p>}
                          {r.expected_impact && (
                            <p className="text-xs text-forest-700 mt-1 inline-flex items-center gap-1">
                              <CheckCircle size={12} /> Kỳ vọng: {r.expected_impact}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-[11px] text-ink-faint inline-flex items-start gap-1">
                  <Clock size={12} className="mt-0.5 shrink-0" />
                  Nhận xét do AI tạo, có thể chưa chính xác.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}