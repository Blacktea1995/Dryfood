import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Icon } from '../store/Ui.jsx';
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
          <h1 className="display text-2xl text-ink">Quản lý sản phẩm</h1>
          <p className="text-sm text-ink-soft mt-1">{products.length} sản phẩm thực phẩm khô</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-forest-800 hover:bg-forest-700 text-bone-50 px-4 py-2.5 rounded-card font-semibold text-sm shadow-sm transition-colors"
        >
          + Thêm sản phẩm
        </button>
        <a
          href={api.exportUrl('products')}
          className="bg-forest-800 hover:bg-forest-950 text-bone-50 px-4 py-2.5 rounded-card font-semibold text-sm shadow-sm transition-colors"
        >
          <Icon name="Tag" size={16} />
            Xuất CSV
        </a>
      </div>

      {/* Search */}
      <div className="bg-surface-raised rounded-card border border-line p-4 shadow-sm">
        <div className="relative max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"><Icon name="MagnifyingGlass" size={18} /></span>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Tìm theo tên, SKU, danh mục..."
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
                <tr key={p.id} className="hairline hover:bg-bone-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.imageUrl || ''}
                        alt={p.name}
                        className="w-11 h-11 rounded-control object-cover bg-bone-100 shrink-0"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                      <div>
                        <div className="font-semibold text-ink">{p.name}</div>
                        {p.description && <div className="text-xs text-ink-faint max-w-[220px] truncate">{p.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-soft font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-3">
                    <span className="bg-bone-100 text-ink-soft px-2 py-1 rounded-md text-xs">{p.category || '-'}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">{fmtVND(p.price)} ₫</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block min-w-16 px-2 py-1 rounded-control text-xs font-bold ${p.stock <= 5 ? 'bg-rose-100 text-rose-700' : p.stock <= 10 ? 'bg-amber-brand/15 text-amber-deep' : 'bg-emerald-100 text-emerald-700'}`}>
                      {p.stock} {p.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setStockId(p.id); setStockDelta(''); setStockError(''); }}
                        className="px-3 py-1.5 rounded-control text-xs font-semibold bg-bone-100 hover:bg-bone-200 text-ink"
                      >
                        Điều chỉnh kho
                      </button>
                      <button
                        onClick={() => openEdit(p)}
                        className="px-3 py-1.5 rounded-control text-xs font-semibold bg-forest-100 hover:bg-forest-100 text-forest-800"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="px-3 py-1.5 rounded-control text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700"
                      >
                        Xoá
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && products.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-ink-faint py-10">
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
              <label className="block text-sm font-semibold text-ink mb-1">Tên sản phẩm *</label>
              <input
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-line-strong rounded-control text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
                placeholder="VD: Mi goi Hao Hao"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-1">SKU *</label>
              <input
                required
                value={form.sku}
                onChange={e => setForm({ ...form, sku: e.target.value })}
                className="w-full px-3 py-2 border border-line-strong rounded-control text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
                placeholder="VD: DF-013"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-1">Danh mục</label>
              <input
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-line-strong rounded-control text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
                placeholder="VD: Do kho"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-1">Giá bán (₫) *</label>
              <input
                required
                type="number"
                min="0"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                className="w-full px-3 py-2 border border-line-strong rounded-control text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
                placeholder="45000"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-1">Tồn kho *</label>
              <input
                required
                type="number"
                min="0"
                value={form.stock}
                onChange={e => setForm({ ...form, stock: e.target.value })}
                className="w-full px-3 py-2 border border-line-strong rounded-control text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-1">Đơn vị</label>
              <input
                value={form.unit}
                onChange={e => setForm({ ...form, unit: e.target.value })}
                className="w-full px-3 py-2 border border-line-strong rounded-control text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
                placeholder="goi"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-ink mb-1">Ảnh sản phẩm (URL)</label>
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 rounded-card bg-bone-100 border border-line flex items-center justify-center overflow-hidden shrink-0">
                  {form.imageUrl ? (
                    <img
                      src={form.imageUrl}
                      alt="Xem truoc"
                      className="w-full h-full object-cover"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <Icon name="Image" size={26} className="text-bone-50/80" aria-hidden="true" />
                  )}
                </div>
                <input
                  value={form.imageUrl}
                  onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                  className="flex-1 px-3 py-2 border border-line-strong rounded-control text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
                  placeholder="/images/mi-hao-hao.svg (ảnh trong backend) hoặc https://... (ảnh ngoài)"
                />
              </div>
              <p className="text-xs text-ink-faint mt-1 inline-flex items-start gap-1.5">
                <Icon name="Info" size={14} className="mt-0.5 shrink-0" />
                <span>Muốn dùng ảnh của riêng bạn: bỏ file ảnh vào thư mục <code className="text-ink-soft">backend/src/main/resources/static/images/</code> rồi nhập <code className="text-ink-soft">/images/ten-file.png</code>. Hoặc dán URL ảnh bất kỳ trên web.</span>
              </p>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-ink mb-1">Mô tả</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-line-strong rounded-control text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
              />
            </div>
          </div>

          {formError && <div className="bg-rose-50 text-rose-700 text-sm rounded-control p-3">{formError}</div>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-control text-sm font-semibold bg-bone-100 hover:bg-bone-200 text-ink">
              Huỷ
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-control text-sm font-semibold bg-forest-800 hover:bg-forest-700 text-bone-50 disabled:opacity-50">
              {saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock adjust modal */}
      <Modal open={stockId !== null} onClose={() => setStockId(null)} title="Điều chỉnh tồn kho" width="max-w-sm">
        <form onSubmit={handleAdjustStock} className="space-y-4">
          <p className="text-sm text-ink-soft">
            Nhập số dương để nhập thêm hàng, số âm để trừ bớt (xuất kho/điều chỉnh).
          </p>
          <input
            type="number"
            value={stockDelta}
            onChange={e => setStockDelta(e.target.value)}
            placeholder="VD: 20 hoặc -5"
            className="w-full px-3 py-2.5 border border-line-strong rounded-control text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
            autoFocus
          />
          {stockError && <div className="bg-rose-50 text-rose-700 text-sm rounded-control p-3">{stockError}</div>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setStockId(null)} className="px-4 py-2 rounded-control text-sm font-semibold bg-bone-100 hover:bg-bone-200 text-ink">
              Huỷ
            </button>
            <button type="submit" className="px-4 py-2 rounded-control text-sm font-semibold bg-forest-800 hover:bg-forest-700 text-bone-50">
              Cập nhật
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
