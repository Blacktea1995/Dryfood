package com.evomap.dryfood.service;

import com.evomap.dryfood.exception.BadRequestException;
import com.evomap.dryfood.exception.NotFoundException;
import com.evomap.dryfood.model.Product;
import com.evomap.dryfood.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
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

    /** Ket qua phan trang cua sản phẩm. */
    public record PageProducts(List<Product> items, long total, int page, int size) {
    }

    /**
     * Tìm kiếm + lọc theo danh mục + sắp xếp + phân trang.
     * Nếu không truyền page thì trả toàn bộ (tương thích ngược với các trang hiện tại).
     */
    public Object search(String q, String category, String sort, String order, Integer page, Integer size) {
        List<Product> base = new ArrayList<>(search(q));
        if (category != null && !category.isBlank()) {
            base.removeIf(p -> !category.equals(p.getCategory()));
        }
        applySort(base, sort, order);

        if (page == null || size == null) {
            return base;
        }
        int p = Math.max(0, page);
        int s = Math.max(1, Math.min(size, 200));
        int from = Math.min(p * s, base.size());
        int to = Math.min(from + s, base.size());
        return new PageProducts(base.subList(from, to), base.size(), p, s);
    }

    public List<Product> search(String q) {
        if (q == null || q.isBlank()) {
            return findAll();
        }
        return productRepository.search(q.trim());
    }

    public List<String> categories() {
        return productRepository.findAll().stream()
                .map(Product::getCategory)
                .filter(c -> c != null && !c.isBlank())
                .distinct()
                .sorted()
                .toList();
    }

    public List<Product> findLowStock(int threshold) {
        return productRepository.findByStockLessThanEqual(threshold);
    }

    private void applySort(List<Product> list, String sort, String order) {
        if (sort == null || sort.isBlank()) {
            return;
        }
        boolean asc = !"desc".equalsIgnoreCase(order);
        Comparator<Product> cmp = switch (sort.toLowerCase()) {
            case "name" -> Comparator.comparing(Product::getName, Comparator.nullsLast(String::compareTo));
            case "price" -> Comparator.comparing(Product::getPrice, Comparator.nullsLast(Double::compareTo));
            case "stock" -> Comparator.comparing(Product::getStock, Comparator.nullsLast(Integer::compareTo));
            default -> throw new BadRequestException("Không hỗ trợ sắp xếp theo: " + sort);
        };
        if (!asc) cmp = cmp.reversed();
        list.sort(cmp);
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
            throw new BadRequestException("Tồn kho không đủ (hiện tại: " + p.getStock() + ")");
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