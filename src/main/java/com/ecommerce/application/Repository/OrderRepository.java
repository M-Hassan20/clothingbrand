package com.ecommerce.application.Repository;

import com.ecommerce.application.ENUM.OrderStatus;
import com.ecommerce.application.Entity.Order;
import com.ecommerce.application.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUser(User user);
    List<Order> findByUserId(Long userId);
    List<Order> findByStatus(OrderStatus status);
    List<Order> findByUserIdAndStatus(Long userId, OrderStatus status);
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);
}
