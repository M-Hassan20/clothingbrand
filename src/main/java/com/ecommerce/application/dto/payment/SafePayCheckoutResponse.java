package com.ecommerce.application.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SafePayCheckoutResponse {
    private String trackerToken;
    private String checkoutUrl;
}