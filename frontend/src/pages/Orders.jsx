import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { Icon } from '../store/Ui.jsx';
import Modal from '../components/Modal.jsx';
import StatusBadge, { LABELS, STYLES } from '../components/StatusBadge.jsx';
import { fmtVND, fmtDateTime } from '../utils/format.js';

const STATUS_ORDER = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create order
  const [createOpen, setCreateOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState([{ productId: '', quantity: 1 }]);
  const [createError, setCreateError] = useState('');
  const [saving, setSaving] = useState(false);

  // Detail
  const [detail, setDetail] = useState(null);
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    loadAll();
  }, [statusFilter]);

  async function loadAll() {
    try {
      setError('');
      const [o, p, c] = await Promise.all([
        api.getOrders(statusFilter),
        api.getProducts(),
        api.getCustomers()
      ]);
      setOrders(o);
      setProducts(p);
      setCustomers(c);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const productMap = useMemo(() => {
    const m = {};
    products.forEach(p => { m[p.id] = p; });
    return m;
  }, [products]);

  const customerMap = useMemo(() => {
    const m = {};
    customers.forEach(c => { m[c.id] = c; });
    return m;
  }, [customers]);

  function openCreate() {
    setCustomerId('');
    setNote('');
    setLines([{ productId: '', quantity: 1 }]);
    setCreateError('');
    setCreateOpen(true);
  }

  function updateLine(i, field, value) {
    const next = [...lines];
    next[i][field] = value;
    setLines(next);
  }

  function addLine() {
    setLines([...lines, { productId: '', quantity: 1 }]);
  }

  function removeLine(i) {
    if (lines.length === 1) return;
    setLines(lines.filter((_, idx) => idx !== i));
  }

  const cartTotal = useMemo(() => {
    return lines.reduce((sum, line) => {
      const p = productMap[line.productId];
      if (!p) return sum;
      return sum + p.price * (Number(line.quantity) || 0);
    }, 0);
  }, [lines, productMap]);

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError('');
    setSaving(true);
    try {
      const items = lines
        .filter(l => l.productId && Number(l.quantity) > 0)
        .map(l => ({ productId: Number(l.productId), quantity: Number(l.quantity) }));
      if (!customerId) throw new Error('Vui lòng chọn khách hàng');
      if (items.length === 0) throw new Error('Đơn hàng phải có ít nhất 1 sản phẩm');
      await api.createOrder({ customerId: Number(customerId), note: note || null, items });
      setCreateOpen(false);
      loadAll();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setSaving(false);
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

  async function handleStatusChange(newStatus) {
    if (!detail) return;
    try {
      const updated = await api.updateOrderStatus(detail.id, newStatus);
      setDetail(updated);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(order) {
    if (!window.confirm(`Xoá đơn hàng ${order.orderCode}?`)) return;
    try {
      setError('');
      await api.deleteOrder(order.id);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Quản lý đơn hàng</h1>
          <p className="text-sm text-ink-soft mt-1">{orders.length} đơn hàng</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={api.exportUrl('orders')}
            className="bg-forest-800 hover:bg-forest-950 text-bone-50 px-4 py-2.5 rounded-card font-semibold text-sm shadow-sm transition-colors"
          >
            <Icon name="Tag" size={16} />
            Xuất CSV
          </a>
          <button
            onClick={openCreate}
            className="bg-forest-800 hover:bg-forest-700 text-bone-50 px-4 py-2.5 rounded-card font-semibold text-sm shadow-sm transition-colors"
          >
            + Tạo đơn hàng
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-surface-raised rounded-card border border-line p-4 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-ink-soft font-medium mr-1">Lọc:</span>
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors ${!statusFilter ? 'bg-forest-800 text-bone-50' : 'bg-bone-100 text-ink-soft hover:bg-bone-200'}`}
          >
            Tất cả
          </button>
          {STATUS_ORDER.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors ${statusFilter === s ? 'bg-forest-800 text-bone-50' : 'bg-bone-100 text-ink-soft hover:bg-bone-200'}`}
            >
              {LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-card p-4 text-sm">{error}</div>}

      {/* Orders table */}
      <div className="bg-surface-raised rounded-card border border-line shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bone-100 text-ink-soft text-left">
                <th className="px-4 py-3 font-semibold">Mã đơn</th>
                <th className="px-4 py-3 font-semibold">Khách hàng</th>
                <th className="px-4 py-3 font-semibold">Sản phẩm</th>
                <th className="px-4 py-3 font-semibold text-right">Tổng tiền</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                <th className="px-4 py-3 font-semibold">Ngày tạo</th>
                <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const cust = o.customer;
                const itemCount = (o.items || []).reduce((s, it) => s + it.quantity, 0);
                const itemNames = (o.items || []).slice(0, 2).map(it => it.productName).join(', ');
                return (
                  <tr key={o.id} className="border-t border-line hover:bg-bone-100/60">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-ink">{o.orderCode}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-ink">{cust?.name || '—'}</div>
                      <div className="text-xs text-ink-faint">{cust?.phone || cust?.email || ''}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft max-w-[240px]">
                      <span className="block truncate">{itemNames || '—'}</span>
                      <span className="text-xs text-ink-faint">{itemCount} sản phẩm</span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-ink">{fmtVND(o.totalAmount)} ₫</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-ink-soft text-xs">{fmtDateTime(o.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetail(o)}
                          className="px-3 py-1.5 rounded-control text-xs font-semibold bg-bone-100 hover:bg-bone-200 text-ink"
                        >
                          Chi tiết
                        </button>
                        <button
                          onClick={() => handleDelete(o)}
                          className="px-3 py-1.5 rounded-control text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700"
                        >
                          Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-ink-faint py-10">
                    Không có đơn hàng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create order modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Tạo đơn hàng mới" width="max-w-2xl">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink mb-1">Khách hàng *</label>
              <select
                required
                value={customerId}
                onChange={e => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-line-strong rounded-control text-sm bg-surface-raised focus:ring-2 focus:ring-forest-500 focus:outline-none"
              >
                <option value="">— Chọn khách hàng —</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-1">Ghi chú</label>
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full px-3 py-2 border border-line-strong rounded-control text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
                placeholder="VD: Giao gio hanh chinh"
              />
            </div>
          </div>

          {/* Line items */}
          <div>
            <label className="block text-sm font-semibold text-ink mb-2">Sản phẩm</label>
            <div className="space-y-2">
              {lines.map((line, i) => {
                const p = productMap[line.productId];
                return (
                  <div key={i} className="flex items-center gap-2">
                    <select
                      value={line.productId}
                      onChange={e => updateLine(i, 'productId', e.target.value)}
                      className="flex-1 px-3 py-2 border border-line-strong rounded-control text-sm bg-surface-raised focus:ring-2 focus:ring-forest-500 focus:outline-none"
                    >
                      <option value="">— Chọn sản phẩm —</option>
                      {products.map(pr => (
                        <option key={pr.id} value={pr.id} disabled={pr.stock <= 0}>
                          {pr.name} — {fmtVND(pr.price)}₫ (kho: {pr.stock})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={e => updateLine(i, 'quantity', e.target.value)}
                      className="w-20 px-2 py-2 border border-line-strong rounded-control text-sm text-center focus:ring-2 focus:ring-forest-500 focus:outline-none"
                    />
                    {p && <span className="text-sm font-semibold text-ink w-24 text-right">{fmtVND(p.price * (Number(line.quantity) || 0))}₫</span>}
                    <button
                      type="button"
                      onClick={() => removeLine(i)}
                      disabled={lines.length === 1}
                      className="w-8 h-8 rounded-control bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm disabled:opacity-30"
                      aria-label="Xoá dòng"
                    >
                      <Icon name="X" size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={addLine}
              className="mt-2 text-sm font-semibold text-forest-700 hover:text-amber-deep"
            >
              + Thêm sản phẩm
            </button>
          </div>

          <div className="flex items-center justify-between bg-bone-100 rounded-card px-4 py-3">
            <span className="text-sm text-ink-soft">Tổng cộng</span>
            <span className="text-lg font-bold text-ink">{fmtVND(cartTotal)} ₫</span>
          </div>

          {createError && <div className="bg-rose-50 text-rose-700 text-sm rounded-control p-3">{createError}</div>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded-control text-sm font-semibold bg-bone-100 hover:bg-bone-200 text-ink">
              Huỷ
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-control text-sm font-semibold bg-forest-800 hover:bg-forest-700 text-bone-50 disabled:opacity-50">
              {saving ? 'Đang tạo...' : 'Tạo đơn hàng'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail modal */}
      <Modal open={detail !== null} onClose={() => setDetail(null)} title={`Đơn hàng ${detail?.orderCode || ''}`} width="max-w-xl">
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-soft">Khách hàng</p>
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
                    <tr key={i} className="border-t border-line">
                      <td className="py-2 text-ink">{it.productName}</td>
                      <td className="py-2 text-right text-ink-soft">{it.quantity}</td>
                      <td className="py-2 text-right text-ink-soft">{fmtVND(it.price)}₫</td>
                      <td className="py-2 text-right font-semibold text-ink">{fmtVND(it.subtotal)}₫</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between bg-bone-100 rounded-card px-4 py-3">
              <span className="text-sm text-ink-soft">Phụ thu</span>
              <span className="text-ink font-semibold">{fmtVND(detail.totalAmount + (detail.discountAmount || 0))} ₫</span>
            </div>

            {detail.discountAmount > 0 && (
              <div className="flex items-center justify-between text-sm px-1">
                <span className="text-emerald-600">Giảm giá {detail.voucherCode ? `(${detail.voucherCode})` : ''}</span>
                <span className="text-emerald-600 font-semibold">−{fmtVND(detail.discountAmount)} ₫</span>
              </div>
            )}

            <div className="flex items-center justify-between bg-bone-100 rounded-card px-4 py-3">
              <span className="text-sm text-ink-soft">Tổng cộng sau giảm</span>
              <span className="text-lg font-bold text-ink">{fmtVND(detail.totalAmount)} ₫</span>
            </div>

            <div className="text-sm text-ink-soft flex items-center gap-1">
              <span>Thanh toán:</span>
              <b className="text-ink">{detail.paymentMethod === 'TRANSFER' ? 'Chuyển khoản 🏦' : 'Khi nhận hàng (COD) 💵'}</b>
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
                      <span className="w-2 h-2 mt-1.5 rounded-full bg-forest-800 shrink-0" />
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
              <div className="text-sm text-ink-soft bg-amber-50 border border-amber-100 rounded-control px-3 py-2">
                📝 {detail.note}
              </div>
            )}

            <div className="text-xs text-ink-faint">Ngày tạo: {fmtDateTime(detail.createdAt)}</div>

            {/* Status change */}
            {detail.status !== 'CANCELLED' && detail.status !== 'DELIVERED' && (
              <div>
                <p className="text-sm font-semibold text-ink mb-2">Cập nhật trạng thái</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {STATUS_ORDER.filter(s => s !== detail.status).map(s => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-colors ${STYLES[s] || 'bg-bone-100 text-ink-soft'}`}
                    >
                      {LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
