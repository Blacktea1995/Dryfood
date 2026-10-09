import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import StatusBadge, { LABELS } from '../components/StatusBadge.jsx';
import Modal from '../components/Modal.jsx';
import { fmtVND, fmtDateTime } from '../utils/format.js';
import { Icon } from './Ui.jsx';

const FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ xác nhận' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'SHIPPING', label: 'Đang giao' },
  { value: 'DELIVERED', label: 'Đã giao' },
  { value: 'CANCELLED', label: 'Đã huỷ' }
];

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    load();
  }, [filter]);

  async function load() {
    try {
      setError('');
      setLoading(true);
      const data = await api.getOrders(filter);
      setOrders(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(order) {
    try {
      const data = await api.getOrder(order.id);
      const tl = await api.getOrderTimeline(order.id).catch(() => []);
      setDetail(data);
      setTimeline(tl);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-ink">Đơn hàng của tôi</h1>
        <p className="text-sm text-ink-faint mt-1">{orders.length} đơn hàng</p>
      </div>

      {/* Filter */}
      <div className="bg-surface-raised rounded-card border border-line p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-ink-soft font-medium mr-1">Lọc:</span>
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-control text-xs font-bold transition-colors ${filter === f.value ? 'bg-forest-800 text-bone-50' : 'bg-bone-100 text-ink-soft hover:bg-bone-200'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="flex items-center gap-2 rounded-control border border-rose-200 bg-rose-50 text-rose-700 p-4 text-sm">
        <Icon name="WarningCircle" size={18} />{error}
      </div>}

      <div className="bg-surface-raised rounded-card border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bone-100/60 text-ink-soft text-left">
                <th className="px-4 py-3 font-semibold">Mã đơn</th>
                <th className="px-4 py-3 font-semibold">Sản phẩm</th>
                <th className="px-4 py-3 font-semibold text-right">Tổng tiền</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                <th className="px-4 py-3 font-semibold">Ngày đặt</th>
                <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const itemCount = (o.items || []).reduce((s, it) => s + it.quantity, 0);
                const itemNames = (o.items || []).slice(0, 2).map(it => it.productName).join(', ');
                return (
                  <tr key={o.id} className="border-t border-line hover:bg-bone-50/60">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-ink tabular">{o.orderCode}</td>
                    <td className="px-4 py-3 text-ink-soft max-w-[240px]">
                      <span className="block truncate">{itemNames || '—'}</span>
                      <span className="text-xs text-ink-faint">{itemCount} sản phẩm</span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-ink tabular">{fmtVND(o.totalAmount)} ₫</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-ink-soft text-xs">{fmtDateTime(o.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          onClick={() => openDetail(o)}
                          className="px-3 py-1.5 rounded-control text-xs font-semibold bg-bone-100 hover:bg-bone-200 text-ink"
                        >
                          Chi tiết
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-ink-faint py-10">
                    Chưa có đơn hàng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      <Modal open={detail !== null} onClose={() => setDetail(null)} title={`Đơn hàng ${detail?.orderCode || ''}`} width="max-w-xl">
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-faint">Giao tới</p>
                <p className="font-semibold text-ink">{detail.customer?.name}</p>
                <p className="text-xs text-ink-faint">{detail.customer?.phone} · {detail.customer?.email}</p>
                {detail.customer?.address && <p className="text-xs text-ink-faint">{detail.customer.address}</p>}
              </div>
              <StatusBadge status={detail.status} />
            </div>

            <div className="border-t border-line pt-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-ink-faint text-xs">
                    <th className="text-left py-1 font-semibold">Sản phẩm</th>
                    <th className="text-right py-1 font-semibold">SL</th>
                    <th className="text-right py-1 font-semibold">Đơn giá</th>
                    <th className="text-right py-1 font-semibold">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {(detail.items || []).map((it, i) => (
                    <tr key={i} className="border-t border-line-soft">
                      <td className="py-2 text-ink">{it.productName}</td>
                      <td className="py-2 text-right text-ink-soft tabular">{it.quantity}</td>
                      <td className="py-2 text-right text-ink-soft tabular">{fmtVND(it.price)}₫</td>
                      <td className="py-2 text-right font-semibold text-ink tabular">{fmtVND(it.subtotal)}₫</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between bg-bone-100 rounded-control px-4 py-3">
              <span className="text-sm text-ink-soft">Tổng cộng</span>
              <span className="text-lg font-bold text-ink tabular">{fmtVND(detail.totalAmount)} ₫</span>
            </div>

            {detail.discountAmount > 0 && (
              <div className="flex items-center justify-between text-sm px-1">
                <span className="text-emerald-700">Giảm giá {detail.voucherCode ? `(${detail.voucherCode})` : ''}</span>
                <span className="text-emerald-700 font-semibold tabular">−{fmtVND(detail.discountAmount)} ₫</span>
              </div>
            )}

            <div className="text-sm text-ink-soft flex items-center gap-1.5">
              <Icon name="Info" size={16} />
              <span>Thanh toán:</span>
              <b className="text-ink">{detail.paymentMethod === 'TRANSFER' ? 'Chuyển khoản' : 'Khi nhận hàng (COD)'}</b>
            </div>

            {/* Timeline */}
            <div className="border-t border-line pt-3">
              <p className="text-sm font-semibold text-ink mb-2">Tiến trình đơn hàng</p>
              {timeline.length === 0 ? (
                <p className="text-xs text-ink-faint">Chưa có dữ liệu tiến trình</p>
              ) : (
                <div className="space-y-2">
                  {timeline.map((t, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="w-2 h-2 mt-1.5 rounded-full bg-forest-600 shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-ink">{LABELS[t.status] || t.status}</div>
                        {t.note && <div className="text-xs text-ink-faint">{t.note}</div>}
                        <div className="text-xs text-ink-faint">{fmtDateTime(t.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {detail.note && (
              <div className="text-sm text-ink-soft bg-amber-brand/10 border border-amber-brand/20 rounded-control px-3 py-2 inline-flex items-center gap-2">
                <Icon name="NotePencil" size={16} />
                {detail.note}
              </div>
            )}

            <div className="text-xs text-ink-faint">Ngày đặt: {fmtDateTime(detail.createdAt)}</div>
          </div>
        )}
      </Modal>
    </div>
  );
}