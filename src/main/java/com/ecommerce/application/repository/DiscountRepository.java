package com.ecommerce.application.repository;

import com.ecommerce.application.entity.Discount;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface DiscountRepository extends JpaRepository<Discount, Long> {
    Optional<Discount> findByCode(String code);
    List<Discount> findByIsActiveTrue();

    @Query("SELECT d FROM Discount d WHERE d.code = :code AND d.isActive = true " +
            "AND d.validFrom <= :now AND d.validUntil >= :now " +
            "AND (d.maxUsageCount IS NULL OR d.currentUsageCount < d.maxUsageCount)")
    Optional<Discount> findValidDiscountByCode(String code, LocalDateTime now);

    @Query("SELECT d FROM Discount d " +
            "LEFT JOIN FETCH d.applicableProducts " +
            "LEFT JOIN FETCH d.applicableCategories " +
            "WHERE d.isAutoApplied = true AND d.isActive = true " +
            "AND d.validFrom <= :now AND d.validUntil >= :now")
    List<Discount> findActiveAutoDiscounts(@Param("now") LocalDateTime now);

    @Modifying
    @Transactional
    @Query("UPDATE Discount d SET d.currentUsageCount = d.currentUsageCount + 1 " +
            "WHERE d.id = :discountId")
    void incrementUsageCount(@Param("discountId") Long discountId);

    // Active discounts for a category
    @Query("SELECT d FROM Discount d " +
            "JOIN d.applicableCategories c " +
            "WHERE c.id = :categoryId " +
            "AND d.isActive = true " +
            "AND d.validFrom <= :now " +
            "AND d.validUntil >= :now")
    List<Discount> findActiveByCategoryId(@Param("categoryId") Long categoryId,
                                          @Param("now") LocalDateTime now);

    // Expired discounts (for cleanup)
    @Query("SELECT d FROM Discount d WHERE d.validUntil < :now AND d.isActive = true")
    List<Discount> findExpiredDiscounts(@Param("now") LocalDateTime now);
}
