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
import com.ecommerce.application.enums.PaymentStatus;
import com.ecommerce.application.repository.PaymentRepository;
import com.ecommerce.application.security.JwtUtil;
import com.ecommerce.application.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentRepository paymentRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductVariantServiceImpl productVariantService;
    private final AddressService addressService;
    private final DiscountService discountService;
    private final UserService userService;
    private final OrderMapper orderMapper;
    private final OrderItemMapper orderItemMapper;
    private final EmailService emailService;
    private final InvoiceService invoiceService;
    private final JwtUtil jwtUtil;

    public OrderResponse getOrderById(Long id) {
        return enrichOrderResponse(orderMapper.toResponse(orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id))));
    }

    public Order getOrderEntityById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
    }

    public Page<OrderResponse> getUserOrders(Long userId, Pageable pageable) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(order -> enrichOrderResponse(orderMapper.toResponse(order)));
    }

    public Page<OrderResponse> getAllOrders(Pageable pageable) {
        return orderRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(order -> enrichOrderResponse(orderMapper.toResponse(order)));
    }

    public Page<OrderResponse> getOrdersByStatus(OrderStatus status, Pageable pageable) {
        return orderRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                .map(order -> enrichOrderResponse(orderMapper.toResponse(order)));
    }

    public List<OrderResponse> getPendingOrders() {
        return enrichOrderResponseList(orderMapper.toResponseList(orderRepository.findPendingOrders()));
    }

    public List<OrderResponse> getRecentOrders() {
        return enrichOrderResponseList(orderMapper.toResponseList(orderRepository.findTop10ByOrderByCreatedAtDesc()));
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

            BigDecimal effectivePrice = discountService.calculateEffectivePrice(variant);
            BigDecimal itemTotal = effectivePrice.multiply(
                    BigDecimal.valueOf(itemRequest.getQuantity()));
            totalAmount = totalAmount.add(itemTotal);

            OrderItem orderItem = OrderItem.builder()
                    .productVariant(variant)
                    .quantity(itemRequest.getQuantity())
                    .priceSnapshot(effectivePrice)
                    .productNameSnapshot(variant.getProduct().getName())
                    .build();
            orderItems.add(orderItem);
        }

        BigDecimal discountAmount = BigDecimal.ZERO;
        String appliedDiscountCode = null;

        // Apply discount if provided
        if (request.getDiscountCode() != null && !request.getDiscountCode().trim().isEmpty()) {
            appliedDiscountCode = request.getDiscountCode().trim().toUpperCase();
            Discount discount = discountService.validateDiscountCode(appliedDiscountCode);
            discountAmount = discountService.calculateDiscount(discount, totalAmount);
            totalAmount = discountService.applyDiscount(appliedDiscountCode, totalAmount);
        }

        // Calculate Shipping Fee: Rs. 300 flat nationwide, FREE over Rs. 5000 subtotal
        BigDecimal shippingFee = totalAmount.compareTo(new BigDecimal("5000")) >= 0
                ? BigDecimal.ZERO
                : new BigDecimal("300");
        totalAmount = totalAmount.add(shippingFee);

        // Create order
        Order order = Order.builder()
                .user(user)
                .status(OrderStatus.PENDING)
                .totalAmount(totalAmount)
                .discountAmount(discountAmount)
                .discountCode(appliedDiscountCode)
                .shippingFee(shippingFee)
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

        return enrichOrderResponse(orderMapper.toResponse(order));
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, OrderStatus newStatus) {
        Order order = getOrderEntityById(orderId);
        OrderStatus oldStatus = order.getStatus();

        // Prevent status regression to PENDING if order is already PROCESSING, CONFIRMED, SHIPPED, or DELIVERED
        if ((oldStatus == OrderStatus.PROCESSING || oldStatus == OrderStatus.CONFIRMED || oldStatus == OrderStatus.SHIPPED || oldStatus == OrderStatus.DELIVERED)
                && newStatus == OrderStatus.PENDING) {
            System.out.println("Ignoring status regression from " + oldStatus + " to " + newStatus + " for order ID: " + orderId);
            return enrichOrderResponse(orderMapper.toResponse(order));
        }

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

        return enrichOrderResponse(orderMapper.toResponse(orderRepository.save(order)));
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

        OrderResponse response = createOrder(guestUser.getId(), orderCreateRequest);
        String token = jwtUtil.generateToken(guestUser.getEmail(), guestUser.getId(), guestUser.getRole().name());
        response.setGuestToken(token);
        return response;
    }

    public OrderResponse enrichOrderResponse(OrderResponse response) {
        if (response == null) return null;
        Order order = orderRepository.findById(response.getId()).orElse(null);
        if (order != null) {
            response.setDiscountCode(order.getDiscountCode());
            response.setDiscountAmount(order.getDiscountAmount());
            response.setShippingFee(order.getShippingFee() != null ? order.getShippingFee() : BigDecimal.ZERO);

            // Internal PostEx Courier Estimation
            int totalItems = 0;
            if (response.getItems() != null && !response.getItems().isEmpty()) {
                totalItems = response.getItems().stream().mapToInt(item -> item.getQuantity() != null ? item.getQuantity() : 1).sum();
            } else if (order.getId() != null) {
                List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
                totalItems = items.stream().mapToInt(item -> item.getQuantity() != null ? item.getQuantity() : 1).sum();
            }
            if (totalItems == 0) totalItems = 1;

            int billableWeightKg = (int) Math.ceil(totalItems * 0.5);
            if (billableWeightKg < 1) billableWeightKg = 1;

            String city = (order.getShippingAddress() != null && order.getShippingAddress().getCity() != null)
                    ? order.getShippingAddress().getCity().trim() : "";
            BigDecimal ratePerKg = city.equalsIgnoreCase("Karachi") ? new BigDecimal("250") : new BigDecimal("300");
            BigDecimal estFee = ratePerKg.multiply(BigDecimal.valueOf(billableWeightKg));

            response.setEstimatedCourierFee(estFee);
            BigDecimal custShipping = response.getShippingFee() != null ? response.getShippingFee() : BigDecimal.ZERO;
            response.setCourierMargin(custShipping.subtract(estFee));
            response.setReturnStatus(order.getReturnStatus());
            response.setReturnReason(order.getReturnReason());
            response.setReturnResolution(order.getReturnResolution());
            response.setReturnBankDetails(order.getReturnBankDetails());
            response.setRequestedSize(order.getRequestedSize());
            response.setReturnRemarks(order.getReturnRemarks());
        }
        paymentRepository.findByOrderId(response.getId())
                .ifPresentOrElse(
                        payment -> response.setPaymentStatus(payment.getPaymentStatus()),
                        () -> response.setPaymentStatus(PaymentStatus.PENDING)
                );
        return response;
    }

    public List<OrderResponse> enrichOrderResponseList(List<OrderResponse> responses) {
        if (responses != null) {
            responses.forEach(this::enrichOrderResponse);
        }
        return responses;
    }

    @Transactional
    public OrderResponse requestReturn(Long orderId, com.ecommerce.application.dto.request.ReturnRequestDTO dto) {
        Order order = getOrderEntityById(orderId);
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new RuntimeException("Return requests can only be submitted for delivered orders.");
        }
        order.setReturnStatus("REQUESTED");
        if (dto != null) {
            if (dto.getReason() != null) order.setReturnReason(dto.getReason().trim());
            if (dto.getResolution() != null) order.setReturnResolution(dto.getResolution().trim());
            if (dto.getBankDetails() != null) order.setReturnBankDetails(dto.getBankDetails().trim());
            if (dto.getRequestedSize() != null) order.setRequestedSize(dto.getRequestedSize().trim());
            if (dto.getRemarks() != null) order.setReturnRemarks(dto.getRemarks().trim());

            // Validate requested size stock availability for EXCHANGE requests
            if ("EXCHANGE".equalsIgnoreCase(dto.getResolution()) && dto.getRequestedSize() != null && !dto.getRequestedSize().isBlank()) {
                validateRequestedSizeStock(order, dto.getRequestedSize().trim());
            }
        }
        Order saved = orderRepository.save(order);
        emailService.sendAdminReturnRequestNotification(
                saved.getId(),
                saved.getUser() != null ? saved.getUser().getEmail() : "Guest Customer",
                saved.getReturnReason(),
                saved.getReturnResolution(),
                saved.getReturnBankDetails(),
                saved.getRequestedSize(),
                saved.getReturnRemarks()
        );
        return enrichOrderResponse(orderMapper.toResponse(saved));
    }

    private void validateRequestedSizeStock(Order order, String requestedSize) {
        List<OrderItem> items = orderItemRepository.findByOrder(order);
        for (OrderItem item : items) {
            if (item.getProductVariant() != null && item.getProductVariant().getProduct() != null) {
                Product product = item.getProductVariant().getProduct();
                List<ProductVariant> variants = productVariantRepository.findByProductId(product.getId());
                if (variants != null && !variants.isEmpty()) {
                    boolean matchingAvailable = variants.stream().anyMatch(v ->
                            v.getSize() != null &&
                            v.getSize().equalsIgnoreCase(requestedSize) &&
                            v.getStockQuantity() != null &&
                            v.getStockQuantity() > 0
                    );
                    if (!matchingAvailable) {
                        throw new RuntimeException("Requested size '" + requestedSize + "' for '" + product.getName() + "' is currently out of stock. Please select an available size.");
                    }
                }
            }
        }
    }

    @Transactional
    public OrderResponse updateReturnStatus(Long orderId, String returnStatus) {
        Order order = getOrderEntityById(orderId);
        String formattedStatus = returnStatus != null ? returnStatus.toUpperCase() : "COMPLETED";
        order.setReturnStatus(formattedStatus);
        Order saved = orderRepository.save(order);

        Long replacementOrderId = null;

        // Auto-create 0 payment & 0 COD size exchange replacement order when return request is APPROVED
        if ("APPROVED".equalsIgnoreCase(formattedStatus) && "EXCHANGE".equalsIgnoreCase(saved.getReturnResolution())) {
            replacementOrderId = createExchangeReplacementOrder(saved);
        }

        if (saved.getUser() != null && saved.getUser().getEmail() != null) {
            emailService.sendCustomerReturnApprovalEmail(
                    saved.getUser().getEmail(),
                    saved.getUser().getFullName(),
                    saved.getId(),
                    formattedStatus,
                    saved.getReturnResolution(),
                    replacementOrderId
            );
        }

        return enrichOrderResponse(orderMapper.toResponse(saved));
    }

    @Transactional
    public Long createExchangeReplacementOrder(Order originalOrder) {
        String exchangeCode = "EXCHANGE-REPLACEMENT-ORD-" + originalOrder.getId();

        // Prevent duplicate creation if an exchange order already exists for this original order
        if (originalOrder.getUser() != null) {
            List<Order> userOrders = orderRepository.findByUser(originalOrder.getUser());
            for (Order o : userOrders) {
                if (exchangeCode.equalsIgnoreCase(o.getDiscountCode())) {
                    log.info("Exchange replacement order already exists (id={}) for original order #{}", o.getId(), originalOrder.getId());
                    return o.getId();
                }
            }
        }

        Order replacementOrder = Order.builder()
                .user(originalOrder.getUser())
                .shippingAddress(originalOrder.getShippingAddress())
                .status(OrderStatus.PROCESSING)
                .totalAmount(BigDecimal.ZERO)
                .shippingFee(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .discountCode(exchangeCode)
                .build();

        Order savedReplacement = orderRepository.save(replacementOrder);

        // Copy order items from original order to replacement order
        List<OrderItem> originalItems = orderItemRepository.findByOrder(originalOrder);
        for (OrderItem item : originalItems) {
            OrderItem replacementItem = OrderItem.builder()
                    .order(savedReplacement)
                    .productVariant(item.getProductVariant())
                    .quantity(item.getQuantity())
                    .priceSnapshot(BigDecimal.ZERO)
                    .productNameSnapshot(item.getProductNameSnapshot() != null ? item.getProductNameSnapshot() + " (Size Exchange)" : "Size Exchange Item")
                    .build();
            orderItemRepository.save(replacementItem);
        }

        // Record 0 payment in Payment repository so system treats it as fully satisfied / 0 COD
        Payment payment = Payment.builder()
                .order(savedReplacement)
                .amount(BigDecimal.ZERO)
                .paymentStatus(PaymentStatus.SUCCESS)
                .stripePaymentIntentId("EXCHANGE-REPLACEMENT-" + savedReplacement.getId())
                .build();
        paymentRepository.save(payment);

        log.info("Created 0 payment & 0 COD Exchange Replacement Order #{} for Original Order #{}", savedReplacement.getId(), originalOrder.getId());
        return savedReplacement.getId();
    }

    @Transactional
    public OrderResponse cancelGuestOrder(Long orderId, String email) {
        Order order = getOrderEntityById(orderId);
        if (order.getUser() != null && email != null && !order.getUser().getEmail().equalsIgnoreCase(email.trim())) {
            throw new RuntimeException("Email does not match order record.");
        }
        return cancelOrder(orderId, order.getUser().getId());
    }
}
