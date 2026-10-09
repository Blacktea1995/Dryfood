import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Icon } from '../store/Ui.jsx';
import StatCard from '../components/StatCard.jsx';
import { fmtVND } from '../utils/format.js';

const SEGMENT_STYLES = {
  'VIP': 'bg-amber-brand/15 text-amber-800',
  'Trung thanh': 'bg-emerald-100 text-emerald-800',
  'Moi': 'bg-sky-100 text-sky-800',
  'Co nguy co': 'bg-amber-brand/15 text-amber-deep',
  'Ro bo': 'bg-rose-100 text-rose-800'
};

const RISK_STYLES = {
  'CAO': 'bg-rose-100 text-rose-700',
  'VUA': 'bg-amber-brand/15 text-amber-deep',
  'THAP': 'bg-emerald-100 text-emerald-700'
};

export default function Analytics() {
  const [segments, setSegments] = useState([]);
  const [churn, setChurn] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [demand, setDemand] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(7);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [days]);

  async function load() {
    try {
      setError('');
      setLoading(true);
      const [s, c, f, d] = await Promise.all([
        api.getRfmSegments(),
        api.getChurnRisk(),
        api.getForecast(days),
        api.getDemandForecast()
      ]);
      setSegments(s);
      setChurn(c);
      setForecast(f);
      setDemand(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const totalForecast = forecast.reduce((s, p) => s + p.forecastRev, 0);
  const totalQty = forecast.reduce((s, p) => s + p.forecastQty, 0);
  const highRisk = churn.filter(c => c.riskLevel === 'CAO').length;
  const needRestock = demand.filter(d => d.stock < d.forecastQtyNext7Days).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-2xl text-ink">Phân tích & AI</h1>
        <p className="text-sm text-ink-soft mt-1">Dự báo nhu cầu · khách rời bỏ · phân cụm RFM · gợi ý nhập hàng (tính toán trong Java)</p>
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-danger rounded-card p-4 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center text-ink-faint py-20 animate-pulse">Đang tính toán...</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title={`Dự báo doanh thu ${days} ngày`} value={totalForecast} currency accent="blue" icon="TrendUp" />
            <StatCard title="Dự báo lượng bán" value={totalQty} accent="orange" icon="Package" sub="sản phẩm" />
            <StatCard title="Khách rủi ro cao" value={highRisk} accent="red" icon="WarningCircle" />
            <StatCard title="Sản phẩm cần nhập" value={needRestock} accent="green" icon="TrendDown" />
          </div>

          {/* Forecast */}
          <div className="bg-surface-raised rounded-card border border-line shadow-sm p-6">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h2 className="font-bold text-ink">Dự báo doanh thu & lượng bán</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-ink-soft">Số ngày:</span>
                {[3, 7, 14].map(d => (
                  <button key={d} onClick={() => setDays(d)}
                    className={`px-3 py-1.5 rounded-control text-xs font-semibold ${days === d ? 'bg-forest-800 text-bone-50' : 'bg-bone-100 text-ink-soft hover:bg-bone-200'}`}>
                    {d} ngày
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bone-100 text-ink-soft text-left">
                    <th className="px-4 py-2 font-semibold">Ngày</th>
                    <th className="px-4 py-2 font-semibold text-right">Số lượng dự kiến</th>
                    <th className="px-4 py-2 font-semibold text-right">Doanh thu dự kiến</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.map(f => (
                    <tr key={f.date} className="hairline">
                      <td className="px-4 py-2 text-ink">{f.date}</td>
                      <td className="px-4 py-2 text-right font-semibold text-ink">{f.forecastQty}</td>
                      <td className="px-4 py-2 text-right font-semibold text-forest-700">{fmtVND(f.forecastRev)} ₫</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Demand / restock */}
          <div className="bg-surface-raised rounded-card border border-line shadow-sm p-6">
            <h2 className="font-bold text-ink mb-4">Khuyến nghị nhập hàng (7 ngày tới)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bone-100 text-ink-soft text-left">
                    <th className="px-4 py-2 font-semibold">Sản phẩm</th>
                    <th className="px-4 py-2 font-semibold">Danh mục</th>
                    <th className="px-4 py-2 font-semibold text-right">Dự báo 7 ngày</th>
                    <th className="px-4 py-2 font-semibold text-right">Tồn kho</th>
                    <th className="px-4 py-2 font-semibold">Khuyến nghị</th>
                  </tr>
                </thead>
                <tbody>
                  {demand.map(d => {
                    const need = d.stock < d.forecastQtyNext7Days;
                    return (
                      <tr key={d.productId} className="hairline">
                        <td className="px-4 py-2 font-semibold text-ink">{d.name}</td>
                        <td className="px-4 py-2">
                          <span className="bg-bone-100 text-ink-soft px-2 py-0.5 rounded-md text-xs">{d.category || '-'}</span>
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-ink">{d.forecastQtyNext7Days}</td>
                        <td className={`px-4 py-2 text-right font-bold ${need ? 'text-rose-600' : 'text-emerald-600'}`}>{d.stock}</td>
                        <td className="px-4 py-2 text-xs">
                          {need ? <span className="inline-flex items-center gap-1 text-rose-600 font-semibold"><Icon name="WarningCircle" size={16} /> {d.restockAdvice}</span> : <span className="inline-flex items-center gap-1 text-emerald-600"><Icon name="CheckCircle" size={16} /> Đủ</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* RFM */}
          <div className="bg-surface-raised rounded-card border border-line shadow-sm p-6">
            <h2 className="font-bold text-ink mb-4">Phân cụm khách hàng (RFM)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bone-100 text-ink-soft text-left">
                    <th className="px-4 py-2 font-semibold">Cụm</th>
                    <th className="px-4 py-2 font-semibold text-center">Số khách</th>
                    <th className="px-4 py-2 font-semibold text-right">GTTB trung bình</th>
                    <th className="px-4 py-2 font-semibold text-right">Gần đây TB (ngày)</th>
                    <th className="px-4 py-2 font-semibold text-right">Tần suất TB</th>
                  </tr>
                </thead>
                <tbody>
                  {segments.map(s => (
                    <tr key={s.segment} className="hairline">
                      <td className="px-4 py-2">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${SEGMENT_STYLES[s.segment] || 'bg-bone-100 text-ink-soft'}`}>{s.segment}</span>
                      </td>
                      <td className="px-4 py-2 text-center font-bold text-ink">{s.count}</td>
                      <td className="px-4 py-2 text-right font-semibold text-ink">{fmtVND(s.avgMonetary)} ₫</td>
                      <td className="px-4 py-2 text-right text-ink-soft">{s.avgRecency.toFixed(0)}</td>
                      <td className="px-4 py-2 text-right text-ink-soft">{s.avgFrequency.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-ink-faint mt-3">Mẹo: tặng ưu đãi cho cụm VIP/Trung thành, gửi voucher lấy lại cho cụm Có nguy cơ / Rời bỏ.</p>
          </div>

          {/* Churn */}
          <div className="bg-surface-raised rounded-card border border-line shadow-sm p-6">
            <h2 className="font-bold text-ink mb-4">Khách hàng có nguy cơ rời bỏ (churn)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bone-100 text-ink-soft text-left">
                    <th className="px-4 py-2 font-semibold">Khách hàng</th>
                    <th className="px-4 py-2 font-semibold text-right">Điểm rủi ro</th>
                    <th className="px-4 py-2 font-semibold">Mức rủi ro</th>
                    <th className="px-4 py-2 font-semibold">Gợi ý chăm sóc</th>
                  </tr>
                </thead>
                <tbody>
                  {churn.slice(0, 15).map(c => (
                    <tr key={c.customerId} className="hairline">
                      <td className="px-4 py-2">
                        <div className="font-semibold text-ink">{c.name}</div>
                        <div className="text-xs text-ink-faint">{c.email}</div>
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-ink">{c.churnScore.toFixed(0)}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${RISK_STYLES[c.riskLevel] || 'bg-bone-100 text-ink-soft'}`}>{c.riskLevel}</span>
                      </td>
                      <td className="px-4 py-2 text-xs text-ink-soft">{c.suggestion}</td>
                    </tr>
                  ))}
                  {churn.length === 0 && <tr><td colSpan={4} className="text-center text-ink-faint py-6">Chưa có dữ liệu khách hàng</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}