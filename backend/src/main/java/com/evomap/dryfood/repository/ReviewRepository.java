package com.evomap.dryfood.repository;

import com.evomap.dryfood.model.Product;
import com.evomap.dryfood.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByProductIdOrderByCreatedAtDesc(Long productId);

    long countByProductId(Long productId);

    boolean existsByUserIdAndOrderId(Long userId, Long orderId);

    boolean existsByUserIdAndProductId(Long userId, Long productId);

    @Query("SELECT COALESCE(AVG(r.rating), 0) FROM Review r WHERE r.product.id = :productId")
    double avgRatingFor(@Param("productId") Long productId);
}