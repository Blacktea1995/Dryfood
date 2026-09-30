package com.evomap.dryfood.service;

import com.evomap.dryfood.exception.BadRequestException;
import com.evomap.dryfood.exception.NotFoundException;
import com.evomap.dryfood.model.Product;
import com.evomap.dryfood.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> findAll() {
        return productRepository.findAllByOrderByIdDesc();
    }

    public Product findById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Khong tim thay san pham id=" + id));
    }

    public List<Product> search(String q) {
        if (q == null || q.isBlank()) {
            return findAll();
        }
        return productRepository.search(q.trim());
    }

    public List<Product> findLowStock(int threshold) {
        return productRepository.findByStockLessThanEqual(threshold);
    }

    @Transactional
    public Product create(Product product) {
        return productRepository.save(product);
    }

    @Transactional
    public Product update(Long id, Product updated) {
        Product p = findById(id);
        p.setName(updated.getName());
        p.setSku(updated.getSku());
        p.setCategory(updated.getCategory());
        p.setUnit(updated.getUnit());
        p.setPrice(updated.getPrice());
        p.setStock(updated.getStock());
        p.setDescription(updated.getDescription());
        p.setImageUrl(updated.getImageUrl());
        return productRepository.save(p);
    }

    @Transactional
    public Product adjustStock(Long id, int delta) {
        Product p = findById(id);
        int newStock = p.getStock() + delta;
        if (newStock < 0) {
            throw new BadRequestException("Ton kho khong du (hien tai: " + p.getStock() + ")");
        }
        p.setStock(newStock);
        return productRepository.save(p);
    }

    @Transactional
    public void delete(Long id) {
        Product p = findById(id);
        productRepository.delete(p);
    }
}
