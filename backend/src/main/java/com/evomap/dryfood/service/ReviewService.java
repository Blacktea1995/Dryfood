package com.evomap.dryfood.service;

import com.evomap.dryfood.exception.BadRequestException;
import com.evomap.dryfood.exception.NotFoundException;
import com.evomap.dryfood.model.Order;
import com.evomap.dryfood.model.OrderItem;
import com.evomap.dryfood.model.Product;
import com.evomap.dryfood.model.Review;
import com.evomap.dryfood.model.User;
import com.evomap.dryfood.repository.OrderRepository;
import com.evomap.dryfood.repository.ProductRepository;
import com.evomap.dryfood.repository.ReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    public ReviewService(ReviewRepository reviewRepository,
                         ProductRepository productRepository,
                         OrderRepository orderRepository) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
    }

    public List<Review> findByProduct(Long productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }

    /** Giu phan danh gia trung binh vao doi tuong product truoc khi serialize. */
    public void populateRating(Product product) {
        if (product == null) return;
        long count = reviewRepository.countByProductId(product.getId());
        product.setRatingCount((int) count);
        product.setAvgRating(count == 0 ? null : Math.round(reviewRepository.avgRatingFor(product.getId()) * 10.0) / 10.0);
    }

    public void populateRatings(List<Product> products) {
        for (Product p : products) {
            populateRating(p);
        }
    }

    /**
     * Khach hang danh gia san pham. Chi cho phep khi:
     * - Da mua san pham nay (co don DA GIAO chua huy, hoac don da tao chua huy).
     * - Chua danh gia 2 lan cho cung san pham.
     */
    @Transactional
    public Review create(User user, Long productId, Integer rating, String comment, Long orderId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException("Khong tim thay san pham id=" + productId));
        if (user.getRole() != User.Role.CUSTOMER) {
            throw new BadRequestException("Chi khach hang moi duoc danh gia");
        }

        if (orderId == null) {
            // Khong ke khai don: kiem tra khach da mua san pham nay hay chua.
            if (!hasPurchased(user.getCustomerId(), productId)) {
                throw new BadRequestException("Ban phai mua san pham nay moi duoc danh gia");
            }
            if (reviewRepository.existsByUserIdAndProductId(user.getId(), productId)) {
                throw new BadRequestException("Ban da danh gia san pham nay roi");
            }
        } else {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new NotFoundException("Khong tim thay don hang id=" + orderId));
            if (!order.getCustomer().getId().equals(user.getCustomerId())) {
                throw new BadRequestException("Khong the danh gia cho don hang cua nguoi khac");
            }
            boolean bought = order.getItems().stream().anyMatch(i -> i.getProduct().getId().equals(productId));
            if (!bought) {
                throw new BadRequestException("San pham nay khong co trong don hang cua ban");
            }
            if (reviewRepository.existsByUserIdAndOrderId(user.getId(), orderId)) {
                throw new BadRequestException("Ban da danh gia don hang nay roi");
            }
            // Chi danh gia khi don da giao hoac da xac nhan (khong can hang lien quan toi don)
            if (order.getStatus() != Order.Status.DELIVERED) {
                throw new BadRequestException("Chi danh gia duoc khi don da giao");
            }
        }

        Review review = new Review();
        review.setProduct(product);
        review.setUser(user);
        review.setRating(rating);
        review.setComment(comment);
        review.setOrder(orderId == null ? null : orderRepository.getReferenceById(orderId));
        return reviewRepository.save(review);
    }

    private boolean hasPurchased(Long customerId, Long productId) {
        for (Order o : orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)) {
            if (o.getStatus() == Order.Status.CANCELLED) continue;
            boolean found = o.getItems().stream().anyMatch(i -> i.getProduct().getId().equals(productId));
            if (found) return true;
        }
        return false;
    }
}