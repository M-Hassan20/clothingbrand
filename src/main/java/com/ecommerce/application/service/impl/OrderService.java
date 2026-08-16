package com.ecommerce.application.service.impl;

import com.ecommerce.application.dto.request.OrderCreateRequest;
import com.ecommerce.application.dto.request.OrderItemRequest;
import com.ecommerce.application.dto.request.GuestCheckoutRequest;
import com.ecommerce.application.dto.request.AddressRequest;
import com.ecommerce.application.dto.response.OrderItemResponse;
import com.ecommerce.application.dto.response.OrderResponse;
import com.ecommerce.application.dto.response.AddressResponse;
import com.ecommerce.application.entity.*;
import com.ecommerce.application.enums.OrderStatus;
import com.ecommerce.application.exception.ResourceNotFoundException;
import com.ecommerce.application.mapper.OrderItemMapper;
import com.ecommerce.application.mapper.OrderMapper;
import com.ecommerce.application.repository.OrderItemRepository;
import com.ecommerce.application.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
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
    private final OrderMapper orderMapper;
    private final OrderItemMapper orderItemMapper;
    private final EmailService emailService;
    private final InvoiceService invoiceService;

    public OrderResponse getOrderById(Long id) {
        return orderMapper.toResponse(orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id)));
    }

    public Order getOrderEntityById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
    }

    public Page<OrderResponse> getUserOrders(Long userId, Pageable pageable) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable).map(orderMapper::toResponse);
    }

    public Page<OrderResponse> getAllOrders(Pageable pageable) {
        return orderRepository.findAllByOrderByCreatedAtDesc(pageable).map(orderMapper::toResponse);
    }

    public Page<OrderResponse> getOrdersByStatus(OrderStatus status, Pageable pageable) {
        return orderRepository.findByStatusOrderByCreatedAtDesc(status, pageable).map(orderMapper::toResponse);
    }

    public List<OrderResponse> getPendingOrders() {
        return orderMapper.toResponseList(orderRepository.findPendingOrders());
    }

    public List<OrderResponse> getRecentOrders() {
        return orderMapper.toResponseList(orderRepository.findTop10ByOrderByCreatedAtDesc());
    }

    public boolean hasUserPurchasedProduct(Long userId, Long productId) {
        return orderRepository.hasUserPurchasedProduct(userId, productId);
    }

//    @Transactional
//    public OrderResponse createOrder(Long userId, List<OrderItemRequest> orderItems,
//                             Long shippingAddressId, Long discountId) {
//        User user = userService.getUserEntityById(userId);
//
//        // Validate stock and calculate total
//        BigDecimal totalAmount = BigDecimal.ZERO;
//        for (OrderItemRequest item : orderItems) {
//            ProductVariant variant = productVariantService.useEntity(
//                    item.getProductVariantId());
//
//            if (variant.getStockQuantity() < item.getQuantity()) {
//                throw new ResourceNotFoundException(
//                        "Order Item", "Stock Quantity", item.getQuantity());
//            }
//
//            // Calculate item total
//            BigDecimal itemTotal = variant.getPrice().multiply(
//                    BigDecimal.valueOf(item.getQuantity()));
//            totalAmount = totalAmount.add(itemTotal);
//
//            // Set snapshots
//            item.setPriceSnapshot(variant.getPrice());
//            item.setProductNameSnapshot(variant.getProduct().getName());
//        }
//
//        // Apply discount if provided
//        if (discountId != null) {
//            // Discount logic will be handled by DiscountService
//            Discount discount = discountService.getDiscountById(discountId);
//             totalAmount = discountService.applyDiscount(discount.getCode(), totalAmount);
//        }
//
//        // Create order
//        Order order = Order.builder()
//                .user(user)
//                .status(OrderStatus.PENDING)
//                .totalAmount(totalAmount)
//                .build();
//
//        // Set shipping address if provided
//         order.setShippingAddress(addressService.getAddressEntityById(shippingAddressId));
//
//        order = orderRepository.save(order);
//
//        // Save order items
//        for (OrderItem item : orderItems) {
//            item.setOrder(order);
//            orderItemRepository.save(item);
//
//            // Decrease stock
//            productVariantService.decreaseStock(
//                    item.getProductVariant().getId(),
//                    item.getQuantity());
//        }
//
//        return orderMapper.toResponse(order);
//    }

    @Transactional
    public OrderResponse createOrder(Long userId, OrderCreateRequest request) {
        User user = userService.getUserEntityById(userId);

        // Convert request items to entities and validate
        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (OrderItemRequest itemRequest : request.getItems()) {
            ProductVariant variant = productVariantService.getVariantEntityById(
                    itemRequest.getProductVariantId());

            if (variant.getStockQuantity() < itemRequest.getQuantity()) {
                throw new RuntimeException(
                        "Insufficient stock for product: " + variant.getProduct().getName());
            }

            BigDecimal itemTotal = variant.getPrice().multiply(
                    BigDecimal.valueOf(itemRequest.getQuantity()));
            totalAmount = totalAmount.add(itemTotal);

            OrderItem orderItem = OrderItem.builder()
                    .productVariant(variant)
                    .quantity(itemRequest.getQuantity())
                    .priceSnapshot(variant.getPrice())
                    .productNameSnapshot(variant.getProduct().getName())
                    .build();
            orderItems.add(orderItem);
        }

        // Apply discount if provided
        if (request.getDiscountCode() != null) {
            totalAmount = discountService.applyDiscount(request.getDiscountCode(), totalAmount);
        }

        // Create order
        Order order = Order.builder()
                .user(user)
                .status(OrderStatus.PENDING)
                .totalAmount(totalAmount)
                .build();

        // Set shipping address
        if (request.getShippingAddressId() != null) {
            Address address = addressService.getAddressEntityById(request.getShippingAddressId());
            order.setShippingAddress(address);
        }

        order = orderRepository.save(order);

        emailService.sendOrderConfirmationEmail(user.getEmail(), user.getFullName(), order.getId(), order.getTotalAmount().toString());

        emailService.sendAdminNewOrderNotification(order.getId(), user.getEmail(), order.getTotalAmount().toString());

        // Save order items
        for (OrderItem item : orderItems) {
            item.setOrder(order);
            orderItemRepository.save(item);
            productVariantService.decreaseStock(item.getProductVariant().getId(), item.getQuantity());
        }

        return orderMapper.toResponse(order);
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, OrderStatus newStatus) {
        Order order = getOrderEntityById(orderId);
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

        if(newStatus == OrderStatus.DELIVERED && oldStatus != OrderStatus.DELIVERED) {
            try {
                invoiceService.generateAndEmailInvoice(orderId);
            } catch (Exception e) {
                System.err.println("Failed to generate invoice: " + e.getMessage());
            }
        }

        emailService.sendOrderStatusUpdateEmail(order.getUser().getEmail(), order.getUser().getFullName(), orderId, newStatus.toString());

        return orderMapper.toResponse(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse cancelOrder(Long orderId, Long userId) {
        Order order = getOrderEntityById(orderId);

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

    public List<OrderItemResponse> getOrderItems(Long orderId) {
        return orderItemMapper.toResponseList(orderItemRepository.findByOrderId(orderId));
    }

    // Analytics
    public BigDecimal calculateRevenue(LocalDateTime startDate, LocalDateTime endDate) {
        BigDecimal revenue = orderRepository.calculateRevenue(startDate, endDate);
        return revenue != null ? revenue : BigDecimal.ZERO;
    }

    public Long getOrderCountByStatus(OrderStatus status) {
        return orderRepository.countByStatus(status);
    }

    @Transactional
    public OrderResponse createGuestOrder(GuestCheckoutRequest request) {
        User guestUser = userService.findOrCreateGuestUser(
                request.getGuestEmail(),
                request.getGuestName(),
                request.getGuestPhone()
        );

        AddressRequest addressRequest = new AddressRequest();
        addressRequest.setLabel("Checkout");
        addressRequest.setStreet(request.getShippingStreet());
        addressRequest.setCity(request.getShippingCity());
        addressRequest.setCountry(request.getShippingCountry());
        addressRequest.setZipCode(request.getShippingZipCode());
        addressRequest.setIsDefault(true);

        AddressResponse guestAddress = addressService.createAddress(guestUser.getId(), addressRequest);

        OrderCreateRequest orderCreateRequest = new OrderCreateRequest();
        orderCreateRequest.setShippingAddressId(guestAddress.getId());
        orderCreateRequest.setItems(request.getItems());
        orderCreateRequest.setDiscountCode(request.getDiscountCode());

        return createOrder(guestUser.getId(), orderCreateRequest);
    }
}
