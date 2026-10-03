import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import StatusBadge, { LABELS } from '../components/StatusBadge.jsx';
import Modal from '../components/Modal.jsx';
import { fmtVND, fmtDateTime } from '../utils/format.js';

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
        <h1 className="text-2xl font-bold text-slate-800">Đơn hàng của tôi</h1>
        <p className="text-sm text-slate-500 mt-1">{orders.length} đơn hàng</p>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-500 font-medium mr-1">Lọc:</span>
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === f.value ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 text-sm">{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-left">
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
                  <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">{o.orderCode}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[240px]">
                      <span className="block truncate">{itemNames || '—'}</span>
                      <span className="text-xs text-slate-400">{itemCount} sản phẩm</span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">{fmtVND(o.totalAmount)} ₫</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{fmtDateTime(o.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          onClick={() => openDetail(o)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
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
                  <td colSpan={6} className="text-center text-slate-400 py-10">
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
                <p className="text-sm text-slate-500">Giao tới</p>
                <p className="font-semibold text-slate-800">{detail.customer?.name}</p>
                <p className="text-xs text-slate-400">{detail.customer?.phone} · {detail.customer?.email}</p>
                {detail.customer?.address && <p className="text-xs text-slate-400">{detail.customer.address}</p>}
              </div>
              <StatusBadge status={detail.status} />
            </div>

            <div className="border-t border-slate-100 pt-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs">
                    <th className="text-left py-1 font-semibold">Sản phẩm</th>
                    <th className="text-right py-1 font-semibold">SL</th>
                    <th className="text-right py-1 font-semibold">Đơn giá</th>
                    <th className="text-right py-1 font-semibold">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {(detail.items || []).map((it, i) => (
                    <tr key={i} className="border-t border-slate-50">
                      <td className="py-2 text-slate-700">{it.productName}</td>
                      <td className="py-2 text-right text-slate-600">{it.quantity}</td>
                      <td className="py-2 text-right text-slate-600">{fmtVND(it.price)}₫</td>
                      <td className="py-2 text-right font-semibold text-slate-800">{fmtVND(it.subtotal)}₫</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
              <span className="text-sm text-slate-500">Tổng cộng</span>
              <span className="text-lg font-bold text-slate-800">{fmtVND(detail.totalAmount)} ₫</span>
            </div>

            {detail.discountAmount > 0 && (
              <div className="flex items-center justify-between text-sm px-1">
                <span className="text-emerald-600">Giảm giá {detail.voucherCode ? `(${detail.voucherCode})` : ''}</span>
                <span className="text-emerald-600 font-semibold">−{fmtVND(detail.discountAmount)} ₫</span>
              </div>
            )}

            <div className="text-sm text-slate-500 flex items-center gap-1">
              <span>Thanh toán:</span>
              <b className="text-slate-700">{detail.paymentMethod === 'TRANSFER' ? 'Chuyển khoản 🏦' : 'Khi nhận hàng (COD) 💵'}</b>
            </div>

            {/* Timeline */}
            <div className="border-t border-slate-100 pt-3">
              <p className="text-sm font-semibold text-slate-700 mb-2">Tiến trình đơn hàng</p>
              {timeline.length === 0 ? (
                <p className="text-xs text-slate-400">Chưa có dữ liệu tiến trình</p>
              ) : (
                <div className="space-y-2">
                  {timeline.map((t, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="w-2 h-2 mt-1.5 rounded-full bg-orange-500 shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-700">{LABELS[t.status] || t.status}</div>
                        {t.note && <div className="text-xs text-slate-400">{t.note}</div>}
                        <div className="text-xs text-slate-400">{fmtDateTime(t.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {detail.note && (
              <div className="text-sm text-slate-500 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                📝 {detail.note}
              </div>
            )}

            <div className="text-xs text-slate-400">Ngày đặt: {fmtDateTime(detail.createdAt)}</div>
          </div>
        )}
      </Modal>
    </div>
  );
}
