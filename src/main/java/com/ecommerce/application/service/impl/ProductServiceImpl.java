package com.ecommerce.application.service.impl;

import com.ecommerce.application.dto.request.ProductCreateRequest;
import com.ecommerce.application.dto.request.ProductUpdateRequest;
import com.ecommerce.application.dto.request.ProductVariantRequest;
import com.ecommerce.application.dto.response.ProductDetailResponse;
import com.ecommerce.application.dto.response.ProductResponse;
import com.ecommerce.application.dto.response.ProductVariantResponse;
import com.ecommerce.application.entity.Category;
import com.ecommerce.application.entity.Product;
import com.ecommerce.application.entity.ProductVariant;
import com.ecommerce.application.enums.ProductStatus;
import com.ecommerce.application.exception.ResourceNotFoundException;
import com.ecommerce.application.mapper.ProductMapper;
import com.ecommerce.application.mapper.ProductVariantMapper;
import com.ecommerce.application.repository.ProductRepository;
import com.ecommerce.application.repository.ProductVariantRepository;
import com.ecommerce.application.repository.ProductRecommendationRepository;
import com.ecommerce.application.entity.ProductRecommendation;
import com.ecommerce.application.service.ProductService;
import com.ecommerce.application.service.impl.DiscountService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductServiceImpl implements ProductService{
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductMapper productMapper;
    private final ProductVariantMapper productVariantMapper;
    private final ReviewService reviewService;
    private final RevalidationService revalidationService;
    private final ProductRecommendationRepository productRecommendationRepository;
    private final DiscountService discountService;

    private ProductResponse populateSalePrices(ProductResponse response, Product product) {
        if (response == null || product == null) return response;

        List<ProductVariant> variants = productVariantRepository.findByProductId(product.getId());
        BigDecimal minSale = null;
        BigDecimal maxSale = null;

        for (ProductVariant variant : variants) {
            BigDecimal salePrice = discountService.calculateEffectivePrice(variant);
            if (minSale == null || salePrice.compareTo(minSale) < 0) {
                minSale = salePrice;
            }
            if (maxSale == null || salePrice.compareTo(maxSale) > 0) {
                maxSale = salePrice;
            }
        }

        response.setMinSalePrice(minSale != null ? minSale : response.getMinPrice());
        response.setMaxSalePrice(maxSale != null ? maxSale : response.getMaxPrice());

        List<String> skus = variants.stream()
                .map(ProductVariant::getSku)
                .filter(sku -> sku != null && !sku.isEmpty())
                .toList();
        response.setSkus(skus);

        return response;
    }
    @Cacheable(value = "products", key = "#pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<ProductResponse> getAllActiveProducts(Pageable pageable) {
        return productRepository.findByIsActiveTrue(pageable).map(product -> populateSalePrices(productMapper.toResponse(product), product));
    }

    @Cacheable(value = "product", key = "#productId")
    public ProductResponse getProductById(Long productId) {
        // Use the active‑only lookup to enforce soft‑delete semantics
        Product product = productRepository.findByIdAndIsActiveTrue(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        return populateSalePrices(productMapper.toResponse(product), product);
    }

    // Keep this for internal service use
    private Product getProductEntityById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
    }

    public Product useEntityById(Long id) {
        return getProductEntityById(id);
    }

    public Page<ProductResponse> getProductsByCategory(Long categoryId, Pageable pageable) {
                Page<Product> products = productRepository.findByCategoryId(categoryId, pageable);
                return products.map(product -> populateSalePrices(productMapper.toResponse(product), product));
    }

    public Page<ProductResponse> searchProducts(String keyword, Pageable pageable) {
        Page<Product> products = productRepository.searchProducts(keyword, pageable);
        return products.map(product -> populateSalePrices(productMapper.toResponse(product), product));
    }

    public Page<ProductResponse> filterProducts(Long categoryId, String brand, BigDecimal minPrice, BigDecimal maxPrice, String keyword, Pageable pageable) {
        Page<Product> products = productRepository.findByFilters(categoryId, brand, minPrice, maxPrice, keyword, pageable);
        return products.map(product -> populateSalePrices(productMapper.toResponse(product), product));
    }

    @Cacheable(value = "bestSellers")
    public Page<ProductResponse> getBestSellers(Pageable pageable) {
        Page<Product> products = productRepository.findBestSellers(pageable);
        return products.map(product -> populateSalePrices(productMapper.toResponse(product), product));
    }

    public Page<ProductResponse> getNewArrivals(Pageable pageable) {
        Page<Product> products = productRepository.findByIsActiveTrueOrderByCreatedAtDesc(pageable);
        return products.map(product -> populateSalePrices(productMapper.toResponse(product), product));
    }

    public Page<ProductResponse> getRelatedProducts(Long productId, Pageable pageable) {
        Product product = getProductEntityById(productId);
        Page<Product> products = productRepository.findRelatedProducts(product.getCategory().getId(), productId, pageable);
        return products.map(p -> populateSalePrices(productMapper.toResponse(p), p));
    }

    public List<ProductVariantResponse> getProductVariants(Long productId) {
        List<ProductVariant> variants = productVariantRepository.findByProductId(productId);
        List<ProductVariantResponse> responses = productVariantMapper.toResponseList(variants);
        for (int i = 0; i < variants.size(); i++) {
            BigDecimal salePrice = discountService.calculateEffectivePrice(variants.get(i));
            responses.get(i).setSalePrice(salePrice);
        }
        return responses;
    }

    public List<String> getAvailableSizes(Long productId) {
        return productVariantRepository.getAvailableSizesByProductId(productId);
    }

    public List<String> getAvailableColors(Long productId) {
        return productVariantRepository.getAvailableColorsByProductId(productId);
    }

    @Cacheable(value = "brands")
    public List<String> getAllBrands() {
        return productRepository.findAllBrands();
    }

    @Transactional
    @CacheEvict(value = {"products", "product", "brands"}, allEntries = true)
    public ProductResponse createProduct(ProductCreateRequest request) {
        // 1️⃣ Persist the base product entity
        Product product = productMapper.toEntity(request);
        if (Boolean.FALSE.equals(request.getIsActive())) {
            product.setStatus(ProductStatus.DRAFT);
        } else {
            product.setStatus(ProductStatus.ACTIVE);
        }
        if (request.getThumbnailImage() != null && !request.getThumbnailImage().trim().isEmpty()) {
            product.setThumbnailImage(request.getThumbnailImage());
        }
        Product saved = productRepository.save(product);

        // 2️⃣ Persist any supplied variants (price, size, color, optional image URL)
        if (request.getVariants() != null) {
            request.getVariants().forEach(variantReq -> {
                ProductVariant variant = new ProductVariant();
                variant.setProduct(saved);
                variant.setSize(variantReq.getSize());
                variant.setColor(variantReq.getColor());
                variant.setPrice(variantReq.getPrice());
                variant.setStockQuantity(variantReq.getStockQuantity());
                // Store the first image URL on the variant if provided – this will be used as thumbnail
                variant.setPublicImageUrl(variantReq.getPublicImageUrl());
                variant.setIsActive(true);
                productVariantRepository.save(variant);
            });
        }

        // 3️⃣ Set product thumbnail from the first variant image (if thumbnailImage was not already set)
        if (saved.getThumbnailImage() == null || saved.getThumbnailImage().trim().isEmpty()) {
            if (request.getVariants() != null && !request.getVariants().isEmpty()) {
                String firstImg = request.getVariants().get(0).getPublicImageUrl();
                if (firstImg != null && !firstImg.trim().isEmpty()) {
                    saved.setThumbnailImage(firstImg);
                    productRepository.save(saved);
                }
            }
        }

        revalidationService.revalidate("products");
        return productMapper.toResponse(saved);
    }

    @Transactional
    @CacheEvict(value = {"products", "product", "brands"}, allEntries = true)
    public ProductResponse updateProduct(Long id, ProductUpdateRequest request) {
        Product product = getProductEntityById(id);
        productMapper.updateEntityFromRequest(request, product);

        if (request.getIsActive() != null) {
            product.setIsActive(request.getIsActive());
            if (Boolean.TRUE.equals(request.getIsActive())) {
                product.setStatus(ProductStatus.ACTIVE);
            } else if (product.getStatus() != ProductStatus.ARCHIVED) {
                product.setStatus(ProductStatus.DRAFT);
            }
        }

        if (request.getThumbnailImage() != null && !request.getThumbnailImage().trim().isEmpty()) {
            product.setThumbnailImage(request.getThumbnailImage());
        }

        // Update variants if supplied
        if (request.getVariants() != null) {
            List<ProductVariant> existingVariants = productVariantRepository.findByProductId(id);
            Map<Long, ProductVariant> existingMap = existingVariants.stream()
                    .collect(Collectors.toMap(ProductVariant::getId, v -> v));

            Set<Long> processedVariantIds = new HashSet<>();

            for (ProductVariantRequest vReq : request.getVariants()) {
                ProductVariant variant = null;

                // 1. Match by ID if present
                if (vReq.getId() != null && existingMap.containsKey(vReq.getId())) {
                    variant = existingMap.get(vReq.getId());
                } 
                // 2. Match by size and color if ID not present or not matched
                else if (vReq.getSize() != null && vReq.getColor() != null) {
                    variant = existingVariants.stream()
                            .filter(v -> vReq.getSize().equalsIgnoreCase(v.getSize()) && vReq.getColor().equalsIgnoreCase(v.getColor()))
                            .findFirst()
                            .orElse(null);
                }

                if (variant == null) {
                    variant = new ProductVariant();
                    variant.setProduct(product);
                }

                variant.setSize(vReq.getSize());
                variant.setColor(vReq.getColor());
                variant.setPrice(vReq.getPrice() != null ? vReq.getPrice() : BigDecimal.ZERO);
                variant.setStockQuantity(vReq.getStockQuantity() != null ? vReq.getStockQuantity() : 0);

                if (vReq.getSku() != null && !vReq.getSku().trim().isEmpty()) {
                    variant.setSku(vReq.getSku());
                } else if (variant.getSku() == null || variant.getSku().trim().isEmpty()) {
                    String colorClean = vReq.getColor() != null ? vReq.getColor().toLowerCase().replaceAll("[^a-z0-9]", "") : "col";
                    String sizeClean = vReq.getSize() != null ? vReq.getSize().toLowerCase().replaceAll("[^a-z0-9]", "") : "sz";
                    variant.setSku("hoh-" + id + "-" + colorClean + "-" + sizeClean);
                }

                if (vReq.getPublicImageUrl() != null && !vReq.getPublicImageUrl().trim().isEmpty()) {
                    variant.setPublicImageUrl(vReq.getPublicImageUrl());
                }
                if (vReq.getAdditionalImageUrls() != null) {
                    variant.setAdditionalImageUrls(vReq.getAdditionalImageUrls());
                }
                variant.setIsActive(vReq.getIsActive() != null ? vReq.getIsActive() : true);

                ProductVariant savedVariant = productVariantRepository.save(variant);
                if (savedVariant.getId() != null) {
                    processedVariantIds.add(savedVariant.getId());
                }
            }

            // Deactivate any variants removed during edit
            for (ProductVariant existing : existingVariants) {
                if (!processedVariantIds.contains(existing.getId())) {
                    existing.setIsActive(false);
                    productVariantRepository.save(existing);
                }
            }
        }

        // Set fallback thumbnail from first variant if empty
        if (product.getThumbnailImage() == null || product.getThumbnailImage().trim().isEmpty()) {
            if (request.getVariants() != null && !request.getVariants().isEmpty()) {
                String firstImg = request.getVariants().get(0).getPublicImageUrl();
                if (firstImg != null && !firstImg.trim().isEmpty()) {
                    product.setThumbnailImage(firstImg);
                }
            }
        }

        Product updated = productRepository.save(product);
        revalidationService.revalidate("products", "product-" + id);
        return populateSalePrices(productMapper.toResponse(updated), updated);
    }

    @Transactional
    @CacheEvict(value = {"products", "product", "brands"}, allEntries = true)
    public void deleteProduct(Long id) {
        Product product = getProductEntityById(id);
        product.setIsActive(false);
        product.setStatus(ProductStatus.ARCHIVED);
        productRepository.save(product);
        revalidationService.revalidate("products", "product-" + id);
    }

    // Get low stock products (Admin)
    public List<Product> getLowStockProducts() {
        return productRepository.findLowStockProducts();
    }

    public ProductDetailResponse getProductDetailById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        ProductDetailResponse response = productMapper.toDetailResponse(product);

        // Set additional data
        List<ProductVariant> variants = productVariantRepository.findByProductId(id);
        List<ProductVariantResponse> variantResponses = productVariantMapper.toResponseList(variants);
        for (int i = 0; i < variants.size(); i++) {
            BigDecimal salePrice = discountService.calculateEffectivePrice(variants.get(i));
            variantResponses.get(i).setSalePrice(salePrice);
        }
        response.setVariants(variantResponses);
        response.setAvailableSizes(getAvailableSizes(id));
        response.setAvailableColors(getAvailableColors(id));
        response.setAverageRating(reviewService.getAverageRating(id));
        response.setReviewCount(reviewService.getReviewCount(id));

        return response;
    }

    @Transactional
    @CacheEvict(value = {"products", "product"}, allEntries = true)
    public void updateProductThumbnail(Long productId, String thumbnailUrl) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        product.setThumbnailImage(thumbnailUrl);
        productRepository.save(product);
        revalidationService.revalidate("products", "product-" + productId);
    }

    @Override
    public Page<ProductResponse> getAllProductsForAdmin(Long categoryId, String search, String status, Pageable pageable) {
        String statusParam = (status != null && !status.trim().isEmpty()) ? status.trim().toUpperCase() : "DEFAULT";
        Page<Product> products = productRepository.findAllForAdmin(categoryId, search, statusParam, pageable);
        return products.map(product -> populateSalePrices(productMapper.toResponse(product), product));
    }

    @Override
    public List<ProductResponse> getCompleteTheLook(Long productId) {
        List<ProductRecommendation> curated =
                productRecommendationRepository.findByProductIdOrderByDisplayOrderAsc(productId);

        if (!curated.isEmpty()) {
            return curated.stream()
                    .map(r -> populateSalePrices(productMapper.toResponse(r.getRecommendedProduct()), r.getRecommendedProduct()))
                    .toList();
        }

        // Fallback: same-category related products, existing logic, unchanged
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        return productRepository
                .findRelatedProducts(product.getCategory().getId(), productId, PageRequest.of(0, 4))
                .map(p -> populateSalePrices(productMapper.toResponse(p), p))
                .toList();
    }

    @Override
    public List<ProductResponse> getRecommendationsForAdmin(Long productId) {
        return productRecommendationRepository.findByProductIdOrderByDisplayOrderAsc(productId).stream()
                .map(r -> populateSalePrices(productMapper.toResponse(r.getRecommendedProduct()), r.getRecommendedProduct()))
                .toList();
    }

    @Override
    @Transactional
    public void setRecommendations(Long productId, List<Long> recommendedProductIds) {
        productRecommendationRepository.deleteByProductId(productId);

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        List<ProductRecommendation> rows = new ArrayList<>();
        int order = 0;
        for (Long recommendedId : recommendedProductIds) {
            if (recommendedId.equals(productId)) continue; // a product can't recommend itself
            Product recommended = productRepository.findById(recommendedId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", recommendedId));
            rows.add(ProductRecommendation.builder()
                    .product(product)
                    .recommendedProduct(recommended)
                    .displayOrder(order++)
                    .build());
        }
        productRecommendationRepository.saveAll(rows);
        revalidationService.revalidate("products", "product-" + productId);
    }
}
