package com.evomap.dryfood.service;

/**
 * Du lieu tong hop cho trang phan tich (dashboard).
 */
public record DashboardSummary(
        double totalRevenue,
        double revenueToday,
        long totalOrders,
        long pendingOrders,
        long lowStockProducts,
        long totalProducts,
        long totalCustomers
) {
}
