package com.ecommerce.application.dto.response;

import com.ecommerce.application.entity.Category;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private Long id;
    private String name;
    private String description;
    private String brand;
    private CategoryResponse category;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private String thumbnailImage;
    private List<String> additionalImages;
    private Double averageRating;
    private Long reviewCount;
    private Boolean isActive;
    private LocalDateTime createdAt;
}