package com.ecommerce.application.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JazzCashPaymentRequest {
    private Long orderId;
    private BigDecimal amount;
    private String description;
}
