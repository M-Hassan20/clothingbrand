package com.ecommerce.application.dto.response;

import com.ecommerce.application.enums.OrderStatus;
import com.ecommerce.application.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private Long id;
    private Long userId;
    private String userEmail;
    private String userFullName;
    private OrderStatus status;
    private PaymentStatus paymentStatus;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private String discountCode;
    private AddressResponse shippingAddress;
    private List<OrderItemResponse> items;
    private LocalDateTime createdAt;
    private String guestToken;
    private String trackingNumber;
    private String courierName;
    private String postexStatus;
    private String pickupAddressCode;
    private BigDecimal shippingFee;
    private BigDecimal estimatedCourierFee;
    private BigDecimal courierMargin;
}