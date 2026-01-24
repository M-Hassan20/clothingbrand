package com.ecommerce.application.service.impl;

import com.ecommerce.application.dto.request.ProductCreateRequest;
import com.ecommerce.application.dto.request.ProductUpdateRequest;
import com.ecommerce.application.dto.response.ProductDetailResponse;
import com.ecommerce.application.dto.response.ProductResponse;
import com.ecommerce.application.dto.response.ProductVariantResponse;
import com.ecommerce.application.entity.Category;
import com.ecommerce.application.entity.Product;
import com.ecommerce.application.entity.ProductVariant;
import com.ecommerce.application.exception.ResourceNotFoundException;
import com.ecommerce.application.mapper.ProductMapper;
import com.ecommerce.application.mapper.ProductVariantMapper;
import com.ecommerce.application.repository.ProductRepository;
import com.ecommerce.application.repository.ProductVariantRepository;
import com.ecommerce.application.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductServiceImpl implements ProductService{
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductMapper productMapper;
    private final ProductVariantMapper productVariantMapper;
    private final ReviewService reviewService;
    @Cacheable(value = "products", key = "#pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<ProductResponse> getAllActiveProducts(Pageable pageable) {
        return productRepository.findByIsActiveTrue(pageable).map(productMapper::toResponse);
    }

    @Cacheable(value = "product", key = "#id")
    public ProductResponse getProductById(Long productId) {
        Product product = productRepository.findById(productId).orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        return productMapper.toResponse(product);
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
                return products.map(productMapper::toResponse);
    }

    public Page<ProductResponse> searchProducts(String keyword, Pageable pageable) {
        Page<Product> products = productRepository.searchProducts(keyword, pageable);
        return products.map(productMapper::toResponse);
    }

    public Page<ProductResponse> filterProducts(Long categoryId, String brand, BigDecimal minPrice, BigDecimal maxPrice, String keyword, Pageable pageable) {
        Page<Product> products = productRepository.findByFilters(categoryId, brand, minPrice, maxPrice, keyword, pageable);
        return products.map(productMapper::toResponse);
    }

    @Cacheable(value = "bestSellers")
    public Page<ProductResponse> getBestSellers(Pageable pageable) {
        Page<Product> products = productRepository.findBestSellers(pageable);
        return products.map(productMapper::toResponse);
    }

    public Page<ProductResponse> getNewArrivals(Pageable pageable) {
        Page<Product> products = productRepository.findByIsActiveTrueOrderByCreatedAtDesc(pageable);
        return products.map(productMapper::toResponse);
    }

    public Page<ProductResponse> getRelatedProducts(Long productId, Pageable pageable) {
        Product product = getProductEntityById(productId);
        Page<Product> products = productRepository.findRelatedProducts(product.getCategory().getId(), productId, pageable);
        return products.map(productMapper::toResponse);
    }

    public List<ProductVariantResponse> getProductVariants(Long productId) {
        List<ProductVariant> variants = productVariantRepository.findByProductId(productId);
        return productVariantMapper.toResponseList(variants);
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
        Product product = productMapper.toEntity(request);
        Product saved = productRepository.save(product);
        return productMapper.toResponse(saved);
    }

    @Transactional
    @CacheEvict(value = {"products", "product", "brands"}, allEntries = true)
    public ProductResponse updateProduct(Long id, ProductUpdateRequest request) {
        Product product = getProductEntityById(id);
        productMapper.updateEntityFromRequest(request, product);
        Product updated = productRepository.save(product);
        return productMapper.toResponse(updated);
    }

    @Transactional
    @CacheEvict(value = {"products", "product", "brands"}, allEntries = true)
    public void deleteProduct(Long id) {
        Product product = getProductEntityById(id);
        product.setIsActive(false);
        productRepository.save(product);
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
        response.setVariants(productVariantMapper.toResponseList(
                productVariantRepository.findByProductId(id)));
        response.setAvailableSizes(getAvailableSizes(id));
        response.setAvailableColors(getAvailableColors(id));
        response.setAverageRating(reviewService.getAverageRating(id));
        response.setReviewCount(reviewService.getReviewCount(id));

        return response;
    }

}
