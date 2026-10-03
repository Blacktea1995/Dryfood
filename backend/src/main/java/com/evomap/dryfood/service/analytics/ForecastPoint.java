package com.evomap.dryfood.service.analytics;

/**
 * Ket qua du doan doanh thu / so luong ban cho nhung ngay sap toi.
 *
 * @param date        ngay du bao (yyyy-MM-dd)
 * @param forecastQty so luong san pham du kien ban
 * @param forecastRev doanh thu du kien (VND)
 */
public record ForecastPoint(
        String date,
        int forecastQty,
        double forecastRev
) {
}