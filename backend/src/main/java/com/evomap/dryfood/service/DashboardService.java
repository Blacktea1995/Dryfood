package com.evomap.dryfood.service;

import com.evomap.dryfood.model.Order;
import com.evomap.dryfood.model.Order.Status;
import com.evomap.dryfood.repository.CustomerRepository;
import com.evomap.dryfood.repository.OrderRepository;
import com.evomap.dryfood.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Phan tich du lieu kinh doanh cho dashboard.
 */
@Service
public class DashboardService {

    private static final int LOW_STOCK_THRESHOLD = 10;
    private static final int DAYS = 7;
    private static final int TOP_N = 5;

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;

    public DashboardService(OrderRepository orderRepository,
                            ProductRepository productRepository,
                            CustomerRepository customerRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
    }

    public DashboardSummary summary() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime sevenDaysAgo = LocalDate.now().minusDays(DAYS - 1L).atStartOfDay();

        double totalRevenue = orderRepository.sumTotalByStatusNotAndCreatedAtAfter(Status.CANCELLED, LocalDateTime.of(2000, 1, 1, 0, 0));
        double revenueToday = orderRepository.sumTotalByStatusNotAndCreatedAtAfter(Status.CANCELLED, startOfDay);

        long totalOrders = orderRepository.count();
        long pendingOrders = orderRepository.countByStatus(Status.PENDING);
        long lowStockProducts = productRepository.findByStockLessThanEqual(LOW_STOCK_THRESHOLD).size();
        long totalProducts = productRepository.count();
        long totalCustomers = customerRepository.count();

        return new DashboardSummary(totalRevenue, revenueToday, totalOrders,
                pendingOrders, lowStockProducts, totalProducts, totalCustomers);
    }

    public List<RevenuePoint> revenueLast7Days() {
        Map<LocalDate, Double> map = new LinkedHashMap<>();
        LocalDate today = LocalDate.now();
        for (int i = DAYS - 1; i >= 0; i--) {
            map.put(today.minusDays(i), 0.0);
        }

        LocalDateTime from = today.minusDays(DAYS - 1L).atStartOfDay();
        LocalDateTime to = today.plusDays(1L).atStartOfDay();
        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc();

        for (Order o : orders) {
            if (o.getStatus() == Status.CANCELLED) continue;
            LocalDate d = o.getCreatedAt().toLocalDate();
            if (!d.isBefore(from.toLocalDate()) && !d.isAfter(today)) {
                map.merge(d, o.getTotalAmount(), Double::sum);
            }
        }

        List<RevenuePoint> points = new ArrayList<>();
        for (Map.Entry<LocalDate, Double> e : map.entrySet()) {
            points.add(new RevenuePoint(e.getKey(), round2(e.getValue())));
        }
        return points;
    }

    public List<TopProduct> topProducts() {
        Map<Long, long[]> agg = new LinkedHashMap<>(); // productId -> {sold, revenue(rounded cent)}
        for (Order o : orderRepository.findAll()) {
            if (o.getStatus() == Status.CANCELLED) continue;
            o.getItems().forEach(item -> {
                long pid = item.getProduct().getId();
                long[] cur = agg.computeIfAbsent(pid, k -> new long[2]);
                cur[0] += item.getQuantity();
                cur[1] += Math.round(item.getSubtotal() * 100);
            });
        }

        return agg.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue()[0], a.getValue()[0]))
                .limit(TOP_N)
                .map(e -> {
                    var product = productRepository.findById(e.getKey()).orElse(null);
                    if (product == null) return null;
                    return new TopProduct(product.getId(), product.getName(), product.getImageUrl(),
                            e.getValue()[0], round2(e.getValue()[1] / 100.0));
                })
                .filter(java.util.Objects::nonNull)
                .toList();
    }

    public List<StatusCount> ordersByStatus() {
        Map<Status, Long> counts = new EnumMap<>(Status.class);
        for (Status s : Status.values()) {
            counts.put(s, 0L);
        }
        for (Order o : orderRepository.findAll()) {
            counts.merge(o.getStatus(), 1L, Long::sum);
        }
        return counts.entrySet().stream()
                .map(e -> new StatusCount(e.getKey(), e.getValue()))
                .toList();
    }

    public List<com.evomap.dryfood.model.Product> lowStock() {
        return productRepository.findByStockLessThanEqual(LOW_STOCK_THRESHOLD);
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
