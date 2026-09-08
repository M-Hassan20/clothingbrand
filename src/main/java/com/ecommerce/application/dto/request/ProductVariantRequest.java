package com.ecommerce.application.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantRequest {
    private Long id;

    private Long productId;

    @NotBlank(message = "Size is required")
    private String size;

    @NotBlank(message = "Color is required")
    private String color;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "1.00", message = "Price must be greater than 1")
    private BigDecimal price;

    @NotNull(message = "Stock Quantity is required")
    @Min(value = 0, message = "Stock Quantity cannot be negative")
    private Integer stockQuantity;

    @NotBlank(message = "SKU is required")
    private String sku;

    @NotBlank(message = "Image is required")
    private String publicImageUrl;

    private List<String> additionalImageUrls;

    private Boolean isActive = true;
}
