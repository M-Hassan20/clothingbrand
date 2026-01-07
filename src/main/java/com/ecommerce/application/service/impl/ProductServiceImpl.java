package com.ecommerce.application.service.impl;

import com.ecommerce.application.entity.Category;
import com.ecommerce.application.entity.Product;
import com.ecommerce.application.entity.ProductVariant;
import com.ecommerce.application.exception.ResourceNotFoundException;
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

    @Cacheable(value = "products", key = "#pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<Product> getAllActiveProducts(Pageable pageable) {
        return productRepository.findByIsActiveTrue(pageable);
    }

    @Cacheable(value = "product", key = "#id")
    public Product getProductById(Long productId) {
        return productRepository.findById(productId).orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
    }

    public Page<Product> getProductsByCategory(Long categoryId, Pageable pageable) {
        return productRepository.findByCategoryId(categoryId, pageable);
    }

    public Page<Product> searchProducts(String keyword, Pageable pageable) {
        return productRepository.searchProducts(keyword, pageable);
    }

    public Page<Product> filterProducts(Long categoryId, String brand, BigDecimal minPrice, BigDecimal maxPrice, String keyword, Pageable pageable) {
        return productRepository.findByFilters(categoryId, brand, minPrice, maxPrice, keyword, pageable);
    }

    @Cacheable(value = "bestSellers")
    public Page<Product> getBestSellers(Pageable pageable) {
        return productRepository.findBestSellers(pageable);
    }

    public Page<Product> getNewArrivals(Pageable pageable) {
        return productRepository.findByIsActiveTrueOrderByCreatedAtDesc(pageable);
    }

    public Page<Product> getRelatedProducts(Long productId, Pageable pageable) {
        Product product = getProductById(productId);
        return productRepository.findRelatedProducts(
                product.getCategory().getId(), productId, pageable);
    }

    public List<ProductVariant> getProductVariants(Long productId) {
        return productVariantRepository.findByProductId(productId);
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
    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    @Transactional
    @CacheEvict(value = {"products", "product", "brands"}, allEntries = true)
    public Product updateProduct(Long id, Product productDetails) {
        Product product = getProductById(id);
        product.setName(productDetails.getName());
        product.setDescription(productDetails.getDescription());
        product.setBrand(productDetails.getBrand());
        product.setCategory(productDetails.getCategory());
        product.setIsActive(productDetails.getIsActive());
        return productRepository.save(product);
    }

    @Transactional
    @CacheEvict(value = {"products", "product", "brands"}, allEntries = true)
    public void deleteProduct(Long id) {
        Product product = getProductById(id);
        product.setIsActive(false);
        productRepository.save(product);
    }

    // Get low stock products (Admin)
    public List<Product> getLowStockProducts() {
        return productRepository.findLowStockProducts();
    }

}
