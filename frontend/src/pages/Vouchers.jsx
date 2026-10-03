import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Modal from '../components/Modal.jsx';

const EMPTY = {
  code: '',
  type: 'AMOUNT',
  value: '',
  maxDiscount: '',
  minOrder: '',
  startDate: todayStr(),
  endDate: '',
  quantity: '',
  active: true,
  description: ''
};

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function Vouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setError('');
      const data = await api.getVouchers();
      setVouchers(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(v) {
    setEditingId(v.id);
    setForm({
      code: v.code,
      type: v.type,
      value: v.value,
      maxDiscount: v.maxDiscount ?? '',
      minOrder: v.minOrder ?? '',
      startDate: v.startDate,
      endDate: v.endDate,
      quantity: v.quantity ?? '',
      active: v.active,
      description: v.description || ''
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const payload = {
        code: form.code,
        type: form.type,
        value: Number(form.value),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        minOrder: form.minOrder ? Number(form.minOrder) : null,
        startDate: form.startDate,
        endDate: form.endDate,
        quantity: form.quantity ? Number(form.quantity) : null,
        active: form.active,
        description: form.description || null
      };
      if (editingId) await api.updateVoucher(editingId, payload);
      else await api.createVoucher(payload);
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(v) {
    if (!window.confirm(`Xoá mã giảm giá "${v.code}"?`)) return;
    try {
      setError('');
      await api.deleteVoucher(v.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function status(v) {
    const today = todayStr();
    if (!v.active) return { label: 'Tắt', cls: 'bg-slate-100 text-slate-600' };
    if (v.endDate < today) return { label: 'Hết hạn', cls: 'bg-rose-100 text-rose-700' };
    if (v.quantity != null && v.usedCount >= v.quantity) return { label: 'Hết lượt', cls: 'bg-amber-100 text-amber-700' };
    return { label: 'Đang chạy', cls: 'bg-emerald-100 text-emerald-700' };
  }

  function displayValue(v) {
    if (v.type === 'PERCENT') return `${v.value}%`;
    return `${(v.value || 0).toLocaleString('vi-VN')} ₫`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mã giảm giá</h1>
          <p className="text-sm text-slate-500 mt-1">{vouchers.length} mã khuyến mãi</p>
        </div>
        <button onClick={openCreate} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-colors">
          + Tạo mã giảm giá
        </button>
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 text-sm">{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-left">
                <th className="px-4 py-3 font-semibold">Mã</th>
                <th className="px-4 py-3 font-semibold">Giảm giá</th>
                <th className="px-4 py-3 font-semibold">Đơn tối thiểu</th>
                <th className="px-4 py-3 font-semibold">Hiệu lực</th>
                <th className="px-4 py-3 font-semibold text-center">Lượt dùng</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map(v => {
                const s = status(v);
                return (
                  <tr key={v.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-orange-600">{v.code}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {displayValue(v)}
                      {v.type === 'PERCENT' && v.maxDiscount ? <span className="block text-xs text-slate-400">tối đa {v.maxDiscount.toLocaleString('vi-VN')} ₫</span> : null}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{v.minOrder ? `${v.minOrder.toLocaleString('vi-VN')} ₫` : '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {v.startDate} → {v.endDate}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      {v.usedCount}{v.quantity != null ? `/${v.quantity}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(v)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700">Sửa</button>
                        <button onClick={() => handleDelete(v)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700">Xoá</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && vouchers.length === 0 && (
                <tr><td colSpan={7} className="text-center text-slate-400 py-10">Chưa có mã giảm giá nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Sửa mã giảm giá' : 'Tạo mã giảm giá'} width="max-w-2xl">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Mã giảm giá *</label>
              <input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-orange-400 focus:outline-none" placeholder="VD: TET10" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Loại</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-400 focus:outline-none">
                <option value="AMOUNT">Giảm theo số tiền</option>
                <option value="PERCENT">Giảm theo phần trăm</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">{form.type === 'PERCENT' ? 'Phần trăm giảm (%) *' : 'Số tiền giảm (₫) *'}</label>
              <input required type="number" min="0" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none" placeholder={form.type === 'PERCENT' ? '10' : '20000'} />
            </div>
            {form.type === 'PERCENT' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Giảm tối đa (₫)</label>
                <input type="number" min="0" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none" placeholder="50000" />
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Đơn tối thiểu (₫)</label>
              <input type="number" min="0" value={form.minOrder} onChange={e => setForm({ ...form, minOrder: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none" placeholder="100000" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Số lượng phát hành (để trống = không giới hạn)</label>
              <input type="number" min="0" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none" placeholder="100" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày bắt đầu</label>
              <input required type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày kết thúc</label>
              <input required type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none" placeholder="Khuyến mãi Tết..." />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="active" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })}
                className="w-4 h-4" />
              <label htmlFor="active" className="text-sm text-slate-700">Kích hoạt mã</label>
            </div>
          </div>
          {formError && <div className="bg-rose-50 text-rose-700 text-sm rounded-lg p-3">{formError}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700">Huỷ</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50">
              {saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Tạo mã'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}