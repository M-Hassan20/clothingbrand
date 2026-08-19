package com.ecommerce.application.repository;

import com.ecommerce.application.enums.OrderStatus;
import com.ecommerce.application.entity.Order;
import com.ecommerce.application.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

        Page<Order> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

        // Admin: All orders with pagination
        Page<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);

        // Filter by status
        Page<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status, Pageable pageable);

        Page<Order> findByUserIdAndStatus(Long userId, OrderStatus status, Pageable pageable);

        // Date range queries for analytics
        @Query("SELECT o FROM Order o WHERE o.createdAt BETWEEN :startDate AND :endDate")
        List<Order> findOrdersByDateRange(@Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate);

        // Revenue analytics
        @Query("SELECT SUM(o.totalAmount) FROM Order o " +
                        "WHERE o.status = 'DELIVERED' " +
                        "AND o.createdAt BETWEEN :startDate AND :endDate")
        BigDecimal calculateRevenue(@Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate);

        @Query("SELECT o FROM Order o WHERE o.status = 'PENDING' " +
                        "ORDER BY o.createdAt ASC")
        List<Order> findPendingOrders();

        // Check if user has purchased a product (for verified reviews)
        @Query("SELECT CASE WHEN COUNT(o) > 0 THEN true ELSE false END FROM Order o " +
                        "JOIN OrderItem oi ON oi.order.id = o.id " +
                        "WHERE o.user.id = :userId " +
                        "AND oi.productVariant.product.id = :productId " +
                        "AND o.status = 'DELIVERED'")
        boolean hasUserPurchasedProduct(@Param("userId") Long userId, @Param("productId") Long productId);

        // Order count by status
        Long countByStatus(OrderStatus status);

        // Recent orders for admin dashboard
        List<Order> findTop10ByOrderByCreatedAtDesc();

        List<Order> findByUser(User user);

        List<Order> findByUserId(Long userId);

        List<Order> findByStatus(OrderStatus status);

        List<Order> findByUserIdAndStatus(Long userId, OrderStatus status);

        List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);
}
