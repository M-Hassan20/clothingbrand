package com.ecommerce.application.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefundRequest {
    private BigDecimal amount;
    private String reason;
    @Builder.Default
    private Boolean isManualOverride = false;
}
