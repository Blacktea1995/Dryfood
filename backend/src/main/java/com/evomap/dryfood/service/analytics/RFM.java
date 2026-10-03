package com.evomap.dryfood.service.analytics;

/**
 * To hop du lieu RFM cua mot khach hang.
 *
 * <p>RFM:
 * <ul>
 *   <li><b>R (Recency)</b> - do gan day (ngay): ngay mua gan nhat cang gan cang tot</li>
 *   <li><b>F (Frequency)</b> - tan suat (so lan): so don da dat</li>
 *   <li><b>M (Monetary)</b> - gia tri: tong tien da chi</li>
 * </ul>
 * Duoc dung de phan cum khach hang va du doan ru ri bo (churn).
 */
public record RFM(
        double recency,
        double frequency,
        double monetary
) {
}