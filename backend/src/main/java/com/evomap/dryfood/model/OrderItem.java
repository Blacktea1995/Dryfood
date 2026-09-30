package com.evomap.dryfood.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;

@Entity
@Table(name = "order_items")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @NotBlank(message = "Ten san pham khong duoc de trong")
    @Column(nullable = false, length = 150)
    private String productName;

    @NotNull(message = "So luong khong duoc de trong")
    @Min(value = 1, message = "So luong phai >= 1")
    private Integer quantity;

    @NotNull(message = "Gia ban khong duoc de trong")
    @PositiveOrZero(message = "Gia ban phai >= 0")
    private Double price;

    public OrderItem() {
    }

    public OrderItem(Product product, Integer quantity) {
        this.product = product;
        this.productName = product.getName();
        this.quantity = quantity;
        this.price = product.getPrice();
    }

    public double getSubtotal() {
        return price * quantity;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Order getOrder() {
        return order;
    }

    public void setOrder(Order order) {
        this.order = order;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }
}
