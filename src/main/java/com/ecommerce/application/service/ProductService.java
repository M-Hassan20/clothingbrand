package com.ecommerce.application.service;

import com.ecommerce.application.dto.request.ProductCreateRequest;
import com.ecommerce.application.dto.request.ProductUpdateRequest;
import com.ecommerce.application.dto.response.ProductResponse;
import com.ecommerce.application.dto.response.ProductVariantResponse;
import com.ecommerce.application.entity.Product;
import com.ecommerce.application.entity.ProductVariant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface ProductService {

    // READ OPERATIONS
    Page<Product> getAllActiveProducts(Pageable pageable);

    ProductResponse getProductById(Long productId);

    Page<ProductResponse> getProductsByCategory(Long categoryId, Pageable pageable);

    Page<ProductResponse> searchProducts(String keyword, Pageable pageable);

    Page<ProductResponse> filterProducts(
            Long categoryId,
            String brand,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String keyword,
            Pageable pageable
    );

    Page<ProductResponse> getBestSellers(Pageable pageable);

    Page<ProductResponse> getNewArrivals(Pageable pageable);

    Page<ProductResponse> getRelatedProducts(Long productId, Pageable pageable);

    List<ProductVariantResponse> getProductVariants(Long productId);

    List<String> getAvailableSizes(Long productId);

    List<String> getAvailableColors(Long productId);

    List<String> getAllBrands();

    // WRITE OPERATIONS
    ProductResponse createProduct(ProductCreateRequest request);

    ProductResponse updateProduct(Long id, ProductUpdateRequest request);

    void deleteProduct(Long id);

    // ADMIN / MONITORING
    List<Product> getLowStockProducts();
}
