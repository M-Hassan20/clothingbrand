package com.ecommerce.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DiscountValidateRequest {

    @NotBlank(message = "Discount code cannot be blank")
    private String code;

    @NotNull(message = "Order amount is required")
    @Positive(message = "Order amount must be positive")
    private BigDecimal orderAmount;
}
