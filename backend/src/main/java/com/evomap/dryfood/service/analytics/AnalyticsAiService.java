package com.evomap.dryfood.service.analytics;

import com.evomap.dryfood.model.Product;
import com.evomap.dryfood.model.analytics.AnalyticsJob;
import com.evomap.dryfood.model.analytics.AnalyticsSnapshot;
import com.evomap.dryfood.repository.AnalyticsJobRepository;
import com.evomap.dryfood.repository.AnalyticsSnapshotRepository;
import com.evomap.dryfood.service.OpenAiChatService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Pipeline phan tich AI:
 * gom du lieu -> forecast Java (doi chung) -> goi OpenAI -> validator -> luu snapshot.
 *
 * <p>Loi/het quota/khong key -> fallback snapshot {@code source="fallback"}.
 * Fallback KHONG con la placeholder rong: moi phan (du bao, nhu cau, churn, RFM,
 * khuyen nghi, canh bao) deu duoc tinh bang cac heuristic Java thuc te
 * ({@link AnalyticsService}, {@link ForecastEngine}), chi thieu phan nhan xet
 * van xuoi cua AI.
 */
@Service
public class AnalyticsAiService {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsAiService.class);
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final Locale VI = Locale.forLanguageTag("vi-VN");
    private static final int FORECAST_HORIZON_DAYS = 30;
    private static final int DEMAND_TOP_N = 12;

    private final AnalyticsDataService dataService;
    private final ForecastEngine forecastEngine;
    private final OpenAiChatService openAiChatService;
    private final AnalyticsSnapshotRepository snapshotRepository;
    private final AnalyticsJobRepository jobRepository;
    private final AnalyticsService analyticsService;

    public AnalyticsAiService(AnalyticsDataService dataService,
                              ForecastEngine forecastEngine,
                              OpenAiChatService openAiChatService,
                              AnalyticsSnapshotRepository snapshotRepository,
                              AnalyticsJobRepository jobRepository,
                              AnalyticsService analyticsService) {
        this.dataService = dataService;
        this.forecastEngine = forecastEngine;
        this.openAiChatService = openAiChatService;
        this.snapshotRepository = snapshotRepository;
        this.jobRepository = jobRepository;
        this.analyticsService = analyticsService;
    }

    /** Chay pipeline (dang async tu controller) va luu snapshot. */
    public void runAnalysis(int periodDays, Long jobId) {
        AnalyticsJob job = null;
        try {
            job = jobId == null ? null
                    : jobRepository.findById(jobId).orElse(null);
            if (job != null) job.setStatus("running");
            if (job != null) jobRepository.save(job);

            AnalyticsDataService.AggregatedData agg = dataService.aggregate(periodDays);
            // Forecast Java doi chung
            List<Double> series = agg.revenueSeries().stream()
                    .map(p -> p.revenue()).toList();
            LocalDate start = agg.revenueSeries().isEmpty() ? LocalDate.now()
                    : agg.revenueSeries().get(agg.revenueSeries().size() - 1).date();
            ForecastEngine.ForecastOutput statOut = forecastEngine.forecast(series, start);

            // 1) Thu OpenAI (neu co key)
            String aiText = null;
            try {
                if (OpenAiChatService.isEnabled()) {
                    aiText = openAiChatService.chat(systemPrompt(), userPrompt(agg, statOut));
                }
            } catch (Exception e) {
                log.warn("OpenAI analysis failed: {}", e.getMessage());
            }

            if (aiText != null) {
                JsonNode parsed = parseJson(aiText);
                if (parsed != null && parsed.isObject()) {
                    // Validator
                    long dbCustomers = agg.totalCustomers();
                    double dbAvgRevenue = series.isEmpty() ? 0
                            : series.stream().mapToDouble(Double::doubleValue).average().orElse(0);
                    List<String> errors = AnalyticsValidator.validate(parsed, dbCustomers, dbAvgRevenue);
                    if (!errors.isEmpty()) {
                        log.warn("Validator fail lan 1: {}", errors);
                        // Retry 1 lan
                        String retry = openAiChatService.chat(systemPrompt(), userPrompt(agg, statOut));
                        if (retry != null) {
                            JsonNode p2 = parseJson(retry);
                            if (p2 != null && p2.isObject()) {
                                errors = AnalyticsValidator.validate(p2, dbCustomers, dbAvgRevenue);
                                if (errors.isEmpty()) parsed = p2;
                            }
                        }
                        if (!errors.isEmpty()) {
                            saveFallback(agg, statOut, periodDays, "Validator fail: " + errors);
                            finish(job, "done");
                            return;
                        }
                    } else {
                        AnalyticsValidator.fixRfmTotals(parsed, dbCustomers);
                    }
                    ObjectNode withMeta = (ObjectNode) parsed;
                    withMeta.put("source", "ai");
                    withMeta.put("created_at", LocalDate.now().toString());
                    withMeta.put("period_days", periodDays);
                    saveSnapshot(JSON.writeValueAsString(withMeta), periodDays, "ai", null);
                    finish(job, "done");
                    return;
                }
            }

            // 2) Fallback: thong ke Java + rule (KHONG dung AI)
            String reason = aiText == null
                    ? "OpenAI khong phan hoi (het quota/loi)"
                    : "JSON khong hop le";
            saveFallback(agg, statOut, periodDays, reason);
            finish(job, "done");
        } catch (Exception e) {
            log.error("AI analysis pipeline failed", e);
            try {
                saveFallbackEmpty(periodDays, e.getMessage());
            } catch (Exception ex) {
                log.error("Fallback snapshot failed", ex);
            }
            finish(job, "failed");
        }
    }

    // ==================================================================
    // FALLBACK: snapshot day du sinh bang rule Java (khong dung AI)
    // ==================================================================

    private void saveFallback(AnalyticsDataService.AggregatedData agg,
                              ForecastEngine.ForecastOutput statOut,
                              int periodDays, String reason) {
        try {
            ObjectNode payload = JSON.createObjectNode();
            payload.put("source", "fallback");
            payload.put("created_at", LocalDate.now().toString());
            payload.put("period_days", periodDays);
            payload.put("summary", buildFallbackSummary(agg, statOut));
            // Ly do ky thuat giu o field rieng (khong dua vao summary hien thi)
            payload.put("reason", reason == null ? "" : reason);

            payload.set("kpi_insights", buildKpiInsights(agg));
            payload.set("revenue_forecast", buildRevenueForecast(statOut));
            payload.set("demand_forecast", buildDemandForecast());
            payload.set("rfm_segments", buildRfmSegments(agg));
            payload.set("churn_risk", buildChurnRisk(agg));
            payload.set("anomalies", buildAnomalies(agg));
            payload.set("recommendations", buildRecommendations(agg, statOut));

            saveSnapshot(JSON.writeValueAsString(payload), periodDays, "fallback", reason);
        } catch (Exception e) {
            log.error("saveFallback failed", e);
        }
    }

    private void saveFallbackEmpty(int periodDays, String error) {
        try {
            ObjectNode payload = JSON.createObjectNode();
            payload.put("source", "fallback");
            payload.put("created_at", LocalDate.now().toString());
            payload.put("period_days", periodDays);
            payload.put("summary", "Chưa có dữ liệu để phân tích. Hãy tạo sản phẩm và đơn hàng "
                    + "trước khi bấm \"Phân tích lại\".");
            payload.put("reason", error == null ? "" : error);
            payload.putArray("kpi_insights");
            payload.putArray("demand_forecast");
            payload.putArray("anomalies");
            payload.putArray("recommendations");
            payload.putArray("rfm_segments");
            ObjectNode churn = payload.putObject("churn_risk");
            churn.put("high", 0).put("medium", 0).put("low", 0);
            churn.putArray("drivers");
            ObjectNode rev = payload.putObject("revenue_forecast");
            rev.put("horizon_days", FORECAST_HORIZON_DAYS);
            rev.put("confidence", "low");
            rev.put("assumptions", "Không có dữ liệu lịch sử để dự báo.");
            rev.putArray("points");
            saveSnapshot(JSON.writeValueAsString(payload), periodDays, "fallback", error);
        } catch (Exception e) {
            log.error("saveFallbackEmpty failed", e);
        }
    }

    // ------------------------------------------------------------------
    // Summary + KPI insights
    // ------------------------------------------------------------------

    private String buildFallbackSummary(AnalyticsDataService.AggregatedData agg,
                                        ForecastEngine.ForecastOutput statOut) {
        StringBuilder sb = new StringBuilder();
        sb.append("Phân tích tự động trên dữ liệu thực (chưa dùng AI): doanh thu ")
                .append(money(agg.totalRevenue())).append(" ₫, ")
                .append(agg.totalOrders()).append(" đơn, ")
                .append(agg.totalCustomers()).append(" khách, ")
                .append(agg.lowStockCount()).append(" sản phẩm tồn kho thấp.");
        if (statOut != null && statOut.points() != null && !statOut.points().isEmpty()) {
            double avg = statOut.points().stream().mapToDouble(ForecastEngine.ForecastPoint::value).average().orElse(0);
            sb.append(" Dự báo ").append(FORECAST_HORIZON_DAYS).append(" ngày tới khoảng ")
                    .append(money(avg)).append(" ₫/ngày (").append(statOut.method()).append(").");
        } else {
            sb.append(" Chưa đủ lịch sử để dự báo doanh thu.");
        }
        sb.append(" Bật OpenAI để có nhận xét chi tiết hơn.");
        return sb.toString();
    }

    private ArrayNode buildKpiInsights(AnalyticsDataService.AggregatedData agg) {
        ArrayNode arr = JSON.createArrayNode();
        List<AnalyticsDataService.DailyPoint> series = agg.revenueSeries();

        double[] revAvg = trailingAverages(series, true);
        double revPct = changePct(revAvg[0], revAvg[1]);
        addInsight(arr, "revenue", trend(revPct), revPct,
                revAvg[0] <= 0
                        ? "Chưa có doanh thu trong 7 ngày gần nhất."
                        : "Bình quân " + money(revAvg[0]) + " ₫/ngày trong 7 ngày gần nhất.");

        double[] orderAvg = trailingAverages(series, false);
        double orderPct = changePct(orderAvg[0], orderAvg[1]);
        addInsight(arr, "orders", trend(orderPct), orderPct,
                "Bình quân " + String.format(VI, "%.1f", orderAvg[0]) + " đơn/ngày trong 7 ngày gần nhất.");

        addInsight(arr, "pending", agg.pendingOrders() > 0 ? "up" : "flat", 0,
                agg.pendingOrders() > 0
                        ? "Có " + agg.pendingOrders() + " đơn đang chờ xác nhận/xử lý."
                        : "Không có đơn nào đang chờ xử lý.");

        addInsight(arr, "low_stock", agg.lowStockCount() > 0 ? "down" : "flat", 0,
                agg.lowStockCount() > 0
                        ? agg.lowStockCount() + " sản phẩm đã xuống dưới ngưỡng tồn kho an toàn."
                        : "Tồn kho của tất cả sản phẩm đang ở mức an toàn.");

        addInsight(arr, "customers", "flat", 0,
                "Tổng " + agg.totalCustomers() + " khách hàng trong hệ thống.");

        return arr;
    }

    private void addInsight(ArrayNode arr, String key, String trend, double changePct, String insight) {
        ObjectNode n = arr.addObject();
        n.put("key", key);
        n.put("trend", trend);
        n.put("change_pct", Math.round(changePct * 10.0) / 10.0);
        n.put("insight", insight);
    }

    /** [0] = trung binh 7 ngay gan nhat, [1] = trung binh 7 ngay truoc do. */
    private double[] trailingAverages(List<AnalyticsDataService.DailyPoint> series, boolean revenue) {
        int n = series.size();
        int lastN = Math.min(7, n);
        int prevN = Math.min(7, Math.max(0, n - lastN));
        double last = 0;
        double prev = 0;
        for (int i = n - lastN; i < n; i++) {
            last += revenue ? series.get(i).revenue() : series.get(i).orders();
        }
        for (int i = n - lastN - prevN; i < n - lastN; i++) {
            prev += revenue ? series.get(i).revenue() : series.get(i).orders();
        }
        return new double[]{lastN == 0 ? 0 : last / lastN, prevN == 0 ? 0 : prev / prevN};
    }

    private double changePct(double last, double prev) {
        if (prev <= 0) return last > 0 ? 100.0 : 0.0;
        return ((last - prev) / prev) * 100.0;
    }

    private String trend(double pct) {
        if (pct > 5) return "up";
        if (pct < -5) return "down";
        return "flat";
    }

    // ------------------------------------------------------------------
    // Du bao doanh thu
    // ------------------------------------------------------------------

    private ObjectNode buildRevenueForecast(ForecastEngine.ForecastOutput statOut) {
        ObjectNode rev = JSON.createObjectNode();
        rev.put("horizon_days", FORECAST_HORIZON_DAYS);
        rev.put("confidence", "low");
        rev.put("assumptions", statOut == null || statOut.note() == null
                ? "Ước tính theo thống kê Java, độ tin cậy thấp khi ít dữ liệu."
                : statOut.note());
        ArrayNode points = rev.putArray("points");
        if (statOut != null && statOut.points() != null) {
            for (ForecastEngine.ForecastPoint p : statOut.points()) {
                ObjectNode n = points.addObject();
                n.put("date", p.date());
                n.put("value", p.value());
                n.put("lower", p.lower());
                n.put("upper", p.upper());
            }
        }
        return rev;
    }

    // ------------------------------------------------------------------
    // Du bao nhu cau + rui ro het hang
    // ------------------------------------------------------------------

    private ArrayNode buildDemandForecast() {
        ArrayNode arr = JSON.createArrayNode();
        List<DemandForecast> demand;
        try {
            demand = analyticsService.demandForecastByProduct();
        } catch (Exception e) {
            log.warn("demandForecastByProduct failed: {}", e.getMessage());
            return arr;
        }
        List<ObjectNode> rows = new ArrayList<>();
        for (DemandForecast d : demand) {
            int forecast7 = d.forecastQtyNext7Days();
            String risk = stockRisk(d.stock(), forecast7);
            ObjectNode n = JSON.createObjectNode();
            n.put("product", d.name());
            ArrayNode weeks = n.putArray("next_weeks");
            weeks.add(Math.max(0, forecast7));
            n.put("stock_risk", risk);
            n.put("note", d.restockAdvice());
            n.put("stock", d.stock());
            n.put("forecast_7d", forecast7);
            rows.add(n);
        }
        // High truoc, medium, low; trong cung nhom: du bao lon truoc
        rows.sort((a, b) -> {
            int ra = riskRank(a.path("stock_risk").asText());
            int rb = riskRank(b.path("stock_risk").asText());
            if (ra != rb) return Integer.compare(ra, rb);
            return Integer.compare(b.path("forecast_7d").asInt(), a.path("forecast_7d").asInt());
        });
        for (int i = 0; i < Math.min(DEMAND_TOP_N, rows.size()); i++) {
            arr.add(rows.get(i));
        }
        return arr;
    }

    private int riskRank(String risk) {
        return switch (risk) {
            case "high" -> 0;
            case "medium" -> 1;
            default -> 2;
        };
    }

    /** Rui ro het hang: du bao 7 ngay > ton kho = cao. */
    private String stockRisk(int stock, int forecast7) {
        if (forecast7 <= 0) return stock <= 3 ? "medium" : "low";
        if (forecast7 > stock) return "high";
        if (forecast7 * 2L > stock) return "medium";
        return "low";
    }

    // ------------------------------------------------------------------
    // Phan cum RFM
    // ------------------------------------------------------------------

    private ArrayNode buildRfmSegments(AnalyticsDataService.AggregatedData agg) {
        ArrayNode arr = JSON.createArrayNode();
        for (RfmSegment s : agg.rfmSegments()) {
            ObjectNode n = arr.addObject();
            n.put("name", s.segment());
            n.put("customers", s.count());
            n.put("avg_value", round2(s.avgMonetary()));
            n.put("avg_recency_days", round2(s.avgRecency()));
            n.put("avg_frequency", round2(s.avgFrequency()));
            n.put("insight", segmentInsight(s));
            n.put("action", segmentAction(s));
        }
        return arr;
    }

    private String segmentInsight(RfmSegment s) {
        return switch (s.segment()) {
            case "VIP" -> s.count() + " khách giá trị cao, mua gần đây (TB "
                    + Math.round(s.avgRecency()) + " ngày trước).";
            case "Trung thanh" -> s.count() + " khách quay lại đều, giá trị trung bình "
                    + money(s.avgMonetary()) + " ₫.";
            case "Moi" -> s.count() + " khách mới, mới mua lần đầu.";
            case "Co nguy co" -> s.count() + " khách lâu chưa quay lại (TB "
                    + Math.round(s.avgRecency()) + " ngày).";
            case "Roi bo" -> s.count() + " khách đã rời bỏ hoặc chưa từng mua.";
            default -> s.count() + " khách trong cụm " + s.segment() + ".";
        };
    }

    private String segmentAction(RfmSegment s) {
        return switch (s.segment()) {
            case "VIP" -> "Ưu đãi độc quyền, cho dùng thử sản phẩm mới trước.";
            case "Trung thanh" -> "Nhắc mua lại và gợi ý combo tiết kiệm.";
            case "Moi" -> "Gửi ưu đãi cho đơn thứ hai trong 14 ngày.";
            case "Co nguy co" -> "Gửi voucher 7 ngày kèm nhắc sản phẩm đã mua.";
            case "Roi bo" -> "Chạy chiến dịch win-back và khảo sát lý do rời bỏ.";
            default -> "Theo dõi thêm trước khi hành động.";
        };
    }

    // ------------------------------------------------------------------
    // Rui ro roi bo (churn)
    // ------------------------------------------------------------------

    private ObjectNode buildChurnRisk(AnalyticsDataService.AggregatedData agg) {
        ObjectNode churn = JSON.createObjectNode();
        long high = 0;
        long medium = 0;
        long low = 0;
        List<ChurnRiskCustomer> risks;
        try {
            risks = analyticsService.churnRisk();
        } catch (Exception e) {
            log.warn("churnRisk failed: {}", e.getMessage());
            churn.put("high", 0).put("medium", 0).put("low", 0);
            churn.putArray("drivers");
            return churn;
        }
        for (ChurnRiskCustomer c : risks) {
            switch (c.riskLevel()) {
                case "CAO" -> high++;
                case "VUA" -> medium++;
                default -> low++;
            }
        }
        churn.put("high", high).put("medium", medium).put("low", low);
        ArrayNode drivers = churn.putArray("drivers");
        if (high > 0) {
            drivers.add(high + " khách nguy cơ cao — gửi voucher giá trị cao và khảo sát lý do.");
        }
        if (medium > 0) {
            drivers.add(medium + " khách nguy cơ vừa — nhắc lại sản phẩm đã mua trong 7 ngày.");
        }
        if (low > 0) {
            drivers.add(low + " khách còn gắn kết — duy trì liên hệ định kỳ.");
        }
        // Bo sung boi canh tu cum RFM lon nhat
        agg.rfmSegments().stream()
                .max((a, b) -> Long.compare(a.count(), b.count()))
                .ifPresent(top -> {
                    if (agg.totalCustomers() > 0) {
                        double pct = top.count() * 100.0 / agg.totalCustomers();
                        drivers.add("Cụm đông nhất: " + top.segment() + " ("
                                + Math.round(pct) + "% tổng khách).");
                    }
                });
        return churn;
    }

    // ------------------------------------------------------------------
    // Canh bao (anomalies)
    // ------------------------------------------------------------------

    private ArrayNode buildAnomalies(AnalyticsDataService.AggregatedData agg) {
        ArrayNode arr = JSON.createArrayNode();

        // 1) San pham sap het hang
        int shown = 0;
        List<Product> lowStock = agg.lowStock();
        if (lowStock != null) {
            List<Product> sorted = new ArrayList<>(lowStock);
            sorted.sort((a, b) -> Integer.compare(
                    a.getStock() == null ? 0 : a.getStock(),
                    b.getStock() == null ? 0 : b.getStock()));
            for (Product p : sorted) {
                if (shown >= 5) break;
                int stock = p.getStock() == null ? 0 : p.getStock();
                ObjectNode n = arr.addObject();
                n.put("level", stock <= 3 ? "critical" : "warning");
                n.put("title", "Sắp hết: " + p.getName());
                n.put("detail", "Còn " + stock + " " + (p.getUnit() == null ? "đơn vị" : p.getUnit())
                        + " trong kho.");
                shown++;
            }
        }

        // 2) Bien dong doanh thu bat thuong so voi trung binh ky
        List<AnalyticsDataService.DailyPoint> series = agg.revenueSeries();
        if (series != null && !series.isEmpty()) {
            double mean = series.stream().mapToDouble(AnalyticsDataService.DailyPoint::revenue).average().orElse(0);
            if (mean > 0) {
                int added = 0;
                for (AnalyticsDataService.DailyPoint p : series) {
                    if (added >= 3) break;
                    if (p.revenue() > mean * 2.0) {
                        ObjectNode n = arr.addObject();
                        n.put("level", "warning");
                        n.put("title", "Doanh thu tăng đột biến");
                        n.put("detail", p.date() + ": " + money(p.revenue()) + " ₫ (gấp "
                                + String.format(VI, "%.1f", p.revenue() / mean) + " lần trung bình).");
                        n.put("date", p.date().toString());
                        added++;
                    } else if (p.revenue() < mean * 0.4 && p.orders() == 0) {
                        ObjectNode n = arr.addObject();
                        n.put("level", "info");
                        n.put("title", "Ngày không có đơn");
                        n.put("detail", p.date() + " không ghi nhận đơn hàng nào.");
                        n.put("date", p.date().toString());
                        added++;
                    }
                }
            }
        }

        // 3) Don dang cho xu ly
        if (agg.pendingOrders() >= 5) {
            ObjectNode n = arr.addObject();
            n.put("level", "warning");
            n.put("title", "Đơn chờ xử lý đang tồn");
            n.put("detail", agg.pendingOrders() + " đơn chưa được xác nhận hoặc giao.");
        }

        // 4) Chua co du lieu
        if (agg.totalOrders() == 0) {
            ObjectNode n = arr.addObject();
            n.put("level", "info");
            n.put("title", "Chưa có đơn hàng");
            n.put("detail", "Hệ thống chưa ghi nhận đơn hàng nào nên chưa đủ dữ liệu kết luận.");
        }
        return arr;
    }

    // ------------------------------------------------------------------
    // Khuyen nghi hanh dong
    // ------------------------------------------------------------------

    private ArrayNode buildRecommendations(AnalyticsDataService.AggregatedData agg,
                                           ForecastEngine.ForecastOutput statOut) {
        ArrayNode arr = JSON.createArrayNode();

        // 1) Nhap hang
        if (agg.lowStockCount() > 0 && agg.lowStock() != null && !agg.lowStock().isEmpty()) {
            StringBuilder names = new StringBuilder();
            int n = 0;
            for (Product p : agg.lowStock()) {
                if (n >= 3) break;
                if (n > 0) names.append(", ");
                names.append(p.getName());
                n++;
            }
            if (agg.lowStockCount() > 3) names.append("...");
            ObjectNode r = arr.addObject();
            r.put("priority", "high");
            r.put("title", "Nhập thêm hàng cho " + agg.lowStockCount() + " sản phẩm");
            r.put("detail", "Tồn kho thấp: " + names + ". Kiểm tra cột \"Nguy cơ hết hàng\" "
                    + "để biết số lượng nên nhập.");
            r.put("expected_impact", "Tránh mất đơn vì hết hàng");
        }

        // 2) Cham soc khach nguy co roi bo
        long highChurn = 0;
        long mediumChurn = 0;
        try {
            for (ChurnRiskCustomer c : analyticsService.churnRisk()) {
                if ("CAO".equals(c.riskLevel())) highChurn++;
                else if ("VUA".equals(c.riskLevel())) mediumChurn++;
            }
        } catch (Exception e) {
            log.warn("churnRisk (recommendations) failed: {}", e.getMessage());
        }
        if (highChurn > 0) {
            ObjectNode r = arr.addObject();
            r.put("priority", "high");
            r.put("title", "Giữ chân " + highChurn + " khách nguy cơ rời bỏ cao");
            r.put("detail", "Gửi voucher giá trị cao kèm khảo sát lý do rời bỏ. "
                    + (mediumChurn > 0 ? mediumChurn + " khách mức vừa nên nhắc lại trong 7 ngày." : ""));
            r.put("expected_impact", "Giảm tỷ lệ mất khách");
        }

        // 3) Day san pham ban chay
        if (agg.topProducts() != null && !agg.topProducts().isEmpty()) {
            TopProduct top = agg.topProducts().get(0);
            ObjectNode r = arr.addObject();
            r.put("priority", "medium");
            r.put("title", "Đẩy mạnh bán \"" + top.name() + "\"");
            r.put("detail", "Sản phẩm bán chạy nhất: " + top.sold() + " lượt, doanh thu "
                    + money(top.revenue()) + " ₫. Đặt ở vị trí nổi bật và gợi ý kèm sản phẩm liên quan.");
            r.put("expected_impact", "Tăng doanh thu từ sản phẩm chủ lực");
        }

        // 4) Xu ly don ton
        if (agg.pendingOrders() > 0) {
            ObjectNode r = arr.addObject();
            r.put("priority", agg.pendingOrders() >= 5 ? "high" : "medium");
            r.put("title", "Xử lý " + agg.pendingOrders() + " đơn đang chờ");
            r.put("detail", "Xác nhận và bàn giao sớm để giảm thời gian giao hàng.");
            r.put("expected_impact", "Tăng độ hài lòng của khách");
        }

        // 5) Dua tren du bao
        if (statOut != null && statOut.points() != null && !statOut.points().isEmpty()) {
            double avg = statOut.points().stream()
                    .mapToDouble(ForecastEngine.ForecastPoint::value).average().orElse(0);
            ObjectNode r = arr.addObject();
            r.put("priority", "low");
            r.put("title", "Lập kế hoạch theo dự báo " + FORECAST_HORIZON_DAYS + " ngày");
            r.put("detail", "Dự báo bình quân " + money(avg) + " ₫/ngày ("
                    + statOut.method() + ", độ tin cậy thấp). Dùng để chuẩn bị hàng và nhân sự.");
            r.put("expected_impact", "Chủ động nguồn hàng theo nhu cầu");
        }

        if (arr.isEmpty()) {
            ObjectNode r = arr.addObject();
            r.put("priority", "medium");
            r.put("title", "Bổ sung dữ liệu bán hàng");
            r.put("detail", "Chưa đủ dữ liệu để khuyến nghị cụ thể. Hãy tạo đơn hàng và cập nhật tồn kho.");
            r.put("expected_impact", "Có cơ sở để phân tích chính xác hơn");
        }
        return arr;
    }

    // ------------------------------------------------------------------
    // Tien ich
    // ------------------------------------------------------------------

    private static String money(double v) {
        return String.format(VI, "%,.0f", v);
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    private void saveSnapshot(String payload, int periodDays, String source, String error) {
        AnalyticsSnapshot snap = new AnalyticsSnapshot(payload, periodDays, source, error);
        snapshotRepository.save(snap);
    }

    private void finish(AnalyticsJob job, String status) {
        if (job == null) return;
        job.setStatus(status);
        jobRepository.save(job);
    }

    private String systemPrompt() {
        return "Ban la chuyen gia phan tich du lieu ban le thuc pham kho, tra loi tieng Viet, ngan gon. "
                + "CHI dung so lieu duoc cung cap, khong bia so, khong suy dien ngoai du lieu. "
                + "Du bao la UOC TINH, phai neu gia dinh va do tin cay. "
                + "Chi tra ve JSON dung schema, khong them chu nao ngoai JSON. "
                + "Schema: {\"summary\":string,\"kpi_insights\":[{\"key\":\"revenue|orders|pending|low_stock|customers\",\"trend\":\"up|down|flat\",\"change_pct\":number,\"insight\":string}],"
                + "\"revenue_forecast\":{\"horizon_days\":30,\"confidence\":\"low|medium|high\",\"assumptions\":string,\"points\":[{\"date\":\"YYYY-MM-DD\",\"value\":number,\"lower\":number,\"upper\":number}]},"
                + "\"demand_forecast\":[{\"product\":string,\"next_weeks\":[number],\"stock_risk\":\"low|medium|high\",\"note\":string}],"
                + "\"rfm_segments\":[{\"name\":\"VIP|Trung thanh|Moi|Co nguy co|Roi bo\",\"customers\":number,\"avg_value\":number,\"avg_recency_days\":number,\"avg_frequency\":number,\"insight\":string,\"action\":string}],"
                + "\"churn_risk\":{\"high\":number,\"medium\":number,\"low\":number,\"drivers\":[string]},"
                + "\"anomalies\":[{\"level\":\"critical|warning|info\",\"title\":string,\"detail\":string}],"
                + "\"recommendations\":[{\"priority\":\"high|medium|low\",\"title\":string,\"detail\":string,\"expected_impact\":string}]}";
    }

    private String userPrompt(AnalyticsDataService.AggregatedData agg,
                              ForecastEngine.ForecastOutput statOut) {
        StringBuilder sb = new StringBuilder();
        sb.append("So lieu tong hop (khong bao gom thong tin ca nhan khach hang):\n");
        sb.append("- Ky phan tich: ").append(agg.revenueSeries().isEmpty() ? "trong" : agg.revenueSeries().get(0).date() + " -> " + agg.revenueSeries().get(agg.revenueSeries().size() - 1).date()).append("\n");
        sb.append("- Tong doanh thu: ").append(Math.round(agg.totalRevenue())).append(" VND\n");
        sb.append("- Doanh thu hom nay: ").append(Math.round(agg.revenueToday())).append(" VND\n");
        sb.append("- Tong so don: ").append(agg.totalOrders()).append(", cho xu ly: ").append(agg.pendingOrders()).append("\n");
        sb.append("- Tong so khach: ").append(agg.totalCustomers()).append("\n");
        sb.append("- San pham ton kho thap: ").append(agg.lowStockCount()).append("\n");

        sb.append("- Chuoi doanh thu theo ngay (thuc te):\n");
        agg.revenueSeries().forEach(p -> sb.append("  ").append(p.date()).append(": ").append(Math.round(p.revenue())).append("\n"));

        sb.append("- Top san pham ban chay:\n");
        agg.topProducts().forEach(p -> sb.append("  ").append(p.name()).append(" - ").append(p.sold()).append(" luot, ").append(Math.round(p.revenue())).append(" VND\n"));

        sb.append("- Doanh thu theo danh muc:\n");
        agg.categoryRevenue().forEach(c -> sb.append("  ").append(c.category()).append(": ").append(Math.round(c.revenue())).append("\n"));

        sb.append("- Don theo trang thai:\n");
        agg.statusCounts().forEach(s -> sb.append("  ").append(s.status()).append(": ").append(s.count()).append("\n"));

        sb.append("- Phan cum RFM:\n");
        agg.rfmSegments().forEach(s -> sb.append("  ").append(s.segment()).append(": ").append(s.count())
                .append(" khach, value ").append(Math.round(s.avgMonetary()))
                .append(", recency ").append(s.avgRecency()).append(" ngay\n"));

        sb.append("\nDu bao thong ke Java (doi chung - kiem tra AI trong khoang +-50%):\n");
        sb.append("Phuong phap: ").append(statOut.method()).append(", MAE ").append(statOut.mae())
                .append(", RMSE ").append(statOut.rmse()).append(", MAPE ").append(statOut.mape()).append("\n");
        statOut.points().forEach(p -> sb.append("  ").append(p.date()).append(": ").append(Math.round(p.value()))
                .append(" (lower ").append(Math.round(p.lower())).append(", upper ").append(Math.round(p.upper())).append(")\n"));
        sb.append("Ngay hien tai: ").append(LocalDate.now()).append("\n");

        return sb.toString();
    }

    private JsonNode parseJson(String text) {
        return OpenAiChatService.parseJsonResponse(text);
    }
}
