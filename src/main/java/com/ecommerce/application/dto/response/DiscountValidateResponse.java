package com.ecommerce.application.dto.response;

import com.ecommerce.application.enums.DiscountType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiscountValidateResponse {
    private boolean valid;
    private String code;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private String message;
}
