package com.ecommerce.application.repository;

import com.ecommerce.application.AbstractIntegrationTest;
import com.ecommerce.application.TestDataFactory;
import com.ecommerce.application.entity.*;
import com.ecommerce.application.enums.OrderStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
class OrderRepositoryIT extends AbstractIntegrationTest {

    @Autowired private OrderRepository orderRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private ProductVariantRepository productVariantRepository;
    @Autowired private OrderItemRepository orderItemRepository;

    private User user;
    private Product product;
    private ProductVariant variant;

    @BeforeEach
    void setUp() {
        user = userRepository.save((User) TestDataFactory.aCustomerUser().build());
        product = productRepository.save((Product) TestDataFactory.aProduct().build());
        variant = productVariantRepository.save((ProductVariant) TestDataFactory.aVariant().product(product).build());
    }

    @Test
    void hasUserPurchasedProduct_onlyCountsDeliveredOrders() {
        // 1. Create a PENDING order with this product
        Order pendingOrder = (Order) TestDataFactory.anOrder().user(user).status(OrderStatus.PENDING).build();
        pendingOrder = orderRepository.save(pendingOrder);
        OrderItem item1 = (OrderItem) TestDataFactory.anOrderItem().order(pendingOrder).productVariant(variant).build();
        orderItemRepository.save(item1);

        assertThat(orderRepository.hasUserPurchasedProduct(user.getId(), product.getId())).isFalse();

        // 2. Flip order to DELIVERED
        pendingOrder.setStatus(OrderStatus.DELIVERED);
        orderRepository.save(pendingOrder);

        assertThat(orderRepository.hasUserPurchasedProduct(user.getId(), product.getId())).isTrue();
    }

    @Test
    void calculateRevenue_sumsDeliveredOrdersWithinDateRange() {
        LocalDateTime now = LocalDateTime.now();

        // 1. DELIVERED order inside range (revenue = 100.00)
        Order order1 = (Order) TestDataFactory.anOrder().user(user).status(OrderStatus.DELIVERED).totalAmount(BigDecimal.valueOf(100.00)).build();
        orderRepository.save(order1);

        // 2. DELIVERED order outside range (too early)
        Order order2 = (Order) TestDataFactory.anOrder().user(user).status(OrderStatus.DELIVERED).totalAmount(BigDecimal.valueOf(50.00)).build();
        order2 = orderRepository.save(order2);
        jdbcTemplate.update("UPDATE orders SET created_at = ? WHERE id = ?", java.sql.Timestamp.valueOf(now.minusDays(5)), order2.getId());

        // 3. PENDING order inside range (should be ignored)
        Order order3 = (Order) TestDataFactory.anOrder().user(user).status(OrderStatus.PENDING).totalAmount(BigDecimal.valueOf(200.00)).build();
        orderRepository.save(order3);

        BigDecimal revenue = orderRepository.calculateRevenue(now.minusDays(2), now.plusDays(2));
        assertThat(revenue).isEqualByComparingTo(BigDecimal.valueOf(100.00));
    }
}
