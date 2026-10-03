package com.evomap.dryfood.service.analytics;

/**
 * Khach hang co nguy co roi bo (churn) kem diem ru ri va goi y xu ly.
 *
 * @param customerId id khach hang
 * @param name       ten khach hang
 * @param email      email khach hang
 * @param phone      so dien thoai
 * @param churnScore diem ru ri 0-100 (cao = de mat)
 * @param riskLevel  label: THAP / VUA / CAO
 * @param suggestion goi y cham soc (gui voucher, khao sat...)
 * @param lastOrder  ngay mua gan nhat (yyyy-MM-dd, "" neu chua co don)
 */
public record ChurnRiskCustomer(
        Long customerId,
        String name,
        String email,
        String phone,
        double churnScore,
        String riskLevel,
        String suggestion,
        String lastOrder
) {
}
