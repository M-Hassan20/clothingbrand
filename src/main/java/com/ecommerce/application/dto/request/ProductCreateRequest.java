package com.ecommerce.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import com.ecommerce.application.dto.request.ProductVariantRequest;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductCreateRequest {
    @NotBlank(message = "Product name is required")
    @Size(min = 3, max = 200, message = "Product name must be between 3 and 200 characters")
    private String name;

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 500, message = "Description must be between 10 and 200 characters")
    private String description;

    @NotBlank(message = "Brand name is required")
    private String brand;

    @NotNull(message = "Category is required")
    private Long categoryId;

    private Boolean isActive = true;

    private String thumbnailImage;

    // Optional list of variants for the product
    private List<ProductVariantRequest> variants;
}
