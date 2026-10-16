package com.evomap.dryfood.repository;

import com.evomap.dryfood.model.Order;
import com.evomap.dryfood.model.Order.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderCodeIgnoreCase(String orderCode);

    List<Order> findByStatusOrderByCreatedAtDesc(Status status);

    /** Lay toan bo don hang + items + customer trong 1-2 query (tranh N+1 lazy khi serialize/xu ly). */
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items LEFT JOIN FETCH o.customer ORDER BY o.createdAt DESC")
    List<Order> findAllWithItems();

    /** Lay don theo trang thai + items + customer (1-2 query). */
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items LEFT JOIN FETCH o.customer WHERE o.status = :status ORDER BY o.createdAt DESC")
    List<Order> findByStatusWithItems(@Param("status") Status status);

    /** Phan trang: chi lay id cac don cua 1 trang (LIMIT nhanh tren bang orders). */
    @Query(value = "SELECT o.id FROM orders o ORDER BY o.created_at DESC LIMIT :limit OFFSET :offset", nativeQuery = true)
    List<Long> findPageIds(@Param("limit") int limit, @Param("offset") int offset);

    /** Phan trang + loc trang thai: id cac don cua 1 trang. */
    @Query(value = "SELECT o.id FROM orders o WHERE o.status = :status ORDER BY o.created_at DESC LIMIT :limit OFFSET :offset", nativeQuery = true)
    List<Long> findPageIdsByStatus(@Param("status") String status,
                                   @Param("limit") int limit, @Param("offset") int offset);

    /** Lay don hang theo danh sach id, eager-fetch items + customer (2 buoc phan trang). */
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items LEFT JOIN FETCH o.customer WHERE o.id IN :ids ORDER BY o.createdAt DESC")
    List<Order> findByIdsWithItems(@Param("ids") List<Long> ids);

    /** Dem tong so don (cho phan trang). */
    long countByStatus(Status status);

    /** Lay don cua mot khach + items (1-2 query). */
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items WHERE o.customer.id = :customerId ORDER BY o.createdAt DESC")
    List<Order> findByCustomerIdWithItems(@Param("customerId") Long customerId);

    List<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Order> findByCustomerIdAndStatusOrderByCreatedAtDesc(Long customerId, Status status);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status <> :excluded AND o.createdAt BETWEEN :from AND :to")
    double sumTotalByStatusNotAndCreatedAtBetween(@Param("excluded") Status excluded,
                                                  @Param("from") LocalDateTime from,
                                                  @Param("to") LocalDateTime to);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status <> :excluded AND o.createdAt >= :from")
    double sumTotalByStatusNotAndCreatedAtAfter(@Param("excluded") Status excluded,
                                                @Param("from") LocalDateTime from);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status = :status")
    double sumTotalByStatus(@Param("status") Status status);

    /** Doanh thu + so don theo ngay (GROUP BY DATE), gioi han N ngay gan nhat. */
    @Query(value = "SELECT DATE(o.created_at), SUM(o.total_amount), COUNT(o.id) FROM orders o " +
            "WHERE o.status <> :excluded AND o.created_at >= :from " +
            "GROUP BY DATE(o.created_at) ORDER BY DATE(o.created_at) DESC LIMIT :limit", nativeQuery = true)
    List<Object[]> revenueByDay(@Param("from") LocalDateTime from,
                                @Param("excluded") String excluded,
                                @Param("limit") int limit);

    /** Doanh thu theo danh muc (GROUP BY category). */
    @Query("SELECT p.category, SUM(oi.price * oi.quantity) FROM OrderItem oi " +
            "JOIN oi.product p WHERE oi.order.status <> :excluded AND p.category IS NOT NULL " +
            "GROUP BY p.category")
    List<Object[]> revenueByCategory(@Param("excluded") Status excluded);

    /** Dem so don theo tung trang thai. */
    @Query("SELECT o.status, COUNT(o) FROM Order o GROUP BY o.status")
    List<Object[]> countByStatusAll();

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
