package com.evomap.dryfood.service.analytics;

import com.evomap.dryfood.model.Customer;
import com.evomap.dryfood.model.Order;
import com.evomap.dryfood.model.Order.Status;
import com.evomap.dryfood.model.OrderItem;
import com.evomap.dryfood.model.Product;
import com.evomap.dryfood.repository.CustomerRepository;
import com.evomap.dryfood.repository.OrderRepository;
import com.evomap.dryfood.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Phan tich / tri tue nhan tao (diem nhan cua khao luan) - trien khai bang Java,
 * chay ngay trong app, khong can Python.
 *
 * <p>Bao gom:
 * <ul>
 *   <li>Phan cum RFM (VIP / Trung thanh / Moi / Co nguy co / Ro bo)</li>
 *   <li>Du doan khach hang ru ri bo (churn scoring heuristic)</li>
 *   <li>Du bao nhu cau (demand forecast theo ngay trong tuan + trend)</li>
 *   <li>Goi y san pham (co-occurrence + best-seller)</li>
 * </ul>
 */
@Service
public class AnalyticsService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;

    public AnalyticsService(OrderRepository orderRepository,
                            ProductRepository productRepository,
                            CustomerRepository customerRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
    }

    // ==============================
    // 1. PHAN CUM RFM
    // ==============================

    public List<RfmSegment> rfmSegments() {
        Map<Customer, RFM> rfmMap = computeRfm();
        Map<String, long[]> seg = new LinkedHashMap<>();
        for (var e : rfmMap.entrySet()) {
            String label = segmentLabel(e.getValue());
            long[] agg = seg.computeIfAbsent(label, k -> new long[4]); // count, recencySum, freqSum, monSum
            agg[0] += 1;
            agg[1] += (long) e.getValue().recency();
            agg[2] += (long) e.getValue().frequency();
            agg[3] += Math.round(e.getValue().monetary());
        }
        List<RfmSegment> out = new ArrayList<>();
        for (var e : seg.entrySet()) {
            long count = e.getValue()[0];
            out.add(new RfmSegment(e.getKey(), count,
                    count == 0 ? 0 : (double) e.getValue()[1] / count,
                    count == 0 ? 0 : (double) e.getValue()[2] / count,
                    count == 0 ? 0 : (double) e.getValue()[3] / count));
        }
        Map<String, Integer> rank = Map.of("VIP", 0, "Trung thanh", 1, "Moi", 2, "Co nguy co", 3, "Ro bo", 4);
        out.sort((a, b) -> Integer.compare(rank.getOrDefault(a.segment(), 9), rank.getOrDefault(b.segment(), 9)));
        return out;
    }

    /** Gan nhan thu cho khach hang dua tren RFM. */
    public String segmentLabel(RFM rfm) {
        double r = rfm.recency();   // ngay tu lan mua gan nhat
        double f = rfm.frequency(); // so don
        double m = rfm.monetary();  // tong tien
        if (f >= 4 && m >= 150_000 && r <= 15) return "VIP";
        if (f >= 2 && m >= 50_000 && r <= 45) return "Trung thanh";
        if (f == 1 && r <= 30) return "Moi";
        if (r > 90) return "Ro bo";
        if (r > 45 || f == 1) return "Co nguy co";
        return "Trung thanh";
    }

    // ==============================
    // 2. DU DOAN KHACH HANG RO BO (CHURN)
    // ==============================

    public List<ChurnRiskCustomer> churnRisk() {
        Map<Customer, RFM> rfmMap = computeRfm();
        List<ChurnRiskCustomer> out = new ArrayList<>();
        for (var e : rfmMap.entrySet()) {
            Customer c = e.getKey();
            RFM rfm = e.getValue();
            double score = churnScore(rfm);
            String level = score >= 70 ? "CAO" : score >= 40 ? "VUA" : "THAP";
            String sugg = switch (level) {
                case "CAO" -> "Gui voucher gia tri cao + khao sat ly do roi bo";
                case "VUA" -> "Gui voucher thoi han 7 ngay + nhac lai san pham da mua";
                default -> "Giu lien lien he, gui tin moi me nha do";
            };
            String lastOrder = rfm.recency() == Double.MAX_VALUE ? "" : LocalDate.now().minusDays((long) rfm.recency()).toString();
            out.add(new ChurnRiskCustomer(c.getId(), c.getName(), c.getEmail(), c.getPhone() == null ? "" : c.getPhone(),
                    Math.round(score * 100) / 100.0, level, sugg, lastOrder));
        }
        out.sort((a, b) -> Double.compare(b.churnScore(), a.churnScore()));
        return out;
    }

    private double churnScore(RFM rfm) {
        double rNorm = rfm.recency() == Double.MAX_VALUE ? 1.0 : Math.min(1.0, rfm.recency() / 90.0);
        double fScore = 1.0 - Math.min(1.0, rfm.frequency() / 5.0);
        double mScore = 1.0 - Math.min(1.0, rfm.monetary() / 100_000.0);
        return (rNorm * 0.5 + fScore * 0.3 + mScore * 0.2) * 100;
    }

    // ==============================
    // 3. DU BAO NHU CAU
    // ==============================

    /**
     * Du bao doanh thu + so luong ban cho N ngay toi, dua tren doanh thu trung binh
     * cua tung ngay trong tuan trong 60 ngay qua.
     */
    public List<ForecastPoint> forecastRevenue(int days) {
        List<ForecastPoint> out = new ArrayList<>();
        int d = Math.min(Math.max(days, 1), 30);
        LocalDateTime from = LocalDate.now().minusDays(60).atStartOfDay();
        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc();

        double[] dowTotals = new double[7];
        long[] dowCounts = new long[7];
        double total = 0;
        long dayCount = 0;
        for (Order o : orders) {
            if (o.getStatus() == Status.CANCELLED) continue;
            LocalDate od = o.getCreatedAt().toLocalDate();
            if (!od.isBefore(from.toLocalDate())) {
                int dow = od.getDayOfWeek().getValue() - 1;
                dowTotals[dow] += o.getTotalAmount();
                dowCounts[dow]++;
                total += o.getTotalAmount();
                dayCount++;
            }
        }
        double dailyAvg = dayCount == 0 ? 0 : total / dayCount;
        double avgPrice = avgItemPrice();

        LocalDate today = LocalDate.now();
        for (int i = 1; i <= d; i++) {
            LocalDate day = today.plusDays(i);
            int dow = day.getDayOfWeek().getValue() - 1;
            double dowAvg = dowCounts[dow] > 0 ? dowTotals[dow] / dowCounts[dow] : dailyAvg;
            double forecastRev = Math.round(dowAvg == 0 ? dailyAvg : dowAvg);
            int forecastQty = (int) Math.round(forecastRev / (avgPrice == 0 ? 30000 : avgPrice));
            out.add(new ForecastPoint(day.toString(), Math.max(0, forecastQty), forecastRev));
        }
        return out;
    }

    private double avgItemPrice() {
        List<Product> ps = productRepository.findAll();
        if (ps.isEmpty()) return 30000;
        return ps.stream().mapToDouble(Product::getPrice).average().orElse(30000);
    }

    /** Du bao so luong ban cho tung san pham trong 7 ngay toi + goi y nhap hang. */
    public List<DemandForecast> demandForecastByProduct() {
        List<DemandForecast> out = new ArrayList<>();
        double[] dowTotals = new double[7];      // qty sitv per weekday
        long[] dowCounts = new long[7];
        Map<Long, double[]> prodDaily = new HashMap<>(); // per product total qty + count per weekday (simplified)
        // We'll compute per-product avg daily qty from last 60 days.
        LocalDateTime from = LocalDate.now().minusDays(60).atStartOfDay();
        Map<Long, Long> prodQty = new HashMap<>();
        Map<Long, Double> prodAvgRev = new HashMap<>();
        // qty per product per day of week - simplified: aggregate qty in window
        long histDays = 60;
        for (Order o : orderRepository.findAllByOrderByCreatedAtDesc()) {
            if (o.getStatus() == Status.CANCELLED) continue;
            if (o.getCreatedAt().toLocalDate().isBefore(from.toLocalDate())) continue;
            for (OrderItem it : o.getItems()) {
                prodQty.merge(it.getProduct().getId(), (long) it.getQuantity(), Long::sum);
            }
        }
        for (Product p : productRepository.findAll()) {
            long qty = prodQty.getOrDefault(p.getId(), 0L);
            int daily = (int) Math.round(qty / (double) histDays);
            int forecast7 = daily * 7;
            String advice = forecast7 == 0 ? "Chua co du lieu ban - nhap luu vua du" :
                    p.getStock() < forecast7 ? "Can nhap them " + (forecast7 - p.getStock()) + " " + p.getUnit()
                            : "Ton kho du cho 7 ngay";
            out.add(new DemandForecast(p.getId(), p.getName(), p.getCategory(), forecast7, p.getStock(), advice));
        }
        // sap xep: san pham can nhap gap (stock < forecast) len dau
        out.sort((a, b) -> {
            boolean needA = a.stock() < a.forecastQtyNext7Days();
            boolean needB = b.stock() < b.forecastQtyNext7Days();
            if (needA != needB) return needA ? -1 : 1;
            return Integer.compare(b.forecastQtyNext7Days(), a.forecastQtyNext7Days());
        });
        return out;
    }

    // ==============================
    // 4. GOI Y SAN PHAM (RECOMMENDATION)
    // ==============================

    /** Goi y san pham lien quan (co-purchase) cho mot san pham. */
    public List<Recommendation> recommendForProduct(Long productId, int limit) {
        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc();
        Map<Long, Long> coCount = new HashMap<>();
        for (Order o : orders) {
            if (o.getStatus() == Status.CANCELLED) continue;
            boolean contains = o.getItems().stream().anyMatch(i -> i.getProduct().getId().equals(productId));
            if (!contains) continue;
            for (OrderItem it : o.getItems()) {
                Long pid = it.getProduct().getId();
                if (!pid.equals(productId)) {
                    coCount.merge(pid, 1L, Long::sum);
                }
            }
        }
        Map<Long, Long> buyCount = new HashMap<>();
        for (Order o : orders) {
            if (o.getStatus() == Status.CANCELLED) continue;
            for (OrderItem it : o.getItems()) {
                buyCount.merge(it.getProduct().getId(), 1L, Long::sum);
            }
        }
        List<Recommendation> out = new ArrayList<>();
        for (var e : coCount.entrySet()) {
            Long pid = e.getKey();
            double score = buyCount.getOrDefault(pid, 0L) == 0 ? 0 : (double) e.getValue() / buyCount.get(pid);
            Product p = productRepository.findById(pid).orElse(null);
            if (p == null) continue;
            out.add(new Recommendation(p.getId(), p.getName(), p.getImageUrl(), p.getPrice(), Math.round(score * 100.0) / 100.0));
        }
        out.sort((a, b) -> Double.compare(b.score(), a.score()));
        int cap = Math.min(limit, out.size());
        out = out.subList(0, cap);
        if (out.size() < limit) {
            List<TopProduct> top = topProductsInternal();
            for (TopProduct t : top) {
                if (out.stream().anyMatch(r -> r.productId().equals(t.productId()))) continue;
                if (t.productId().equals(productId)) continue;
                Product p = productRepository.findById(t.productId()).orElse(null);
                if (p == null) continue;
                out.add(new Recommendation(p.getId(), p.getName(), p.getImageUrl(), p.getPrice(), 0.1));
                if (out.size() >= limit) break;
            }
        }
        return out;
    }

    // ==============================
    // helpers
    // ==============================

    private Map<Customer, RFM> computeRfm() {
        List<Order> orders = orderRepository.findAll();
        Map<Long, List<Order>> byCustomer = new HashMap<>();
        for (Order o : orders) {
            if (o.getCustomer() != null && o.getStatus() != Status.CANCELLED) {
                byCustomer.computeIfAbsent(o.getCustomer().getId(), k -> new ArrayList<>()).add(o);
            }
        }
        Map<Customer, RFM> out = new LinkedHashMap<>();
        for (Customer c : customerRepository.findAll()) {
            List<Order> cs = byCustomer.getOrDefault(c.getId(), List.of());
            if (cs.isEmpty()) {
                out.put(c, new RFM(Double.MAX_VALUE, 0, 0));
            } else {
                LocalDate latest = cs.stream().map(o -> o.getCreatedAt().toLocalDate()).max(LocalDate::compareTo).orElse(LocalDate.now());
                long recency = Math.max(0, ChronoUnit.DAYS.between(latest, LocalDate.now()));
                out.put(c, new RFM(recency, cs.size(),
                        cs.stream().mapToDouble(Order::getTotalAmount).sum()));
            }
        }
        return out;
    }

    /** Top san pham ban chay (gan giong DashboardService.topProducts). */
    private List<TopProduct> topProductsInternal() {
        Map<Long, long[]> agg = new LinkedHashMap<>(); // productId -> {sold, rev}
        for (Order o : orderRepository.findAll()) {
            if (o.getStatus() == Status.CANCELLED) continue;
            o.getItems().forEach(it -> {
                long pid = it.getProduct().getId();
                long[] cur = agg.computeIfAbsent(pid, k -> new long[2]);
                cur[0] += it.getQuantity();
                cur[1] += Math.round(it.getSubtotal() * 100);
            });
        }
        return agg.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue()[0], a.getValue()[0]))
                .limit(5)
                .map(e -> {
                    Product p = productRepository.findById(e.getKey()).orElse(null);
                    if (p == null) return null;
                    return new TopProduct(p.getId(), p.getName(), p.getImageUrl(), e.getValue()[0],
                            Math.round(e.getValue()[1]) / 100.0);
                })
                .filter(java.util.Objects::nonNull)
                .toList();
    }
}