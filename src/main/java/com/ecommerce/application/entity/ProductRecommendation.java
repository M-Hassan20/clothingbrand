package com.ecommerce.application.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "product_recommendations",
       uniqueConstraints = @UniqueConstraint(columnNames = {"product_id", "recommended_product_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ProductRecommendation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product; // the product being viewed

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recommended_product_id", nullable = false)
    private Product recommendedProduct; // the suggested pairing

    @Column(name = "display_order")
    private Integer displayOrder;
}
