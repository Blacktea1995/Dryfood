import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import StatCard from '../components/StatCard.jsx';
import BarChart from '../components/BarChart.jsx';
import DonutChart from '../components/DonutChart.jsx';
import StatusBadge, { LABELS } from '../components/StatusBadge.jsx';
import { fmtVND, fmtDate } from '../utils/format.js';
import { Icon } from '../store/Ui.jsx';

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
    return <div className="text-center text-ink-faint py-20">Đang tải dữ liệu...</div>;
  }

  if (error) {
    return (
      <div className="rounded-control border border-rose-200 bg-rose-50 text-rose-700 p-4">
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

  const cardCls = 'bg-surface-raised rounded-card border border-line p-5 shadow-sm';
  const h2Cls = 'font-bold text-ink mb-1';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Tổng quan kinh doanh</h1>
          <p className="text-sm text-ink-faint mt-1">Phân tích dữ liệu bán hàng thực phẩm khô</p>
        </div>
        <div className="flex items-center gap-2">
          <a href={api.exportUrl('orders')} className="inline-flex items-center gap-1.5 rounded-control bg-forest-800 hover:bg-forest-700 text-bone-50 px-4 py-2.5 font-semibold text-sm transition-colors">
            <Icon name="Tag" size={16} />
            Xuất đơn hàng CSV
          </a>
          <a href={api.exportUrl('order-items')} className="inline-flex items-center gap-1.5 rounded-control bg-forest-800 hover:bg-forest-700 text-bone-50 px-4 py-2.5 font-semibold text-sm transition-colors">
            <Icon name="Tag" size={16} />
            Xuất chi tiết CSV
          </a>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Tổng doanh thu" value={summary.totalRevenue} currency accent="blue" icon="D" sub="Toàn thời gian (trừ đơn huỷ)" />
        <StatCard title="Doanh thu hôm nay" value={summary.revenueToday} currency accent="green" icon="D" sub={new Date().toLocaleDateString('vi-VN')} />
        <StatCard title="Tổng đơn hàng" value={summary.totalOrders} accent="orange" icon="D" sub={`${summary.pendingOrders} đơn chờ xử lý`} />
        <StatCard title="Sản phẩm tồn kho thấp" value={summary.lowStockProducts} accent="red" icon="D" sub={`${summary.totalProducts} sản phẩm · ${summary.totalCustomers} khách`} />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-5 gap-4">
        <div className={`lg:col-span-3 ${cardCls}`}>
          <h2 className={h2Cls}>Doanh thu 7 ngày gần nhất</h2>
          <p className="text-xs text-ink-faint mb-3">Đơn vị: VND</p>
          <BarChart data={revenueChart} />
        </div>

        <div className={`lg:col-span-2 ${cardCls}`}>
          <h2 className="font-bold text-ink mb-3">Phân bố trạng thái đơn hàng</h2>
          <DonutChart data={donutData} />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className={cardCls}>
          <h2 className="font-bold text-ink mb-3">Top 5 sản phẩm bán chạy</h2>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.productId} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-brand/15 text-amber-deep text-xs font-bold grid place-items-center shrink-0 tabular">
                  {i + 1}
                </span>
                <img
                  src={p.imageUrl || ''}
                  alt={p.name}
                  className="w-10 h-10 rounded-control object-cover bg-bone-100 shrink-0"
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-ink truncate">{p.name}</div>
                  <div className="text-xs text-ink-faint">Đã bán {p.sold} sản phẩm</div>
                </div>
                <div className="text-sm font-bold text-ink tabular">{fmtVND(p.revenue)} ₫</div>
              </div>
            ))}
            {topProducts.length === 0 && <p className="text-sm text-ink-faint">Chưa có dữ liệu</p>}
          </div>
        </div>

        <div className={cardCls}>
          <h2 className="font-bold text-ink mb-3 inline-flex items-center gap-1.5">
            <Icon name="WarningCircle" size={16} className="text-amber-deep" />
            Sản phẩm cần nhập hàng
          </h2>
          <div className="space-y-2">
            {lowStock.map(p => (
              <div key={p.id} className="flex items-center gap-3 py-2 border-b border-line last:border-0">
                <img
                  src={p.imageUrl || ''}
                  alt={p.name}
                  className="w-10 h-10 rounded-control object-cover bg-bone-100 shrink-0"
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-ink truncate">{p.name}</div>
                  <div className="text-xs text-ink-faint">{p.category || '—'}</div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.stock <= 5 ? 'bg-rose-100 text-rose-700' : 'bg-amber-brand/15 text-amber-deep'}`}>
                  {p.stock} {p.unit || 'sp'}
                </span>
              </div>
            ))}
            {lowStock.length === 0 && <p className="text-sm text-ink-faint">Tất cả sản phẩm đều đủ tồn kho</p>}
          </div>
        </div>
      </div>
    </div>
  );
}