package com.ecommerce.application.service;

import com.ecommerce.application.dto.request.ProductVariantRequest;
import com.ecommerce.application.dto.response.ProductVariantResponse;
import com.ecommerce.application.entity.ProductVariant;

import java.util.List;

public interface ProductVariantService {

    // READ OPERATIONS
    ProductVariantResponse getVariantById(Long id);

    ProductVariantResponse getVariantBySku(String sku);

    List<ProductVariantResponse> getVariantsByProductId(Long productId);

    boolean isInStock(Long variantId);

    ProductVariantResponse findByProductAndAttributes(Long productId, String size, String color);

    List<ProductVariantResponse> getLowStockVariants(Integer threshold);

    // WRITE OPERATIONS
    ProductVariantResponse createVariant(ProductVariantRequest request);

    ProductVariantResponse updateVariant(Long id, ProductVariantRequest request);

    ProductVariantResponse updateStock(Long id, Integer quantity);

    void decreaseStock(Long id, Integer quantity);

    void increaseStock(Long id, Integer quantity);

    void deleteVariant(Long id);
}
