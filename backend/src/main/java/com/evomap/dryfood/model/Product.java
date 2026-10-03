package com.evomap.dryfood.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;

@Entity
@Table(name = "products")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Ten san pham khong duoc de trong")
    @Column(nullable = false, length = 150)
    private String name;

    @NotBlank(message = "SKU khong duoc de trong")
    @Column(nullable = false, unique = true, length = 30)
    private String sku;

    @Column(length = 100)
    private String category;

    @Column(length = 20)
    private String unit = "goi";

    @NotNull(message = "Gia ban khong duoc de trong")
    @PositiveOrZero(message = "Gia ban phai >= 0")
    private Double price;

    @NotNull(message = "Ton kho khong duoc de trong")
    @Min(value = 0, message = "Ton kho phai >= 0")
    private Integer stock = 0;

    @Column(length = 500)
    private String description;

    @Column(length = 255)
    private String imageUrl;

    /** Diem trung binh danh gia (khong luu DB, tinh dong). */
    @Transient
    private Double avgRating;

    /** Tong so danh gia. */
    @Transient
    private Integer ratingCount = 0;

    public Product() {
    }

    public Product(String name, String sku, String category, String unit,
                   Double price, Integer stock, String description, String imageUrl) {
        this.name = name;
        this.sku = sku;
        this.category = category;
        this.unit = unit;
        this.price = price;
        this.stock = stock;
        this.description = description;
        this.imageUrl = imageUrl;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Double getAvgRating() {
        return avgRating;
    }

    public void setAvgRating(Double avgRating) {
        this.avgRating = avgRating;
    }

    public Integer getRatingCount() {
        return ratingCount;
    }

    public void setRatingCount(Integer ratingCount) {
        this.ratingCount = ratingCount;
    }
}
