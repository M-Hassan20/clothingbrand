package com.ecommerce.application.repository;

import com.ecommerce.application.entity.Category;
import com.ecommerce.application.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    Page<Product> findByIsActiveTrue(Pageable pageable);
    Page<Product> findByCategoryId(Long categoryId, Pageable pageable);
    Page<Product> findByBrand(String brand, Pageable pageable);

    // Search functionality
    Page<Product> findByNameContainingIgnoreCaseAndIsActiveTrue(String name, Pageable pageable);

    @Query("SELECT DISTINCT p FROM Product p " +
            "WHERE (LOWER(p.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(p.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "AND p.isActive = true")
    Page<Product> searchProducts(@Param("searchTerm") String searchTerm, Pageable pageable);

    // Filter by price range (through variants) - FIXED ✅
    @Query("SELECT DISTINCT p FROM Product p " +
            "JOIN ProductVariant pv ON pv.product.id = p.id " +
            "WHERE pv.price BETWEEN :minPrice AND :maxPrice " +
            "AND p.isActive = true")
    Page<Product> findByPriceRange(@Param("minPrice") BigDecimal minPrice,
                                   @Param("maxPrice") BigDecimal maxPrice,
                                   Pageable pageable);

    // Complex filtering - category + price + search - FIXED ✅
    @Query("SELECT DISTINCT p FROM Product p " +
            "JOIN ProductVariant pv ON pv.product.id = p.id " +
            "WHERE (:categoryId IS NULL OR p.category.id = :categoryId) " +
            "AND (:brand IS NULL OR p.brand = :brand) " +
            "AND (:minPrice IS NULL OR pv.price >= :minPrice) " +
            "AND (:maxPrice IS NULL OR pv.price <= :maxPrice) " +
            "AND (:searchTerm IS NULL OR " +
            "     LOWER(p.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "     LOWER(p.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "AND p.isActive = true")
    Page<Product> findByFilters(@Param("categoryId") Long categoryId,
                                @Param("brand") String brand,
                                @Param("minPrice") BigDecimal minPrice,
                                @Param("maxPrice") BigDecimal maxPrice,
                                @Param("searchTerm") String searchTerm,
                                Pageable pageable);

    // Featured/trending products - FIXED ✅
    @Query("SELECT p FROM Product p " +
            "JOIN OrderItem oi ON oi.productVariant.product.id = p.id " +
            "WHERE p.isActive = true " +
            "GROUP BY p.id " +
            "ORDER BY COUNT(oi.id) DESC")
    Page<Product> findBestSellers(Pageable pageable);

    // New arrivals
    Page<Product> findByIsActiveTrueOrderByCreatedAtDesc(Pageable pageable);

    // Products with low stock (for admin dashboard) - FIXED ✅
    @Query("SELECT DISTINCT p FROM Product p " +
            "JOIN ProductVariant pv ON pv.product.id = p.id " +
            "WHERE pv.stockQuantity < 10 AND pv.stockQuantity > 0")
    List<Product> findLowStockProducts();

    // Related products (same category, different product)
    @Query("SELECT p FROM Product p " +
            "WHERE p.category.id = :categoryId " +
            "AND p.id != :productId " +
            "AND p.isActive = true")
    Page<Product> findRelatedProducts(@Param("categoryId") Long categoryId,
                                      @Param("productId") Long productId,
                                      Pageable pageable);

    // Get all distinct brands
    @Query("SELECT DISTINCT p.brand FROM Product p WHERE p.brand IS NOT NULL ORDER BY p.brand")
    List<String> findAllBrands();

    @Query("SELECT p FROM Product p " +
            "WHERE (:categoryId IS NULL OR p.category.id = :categoryId) " +
            "AND (:search IS NULL OR :search = '' OR " +
            "     LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "     LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "     LOWER(p.brand) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Product> findAllForAdmin(@Param("categoryId") Long categoryId,
                                  @Param("search") String search,
                                  Pageable pageable);

    List<Product> findByCategory(Category category);
    List<Product> findByCategoryId(Long categoryId);
    List<Product> findByIsActiveTrue();
    List<Product> findByBrand(String brand);
    List<Product> findByNameContainingIgnoreCase(String name);
    Optional<Product> findByNameAndBrand(String name, String brand);
}
