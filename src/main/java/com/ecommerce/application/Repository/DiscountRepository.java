package com.ecommerce.application.Repository;

import com.ecommerce.application.Entity.Discount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

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
}
