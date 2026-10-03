package com.evomap.dryfood.service.analytics;

/**
 * Goi y san pham (recommendation) cho mot san pham / khach hang.
 */
public record Recommendation(
        Long productId,
        String name,
        String imageUrl,
        Double price,
        double score
) {
}