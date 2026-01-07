package com.ecommerce.application.repository;

import com.ecommerce.application.entity.Product;
import com.ecommerce.application.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {

    List<ProductVariant> findByProduct(Product product);
    List<ProductVariant> findByProductId(Long productId);


    Optional<ProductVariant> findBySku(String sku);
    List<ProductVariant> findByStockQuantityGreaterThan(Integer quantity);
    List<ProductVariant> findByProductIdAndStockQuantityGreaterThan(Long productId, Integer quantity);

    @Query("SELECT CASE WHEN v.stockQuantity > 0 THEN true ELSE false END " +
            "FROM ProductVariant v WHERE v.id = :variantId")
    boolean isInStock(@Param("variantId") Long variantId);

    // Get available sizes for a product
    @Query("SELECT DISTINCT v.size FROM ProductVariant v " +
            "WHERE v.product.id = :productId AND v.stockQuantity > 0 " +
            "ORDER BY v.size")
    List<String> getAvailableSizesByProductId(@Param("productId") Long productId);

    // Get available colors for a product
    @Query("SELECT DISTINCT v.color FROM ProductVariant v " +
            "WHERE v.product.id = :productId AND v.stockQuantity > 0 " +
            "ORDER BY v.color")
    List<String> getAvailableColorsByProductId(@Param("productId") Long productId);

    // Find variants by size and color
    Optional<ProductVariant> findByProductIdAndSizeAndColor(Long productId, String size, String color);

    // Low stock alerts for admin
    @Query("SELECT v FROM ProductVariant v WHERE v.stockQuantity < :threshold AND v.stockQuantity > 0")
    List<ProductVariant> findLowStockVariants(@Param("threshold") Integer threshold);

    // Out of stock variants
    List<ProductVariant> findByStockQuantity(Integer quantity);
}
