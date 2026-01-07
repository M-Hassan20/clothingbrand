package com.ecommerce.application.service;

import com.ecommerce.application.entity.ProductVariant;

import java.util.List;

public interface ProductVariantService {

    // READ OPERATIONS
    ProductVariant getVariantById(Long id);

    ProductVariant getVariantBySku(String sku);

    List<ProductVariant> getVariantsByProductId(Long productId);

    boolean isInStock(Long variantId);

    ProductVariant findByProductAndAttributes(Long productId, String size, String color);

    List<ProductVariant> getLowStockVariants(Integer threshold);

    // WRITE OPERATIONS
    ProductVariant createVariant(ProductVariant productVariant);

    ProductVariant updateVariant(Long id, ProductVariant variantDetails);

    ProductVariant updateStock(Long id, Integer quantity);

    void decreaseStock(Long id, Integer quantity);

    void increaseStock(Long id, Integer quantity);

    void deleteVariant(Long id);
}
