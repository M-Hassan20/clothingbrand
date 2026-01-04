package com.ecommerce.application.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "discount")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Discount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false)
    private String code;
    private BigDecimal discountValue;
    private BigDecimal minOrderAmount;
    private BigDecimal maxDiscountAmount;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
    private Integer maxUsageCount = 0;
    private Integer currentUsageCount = 0;
    private Boolean isActive = true;
    @ManyToMany
    @JoinTable(name = "discount_applicable_categories",
    joinColumns = @JoinColumn(name = "discount_id"),
    inverseJoinColumns = @JoinColumn(name = "category_id"))
    private Set<Category> applicableCategories = new HashSet<>();


}
