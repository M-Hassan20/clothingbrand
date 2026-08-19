package com.ecommerce.application.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductRecommendationRequest {
    @NotNull
    private List<Long> recommendedProductIds; // full ordered replacement list
}
