package com.ecommerce.application.service.impl;

import com.ecommerce.application.entity.*;
import com.ecommerce.application.enums.OrderStatus;
import com.ecommerce.application.exception.ResourceNotFoundException;
import com.ecommerce.application.repository.OrderItemRepository;
import com.ecommerce.application.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductVariantServiceImpl productVariantService;
    private final AddressService addressService;
    private final DiscountService discountService;
    private final UserService userService;

    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
    }

    public Page<Order> getUserOrders(Long userId, Pageable pageable) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    public Page<Order> getAllOrders(Pageable pageable) {
        return orderRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    public Page<Order> getOrderByStatus(OrderStatus status, Pageable pageable) {
        return orderRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
    }

    public List<Order> getPendingOrders() {
        return orderRepository.findPendingOrders();
    }

    public List<Order> getRecentOrders() {
        return orderRepository.findTop10ByOrderByCreatedAtDesc();
    }

    public boolean hasUserPurchasedProduct(Long userId, Long productId) {
        return orderRepository.hasUserPurchasedProduct(userId, productId);
    }

    @Transactional
    public Order createOrder(Long userId, List<OrderItem> orderItems,
                             Long shippingAddressId, Long discountId) {
        User user = userService.getUserById(userId);

        // Validate stock and calculate total
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (OrderItem item : orderItems) {
            ProductVariant variant = productVariantService.getVariantById(
                    item.getProductVariant().getId());

            if (variant.getStockQuantity() < item.getQuantity()) {
                throw new ResourceNotFoundException(
                        "Order Item", "Stock Quantity", item.getQuantity());
            }

            // Calculate item total
            BigDecimal itemTotal = variant.getPrice().multiply(
                    BigDecimal.valueOf(item.getQuantity()));
            totalAmount = totalAmount.add(itemTotal);

            // Set snapshots
            item.setPriceSnapshot(variant.getPrice());
            item.setProductNameSnapshot(variant.getProduct().getName());
        }

        // Apply discount if provided
        if (discountId != null) {
            // Discount logic will be handled by DiscountService
            Discount discount = discountService.getDiscountById(discountId);
             totalAmount = discountService.applyDiscount(discount.getCode(), totalAmount);
        }

        // Create order
        Order order = Order.builder()
                .user(user)
                .status(OrderStatus.PENDING)
                .totalAmount(totalAmount)
                .build();

        // Set shipping address if provided
         order.setShippingAddress(addressService.getAddressById(shippingAddressId));

        order = orderRepository.save(order);

        // Save order items
        for (OrderItem item : orderItems) {
            item.setOrder(order);
            orderItemRepository.save(item);

            // Decrease stock
            productVariantService.decreaseStock(
                    item.getProductVariant().getId(),
                    item.getQuantity());
        }

        return order;
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, OrderStatus newStatus) {
        Order order = getOrderById(orderId);
        OrderStatus oldStatus = order.getStatus();
        order.setStatus(newStatus);

        // If order is cancelled, restore stock
        if (newStatus == OrderStatus.CANCELLED && oldStatus != OrderStatus.CANCELLED) {
            List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
            for (OrderItem item : items) {
                productVariantService.increaseStock(
                        item.getProductVariant().getId(),
                        item.getQuantity());
            }
        }

        return orderRepository.save(order);
    }

    @Transactional
    public Order cancelOrder(Long orderId, Long userId) {
        Order order = getOrderById(orderId);

        // Verify user owns this order
        if (!order.getUser().getId().equals(userId)) {
            throw new RuntimeException("You are not authorized to cancel this order");
        }

        // Only allow cancellation of pending/processing orders
        if (order.getStatus() == OrderStatus.DELIVERED ||
                order.getStatus() == OrderStatus.CANCELLED) {
            throw new RuntimeException("Cannot cancel order with status: " + order.getStatus());
        }

        return updateOrderStatus(orderId, OrderStatus.CANCELLED);
    }

    public List<OrderItem> getOrderItems(Long orderId) {
        return orderItemRepository.findByOrderId(orderId);
    }

    // Analytics
    public BigDecimal calculateRevenue(LocalDateTime startDate, LocalDateTime endDate) {
        BigDecimal revenue = orderRepository.calculateRevenue(startDate, endDate);
        return revenue != null ? revenue : BigDecimal.ZERO;
    }

    public Long getOrderCountByStatus(OrderStatus status) {
        return orderRepository.countByStatus(status);
    }
}
