package com.ecommerce.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantResponse {
    private Long id;
    private String size;
    private String color;
    private BigDecimal price;
    private Integer stockQuantity;
    private String sku;
    private String publicImageUrl;
    private Boolean inStock;
    private String productName;
    private Long productId;
    private BigDecimal salePrice;
}