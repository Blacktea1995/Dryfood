package com.evomap.dryfood.repository;

import com.evomap.dryfood.model.Order;
import com.evomap.dryfood.model.Order.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByStatusOrderByCreatedAtDesc(Status status);

    List<Order> findAllByOrderByCreatedAtDesc();

    List<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Order> findByCustomerIdAndStatusOrderByCreatedAtDesc(Long customerId, Status status);

    long countByStatus(Status status);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status <> :excluded AND o.createdAt BETWEEN :from AND :to")
    double sumTotalByStatusNotAndCreatedAtBetween(@Param("excluded") Status excluded,
                                                  @Param("from") LocalDateTime from,
                                                  @Param("to") LocalDateTime to);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status <> :excluded AND o.createdAt >= :from")
    double sumTotalByStatusNotAndCreatedAtAfter(@Param("excluded") Status excluded,
                                                @Param("from") LocalDateTime from);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status = :status")
    double sumTotalByStatus(@Param("status") Status status);

    /**
     * Top san pham ban chay: gop quantity + doanh thu theo product tu order_items
     * (bo don CANCELLED), 1 query GROUP BY thay vi load toan bo order vao memory
     * (truoc day 1000 don = 1000+ query lazy items -> treo tren cloud, HTTP 502).
     * Tra ve cac dong [productId, tongSoLuong, tongDoanhThu].
     */
    @Query("SELECT oi.product.id, SUM(oi.quantity), SUM(oi.price * oi.quantity) " +
           "FROM OrderItem oi WHERE oi.order.status <> :excluded " +
           "GROUP BY oi.product.id ORDER BY SUM(oi.quantity) DESC")
    List<Object[]> topProductsBySold(@Param("excluded") Status excluded);
}
