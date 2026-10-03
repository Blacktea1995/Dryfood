package com.evomap.dryfood.service;

import com.evomap.dryfood.model.Order;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * Request tao don hang moi.
 */
public record OrderRequest(
        Long customerId,
        String note,
        @NotEmpty(message = "Don hang phai co it nhat 1 san pham")
        @Valid
        List<ItemRequest> items,
        Order.PaymentMethod paymentMethod,
        String voucherCode
) {
    public OrderRequest(Long customerId, String note, List<ItemRequest> items) {
        this(customerId, note, items, Order.PaymentMethod.COD, null);
    }

    public record ItemRequest(
            @NotNull(message = "productId khong duoc de trong") Long productId,
            @NotNull(message = "So luong khong duoc de trong") Integer quantity
    ) {
    }
}