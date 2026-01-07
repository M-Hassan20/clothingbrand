package com.ecommerce.application.service;

import com.ecommerce.application.entity.Product;
import com.ecommerce.application.entity.ProductVariant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface ProductService {

    // READ OPERATIONS
    Page<Product> getAllActiveProducts(Pageable pageable);

    Product getProductById(Long productId);

    Page<Product> getProductsByCategory(Long categoryId, Pageable pageable);

    Page<Product> searchProducts(String keyword, Pageable pageable);

    Page<Product> filterProducts(
            Long categoryId,
            String brand,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String keyword,
            Pageable pageable
    );

    Page<Product> getBestSellers(Pageable pageable);

    Page<Product> getNewArrivals(Pageable pageable);

    Page<Product> getRelatedProducts(Long productId, Pageable pageable);

    List<ProductVariant> getProductVariants(Long productId);

    List<String> getAvailableSizes(Long productId);

    List<String> getAvailableColors(Long productId);

    List<String> getAllBrands();

    // WRITE OPERATIONS
    Product createProduct(Product product);

    Product updateProduct(Long id, Product productDetails);

    void deleteProduct(Long id);

    // ADMIN / MONITORING
    List<Product> getLowStockProducts();
}
