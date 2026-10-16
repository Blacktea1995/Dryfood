package com.evomap.dryfood.controller;

import com.evomap.dryfood.model.Customer;
import com.evomap.dryfood.model.analytics.AnalyticsJob;
import com.evomap.dryfood.model.analytics.AnalyticsSnapshot;
import com.evomap.dryfood.repository.AnalyticsJobRepository;
import com.evomap.dryfood.repository.AnalyticsSnapshotRepository;
import com.evomap.dryfood.repository.CustomerRepository;
import com.evomap.dryfood.service.analytics.AnalyticsAiService;
import com.evomap.dryfood.service.analytics.AnalyticsDataService;
import com.evomap.dryfood.service.analytics.AnalyticsService;
import com.evomap.dryfood.service.analytics.RFM;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * API phan tich / AI (admin). Tat ca chi admin (AuthInterceptor chan cac duong khong phai admin).
 */
@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class AnalyticsController {

    private static final long REFRESH_COOLDOWN_MS = 5 * 60 * 1000L; // 5 phut
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final AnalyticsDataService dataService;
    private final AnalyticsAiService aiService;
    private final AnalyticsSnapshotRepository snapshotRepository;
    private final AnalyticsJobRepository jobRepository;
    private final CustomerRepository customerRepository;
    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsDataService dataService,
                               AnalyticsAiService aiService,
                               AnalyticsSnapshotRepository snapshotRepository,
                               AnalyticsJobRepository jobRepository,
                               CustomerRepository customerRepository,
                               AnalyticsService analyticsService) {
        this.dataService = dataService;
        this.aiService = aiService;
        this.snapshotRepository = snapshotRepository;
        this.jobRepository = jobRepository;
        this.customerRepository = customerRepository;
        this.analyticsService = analyticsService;
    }

    /** Snapshot moi nhat + so lieu that tu DB. */
    @GetMapping("/snapshot")
    public Map<String, Object> snapshot(@RequestParam(defaultValue = "7") int days) {
        AnalyticsSnapshot snap = snapshotRepository.findTopByOrderByCreatedAtDesc().orElse(null);
        AnalyticsDataService.AggregatedData data = dataService.aggregate(days);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("snapshot", snap == null ? null : Map.of(
                "id", snap.getId(),
                "createdAt", snap.getCreatedAt().toString(),
                "periodDays", snap.getPeriodDays(),
                "source", snap.getSource(),
                "error", snap.getError() == null ? "" : snap.getError(),
                "payload", safeParse(snap.getPayloadJson())));
        Map<String, Object> dataMap = new LinkedHashMap<>();
        dataMap.put("revenueSeries", data.revenueSeries());
        dataMap.put("topProducts", data.topProducts());
        dataMap.put("categoryRevenue", data.categoryRevenue());
        dataMap.put("statusCounts", data.statusCounts());
        dataMap.put("rfmSegments", data.rfmSegments());
        dataMap.put("lowStock", data.lowStock());
        dataMap.put("totalCustomers", data.totalCustomers());
        dataMap.put("totalRevenue", data.totalRevenue());
        dataMap.put("revenueToday", data.revenueToday());
        dataMap.put("totalOrders", data.totalOrders());
        dataMap.put("pendingOrders", data.pendingOrders());
        dataMap.put("lowStockCount", data.lowStockCount());
        out.put("data", dataMap);
        return out;
    }

    /** Bat dau phan tich lai (async). Gioi han 1 lan / 5 phut. */
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestParam(defaultValue = "7") int days) {
        AnalyticsJob last = jobRepository.findTopByOrderByCreatedAtDesc().orElse(null);
        if (last != null && last.getCreatedAt() != null
                && last.getCreatedAt().plusNanos(REFRESH_COOLDOWN_MS * 1_000_000L).isAfter(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Vui long cho 5 phut truoc khi phan tich lai"));
        }
        AnalyticsJob job = new AnalyticsJob("pending");
        jobRepository.save(job);

        final Long jobId = job.getId();
        CompletableFuture.runAsync(() -> aiService.runAnalysis(days, jobId));

        return ResponseEntity.accepted().body(Map.of("jobId", jobId));
    }

    /** Trang thai cong viec phan tich. */
    @GetMapping("/refresh/{id}")
    public Map<String, Object> refreshStatus(@PathVariable Long id) {
        AnalyticsJob job = jobRepository.findById(id).orElseThrow(
                () -> new com.evomap.dryfood.exception.NotFoundException("Khong tim thay job id=" + id));
        return Map.of("jobId", job.getId(), "status", job.getStatus(),
                "error", job.getError() == null ? "" : job.getError());
    }

    /** Danh sach khach trong mot cum RFM (phong to, chi admin). */
    @GetMapping("/segments/{segment}/customers")
    public Map<String, Object> segmentCustomers(@PathVariable String segment,
                                                @RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "10") int size) {
        int s = Math.min(Math.max(size, 1), 50);
        String canonical = canonicalSegment(segment);
        List<Customer> all = customerRepository.findAll();
        Map<Long, RFM> rfmByCust = rfmByCustomer();
        List<Customer> matched = all.stream()
                .filter(c -> {
                    RFM rfm = rfmByCust.get(c.getId());
                    if (rfm == null) return "Roi bo".equals(canonical);
                    String label = canonicalSegment(analyticsService.segmentLabel(rfm));
                    return label.equals(canonical);
                })
                .toList();
        int from = Math.min(page * s, matched.size());
        int to = Math.min(from + s, matched.size());
        return Map.of(
                "customers", matched.subList(from, to).stream().map(c -> Map.of(
                        "id", c.getId(), "name", c.getName(), "email", c.getEmail(),
                        "phone", c.getPhone() == null ? "" : c.getPhone(),
                        "address", c.getAddress() == null ? "" : c.getAddress())).toList(),
                "total", matched.size(), "page", page, "size", s);
    }

    /** Chuan hoa ten cum: chap nhan ca dang co dau lan khong dau (Rời bỏ / Roi bo / Ro bo...). */
    private static String canonicalSegment(String segment) {
        String s = normalizeVowel(stripDiacritics(segment)).trim().toLowerCase(java.util.Locale.ROOT);
        // Khớp với tên nội bộ gồm: VIP, Trung thanh, Moi, Co nguy co, Roi bo
        if (s.contains("roi") && s.contains("bo")) return "Roi bo";
        if (s.contains("ro bo") || s.equals("ro") || s.equals("bo")) return "Roi bo";
        if (s.contains("trung")) return "Trung thanh";
        if (s.contains("nguy") || s.contains("co nguy")) return "Co nguy co";
        if (s.contains("moi") || s.equals("mo")) return "Moi";
        if (s.equals("vip") || s.contains("vip")) return "VIP";
        return segment; // mac dinh giu nguyen
    }

    /** Gop cac ky tu nguyen am co dau ve dang co ban de so sanh lan nhau (o/ô/ơ -> o...). */
    private static String normalizeVowel(String s) {
        return s.replace('ơ', 'o').replace('ô', 'o').replace('â', 'a')
                .replace('ê', 'e').replace('ư', 'u').replace('ă', 'a').replace('đ', 'd');
    }

    /** Gop cac ky tu nguyen am co dau ve dang co ban de so sanh lan nhau (o/ô/ơ -> o...). */
    private static String stripDiacritics(String s) {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder();
        for (char c : s.toCharArray()) {
            switch (c) {
                case 'đ', 'Đ' -> sb.append('d');
                case 'à', 'á', 'ả', 'ã', 'ạ', 'ă', 'ắ', 'ằ', 'ẳ', 'ẵ', 'ặ', 'â', 'ấ', 'ầ', 'ẩ', 'ẫ', 'ậ',
                     'À', 'Á', 'Ả', 'Ã', 'Ạ', 'Ă', 'Ắ', 'Ằ', 'Ẳ', 'Ẵ', 'Ặ', 'Â', 'Ấ', 'Ầ', 'Ẩ', 'Ẫ', 'Ậ' -> sb.append('a');
                case 'è', 'é', 'ẻ', 'ẽ', 'ẹ', 'ê', 'ế', 'ề', 'ể', 'ễ', 'ệ',
                     'È', 'É', 'Ẻ', 'Ẽ', 'Ẹ', 'Ê', 'Ế', 'Ề', 'Ể', 'Ễ', 'Ệ' -> sb.append('e');
                case 'ì', 'í', 'ỉ', 'ĩ', 'ị', 'Ì', 'Í', 'Ỉ', 'Ĩ', 'Ị' -> sb.append('i');
                case 'ò', 'ó', 'ỏ', 'õ', 'ọ', 'ô', 'ố', 'ồ', 'ổ', 'ỗ', 'ộ', 'ơ', 'ớ', 'ờ', 'ở', 'ỡ', 'ợ',
                     'Ò', 'Ó', 'Ỏ', 'Õ', 'Ọ', 'Ô', 'Ố', 'Ồ', 'Ổ', 'Ỗ', 'Ộ', 'Ơ', 'Ớ', 'Ờ', 'Ở', 'Ỡ', 'Ợ' -> sb.append('o');
                case 'ù', 'ú', 'ủ', 'ũ', 'ụ', 'ư', 'ứ', 'ừ', 'ử', 'ữ', 'ự',
                     'Ù', 'Ú', 'Ủ', 'Ũ', 'Ụ', 'Ư', 'Ứ', 'Ừ', 'Ử', 'Ữ', 'Ự' -> sb.append('u');
                case 'ỳ', 'ý', 'ỷ', 'ỹ', 'ỵ', 'Ỳ', 'Ý', 'Ỷ', 'Ỹ', 'Ỵ' -> sb.append('y');
                default -> sb.append(c);
            }
        }
        return sb.toString();
    }

    /** Xuat CSV du lieu tong hop. */
    @GetMapping("/export/csv")
    public ResponseEntity<String> exportCsv(@RequestParam(defaultValue = "7") int days) {
        AnalyticsDataService.AggregatedData data = dataService.aggregate(days);
        StringBuilder sb = new StringBuilder("Ngay,Doanh thu,So don\n");
        data.revenueSeries().forEach(p -> sb.append(p.date()).append(',')
                .append(String.format(java.util.Locale.ROOT, "%.0f", p.revenue())).append(',')
                .append(p.orders()).append('\n'));
        sb.append("\nSan pham,So luot ban,Doanh thu\n");
        data.topProducts().forEach(p -> sb.append(csv(p.name())).append(',')
                .append(p.sold()).append(',')
                .append(String.format(java.util.Locale.ROOT, "%.0f", p.revenue())).append('\n'));
        return ResponseEntity.ok()
                .header("Content-Type", "text/csv; charset=UTF-8")
                .header("Content-Disposition", "attachment; filename=analytics.csv")
                .body("\uFEFF" + sb); // BOM cho Excel doc dung tieng Viet
    }

    private String csv(String s) {
        if (s == null) return "";
        return s.contains(",") ? "\"" + s.replace("\"", "\"\"") + "\"" : s;
    }

    /** Tinh lai RFM theo tung khach de phong to cum (tu service da fix). */
    private Map<Long, RFM> rfmByCustomer() {
        return analyticsService.rfmByCustomer();
    }

    private JsonNode safeParse(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return MAPPER.readTree(json);
        } catch (Exception e) {
            return null;
        }
    }
}