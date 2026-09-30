package com.evomap.dryfood.service;

import com.evomap.dryfood.model.Product;

/**
 * Ket qua thong ke: san pham + so luong ban + doanh thu tuong ung.
 */
public record TopProduct(long productId, String name, String imageUrl, long sold, double revenue) {
}
