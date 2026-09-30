import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import StatCard from '../components/StatCard.jsx';
import BarChart from '../components/BarChart.jsx';
import DonutChart from '../components/DonutChart.jsx';
import StatusBadge, { LABELS } from '../components/StatusBadge.jsx';
import { fmtVND, fmtDate } from '../utils/format.js';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      setError('');
      const [s, r, t, st, low] = await Promise.all([
        api.getDashboardSummary(),
        api.getRevenue7Days(),
        api.getTopProducts(),
        api.getOrdersByStatus(),
        api.getInventoryLow()
      ]);
      setSummary(s);
      setRevenue(r);
      setTopProducts(t);
      setStatusData(st);
      setLowStock(low);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center text-slate-400 py-20">Đang tải dữ liệu...</div>;
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4">
        Không tải được dữ liệu: {error}
      </div>
    );
  }

  const revenueChart = revenue.map(p => ({
    label: fmtDate(p.date).slice(0, 5),
    value: p.revenue
  }));

  const donutData = statusData.map(s => ({
    label: LABELS[s.status] || s.status,
    value: s.count
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Tổng quan kinh doanh</h1>
        <p className="text-sm text-slate-500 mt-1">Phân tích dữ liệu bán hàng thực phẩm khô</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Tổng doanh thu" value={summary.totalRevenue} currency accent="blue" icon="💰" sub="Toàn thời gian (trừ đơn huỷ)" />
        <StatCard title="Doanh thu hôm nay" value={summary.revenueToday} currency accent="green" icon="📈" sub={new Date().toLocaleDateString('vi-VN')} />
        <StatCard title="Tổng đơn hàng" value={summary.totalOrders} accent="orange" icon="🧾" sub={`${summary.pendingOrders} đơn chờ xử lý`} />
        <StatCard title="Sản phẩm tồn kho thấp" value={summary.lowStockProducts} accent="red" icon="⚠️" sub={`${summary.totalProducts} sản phẩm · ${summary.totalCustomers} khách`} />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-bold text-slate-700 mb-1">Doanh thu 7 ngày gần nhất</h2>
          <p className="text-xs text-slate-400 mb-3">Đơn vị: VND</p>
          <BarChart data={revenueChart} />
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-bold text-slate-700 mb-3">Phân bố trạng thái đơn hàng</h2>
          <DonutChart data={donutData} />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-bold text-slate-700 mb-3">Top 5 sản phẩm bán chạy</h2>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.productId} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <img
                  src={p.imageUrl || ''}
                  alt={p.name}
                  className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-700 truncate">{p.name}</div>
                  <div className="text-xs text-slate-400">Đã bán {p.sold} sản phẩm</div>
                </div>
                <div className="text-sm font-bold text-slate-800">{fmtVND(p.revenue)} ₫</div>
              </div>
            ))}
            {topProducts.length === 0 && <p className="text-sm text-slate-400">Chưa có dữ liệu</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-bold text-slate-700 mb-3">⚠️ Sản phẩm cần nhập hàng</h2>
          <div className="space-y-2">
            {lowStock.map(p => (
              <div key={p.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                <img
                  src={p.imageUrl || ''}
                  alt={p.name}
                  className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-700 truncate">{p.name}</div>
                  <div className="text-xs text-slate-400">{p.category || '—'}</div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.stock <= 5 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                  {p.stock} {p.unit || 'sp'}
                </span>
              </div>
            ))}
            {lowStock.length === 0 && <p className="text-sm text-slate-400">Tất cả sản phẩm đều đủ tồn kho 🎉</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
