package com.ecommerce.application.dto.excel;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductImportRow {
    private Integer rowNumber;

    // Product fields
    private String productName;
    private String description;
    private String brand;
    private String categoryName;
    private Boolean isActive;

    // Variant fields
    private String size;
    private String color;
    private BigDecimal price;
    private Integer stockQuantity;
    private String sku;

    // Validation
    private Boolean hasErrors = false;
    private String errorMessage;
}