package com.ecommerce.application.service.impl;

import com.ecommerce.application.entity.Product;
import com.ecommerce.application.entity.ProductVariant;
import com.ecommerce.application.exception.ResourceNotFoundException;
import com.ecommerce.application.repository.ProductVariantRepository;
import com.ecommerce.application.service.ProductVariantService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@RequiredArgsConstructor
@Service
@Transactional(readOnly = true)
public class ProductVariantServiceImpl implements ProductVariantService{
    private final ProductVariantRepository productVariantRepository;

    public ProductVariant getVariantById(Long id) {
        return productVariantRepository.findById(id).orElseThrow(()-> new ResourceNotFoundException("Product Variant", "id", id));
    }
    public ProductVariant getVariantBySku(String sku) {
        return productVariantRepository.findBySku(sku).orElseThrow(()-> new ResourceNotFoundException("Product Variant", "sku", sku));
    }

    public List<ProductVariant> getVariantsByProductId(Long id) {
        return productVariantRepository.findByProductId(id);
    }

    public boolean isInStock(Long variantId) {
        return productVariantRepository.isInStock(variantId);
    }

    public ProductVariant findByProductAndAttributes(Long productId, String size, String color) {
        return productVariantRepository.findByProductIdAndSizeAndColor(productId, size, color).orElseThrow(()-> new RuntimeException("Product not found with id: " + productId + " size: " + size + " color: " + color));
    }

    @Transactional
    public ProductVariant createVariant(ProductVariant productVariant) {
        return productVariantRepository.save(productVariant);
    }

    @Transactional
    public ProductVariant updateVariant(Long id, ProductVariant variantDetails) {
        ProductVariant variant = getVariantById(id);
        variant.setSize(variantDetails.getSize());
        variant.setColor(variantDetails.getColor());
        variant.setPrice(variantDetails.getPrice());
        variant.setPublicImageUrl(variantDetails.getPublicImageUrl());
        variant.setAdditionalImageUrls(variantDetails.getAdditionalImageUrls());
        variant.setSku(variantDetails.getSku());
        variant.setStockQuantity(variantDetails.getStockQuantity());
//        variant.setProduct(variantDetails.getProduct());
        return productVariantRepository.save(variant);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public ProductVariant updateStock(Long id, Integer quantity) {
        ProductVariant variant = getVariantById(id);
        variant.setStockQuantity(quantity);
        return productVariantRepository.save(variant);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void decreaseStock(Long id, Integer newStockQuantity) {
        ProductVariant variant = getVariantById(id);
        if(variant.getStockQuantity() < newStockQuantity) {
            throw new RuntimeException("Insufficient Stock for Variant: " + id);
        }
        variant.setStockQuantity(variant.getStockQuantity() - newStockQuantity);
        productVariantRepository.save(variant);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void increaseStock(Long id, Integer newStockQuantity) {
        ProductVariant variant = getVariantById(id);
        variant.setStockQuantity(variant.getStockQuantity() + newStockQuantity);
        productVariantRepository.save(variant);
    }

    public List<ProductVariant> getLowStockVariants(Integer threshold) {
        return productVariantRepository.findLowStockVariants(threshold);
    }

    @Transactional
    public void deleteVariant(Long id) {
        ProductVariant variant = getVariantById(id);
        variant.setIsActive(false);
    }

}
