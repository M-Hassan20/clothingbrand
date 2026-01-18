package com.ecommerce.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductDetailResponse {
    private Long id;
    private String name;
    private String description;
    private String brand;
    private CategoryResponse category;
    private List<ProductVariantResponse> variants;
    private List<String> availableSizes;
    private List<String> availableColors;
    private Double averageRating;
    private Long reviewCount;
    private Boolean isActive;
    private LocalDateTime createdAt;
}