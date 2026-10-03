package com.evomap.dryfood.controller;

import com.evomap.dryfood.service.analytics.AnalyticsService;
import com.evomap.dryfood.service.analytics.ChurnRiskCustomer;
import com.evomap.dryfood.service.analytics.DemandForecast;
import com.evomap.dryfood.service.analytics.ForecastPoint;
import com.evomap.dryfood.service.analytics.Recommendation;
import com.evomap.dryfood.service.analytics.RfmSegment;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * API phan tich / AI (admin) - diem nhan cua khao luan.
 */
@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /** Phan cum RFM cua khach hang. */
    @GetMapping("/rfm")
    public List<RfmSegment> rfm() {
        return analyticsService.rfmSegments();
    }

    /** Du doan khach hang ru ri bo (churn). */
    @GetMapping("/churn")
    public List<ChurnRiskCustomer> churn() {
        return analyticsService.churnRisk();
    }

    /** Du bao doanh thu + so luong ban cho N ngay toi. */
    @GetMapping("/forecast")
    public List<ForecastPoint> forecast(@RequestParam(defaultValue = "7") int days) {
        return analyticsService.forecastRevenue(days);
    }

    /** Du bao nhu cau tung san pham + goi y nhap hang. */
    @GetMapping("/demand")
    public List<DemandForecast> demand() {
        return analyticsService.demandForecastByProduct();
    }

    /** Goi y san pham lien quan cho mot san pham. */
    @GetMapping("/recommend")
    public List<Recommendation> recommend(@RequestParam Long productId,
                                          @RequestParam(defaultValue = "5") int limit) {
        return analyticsService.recommendForProduct(productId, limit);
    }
}