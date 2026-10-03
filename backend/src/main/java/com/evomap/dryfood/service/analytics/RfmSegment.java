package com.evomap.dryfood.service.analytics;

/**
 * Cum khach hang theo RFM (VIP, Trung thanh, Moi, Co nguy co, Ro bo).
 *
 * @param segment     ten cum
 * @param count       so khach trong cum
 * @param avgRecency  do gan day trung binh (ngay)
 * @param avgFrequency tan suat trung binh
 * @param avgMonetary gia tri trung binh (VND)
 */
public record RfmSegment(
        String segment,
        long count,
        double avgRecency,
        double avgFrequency,
        double avgMonetary
) {
}
