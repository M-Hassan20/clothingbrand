package com.ecommerce.application.entity;

import com.ecommerce.application.enums.HomepageConfigStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "homepage_config")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class HomepageConfig extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private HomepageConfigStatus status; // DRAFT or PUBLISHED

    private String heroTitle;
    private String heroSubtitle;
    private String heroImageUrl;
    private String ctaText;
    private String ctaLink;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "homepage_featured_products", joinColumns = @JoinColumn(name = "homepage_config_id"))
    @Column(name = "product_id")
    @OrderColumn(name = "display_order") // preserves the order the admin arranged them in
    private List<Long> featuredProductIds = new ArrayList<>();
}
