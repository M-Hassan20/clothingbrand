package com.ecommerce.application.service.impl;

import com.ecommerce.application.dto.request.ProductVariantRequest;
import com.ecommerce.application.dto.response.ProductResponse;
import com.ecommerce.application.dto.response.ProductVariantResponse;
import com.ecommerce.application.entity.Product;
import com.ecommerce.application.entity.ProductVariant;
import com.ecommerce.application.exception.ResourceNotFoundException;
import com.ecommerce.application.mapper.ProductVariantMapper;
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
    private final ProductVariantMapper productVariantMapper;
    private final RevalidationService revalidationService;

    public ProductVariantResponse getVariantById(Long id) {
        return productVariantMapper.toResponse(productVariantRepository.findById(id).orElseThrow(()-> new ResourceNotFoundException("Product Variant", "id", id)));
    }

    public ProductVariant getVariantEntityById(Long id) {
        return productVariantRepository.findById(id).orElseThrow(() -> new RuntimeException("Product Variant does not exist with ID: " + id));
    }

    public ProductVariant useEntity(Long id) {
        return getVariantEntityById(id);
    }
    public ProductVariantResponse getVariantBySku(String sku) {
        return productVariantMapper.toResponse(productVariantRepository.findBySku(sku).orElseThrow(()-> new ResourceNotFoundException("Product Variant", "sku", sku)));
    }

    public List<ProductVariantResponse> getVariantsByProductId(Long id) {
        return productVariantMapper.toResponseList(productVariantRepository.findByProductId(id));
    }

    public boolean isInStock(Long variantId) {
        return productVariantRepository.isInStock(variantId);
    }

    public ProductVariantResponse findByProductAndAttributes(Long productId, String size, String color) {
        return productVariantMapper.toResponse(productVariantRepository.findByProductIdAndSizeAndColor(productId, size, color).orElseThrow(()-> new RuntimeException("Product not found with id: " + productId + " size: " + size + " color: " + color)));
    }

    @Transactional
    public ProductVariantResponse createVariant(ProductVariantRequest request) {
        ProductVariant productVariant = productVariantMapper.toEntity(request);
        ProductVariant saved = productVariantRepository.save(productVariant);
        if (saved.getProduct() != null) {
            revalidationService.revalidate("products", "product-" + saved.getProduct().getId());
        }
        return productVariantMapper.toResponse(saved);
    }

    @Transactional
    public ProductVariantResponse updateVariant(Long id, ProductVariantRequest request) {
        ProductVariant variant = getVariantEntityById(id);
        variant.setSize(request.getSize());
        variant.setColor(request.getColor());
        variant.setPrice(request.getPrice());
        variant.setPublicImageUrl(request.getPublicImageUrl());
        variant.setAdditionalImageUrls(request.getAdditionalImageUrls());
        variant.setSku(request.getSku());
        variant.setStockQuantity(request.getStockQuantity());
        ProductVariant updated = productVariantRepository.save(variant);
        if (updated.getProduct() != null) {
            revalidationService.revalidate("products", "product-" + updated.getProduct().getId());
        }
        return productVariantMapper.toResponse(updated);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public ProductVariantResponse updateStock(Long id, Integer quantity) {
        ProductVariant variant = getVariantEntityById(id);
        variant.setStockQuantity(quantity);
        ProductVariant updated = productVariantRepository.save(variant);
        if (updated.getProduct() != null) {
            revalidationService.revalidate("products", "product-" + updated.getProduct().getId());
        }
        return productVariantMapper.toResponse(updated);
    }

    @Transactional
    public void decreaseStock(Long id, Integer quantity) {
        int updatedRows = productVariantRepository.decreaseStockAtomic(id, quantity);
        if (updatedRows == 0) {
            throw new IllegalArgumentException("Insufficient Stock for Variant: " + id);
        }
        ProductVariant variant = getVariantEntityById(id);
        if (variant.getProduct() != null) {
            revalidationService.revalidate("products", "product-" + variant.getProduct().getId());
        }
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void increaseStock(Long id, Integer newStockQuantity) {
        ProductVariant variant = getVariantEntityById(id);
        variant.setStockQuantity(variant.getStockQuantity() + newStockQuantity);
        ProductVariant updated = productVariantRepository.save(variant);
        if (updated.getProduct() != null) {
            revalidationService.revalidate("products", "product-" + updated.getProduct().getId());
        }
    }

    public List<ProductVariantResponse> getLowStockVariants(Integer threshold) {
        return productVariantMapper.toResponseList(productVariantRepository.findLowStockVariants(threshold));
    }

    @Transactional
    public void deleteVariant(Long id) {
        ProductVariant variant = getVariantEntityById(id);
        variant.setIsActive(false);
        productVariantRepository.save(variant);
        if (variant.getProduct() != null) {
            revalidationService.revalidate("products", "product-" + variant.getProduct().getId());
        }
    }

    @Transactional
    public void updateVariantImages(Long variantId, String mainImage, List<String> additionalImages) {
        ProductVariant variant = getVariantEntityById(variantId);
        variant.setPublicImageUrl(mainImage);
        variant.setAdditionalImageUrls(additionalImages);
        ProductVariant updated = productVariantRepository.save(variant);
        if (updated.getProduct() != null) {
            revalidationService.revalidate("products", "product-" + updated.getProduct().getId());
        }
    }

}
