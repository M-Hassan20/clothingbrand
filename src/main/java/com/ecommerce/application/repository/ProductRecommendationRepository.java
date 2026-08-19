package com.ecommerce.application.repository;

import com.ecommerce.application.entity.ProductRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRecommendationRepository extends JpaRepository<ProductRecommendation, Long> {
    List<ProductRecommendation> findByProductIdOrderByDisplayOrderAsc(Long productId);
    
    @Modifying
    @Query("DELETE FROM ProductRecommendation pr WHERE pr.product.id = :productId")
    void deleteByProductId(@Param("productId") Long productId);
}
