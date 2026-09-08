package com.ecommerce.application.dto.response;

import com.ecommerce.application.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private Long id;
    private BigDecimal amount;
    private String currency;
    private PaymentStatus paymentStatus;
    private String stripePaymentIntentId;
    private BigDecimal refundedAmount;
    private String refundReason;
    private LocalDateTime createdAt;
}