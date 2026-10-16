package com.evomap.dryfood.service.analytics;

import com.evomap.dryfood.model.analytics.AnalyticsJob;
import com.evomap.dryfood.model.analytics.AnalyticsSnapshot;
import com.evomap.dryfood.repository.AnalyticsJobRepository;
import com.evomap.dryfood.repository.AnalyticsSnapshotRepository;
import com.evomap.dryfood.service.OpenAiChatService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Pipeline phan tich AI:
 * gom du lieu -> forecast Java (doi chung) -> goi OpenAI -> validator -> luu snapshot.
 * Loi/het quota/khong key -> fallback snapshot (thong ke Java + rule) source "fallback".
 */
@Service
public class AnalyticsAiService {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsAiService.class);
    private static final ObjectMapper JSON = new ObjectMapper();

    private final AnalyticsDataService dataService;
    private final ForecastEngine forecastEngine;
    private final OpenAiChatService openAiChatService;
    private final AnalyticsSnapshotRepository snapshotRepository;
    private final AnalyticsJobRepository jobRepository;

    public AnalyticsAiService(AnalyticsDataService dataService,
                              ForecastEngine forecastEngine,
                              OpenAiChatService openAiChatService,
                              AnalyticsSnapshotRepository snapshotRepository,
                              AnalyticsJobRepository jobRepository) {
        this.dataService = dataService;
        this.forecastEngine = forecastEngine;
        this.openAiChatService = openAiChatService;
        this.snapshotRepository = snapshotRepository;
        this.jobRepository = jobRepository;
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

            ObjectNode payload = JSON.createObjectNode();
            payload.put("created_at", LocalDate.now().toString());
            payload.put("period_days", periodDays);

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

            // 2) Fallback: thong ke Java + rule
            saveFallback(agg, statOut, periodDays, aiText == null ? "OpenAI khong phan hoi (het quota/loi)" : "JSON khong hop le");
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

    private void saveFallback(AnalyticsDataService.AggregatedData agg,
                              ForecastEngine.ForecastOutput statOut,
                              int periodDays, String reason) {
        try {
            ObjectNode payload = JSON.createObjectNode();
            payload.put("source", "fallback");
            payload.put("created_at", LocalDate.now().toString());
            payload.put("period_days", periodDays);
            payload.put("summary", "Phan tich tu dong (chua dung AI): " + reason);
            payload.putArray("kpi_insights");
            payload.putArray("demand_forecast");
            payload.putArray("anomalies");
            payload.putArray("recommendations");
            payload.putObject("churn_risk").put("high", 0).put("medium", 0).put("low", 0);
            payload.putObject("revenue_forecast")
                    .put("horizon_days", 30)
                    .put("confidence", "low")
                    .put("assumptions", statOut.note())
                    .putArray("points");
            payload.putArray("rfm_segments");
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
            payload.put("summary", "Chua co du lieu phan tich.");
            saveSnapshot(JSON.writeValueAsString(payload), periodDays, "fallback", error);
        } catch (Exception e) {
            log.error("saveFallbackEmpty failed", e);
        }
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