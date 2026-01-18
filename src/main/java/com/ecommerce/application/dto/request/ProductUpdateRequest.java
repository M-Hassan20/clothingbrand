package com.ecommerce.application.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductUpdateRequest {
    @Size(min = 3, max = 200, message = "Product name must be between 3 and 200 characters")
    private String name;

    @Size(min = 3, max = 500, message = "Product name must be between 3 and 500 characters")
    private String description;

    private String brand;

    private Long categoryId;

    private Boolean isActive;
}
