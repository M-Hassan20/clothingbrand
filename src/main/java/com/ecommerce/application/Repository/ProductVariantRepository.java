package com.ecommerce.application.Repository;

import com.ecommerce.application.Entity.Product;
import com.ecommerce.application.Entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
