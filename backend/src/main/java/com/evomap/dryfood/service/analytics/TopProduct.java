package com.evomap.dryfood.service.analytics;

/**
 * San pham ban chay (top product) dung cho goi y va dashboard.
 */
public record TopProduct(
        Long productId,
        String name,
        String imageUrl,
        long sold,
        double revenue
) {
}