package com.evomap.dryfood.controller;

import com.evomap.dryfood.model.Product;
import com.evomap.dryfood.service.DashboardService;
import com.evomap.dryfood.service.DashboardSummary;
import com.evomap.dryfood.service.RevenuePoint;
import com.evomap.dryfood.service.StatusCount;
import com.evomap.dryfood.service.TopProduct;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public DashboardSummary summary() {
        return dashboardService.summary();
    }

    @GetMapping("/revenue-last-7-days")
    public List<RevenuePoint> revenueLast7Days() {
        return dashboardService.revenueLast7Days();
    }

    @GetMapping("/top-products")
    public List<TopProduct> topProducts() {
        return dashboardService.topProducts();
    }

    @GetMapping("/orders-by-status")
    public List<StatusCount> ordersByStatus() {
        return dashboardService.ordersByStatus();
    }

    @GetMapping("/inventory-low")
    public List<Product> inventoryLow() {
        return dashboardService.lowStock();
    }
}
