package com.evomap.dryfood.service.analytics;

import com.evomap.dryfood.model.Order;
import com.evomap.dryfood.model.Order.Status;
import com.evomap.dryfood.model.Product;
import com.evomap.dryfood.repository.CustomerRepository;
import com.evomap.dryfood.repository.OrderRepository;
import com.evomap.dryfood.repository.ProductRepository;
import com.evomap.dryfood.service.DashboardService;
import com.evomap.dryfood.service.DashboardSummary;
import com.evomap.dryfood.service.StatusCount;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Gom du lieu TONG HOP tu DB de dua cho OpenAI (KHONG chua ten/email/phone/address).
 * Cac truy van GROUP BY, tranh N+1.
 */
@Service
public class AnalyticsDataService {

    private static final int LOW_STOCK_THRESHOLD = 10;
    private static final int TOP_N = 20;
    private static final int MAX_DAYS = 90;

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final DashboardService dashboardService;
    private final AnalyticsService analyticsService;

    public AnalyticsDataService(OrderRepository orderRepository,
                                ProductRepository productRepository,
                                CustomerRepository customerRepository,
                                DashboardService dashboardService,
                                AnalyticsService analyticsService) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
        this.dashboardService = dashboardService;
        this.analyticsService = analyticsService;
    }

    /** Du lieu tong hop khong PII. */
    public record DailyPoint(LocalDate date, double revenue, long orders) {
    }

    public record CategoryRevenue(String category, double revenue) {
    }

    public record AggregatedData(
            List<DailyPoint> revenueSeries,
            List<TopProduct> topProducts,
            List<CategoryRevenue> categoryRevenue,
            List<StatusCount> statusCounts,
            List<RfmSegment> rfmSegments,
            List<Product> lowStock,
            long totalCustomers,
            double totalRevenue,
            double revenueToday,
            long totalOrders,
            long pendingOrders,
            long lowStockCount
    ) {
    }

    public AggregatedData aggregate(int periodDays) {
        int days = Math.min(Math.max(periodDays, 7), MAX_DAYS);
        LocalDate today = LocalDate.now();
        LocalDateTime from = today.minusDays(days - 1L).atStartOfDay();

        Map<LocalDate, DailyPoint> seriesMap = new LinkedHashMap<>();
        for (int i = days - 1; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            seriesMap.put(d, new DailyPoint(d, 0.0, 0));
        }

        // Doanh thu/so don theo ngay: dung 1 query GROUP BY (khong load lazy)
        List<Object[]> dayRows = orderRepository.revenueByDay(from, Status.CANCELLED.name(), days);
        for (Object[] row : dayRows) {
            LocalDate d = ((java.sql.Date) row[0]).toLocalDate();
            double rev = ((Number) row[1]).doubleValue();
            long cnt = ((Number) row[2]).longValue();
            seriesMap.put(d, new DailyPoint(d, rev, cnt));
        }

        // Doanh thu theo danh muc: 1 query GROUP BY category
        List<Object[]> catRows = orderRepository.revenueByCategory(Status.CANCELLED);
        Map<String, Double> catRev = new LinkedHashMap<>();
        for (Object[] row : catRows) {
            String cat = (String) row[0];
            double rev = ((Number) row[1]).doubleValue();
            catRev.put(cat, rev);
        }

        List<StatusCount> statusCounts = orderRepository.countByStatusAll().stream()
                .map(row -> new StatusCount((Order.Status) row[0], ((Number) row[1]).longValue()))
                .toList();

        List<DailyPoint> revenueSeries = new ArrayList<>(seriesMap.values());
        List<CategoryRevenue> categoryRevenue = catRev.entrySet().stream()
                .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
                .map(e -> new CategoryRevenue(e.getKey(), e.getValue()))
                .toList();

        List<TopProduct> top = analyticsService.topProducts().stream().limit(TOP_N).toList();

        DashboardSummary s = dashboardService.summary();

        return new AggregatedData(
                revenueSeries,
                top,
                categoryRevenue,
                statusCounts,
                analyticsService.rfmSegments(),
                productRepository.findByStockLessThanEqual(LOW_STOCK_THRESHOLD),
                customerRepository.count(),
                s.totalRevenue(),
                s.revenueToday(),
                s.totalOrders(),
                s.pendingOrders(),
                s.lowStockProducts()
        );
    }
}