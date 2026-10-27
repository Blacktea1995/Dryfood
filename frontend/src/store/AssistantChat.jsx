import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { fmtVND } from '../utils/format.js';
import { Icon, ChatCircle } from './Ui.jsx';

const QUICK = ['Tìm mì gói', 'Tìm hạt điều', 'Chính sách giao hàng', 'Thanh toán như thế nào?'];

const GREETING = 'Chào bạn! Tôi là trợ lý của DryFood. Tôi có thể tìm sản phẩm, tra cứu đơn hàng (cần đăng nhập) và giải đáp về giao hàng, thanh toán. Bạn muốn hỏi gì?';

export default function AssistantChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'bot', text: GREETING, ts: Date.now() }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, busy, open]);

  async function send(text) {
    const q = (text || input).trim();
    if (!q || busy) return;
    setInput('');
    setError('');
    setMessages(m => [...m, { role: 'user', text: q, ts: Date.now() }]);
    setBusy(true);
    try {
      const res = await api.assistantChat(q);
      setMessages(m => [...m, { role: 'bot', text: res.text, ts: Date.now(), products: res.products || [], order: res.order || null }]);
    } catch (e) {
      setError(e.message || 'Không kết nối được trợ lý.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-5 right-5 z-[60] grid place-items-center w-14 h-14 rounded-full bg-forest-800 hover:bg-forest-700 text-bone-50 shadow-pop transition-all active:scale-95"
        aria-label={open ? 'Đóng trợ lý DryFood' : 'Mở trợ lý DryFood'}
        aria-expanded={open}
      >
        {open ? <Icon name="X" size={24} /> : <ChatCircle size={26} weight="fill" />}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-[60] w-[calc(100vw-2.5rem)] max-w-sm rounded-card bg-surface-raised border border-line shadow-pop overflow-hidden flex flex-col" style={{ height: 'min(560px, calc(100dvh - 7rem))' }}>
          {/* Header */}
          <div className="px-4 py-3 bg-forest-900 text-bone-50 flex items-center gap-2.5">
            <span className="grid place-items-center w-9 h-9 rounded-full bg-amber-brand text-forest-950">
              <ChatCircle size={20} weight="fill" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-bold leading-tight">Trợ lý DryFood</div>
              <div className="text-[11px] text-bone-100/80 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Trực tuyến
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto w-8 h-8 rounded-control hover:bg-bone-50/10 grid place-items-center" aria-label="Đóng trợ lý">
              <Icon name="X" size={18} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-surface">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={m.role === 'user' ? 'max-w-[85%] rounded-card rounded-br-md bg-forest-800 text-bone-50 px-3.5 py-2.5 text-sm' : 'max-w-[85%] rounded-card rounded-bl-md bg-bone-100 text-ink px-3.5 py-2.5 text-sm'}>
                  <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>

                  {/* Product hits */}
                  {m.products?.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {m.products.map(p => (
                        <Link
                          key={p.id}
                          to={`/store/product/${p.id}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-2 rounded-control border border-line bg-surface-raised px-2.5 py-2 hover:border-forest-400 transition-colors"
                        >
                          <span className="grid place-items-center w-9 h-9 rounded-control bg-bone-100 text-ink-faint shrink-0 overflow-hidden">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt="" className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
                            ) : (
                              <Icon name="Package" size={18} />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-semibold text-ink truncate">{p.name}</span>
                            <span className="block text-[11px] text-ink-faint">{p.stock > 0 ? `Còn ${p.stock} ${p.unit}` : 'Hết hàng'}</span>
                          </span>
                          <span className="text-xs font-bold text-forest-800 tabular">{fmtVND(p.price)} ₫</span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Order hit */}
                  {m.order && (
                    <div className="mt-2 rounded-control border border-line bg-surface-raised px-2.5 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-ink truncate">{m.order.orderCode}</span>
                        <span className="text-[11px] font-semibold text-forest-700">{m.order.statusLabel}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-ink-faint">
                        {m.order.itemCount} món · {fmtVND(m.order.totalAmount)} ₫
                      </div>
                      <div className="mt-1.5">
                        <Link to="/store/orders" onClick={() => setOpen(false)} className="inline-flex items-center gap-1 text-[11px] font-bold text-forest-800 hover:underline">
                          Xem chi tiết <Icon name="ArrowRight" size={12} />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {busy && (
              <div className="flex justify-start">
                <div className="rounded-card rounded-bl-md bg-bone-100 px-3.5 py-2.5 inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-forest-700 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-forest-600 animate-bounce [animation-delay:120ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-forest-500 animate-bounce [animation-delay:240ms]" />
                  <span className="sr-only">Trợ lý đang trả lời</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick prompts */}
          <div className="px-4 pb-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {QUICK.map(q => (
              <button
                key={q}
                onClick={() => send(q)}
                disabled={busy}
                className="shrink-0 rounded-full border border-line-strong bg-surface px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-forest-400 hover:text-forest-800 disabled:opacity-50 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={e => { e.preventDefault(); send(); }}
            className="px-3 pb-3 flex items-center gap-2"
          >
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Nhập câu hỏi..."
              className="flex-1 min-w-0 px-3 py-2.5 rounded-control border border-line-strong bg-surface text-ink text-sm placeholder:text-ink-faint focus:ring-2 focus:ring-forest-500 focus:outline-none"
              aria-label="Câu hỏi cho trợ lý"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="grid place-items-center w-10 h-10 shrink-0 rounded-control bg-forest-800 hover:bg-forest-700 text-bone-50 disabled:opacity-40 transition-colors"
              aria-label="Gửi"
            >
              <Icon name="ArrowRight" size={18} weight="bold" />
            </button>
          </form>

          {error && <p className="px-4 pb-1 text-xs text-rose-600">{error}</p>}
        </div>
      )}
    </>
  );
}