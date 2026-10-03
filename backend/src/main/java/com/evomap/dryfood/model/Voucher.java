package com.evomap.dryfood.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Ma giam gia / khuyen mai cho don hang.
 */
@Entity
@Table(name = "vouchers")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Voucher {

    public enum Type {
        PERCENT,      // giam theo % don hang
        AMOUNT        // giam tru truc tiep (so tien)
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Ma giam gia khong duoc de trong")
    @Column(nullable = false, unique = true, length = 40)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Type type = Type.AMOUNT;

    /** Gia tri giam: so % (PERCENT, 0-100) hoac so tien (AMOUNT). */
    @NotNull(message = "Gia tri giam khong duoc de trong")
    @Positive(message = "Gia tri giam phai > 0")
    private Double value;

    /** Gia tri giam toi da (chi ap dung cho PERCENT). */
    private Double maxDiscount;

    /** Don hang toi thieu moi ap dung duoc. */
    private Double minOrder;

    @Column(nullable = false)
    private LocalDate startDate = LocalDate.now();

    @Column(nullable = false)
    private LocalDate endDate;

    /** Tong so luong phat hanh (null = khong gioi han). */
    private Integer quantity;

    /** So lan da su dung. */
    @Column(nullable = false)
    private Integer usedCount = 0;

    /** Kich hoat hay vo hieu hoa. */
    @Column(nullable = false)
    private Boolean active = true;

    @Column(length = 255)
    private String description;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Voucher() {
    }

    /** Kiem tra voucher con su dung duoc khong (thoi gian, so luong, kich hoat). */
    public boolean isValid() {
        LocalDate today = LocalDate.now();
        return Boolean.TRUE.equals(active)
                && !today.isBefore(startDate)
                && !today.isAfter(endDate)
                && (quantity == null || usedCount < quantity);
    }

    /** Tinh so tien giam cho mot don hang co tong tien la orderTotal. */
    public double discountFor(double orderTotal) {
        if (!isValid()) {
            return 0;
        }
        if (minOrder != null && orderTotal < minOrder) {
            return 0;
        }
        double discount;
        if (type == Type.PERCENT) {
            double pct = Math.max(0, Math.min(value, 100));
            discount = orderTotal * pct / 100.0;
            if (maxDiscount != null) {
                discount = Math.min(discount, maxDiscount);
            }
        } else {
            discount = value;
        }
        // Khong duoc giam qua don hang (khong am tien)
        return Math.min(discount, orderTotal);
    }

    // ===== getters / setters =====

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public Type getType() {
        return type;
    }

    public void setType(Type type) {
        this.type = type;
    }

    public Double getValue() {
        return value;
    }

    public void setValue(Double value) {
        this.value = value;
    }

    public Double getMaxDiscount() {
        return maxDiscount;
    }

    public void setMaxDiscount(Double maxDiscount) {
        this.maxDiscount = maxDiscount;
    }

    public Double getMinOrder() {
        return minOrder;
    }

    public void setMinOrder(Double minOrder) {
        this.minOrder = minOrder;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Integer getUsedCount() {
        return usedCount;
    }

    public void setUsedCount(Integer usedCount) {
        this.usedCount = usedCount;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
