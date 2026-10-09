import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Icon } from '../store/Ui.jsx';
import Modal from '../components/Modal.jsx';

const EMPTY_FORM = { name: '', email: '', phone: '', address: '' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadCustomers();
  }, [q]);

  async function loadCustomers() {
    try {
      setError('');
      const data = await api.getCustomers(q);
      setCustomers(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(c) {
    setEditingId(c.id);
    setForm({ name: c.name, email: c.email, phone: c.phone || '', address: c.address || '' });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      if (editingId) {
        await api.updateCustomer(editingId, form);
      } else {
        await api.createCustomer(form);
      }
      setModalOpen(false);
      loadCustomers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c) {
    if (!window.confirm(`Xoá khách hàng "${c.name}"?`)) return;
    try {
      setError('');
      await api.deleteCustomer(c.id);
      loadCustomers();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="display text-2xl text-ink">Quản lý khách hàng</h1>
          <p className="text-sm text-ink-soft mt-1">{customers.length} khách hàng</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-forest-800 hover:bg-forest-700 text-bone-50 px-4 py-2.5 rounded-card font-semibold text-sm shadow-sm transition-colors"
        >
          + Thêm khách hàng
        </button>
      </div>

      <div className="bg-surface-raised rounded-card border border-line p-4 shadow-sm">
        <div className="relative max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"><Icon name="Info" size={18} /></span>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Tìm theo tên, email, số điện thoại..."
            className="w-full pl-10 pr-4 py-2.5 border border-line-strong rounded-card text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
          />
        </div>
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-danger rounded-card p-4 text-sm">{error}</div>}

      <div className="bg-surface-raised rounded-card border border-line shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bone-100/60 text-ink-soft text-left">
                <th className="px-4 py-3 font-semibold">Khách hàng</th>
                <th className="px-4 py-3 font-semibold">Số điện thoại</th>
                <th className="px-4 py-3 font-semibold">Địa chỉ</th>
                <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} className="hairline hover:bg-bone-50/60">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-ink">{c.name}</div>
                    <div className="text-xs text-ink-faint">{c.email}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{c.phone || '-'}</td>
                  <td className="px-4 py-3 text-ink-soft">{c.address || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="px-3 py-1.5 rounded-control text-xs font-semibold bg-forest-100 hover:bg-forest-100 text-forest-800"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="px-3 py-1.5 rounded-control text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700"
                      >
                        Xoá
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && customers.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-ink-faint py-10">
                    Không có khách hàng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Sửa khách hàng' : 'Thêm khách hàng mới'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">Họ tên *</label>
            <input
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-line-strong rounded-control text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
              placeholder="VD: Nguyen Van An"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">Email *</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-line-strong rounded-control text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
              placeholder="VD: an@gmail.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">Số điện thoại</label>
            <input
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 border border-line-strong rounded-control text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
              placeholder="VD: 0912345678"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">Địa chỉ</label>
            <input
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 border border-line-strong rounded-control text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
              placeholder="VD: 12 Le Loi, Q1, TP.HCM"
            />
          </div>

          {formError && <div className="bg-rose-50 text-rose-700 text-sm rounded-control p-3">{formError}</div>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-control text-sm font-semibold bg-bone-100 hover:bg-bone-200 text-ink">
              Huỷ
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-control text-sm font-semibold bg-forest-800 hover:bg-forest-700 text-bone-50 disabled:opacity-50">
              {saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Tạo khách hàng'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
