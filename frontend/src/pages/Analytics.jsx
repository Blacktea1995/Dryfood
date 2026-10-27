import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';
import { Icon } from '../store/Ui.jsx';
import KpiCard, { formatCompact } from '../components/KpiCard.jsx';
import AiInsightWidget from '../components/AiInsightWidget.jsx';
import Modal from '../components/Modal.jsx';
import { fmtVND, fmtDate } from '../utils/format.js';
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell, PieChart, Pie, Legend, ReferenceDot
} from 'recharts';

const FOREST = '#1b4437';
const AMBER = '#c98a2b';
const FOREST_400 = '#6ba78f';
const ROSE = '#e11d48';
const EMERALD = '#10b981';
const SKY = '#0ea5e9';
const INK_FAINT = '#6b7a72';
const GRID = '#e2dccb';

const STATUS_LABELS = { PENDING: 'Chờ xử lý', CONFIRMED: 'Đã xác nhận', SHIPPING: 'Đang giao', DELIVERED: 'Đã giao', CANCELLED: 'Đã huỷ' };
const STATUS_COLORS = { 'Chờ xử lý': AMBER, 'Đã xác nhận': SKY, 'Đang giao': FOREST_400, 'Đã giao': EMERALD, 'Đã huỷ': ROSE };
const SEGMENT_COLORS = { 'VIP': AMBER, 'Trung thanh': EMERALD, 'Moi': SKY, 'Co nguy co': FOREST_400, 'Roi bo': ROSE };
const SEGMENT_STYLES = {
  'VIP': 'bg-amber-brand/15 text-amber-deep', 'Trung thanh': 'bg-emerald-100 text-emerald-800',
  'Moi': 'bg-sky-100 text-sky-800', 'Co nguy co': 'bg-forest-100 text-forest-800', 'Roi bo': 'bg-rose-100 text-rose-800'
};
// Hiển thị tiếng Việt có dấu cho cụm RFM (giá trị nội bộ giữ nguyên)
const SEGMENT_LABELS = {
  'VIP': 'VIP', 'Trung thanh': 'Trung thành', 'Moi': 'Mới', 'Co nguy co': 'Có nguy cơ', 'Roi bo': 'Rời bỏ'
};
const RISK_STYLES = { CAO: 'bg-rose-100 text-rose-700', VUA: 'bg-amber-brand/15 text-amber-deep', THAP: 'bg-emerald-100 text-emerald-700' };

const tooltipStyle = {
  backgroundColor: '#fff', border: '1px solid #e2dccb', borderRadius: '0.625rem',
  fontSize: '12px', boxShadow: '0 10px 30px -12px rgba(24,35,31,0.2)'
};

function VndTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={tooltipStyle} className="px-3 py-2">
      <div className="font-semibold text-[13px] mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 text-xs">
          <span className="inline-flex items-center gap-1.5 text-ink-soft">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color || FOREST }} />
            {p.name}
          </span>
          <span className="font-bold text-ink tabular">{fmtVND(p.value)} ₫</span>
        </div>
      ))}
    </div>
  );
}

const card = 'bg-surface-raised rounded-card border border-line shadow-sm p-6';
const h2 = 'font-bold text-ink mb-4 inline-flex items-center gap-2';

export default function Analytics() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [jobStatus, setJobStatus] = useState('');
  const [segCustomers, setSegCustomers] = useState(null);
  const [segPage, setSegPage] = useState(0);
  const pollRef = useRef(null);

  async function load(d = days, silent = false) {
    if (!silent) setLoading(true);
    setError('');
    try {
      const res = await api.getAnalyticsSnapshot(d);
      setData(res.data);
      setSnapshot(res.snapshot);
    } catch (e) {
      setError(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => { load(days); /* eslint-disable-next-line */ }, [days]);

  async function startRefresh() {
    setError('');
    try {
      const res = await api.postAnalyticsRefresh(days);
      setRefreshing(true);
      setJobStatus('pending');
      const jobId = res.jobId;
      pollRef.current = setInterval(async () => {
        try {
          const st = await api.getAnalyticsRefreshStatus(jobId);
          setJobStatus(st.status);
          if (st.status === 'done' || st.status === 'failed') {
            clearInterval(pollRef.current);
            pollRef.current = null;
            setRefreshing(false);
            await load(days, true);
          }
        } catch (e) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setRefreshing(false);
          setError(e.message);
        }
      }, 3000);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  async function openSegment(segment, page = 0) {
    setSegPage(page);
    try {
      const res = await api.getSegmentCustomers(segment, page, 10);
      setSegCustomers({ segment, ...res });
    } catch (e) {
      setError(e.message);
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

  if (error && !data) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-control border border-rose-200 bg-rose-50 text-rose-700 p-6 text-sm">
        <Icon name="WarningCircle" size={24} />
        <span>Không tải được dữ liệu: {error}</span>
        <button onClick={() => load(days)} className="rounded-control bg-forest-800 hover:bg-forest-700 text-bone-50 px-4 py-2 text-sm font-semibold">
          Thử lại
        </button>
      </div>
    );
  }

  const d = data || {};
  const revSeries = d.revenueSeries || [];
  const payload = snapshot?.payload || {};
  const isAI = snapshot?.source === 'ai';
  const createdStr = snapshot?.createdAt ? new Date(snapshot.createdAt).toLocaleString('vi-VN') : '';
  const kpiInsights = (payload.kpi_insights || []).reduce((m, x) => { m[x.key] = x; return m; }, {});
  const kpiSpark = revSeries.slice(-7).map(p => p.revenue);

  const revenueChart = [
    ...revSeries.map(p => ({ name: fmtDate(p.date).slice(5), actual: p.revenue })),
    ...(payload.revenue_forecast?.points || []).map(p => ({
      name: fmtDate(p.date).slice(5), aiForecast: p.value, aiLower: p.lower, aiUpper: p.upper
    }))
  ];
  const anomalies = payload.anomalies || [];
  const anomalyDates = anomalies
    .filter(a => a && a.date)
    .map(a => a.date);

  const statusPie = (d.statusCounts || []).map(s => ({
    name: STATUS_LABELS[s.status] || s.status, value: s.count, color: STATUS_COLORS[STATUS_LABELS[s.status]] || FOREST_400
  }));
  const catPie = (d.categoryRevenue || []).slice(0, 6).map((c, i) => ({
    name: c.category, value: c.revenue, color: [FOREST, AMBER, FOREST_400, SKY, EMERALD, ROSE][i % 6]
  }));
  const rfmPie = (d.rfmSegments || []).map(s => ({
    name: SEGMENT_LABELS[s.segment] || s.segment, value: s.count, color: SEGMENT_COLORS[s.segment] || FOREST_400
  }));
  const topBar = (d.topProducts || []).slice(0, 10).map(p => ({
    name: p.name.length > 16 ? p.name.slice(0, 16) + '…' : p.name, sold: p.sold
  }));
  const needRestock = (d.lowStock || []).length;
  const totalForecast = (payload.revenue_forecast?.points || []).reduce((s, p) => s + p.value, 0);

  const churnDrivers = (payload.churn_risk?.drivers || []).slice(0, 4);
  const recs = (payload.recommendations || []).slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="display text-2xl text-ink">Phân tích &amp; AI</h1>
          <p className="text-sm text-ink-faint mt-1">
            {snapshot
              ? isAI
                ? `Phân tích bởi AI lúc ${createdStr}`
                : `Phân tích tự động (chưa dùng AI) · cập nhật ${createdStr}`
              : 'Chưa có bản phân tích nào'}
            {snapshot?.error ? ` · ${snapshot.error}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 rounded-control border border-line bg-surface-raised p-1">
            {[7, 30, 90].map(dv => (
              <button key={dv} onClick={() => setDays(dv)}
                className={`px-3 py-1.5 rounded-control text-xs font-semibold ${days === dv ? 'bg-forest-800 text-bone-50' : 'text-ink-soft hover:bg-bone-100'}`}>
                {dv} ngày
              </button>
            ))}
          </div>
          <button
            onClick={startRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-control bg-forest-800 hover:bg-forest-700 text-bone-50 px-4 py-2 text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            <Icon name="Info" size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? (jobStatus === 'running' ? 'Đang phân tích...' : 'Đang xếp hàng...') : 'Phân tích lại'}
          </button>
          <a href={api.exportAnalyticsCsvUrl(days)} className="inline-flex items-center gap-1.5 rounded-control border border-line-strong bg-surface-raised px-4 py-2 text-sm font-semibold text-ink-soft hover:border-forest-400 hover:text-forest-800 transition-colors">
            <Icon name="Export" size={16} />
            Xuất báo cáo
          </a>
        </div>
      </div>

      {error && <div className="rounded-control border border-rose-200 bg-rose-50 text-rose-700 p-3 text-sm">{error}</div>}

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard label="Tổng doanh thu" value={d.totalRevenue || 0} currency changePct={kpiInsights.revenue?.change_pct} sparkData={kpiSpark} insight={kpiInsights.revenue?.insight} accent="forest" />
        <KpiCard label="Doanh thu hôm nay" value={d.revenueToday || 0} currency insight={kpiInsights.revenue?.insight} accent="amber" />
        <KpiCard label="Tổng đơn hàng" value={d.totalOrders || 0} changePct={kpiInsights.orders?.change_pct} insight={kpiInsights.orders?.insight} accent="sky" />
        <KpiCard label="Đơn chờ xử lý" value={d.pendingOrders || 0} insight={kpiInsights.pending?.insight} accent="rose" />
        <KpiCard label="Tồn kho thấp" value={needRestock} insight={kpiInsights.low_stock?.insight} accent="amber" />
        <KpiCard label="Khách hàng" value={d.totalCustomers || 0} changePct={kpiInsights.customers?.change_pct} insight={kpiInsights.customers?.insight} accent="forest" />
      </div>

      {/* Revenue chart */}
      <div className={card}>
        <h2 className={h2}><Icon name="TrendUp" size={18} className="text-forest-700" /> Doanh thu thực &amp; dự báo {days} ngày</h2>
        {payload.revenue_forecast?.assumptions && (
          <p className="text-xs text-ink-faint mb-3">{payload.revenue_forecast.assumptions}</p>
        )}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={revenueChart} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: INK_FAINT }} axisLine={{ stroke: GRID }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: INK_FAINT }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(0) + 'k' : v} />
              <Tooltip content={<VndTooltip />} />
              <Area type="monotone" dataKey="aiUpper" name="Khoảng trên (AI)" stroke="none" fill={AMBER} fillOpacity={0.08} />
              <Area type="monotone" dataKey="aiLower" name="Khoảng dưới (AI)" stroke="none" fill={AMBER} fillOpacity={0.08} />
              <Line type="monotone" dataKey="actual" name="Doanh thu thực" stroke={FOREST} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="aiForecast" name="Dự báo AI (ước tính)" stroke={AMBER} strokeWidth={2} strokeDasharray="6 4" dot={false} />
              {anomalyDates.slice(0, 3).map((ad, i) => (
                <ReferenceDot key={i} x={fmtDate(ad).slice(5)} y={0} r={4} fill={ROSE} stroke="#fff" strokeWidth={1} />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-ink-faint mt-2">
          Đường liền: doanh thu thực từ DB. Nét đứt: dự báo AI (ước tính) kèm dải tin cậy. Chấm đỏ: điểm bất thường.
          {payload.revenue_forecast?.confidence ? ` Độ tin cậy: ${payload.revenue_forecast.confidence}.` : ''}
        </p>
      </div>

      {/* Top products + status + category */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className={`lg:col-span-1 ${card}`}>
          <h2 className={h2}><Icon name="Package" size={18} className="text-forest-700" /> Top 10 sản phẩm</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topBar} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: INK_FAINT }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={96} tick={{ fontSize: 10, fill: INK_FAINT }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(107,167,143,0.08)' }} contentStyle={tooltipStyle} />
                <Bar dataKey="sold" name="Đã bán" radius={[0, 6, 6, 0]} fill={FOREST}>
                  {topBar.map((_, i) => <Cell key={i} fill={i === 0 ? AMBER : FOREST} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className={`lg:col-span-1 ${card}`}>
          <h2 className={h2}><Icon name="Receipt" size={18} className="text-forest-700" /> Đơn theo trạng thái</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusPie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {statusPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className={`lg:col-span-1 ${card}`}>
          <h2 className={h2}><Icon name="ChartLineUp" size={18} className="text-forest-700" /> Doanh thu theo danh mục</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={catPie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {catPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<VndTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* RFM block */}
      <div className={card}>
        <h2 className={h2}><Icon name="Users" size={18} className="text-forest-700" /> Phân cụm khách hàng (RFM)</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="h-64 md:col-span-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={rfmPie} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {rfmPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="md:col-span-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bone-100/60 text-ink-soft text-left">
                  <th className="px-3 py-2 font-semibold">Cụm</th>
                  <th className="px-3 py-2 font-semibold text-right">Số khách</th>
                  <th className="px-3 py-2 font-semibold text-right">Giá trị TB (₫)</th>
                  <th className="px-3 py-2 font-semibold text-right">Gần đây TB (ngày)</th>
                  <th className="px-3 py-2 font-semibold text-right">Tần suất TB</th>
                </tr>
              </thead>
              <tbody>
                {(d.rfmSegments || []).map(s => {
                  const aiSeg = (payload.rfm_segments || []).find(x => x.name === s.segment);
                  return (
                    <tr key={s.segment} className="border-t border-line hover:bg-bone-50/60">
                      <td className="px-3 py-2">
                        <button
                          onClick={() => openSegment(s.segment, 0)}
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold hover:underline ${SEGMENT_STYLES[s.segment] || 'bg-bone-100 text-ink-soft'}`}
                        >
                          {SEGMENT_LABELS[s.segment] || s.segment}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-ink tabular">{s.count}</td>
                      <td className="px-3 py-2 text-right font-semibold text-ink tabular">{fmtVND(s.avgMonetary)}</td>
                      <td className="px-3 py-2 text-right text-ink-soft tabular">{s.avgRecency.toFixed(0)}</td>
                      <td className="px-3 py-2 text-right text-ink-soft tabular">{s.avgFrequency.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {(payload.rfm_segments || []).length > 0 && (
              <div className="mt-3 space-y-2">
                {(payload.rfm_segments || []).map(s => (
                  <div key={s.name} className="text-xs text-ink-soft">
                    <b className="text-ink">{SEGMENT_LABELS[s.name] || s.name}:</b> {s.insight}
                    {s.action && <span className="text-forest-700"> · {s.action}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="text-[11px] text-ink-faint mt-2">Phân cụm theo Luật RFM (không phải mô hình học máy). Bấm cụm để xem danh sách khách.</p>
      </div>

      {/* Demand + churn + recommendations */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className={`lg:col-span-1 ${card}`}>
          <h2 className={h2}><Icon name="TrendDown" size={18} className="text-amber-deep" /> Nguy cơ hết hàng</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(payload.demand_forecast || []).slice(0, 8).map((x, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded-control border border-line px-2.5 py-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-ink truncate">{x.product}</div>
                  <div className="text-[11px] text-ink-faint">Tuần tới: {(x.next_weeks || []).join(', ')}</div>
                </div>
                <span className={`shrink-0 text-[11px] font-bold rounded-full px-2 py-0.5 ${
                  x.stock_risk === 'high' ? 'bg-rose-100 text-rose-700'
                    : x.stock_risk === 'medium' ? 'bg-amber-brand/15 text-amber-deep'
                    : 'bg-emerald-100 text-emerald-800'}`}>
                  {x.stock_risk === 'high' ? 'Nguy cơ cao' : x.stock_risk === 'medium' ? 'Cần theo dõi' : 'Đủ'}
                </span>
              </div>
            ))}
            {(payload.demand_forecast || []).length === 0 && (
              <p className="text-xs text-ink-faint">Chưa có dữ liệu dự báo nhu cầu.</p>
            )}
          </div>
        </div>
        <div className={`lg:col-span-1 ${card}`}>
          <h2 className={h2}><Icon name="WarningCircle" size={18} className="text-rose-600" /> Rủi ro rời bỏ</h2>
          <div className="space-y-2">
            {[
              { k: 'high', label: 'Cao', cls: 'text-rose-600' },
              { k: 'medium', label: 'Vừa', cls: 'text-amber-deep' },
              { k: 'low', label: 'Thấp', cls: 'text-emerald-600' }
            ].map(r => (
              <div key={r.k} className="flex items-center justify-between rounded-control border border-line px-3 py-2">
                <span className="text-sm text-ink-soft">Mức {r.label}</span>
                <span className={`text-lg font-extrabold tabular ${r.cls}`}>{payload.churn_risk?.[r.k] ?? 0}</span>
              </div>
            ))}
          </div>
          {churnDrivers.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-ink-soft mb-1">Yếu tố chính:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {churnDrivers.map((x, i) => <li key={i} className="text-xs text-ink-soft">{x}</li>)}
              </ul>
            </div>
          )}
          <p className="text-[11px] text-ink-faint mt-3">Ước tính theo luật RFM.</p>
        </div>
        <div className={`lg:col-span-1 ${card}`}>
          <h2 className={h2}><Icon name="CaretRight" size={18} className="text-forest-700" /> Khuyến nghị</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recs.map((r, i) => (
              <div key={i} className="rounded-control border border-line p-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
                    r.priority === 'high' ? 'bg-rose-100 text-rose-700'
                      : r.priority === 'medium' ? 'bg-amber-brand/15 text-amber-deep'
                      : 'bg-forest-100 text-forest-800'}`}>
                    {r.priority === 'high' ? 'Ưu tiên cao' : r.priority === 'medium' ? 'Ưu tiên vừa' : 'Ưu tiên thấp'}
                  </span>
                  <span className="text-sm font-bold text-ink">{r.title}</span>
                </div>
                {r.detail && <p className="text-xs text-ink-soft mt-1">{r.detail}</p>}
              </div>
            ))}
            {recs.length === 0 && <p className="text-xs text-ink-faint">Chưa có khuyến nghị.</p>}
          </div>
        </div>
      </div>

      {/* Footnotes */}
      <p className="text-[11px] text-ink-faint">
        Phân tích do AI tạo từ số liệu tổng hợp; dự báo mang tính ước tính. Dữ liệu không chứa thông tin cá nhân khách hàng.
      </p>

      {/* Box notification bottom-right */}
      <AiInsightWidget snapshot={snapshot} loading={loading} />

      {/* Segment customers modal */}
      <Modal open={segCustomers !== null} onClose={() => setSegCustomers(null)}
        title={`Khách hàng cụm ${SEGMENT_LABELS[segCustomers?.segment] || segCustomers?.segment || ''} (${segCustomers?.total || 0})`} width="max-w-2xl">
        {segCustomers && (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bone-100/60 text-ink-soft text-left">
                    <th className="px-3 py-2 font-semibold">Tên</th>
                    <th className="px-3 py-2 font-semibold">Email</th>
                    <th className="px-3 py-2 font-semibold">SĐT</th>
                  </tr>
                </thead>
                <tbody>
                  {segCustomers.customers.map(c => (
                    <tr key={c.id} className="border-t border-line">
                      <td className="px-3 py-2 font-semibold text-ink">{c.name}</td>
                      <td className="px-3 py-2 text-ink-soft">{c.email}</td>
                      <td className="px-3 py-2 text-ink-soft">{c.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4">
              <button onClick={() => openSegment(segCustomers.segment, Math.max(0, segPage - 1))}
                disabled={segPage === 0}
                className="rounded-control border border-line px-3 py-1.5 text-sm font-semibold text-ink-soft disabled:opacity-40 hover:border-forest-400">
                ← Trang trước
              </button>
              <span className="text-sm text-ink-faint">Trang {segPage + 1}</span>
              <button onClick={() => openSegment(segCustomers.segment, segPage + 1)}
                disabled={(segPage + 1) * 10 >= segCustomers.total}
                className="rounded-control border border-line px-3 py-1.5 text-sm font-semibold text-ink-soft disabled:opacity-40 hover:border-forest-400">
                Trang sau →
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}