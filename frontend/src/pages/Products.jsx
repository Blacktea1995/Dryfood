import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Modal from '../components/Modal.jsx';
import { fmtVND } from '../utils/format.js';

const EMPTY_FORM = {
  name: '',
  sku: '',
  category: '',
  unit: 'goi',
  price: '',
  stock: '',
  description: '',
  imageUrl: ''
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [stockId, setStockId] = useState(null);
  const [stockDelta, setStockDelta] = useState('');
  const [stockError, setStockError] = useState('');

  useEffect(() => {
    loadProducts();
  }, [q]);

  async function loadProducts() {
    try {
      setError('');
      const data = await api.getProducts(q);
      setProducts(data);
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

  function openEdit(p) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      sku: p.sku,
      category: p.category || '',
      unit: p.unit || 'goi',
      price: p.price,
      stock: p.stock,
      description: p.description || '',
      imageUrl: p.imageUrl || ''
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
        ...form,
        price: Number(form.price),
        stock: Number(form.stock) || 0
      };
      if (editingId) {
        await api.updateProduct(editingId, payload);
      } else {
        await api.createProduct(payload);
      }
      setModalOpen(false);
      loadProducts();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p) {
    if (!window.confirm(`Xoá sản phẩm "${p.name}"?`)) return;
    try {
      setError('');
      await api.deleteProduct(p.id);
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAdjustStock(e) {
    e.preventDefault();
    setStockError('');
    const delta = Number(stockDelta);
    if (!delta || Number.isNaN(delta)) {
      setStockError('Nhập số lượng cần điều chỉnh (dương: nhập thêm, âm: trừ bớt)');
      return;
    }
    try {
      await api.adjustStock(stockId, delta);
      setStockId(null);
      setStockDelta('');
      loadProducts();
    } catch (err) {
      setStockError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý sản phẩm</h1>
          <p className="text-sm text-slate-500 mt-1">{products.length} sản phẩm thực phẩm khô</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-colors"
        >
          + Thêm sản phẩm
        </button>
        <a
          href={api.exportUrl('products')}
          className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-colors"
        >
          ⬇️ Xuất CSV
        </a>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="relative max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Tìm theo tên, SKU, danh mục..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 text-sm">{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-left">
                <th className="px-4 py-3 font-semibold">Sản phẩm</th>
                <th className="px-4 py-3 font-semibold">SKU</th>
                <th className="px-4 py-3 font-semibold">Danh mục</th>
                <th className="px-4 py-3 font-semibold text-right">Giá bán</th>
                <th className="px-4 py-3 font-semibold text-center">Tồn kho</th>
                <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.imageUrl || ''}
                        alt={p.name}
                        className="w-11 h-11 rounded-lg object-cover bg-slate-100 shrink-0"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                      <div>
                        <div className="font-semibold text-slate-800">{p.name}</div>
                        {p.description && <div className="text-xs text-slate-400 max-w-[220px] truncate">{p.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-3">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs">{p.category || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">{fmtVND(p.price)} ₫</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block min-w-16 px-2 py-1 rounded-lg text-xs font-bold ${p.stock <= 5 ? 'bg-rose-100 text-rose-700' : p.stock <= 10 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {p.stock} {p.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setStockId(p.id); setStockDelta(''); setStockError(''); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        Điều chỉnh kho
                      </button>
                      <button
                        onClick={() => openEdit(p)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700"
                      >
                        Xoá
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && products.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-slate-400 py-10">
                    Không có sản phẩm nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tên sản phẩm *</label>
              <input
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                placeholder="VD: Mi goi Hao Hao"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">SKU *</label>
              <input
                required
                value={form.sku}
                onChange={e => setForm({ ...form, sku: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                placeholder="VD: DF-013"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Danh mục</label>
              <input
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                placeholder="VD: Do kho"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Giá bán (₫) *</label>
              <input
                required
                type="number"
                min="0"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                placeholder="45000"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tồn kho *</label>
              <input
                required
                type="number"
                min="0"
                value={form.stock}
                onChange={e => setForm({ ...form, stock: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Đơn vị</label>
              <input
                value={form.unit}
                onChange={e => setForm({ ...form, unit: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                placeholder="goi"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Ảnh sản phẩm (URL)</label>
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                  {form.imageUrl ? (
                    <img
                      src={form.imageUrl}
                      alt="Xem truoc"
                      className="w-full h-full object-cover"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-2xl text-slate-300">🖼️</span>
                  )}
                </div>
                <input
                  value={form.imageUrl}
                  onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  placeholder="/images/mi-hao-hao.svg (ảnh trong backend) hoặc https://... (ảnh ngoài)"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                💡 Muốn dùng ảnh của riêng bạn: bỏ file ảnh vào thư mục <code className="text-slate-500">backend/src/main/resources/static/images/</code> rồi nhập <code className="text-slate-500">/images/ten-file.png</code>. Hoặc dán URL ảnh bất kỳ trên web.
              </p>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
              />
            </div>
          </div>

          {formError && <div className="bg-rose-50 text-rose-700 text-sm rounded-lg p-3">{formError}</div>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700">
              Huỷ
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50">
              {saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock adjust modal */}
      <Modal open={stockId !== null} onClose={() => setStockId(null)} title="Điều chỉnh tồn kho" width="max-w-sm">
        <form onSubmit={handleAdjustStock} className="space-y-4">
          <p className="text-sm text-slate-500">
            Nhập số dương để nhập thêm hàng, số âm để trừ bớt (xuất kho/điều chỉnh).
          </p>
          <input
            type="number"
            value={stockDelta}
            onChange={e => setStockDelta(e.target.value)}
            placeholder="VD: 20 hoặc -5"
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
            autoFocus
          />
          {stockError && <div className="bg-rose-50 text-rose-700 text-sm rounded-lg p-3">{stockError}</div>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setStockId(null)} className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700">
              Huỷ
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white">
              Cập nhật
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
