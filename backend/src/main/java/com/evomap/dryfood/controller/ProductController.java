package com.evomap.dryfood.controller;

import com.evomap.dryfood.model.Product;
import com.evomap.dryfood.service.ProductService;
import com.evomap.dryfood.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class ProductController {

    private final ProductService productService;
    private final ReviewService reviewService;

    public ProductController(ProductService productService, ReviewService reviewService) {
        this.productService = productService;
        this.reviewService = reviewService;
    }

    @GetMapping
    public Object list(@RequestParam(required = false) String q,
                       @RequestParam(required = false) String category,
                       @RequestParam(required = false) String sort,
                       @RequestParam(required = false, defaultValue = "asc") String order,
                       @RequestParam(required = false) Integer page,
                       @RequestParam(required = false) Integer size) {
        Object result = productService.search(q, category, sort, order, page, size);
        if (result instanceof ProductService.PageProducts pg) {
            reviewService.populateRatings(pg.items());
            return pg;
        }
        reviewService.populateRatings((List<Product>) result);
        return result;
    }

    @GetMapping("/categories")
    public List<String> categories() {
        return productService.categories();
    }

    @GetMapping("/low-stock")
    public List<Product> lowStock(@RequestParam(defaultValue = "10") int threshold) {
        return productService.findLowStock(threshold);
    }

    @GetMapping("/{id}")
    public Product get(@PathVariable Long id) {
        Product product = productService.findById(id);
        reviewService.populateRating(product);
        return product;
    }

    @PostMapping
    public ResponseEntity<Product> create(@Valid @RequestBody Product product) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(product));
    }

    @PutMapping("/{id}")
    public Product update(@PathVariable Long id, @Valid @RequestBody Product product) {
        return productService.update(id, product);
    }

    @PutMapping("/{id}/stock")
    public Product adjustStock(@PathVariable Long id, @RequestParam int delta) {
        return productService.adjustStock(id, delta);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }
}