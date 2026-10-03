package com.evomap.dryfood.service.analytics;

/**
 * Du bao nhu cau cho tung san pham / danh muc trong N ngay toi,
 * kem khuyen nghi nhap hang.
 */
public record DemandForecast(
        Long productId,
        String name,
        String category,
        int forecastQtyNext7Days,
        int stock,
        String restockAdvice
) {
}