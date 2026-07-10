package com.ecommerce.application.dto;

import com.ecommerce.application.entity.Address;
import com.ecommerce.application.entity.OrderItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceData {
    // Order details
    private Long orderId;
    private LocalDateTime orderDate;
    private String orderStatus;

    // Customer details
    private String customerName;
    private String customerEmail;
    private String customerPhone;

    // Shipping address
    private Address shippingAddress;

    // Order items
    private List<OrderItem> orderItems;

    // Pricing
    private BigDecimal subtotal;
    private BigDecimal shippingFee;
    private BigDecimal discount;
    private BigDecimal tax;
    private BigDecimal total;

    // Payment
    private String paymentMethod;
    private String paymentStatus;

    // Company details
    private String companyName;
    private String companyAddress;
    private String companyPhone;
    private String companyEmail;
    private String companyWebsite;
}