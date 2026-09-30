import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
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
      setDetail(data);
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
          <h1 className="text-2xl font-bold text-slate-800">Quản lý đơn hàng</h1>
          <p className="text-sm text-slate-500 mt-1">{orders.length} đơn hàng</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-colors"
        >
          + Tạo đơn hàng
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-500 font-medium mr-1">Lọc:</span>
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${!statusFilter ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Tất cả
          </button>
          {STATUS_ORDER.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 text-sm">{error}</div>}

      {/* Orders table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-left">
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
                  <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">{o.orderCode}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{cust?.name || '—'}</div>
                      <div className="text-xs text-slate-400">{cust?.phone || cust?.email || ''}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-[240px]">
                      <span className="block truncate">{itemNames || '—'}</span>
                      <span className="text-xs text-slate-400">{itemCount} sản phẩm</span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">{fmtVND(o.totalAmount)} ₫</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{fmtDateTime(o.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetail(o)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          Chi tiết
                        </button>
                        <button
                          onClick={() => handleDelete(o)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700"
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
                  <td colSpan={7} className="text-center text-slate-400 py-10">
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
              <label className="block text-sm font-semibold text-slate-700 mb-1">Khách hàng *</label>
              <select
                required
                value={customerId}
                onChange={e => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-400 focus:outline-none"
              >
                <option value="">— Chọn khách hàng —</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Ghi chú</label>
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                placeholder="VD: Giao gio hanh chinh"
              />
            </div>
          </div>

          {/* Line items */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Sản phẩm</label>
            <div className="space-y-2">
              {lines.map((line, i) => {
                const p = productMap[line.productId];
                return (
                  <div key={i} className="flex items-center gap-2">
                    <select
                      value={line.productId}
                      onChange={e => updateLine(i, 'productId', e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-400 focus:outline-none"
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
                      className="w-20 px-2 py-2 border border-slate-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-orange-400 focus:outline-none"
                    />
                    {p && <span className="text-sm font-semibold text-slate-700 w-24 text-right">{fmtVND(p.price * (Number(line.quantity) || 0))}₫</span>}
                    <button
                      type="button"
                      onClick={() => removeLine(i)}
                      disabled={lines.length === 1}
                      className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm disabled:opacity-30"
                      aria-label="Xoá dòng"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={addLine}
              className="mt-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
            >
              + Thêm sản phẩm
            </button>
          </div>

          <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
            <span className="text-sm text-slate-500">Tổng cộng</span>
            <span className="text-lg font-bold text-slate-800">{fmtVND(cartTotal)} ₫</span>
          </div>

          {createError && <div className="bg-rose-50 text-rose-700 text-sm rounded-lg p-3">{createError}</div>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700">
              Huỷ
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50">
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
                <p className="text-sm text-slate-500">Khách hàng</p>
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

            {detail.note && (
              <div className="text-sm text-slate-500 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                📝 {detail.note}
              </div>
            )}

            <div className="text-xs text-slate-400">Ngày tạo: {fmtDateTime(detail.createdAt)}</div>

            {/* Status change */}
            {detail.status !== 'CANCELLED' && detail.status !== 'DELIVERED' && (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Cập nhật trạng thái</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {STATUS_ORDER.filter(s => s !== detail.status).map(s => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${STYLES[s] || 'bg-slate-100 text-slate-600'}`}
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
