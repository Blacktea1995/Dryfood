import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Icon } from '../store/Ui.jsx';
import StatCard from '../components/StatCard.jsx';
import { fmtVND, fmtDate } from '../utils/format.js';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell, PieChart, Pie, Legend, ComposedChart, Line
} from 'recharts';

const FOREST = '#1b4437';
const AMBER = '#c98a2b';
const FOREST_400 = '#6ba78f';
const ROSE = '#e11d48';
const EMERALD = '#10b981';
const SKY = '#0ea5e9';
const INK_FAINT = '#6b7a72';
const GRID = '#e2dccb';

const STATUS_LABELS = {
  PENDING: 'Chờ xử lý',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã huỷ'
};

const STATUS_COLORS = {
  'Chờ xử lý': AMBER,
  'Đã xác nhận': SKY,
  'Đang giao': FOREST_400,
  'Đã giao': EMERALD,
  'Đã huỷ': ROSE
};

const SEGMENT_COLORS = {
  'VIP': AMBER,
  'Trung thanh': EMERALD,
  'Moi': SKY,
  'Co nguy co': FOREST_400,
  'Ro bo': ROSE
};

const SEGMENT_STYLES = {
  'VIP': 'bg-amber-brand/15 text-amber-deep',
  'Trung thanh': 'bg-emerald-100 text-emerald-800',
  'Moi': 'bg-sky-100 text-sky-800',
  'Co nguy co': 'bg-forest-100 text-forest-800',
  'Ro bo': 'bg-rose-100 text-rose-800'
};

const RISK_STYLES = {
  'CAO': 'bg-rose-100 text-rose-700',
  'VUA': 'bg-amber-brand/15 text-amber-deep',
  'THAP': 'bg-emerald-100 text-emerald-700'
};

const chartTooltipStyle = {
  backgroundColor: '#fff',
  border: '1px solid #e2dccb',
  borderRadius: '0.625rem',
  fontSize: '12px',
  boxShadow: '0 10px 30px -12px rgba(24,35,31,0.2)'
};

function VndTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={chartTooltipStyle} className="px-3 py-2">
      <div className="font-semibold text-[13px] mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 text-xs">
          <span className="inline-flex items-center gap-1.5 text-ink-soft">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-bold text-ink tabular">
            {p.dataKey === 'forecastRev' || p.dataKey === 'revenue' ? fmtVND(p.value) + ' ₫' : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [revenue7, setRevenue7] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [segments, setSegments] = useState([]);
  const [churn, setChurn] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [demand, setDemand] = useState([]);
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(7);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [days]);

  async function load() {
    try {
      setError('');
      setLoading(true);
      const [sum, rev, top, st, low, s, c, f, d, ins] = await Promise.all([
        api.getDashboardSummary(),
        api.getRevenue7Days(),
        api.getTopProducts(),
        api.getOrdersByStatus(),
        api.getInventoryLow(),
        api.getRfmSegments(),
        api.getChurnRisk(),
        api.getForecast(days),
        api.getDemandForecast(),
        api.getAnalyticsInsights(days)
      ]);
      setSummary(sum);
      setRevenue7(rev);
      setTopProducts(top);
      setStatusData(st);
      setLowStock(low);
      setSegments(s);
      setChurn(c);
      setForecast(f);
      setDemand(d);
      setInsight(ins);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 bg-bone-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-24 bg-bone-100 rounded-card animate-pulse" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="h-72 bg-bone-100 rounded-card animate-pulse" />
          <div className="h-72 bg-bone-100 rounded-card animate-pulse" />
        </div>
        <p className="text-center text-ink-faint animate-pulse">Đang tổng hợp dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-control border border-rose-200 bg-rose-50 text-rose-700 p-4 text-sm">
        <Icon name="WarningCircle" size={20} />
        Không tải được dữ liệu: {error}
      </div>
    );
  }

  // Charts data (dữ liệu thật)
  const statusPie = (statusData || []).map(s => {
    const label = STATUS_LABELS[s.status] || s.status;
    return { name: label, value: s.count, color: STATUS_COLORS[label] || FOREST_400 };
  });

  const segmentPie = (segments || []).map(s => ({
    name: s.segment,
    value: s.count,
    color: SEGMENT_COLORS[s.segment] || FOREST_400
  }));

  const revenueChart = [
    ...(revenue7 || []).map(p => ({ name: fmtDate(p.date).slice(0, 5), revenue: p.revenue, forecast: null })),
    ...(forecast || []).map(f => ({ name: 'DB ' + f.date.slice(5), forecastRev: f.forecastRev }))
  ];

  const churnLevels = [
    { name: 'Cao', value: churn.filter(c => c.riskLevel === 'CAO').length, color: ROSE },
    { name: 'Vừa', value: churn.filter(c => c.riskLevel === 'VUA').length, color: AMBER },
    { name: 'Thấp', value: churn.filter(c => c.riskLevel === 'THAP').length, color: EMERALD }
  ];

  const topBar = (topProducts || []).slice(0, 6).map(p => ({
    name: p.name.length > 18 ? p.name.slice(0, 18) + '...' : p.name,
    sold: p.sold
  }));

  const totalForecast = forecast.reduce((s, p) => s + p.forecastRev, 0);
  const totalQty = forecast.reduce((s, p) => s + p.forecastQty, 0);
  const highRisk = churn.filter(c => c.riskLevel === 'CAO').length;
  const needRestock = demand.filter(d => d.stock < d.forecastQtyNext7Days).length;

  const card = 'bg-surface-raised rounded-card border border-line shadow-sm p-6';
  const h2 = 'font-bold text-ink mb-4 inline-flex items-center gap-2';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Phân tích & AI</h1>
          <p className="text-sm text-ink-faint mt-1">Tổng quan kinh doanh · dự báo · khách hàng · tồn kho</p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-control border border-line-strong bg-surface-raised px-4 py-2 text-sm font-semibold text-ink-soft hover:border-forest-400 hover:text-forest-800 transition-colors"
        >
          <Icon name="Info" size={16} />
          Làm mới
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard title="Tổng doanh thu" value={summary?.totalRevenue || 0} currency accent="blue" icon="TrendUp" />
        <StatCard title="Doanh thu hôm nay" value={summary?.revenueToday || 0} currency accent="green" icon="TrendUp" />
        <StatCard title="Tổng đơn hàng" value={summary?.totalOrders || 0} accent="orange" icon="Receipt" />
        <StatCard title="Đơn chờ xử lý" value={summary?.pendingOrders || 0} accent="red" icon="Clock" />
        <StatCard title="Tồn kho thấp" value={summary?.lowStockProducts || 0} accent="violet" icon="WarningCircle" />
        <StatCard title="Khách hàng" value={summary?.totalCustomers || 0} accent="blue" icon="Users" />
      </div>

      {/* Revenue actual + forecast */}
      <div className={card}>
        <h2 className={h2}>
          <Icon name="TrendUp" size={18} className="text-forest-700" />
          Doanh thu 7 ngày qua & dự báo {days} ngày tới
        </h2>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-ink-soft">Số ngày dự báo:</span>
          {[3, 7, 14].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-control text-xs font-semibold ${days === d ? 'bg-forest-800 text-bone-50' : 'bg-bone-100 text-ink-soft hover:bg-bone-200'}`}>
              {d} ngày
            </button>
          ))}
          <span className="ml-auto text-sm text-ink-faint tabular">Tổng dự báo: <b className="text-forest-800">{fmtVND(totalForecast)} ₫</b> · {totalQty} sản phẩm</span>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={revenueChart} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: INK_FAINT }} axisLine={{ stroke: GRID }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: INK_FAINT }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(0) + 'k' : v} />
              <Tooltip content={<VndTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Doanh thu thực" stroke={FOREST} fill={FOREST_400} fillOpacity={0.25} strokeWidth={2} />
              <Line type="monotone" dataKey="forecastRev" name="Dự báo" stroke={AMBER} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3, fill: AMBER }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status pie + Top products */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className={card}>
          <h2 className={h2}><Icon name="Receipt" size={18} className="text-forest-700" /> Phân bố trạng thái đơn hàng</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {statusPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<VndTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={card}>
          <h2 className={h2}><Icon name="Package" size={18} className="text-forest-700" /> Top sản phẩm bán chạy</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topBar} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: INK_FAINT }} interval={0} angle={-12} textAnchor="end" height={52} axisLine={{ stroke: GRID }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: INK_FAINT }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<VndTooltip />} cursor={{ fill: 'rgba(107,167,143,0.08)' }} />
                <Bar dataKey="sold" name="Đã bán" radius={[6, 6, 0, 0]} fill={FOREST}>
                  {topBar.map((_, i) => <Cell key={i} fill={i === 0 ? AMBER : FOREST} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* RFM + Churn */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className={card}>
          <h2 className={h2}><Icon name="Users" size={18} className="text-forest-700" /> Phân cụm khách hàng (RFM)</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={segmentPie} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
                  {segmentPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<VndTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={card}>
          <h2 className={h2}><Icon name="WarningCircle" size={18} className="text-rose-600" /> Khách rời bỏ theo mức rủi ro</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={churnLevels} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: INK_FAINT }} axisLine={{ stroke: GRID }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: INK_FAINT }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<VndTooltip />} cursor={{ fill: 'rgba(225,29,72,0.06)' }} />
                <Bar dataKey="value" name="Khách" radius={[6, 6, 0, 0]}>
                  {churnLevels.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI insight */}
      {insight && (
        <div className="rounded-card border border-forest-200 bg-forest-50 p-6 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <h2 className="font-bold text-ink inline-flex items-center gap-2">
              <Icon name="CaretRight" size={18} className="text-forest-700" />
              AI nhận định & khuyến nghị
            </h2>
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2.5 py-1 ${insight.useLLM ? 'bg-emerald-100 text-emerald-800' : 'bg-bone-200 text-ink-soft'}`}>
              <Icon name={insight.useLLM ? 'CheckCircle' : 'Info'} size={12} />
              {insight.useLLM ? `AI thật (${insight.source})` : 'Phân tích trong Java (rule)'}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-ink whitespace-pre-wrap">{insight.text}</p>
        </div>
      )}

      {/* Tables: forecast + demand + RFM + churn */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Forecast table */}
        <div className={card}>
          <h2 className={h2}><Icon name="ChartLineUp" size={18} className="text-forest-700" /> Chi tiết dự báo {days} ngày</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bone-100/60 text-ink-soft text-left">
                  <th className="px-3 py-2 font-semibold">Ngày</th>
                  <th className="px-3 py-2 font-semibold text-right">Lượng bán</th>
                  <th className="px-3 py-2 font-semibold text-right">Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {forecast.map(f => (
                  <tr key={f.date} className="border-t border-line">
                    <td className="px-3 py-2 text-ink tabular">{fmtDate(f.date)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-ink tabular">{f.forecastQty}</td>
                    <td className="px-3 py-2 text-right font-semibold text-forest-700 tabular">{fmtVND(f.forecastRev)} ₫</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-line-strong bg-bone-100/40">
                  <td className="px-3 py-2 font-bold text-ink">Tổng cộng</td>
                  <td className="px-3 py-2 text-right font-bold text-ink tabular">{totalQty}</td>
                  <td className="px-3 py-2 text-right font-bold text-forest-800 tabular">{fmtVND(totalForecast)} ₫</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Demand / restock */}
        <div className={card}>
          <h2 className={h2}><Icon name="TrendDown" size={18} className="text-amber-deep" /> Khuyến nghị nhập hàng (7 ngày tới)</h2>
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bone-100/60 text-ink-soft text-left sticky top-0">
                  <th className="px-3 py-2 font-semibold">Sản phẩm</th>
                  <th className="px-3 py-2 font-semibold text-right">Dự báo</th>
                  <th className="px-3 py-2 font-semibold text-right">Tồn kho</th>
                  <th className="px-3 py-2 font-semibold">Khuyến nghị</th>
                </tr>
              </thead>
              <tbody>
                {demand.slice(0, 10).map(d => {
                  const need = d.stock < d.forecastQtyNext7Days;
                  return (
                    <tr key={d.productId} className="border-t border-line">
                      <td className="px-3 py-2">
                        <div className="font-semibold text-ink">{d.name}</div>
                        <div className="text-xs text-ink-faint">{d.category || '-'}</div>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-ink tabular">{d.forecastQtyNext7Days}</td>
                      <td className={`px-3 py-2 text-right font-bold tabular ${need ? 'text-rose-600' : 'text-emerald-600'}`}>{d.stock}</td>
                      <td className="px-3 py-2 text-xs">
                        {need
                          ? <span className="inline-flex items-center gap-1 text-rose-600 font-semibold"><Icon name="WarningCircle" size={14} /> {d.restockAdvice}</span>
                          : <span className="inline-flex items-center gap-1 text-emerald-600"><Icon name="CheckCircle" size={14} /> Đủ</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RFM detail table */}
      <div className={card}>
        <h2 className={h2}><Icon name="Users" size={18} className="text-forest-700" /> Chi tiết phân cụm RFM</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bone-100/60 text-ink-soft text-left">
                <th className="px-3 py-2 font-semibold">Cụm</th>
                <th className="px-3 py-2 font-semibold text-center">Số khách</th>
                <th className="px-3 py-2 font-semibold text-right">Giá trị TB (₫)</th>
                <th className="px-3 py-2 font-semibold text-right">Gần đây TB (ngày)</th>
                <th className="px-3 py-2 font-semibold text-right">Tần suất TB</th>
              </tr>
            </thead>
            <tbody>
              {segments.map(s => (
                <tr key={s.segment} className="border-t border-line">
                  <td className="px-3 py-2">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${SEGMENT_STYLES[s.segment] || 'bg-bone-100 text-ink-soft'}`}>{s.segment}</span>
                  </td>
                  <td className="px-3 py-2 text-center font-bold text-ink tabular">{s.count}</td>
                  <td className="px-3 py-2 text-right font-semibold text-ink tabular">{fmtVND(s.avgMonetary)}</td>
                  <td className="px-3 py-2 text-right text-ink-soft tabular">{s.avgRecency.toFixed(0)}</td>
                  <td className="px-3 py-2 text-right text-ink-soft tabular">{s.avgFrequency.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Churn detail */}
      <div className={card}>
        <h2 className={h2}><Icon name="WarningCircle" size={18} className="text-rose-600" /> Khách hàng có nguy cơ rời bỏ cao</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bone-100/60 text-ink-soft text-left">
                <th className="px-3 py-2 font-semibold">Khách hàng</th>
                <th className="px-3 py-2 font-semibold text-right">Điểm rủi ro</th>
                <th className="px-3 py-2 font-semibold">Mức</th>
                <th className="px-3 py-2 font-semibold">Gợi ý chăm sóc</th>
              </tr>
            </thead>
            <tbody>
              {churn.filter(c => c.riskLevel === 'CAO').slice(0, 10).map(c => (
                <tr key={c.customerId} className="border-t border-line">
                  <td className="px-3 py-2">
                    <div className="font-semibold text-ink">{c.name}</div>
                    <div className="text-xs text-ink-faint">{c.email}</div>
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-ink tabular">{c.churnScore.toFixed(0)}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${RISK_STYLES[c.riskLevel] || 'bg-bone-100 text-ink-soft'}`}>{c.riskLevel}</span>
                  </td>
                  <td className="px-3 py-2 text-xs text-ink-soft">{c.suggestion}</td>
                </tr>
              ))}
              {churn.filter(c => c.riskLevel === 'CAO').length === 0 && (
                <tr><td colSpan={4} className="text-center text-ink-faint py-6">Chưa có khách hàng rủi ro cao</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}