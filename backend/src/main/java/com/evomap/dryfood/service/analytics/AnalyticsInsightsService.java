package com.evomap.dryfood.service.analytics;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.text.DecimalFormat;
import java.time.Duration;
import java.util.List;

/**
 * AI insights cho trang "Phan tich & AI" (admin).
 *
 * <p>Lay cac so lieu that tu AnalyticsService (RFM, churn, forecast, demand, top products),
 * goi OpenAI sinh bản nhan dinh + khuyen nghi hanh dong (neu co OPENAI_API_KEY + credit).
 * Loi/khong key -> fallback ve tom tat bang quy tac tu chinh cac con so do
 * (khong bao gio trong, khong bia du lieu).
 */
@Service
public class AnalyticsInsightsService {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsInsightsService.class);

    private static final String OPENAI_KEY = System.getenv("OPENAI_API_KEY");
    private static final String OPENAI_MODEL = System.getenv("OPENAI_MODEL") == null
            ? "gpt-4o-mini" : System.getenv("OPENAI_MODEL");
    private static final boolean LLM_ENABLED = OPENAI_KEY != null && !OPENAI_KEY.isBlank();
    private static final String OPENAI_URL = "https://api.openai.com/v1/chat/completions";
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5)).build();
    private static final DecimalFormat FMT = new DecimalFormat("#,##0");

    private final AnalyticsService analyticsService;

    public AnalyticsInsightsService(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /** Tóm tắt nhận định + khuyến nghị. `useLLM` để frontend biết nguồn. */
    public record Insight(String text, boolean useLLM, String source) {
    }

    public Insight generate(int forecastDays) {
        // Gom du lieu that
        List<RfmSegment> segments = analyticsService.rfmSegments();
        List<ChurnRiskCustomer> churn = analyticsService.churnRisk();
        List<ForecastPoint> forecast = analyticsService.forecastRevenue(forecastDays);
        List<DemandForecast> demand = analyticsService.demandForecastByProduct();
        List<TopProduct> top = analyticsService.topProducts();

        String summary = buildSummary(segments, churn, forecast, demand, top, forecastDays);

        if (LLM_ENABLED) {
            try {
                String ai = callOpenAI(summary, forecastDays);
                if (ai != null && !ai.isBlank()) {
                    return new Insight(ai.trim(), true, "OpenAI " + OPENAI_MODEL);
                }
            } catch (Exception e) {
                log.info("OpenAI insights fallback to rule: {}", e.getMessage());
            }
        }
        return new Insight(summary, false, "Phân tích trong Java (rule)");
    }

    /** Build prompt nén từ số liệu thật. */
    private String buildSummary(List<RfmSegment> segments, List<ChurnRiskCustomer> churn,
                                List<ForecastPoint> forecast, List<DemandForecast> demand,
                                List<TopProduct> top, int days) {
        StringBuilder sb = new StringBuilder();
        sb.append("Số liệu kinh doanh DryFood (dữ liệu thật của hệ thống):\n\n");

        if (segments != null && !segments.isEmpty()) {
            sb.append("Phân khúc khách hàng (RFM):\n");
            segments.forEach(s -> sb.append(" - ").append(s.segment())
                    .append(": ").append(s.count()).append(" khách, giá trị trung bình ")
                    .append(FMT.format(s.avgMonetary())).append(" ₫\n"));
        }
        if (churn != null && !churn.isEmpty()) {
            long cao = churn.stream().filter(c -> "CAO".equals(c.riskLevel())).count();
            long vua = churn.stream().filter(c -> "VUA".equals(c.riskLevel())).count();
            sb.append("Khách rủi ro rời bỏ: ").append(cao).append(" cao, ").append(vua)
                    .append(" vừa (tổng ").append(churn.size()).append(" khách).\n");
            churn.stream().filter(c -> "CAO".equals(c.riskLevel())).limit(5)
                    .forEach(c -> sb.append("   - ").append(c.name())
                            .append(" (").append(c.churnScore()).append(" điểm): ").append(c.suggestion()).append("\n"));
        }
        if (forecast != null && !forecast.isEmpty()) {
            double totalRev = forecast.stream().mapToDouble(ForecastPoint::forecastRev).sum();
            long totalQty = forecast.stream().mapToLong(ForecastPoint::forecastQty).sum();
            sb.append("Dự báo ").append(days).append(" ngày tới: doanh thu ")
                    .append(FMT.format(totalRev)).append(" ₫, lượng bán ").append(totalQty)
                    .append(" sản phẩm.\n");
        }
        if (demand != null && !demand.isEmpty()) {
            long restock = demand.stream().filter(d -> d.stock() < d.forecastQtyNext7Days()).count();
            sb.append("Sản phẩm cần nhập hàng: ").append(restock).append(" món.\n");
        }
        if (top != null && !top.isEmpty()) {
            sb.append("Top sản phẩm bán chạy:\n");
            top.forEach(p -> sb.append(" - ").append(p.name())
                    .append(": ").append(p.sold()).append(" bán, ").append(FMT.format(p.revenue())).append(" ₫\n"));
        }
        return sb.toString();
    }

    /** Rule fallback: tóm tắt bằng 3-4 câu từ chính số liệu (không LLM). */
    private String ruleSummary(List<RfmSegment> segments, List<ChurnRiskCustomer> churn,
                               List<ForecastPoint> forecast, List<DemandForecast> demand,
                               List<TopProduct> top, int days) {
        StringBuilder sb = new StringBuilder();
        if (top != null && !top.isEmpty()) {
            TopProduct p = top.get(0);
            sb.append("Sản phẩm bán chạy nhất là ").append(p.name())
                    .append(" (").append(p.sold()).append(" lượt bán). ");
        }
        if (forecast != null && !forecast.isEmpty()) {
            double totalRev = forecast.stream().mapToDouble(ForecastPoint::forecastRev).sum();
            sb.append("Dự báo ").append(days).append(" ngày tới đạt khoảng ")
                    .append(FMT.format(totalRev)).append(" ₫. ");
        }
        if (churn != null && !churn.isEmpty()) {
            long cao = churn.stream().filter(c -> "CAO".equals(c.riskLevel())).count();
            if (cao > 0) {
                sb.append("Có ").append(cao).append(" khách đang ở mức rủi ro rời bỏ cao, nên ưu tiên chăm sóc. ");
            }
        }
        if (demand != null && !demand.isEmpty()) {
            long restock = demand.stream().filter(d -> d.stock() < d.forecastQtyNext7Days()).count();
            if (restock > 0) {
                sb.append("Cần nhập thêm ").append(restock).append(" sản phẩm sắp thiếu hàng.");
            } else {
                sb.append("Tồn kho hiện đủ để đáp ứng dự báo 7 ngày.");
            }
        }
        return sb.toString().trim();
    }

    private String callOpenAI(String facts, int days) throws Exception {
        ObjectNode body = JSON.createObjectNode();
        body.put("model", OPENAI_MODEL);
        ArrayNode messages = body.putArray("messages");
        ObjectNode system = messages.addObject();
        system.put("role", "system");
        system.put("content",
                "Bạn là chuyên gia phân tích kinh doanh của cửa hàng thực phẩm khô DryFood (tiếng Việt). "
                + "Dựa CHỈ vào dữ liệu được cung cấp, viết một bản nhận định ngắn 3-4 đoạn: "
                + "(1) sức khỏe tổng thể, (2) rủi ro đáng chú ý nhất, (3) 2-3 khuyến nghị hành động cụ thể. "
                + "KHÔNG được bịa số liệu, KHÔNG thêm thông tin ngoài dữ liệu. "
                + "Nếu dữ liệu không đủ, nói rõ điều đó thay vì đoán.");
        ObjectNode user = messages.addObject();
        user.put("role", "user");
        user.put("content", "Dữ liệu " + days + " ngày:\n" + facts);
        body.put("temperature", 0.4);
        body.put("max_tokens", 700);

        HttpRequest req = HttpRequest.newBuilder(URI.create(OPENAI_URL))
                .timeout(Duration.ofSeconds(20))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + OPENAI_KEY)
                .POST(HttpRequest.BodyPublishers.ofString(JSON.writeValueAsString(body)))
                .build();
        HttpResponse<String> res = HTTP.send(req, HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() != 200) {
            log.warn("OpenAI insights HTTP {}: {}", res.statusCode(),
                    res.body().length() > 200 ? res.body().substring(0, 200) : res.body());
            return null;
        }
        JsonNode root = JSON.readTree(res.body());
        JsonNode text = root.path("choices").path(0).path("message").path("content");
        return text.isMissingNode() || text.isNull() ? null : text.asText();
    }
}