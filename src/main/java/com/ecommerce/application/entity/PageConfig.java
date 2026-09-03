package com.ecommerce.application.entity;

import com.ecommerce.application.enums.HeroType;
import com.ecommerce.application.enums.PageConfigStatus;
import com.ecommerce.application.enums.PageKey;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "page_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class PageConfig extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PageKey pageKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PageConfigStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private HeroType heroType = HeroType.SPLIT;

    private String title;
    private String subtitle;
    private String imageUrl;
    private String ctaText;
    private String ctaLink;

    @Builder.Default
    private Integer carouselIntervalSeconds = 5;

    @OneToMany(mappedBy = "pageConfig", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderColumn(name = "slide_order")
    @JsonManagedReference("page-config-slides")
    @Builder.Default
    private List<HomepageCarouselSlide> slides = new ArrayList<>();

    @Lob
    @Column(columnDefinition = "TEXT")
    private String contentHtml;

    private String contactEmail;
    private String contactPhone;
    private String contactAddress;
    private String workingHours;

    private String metaTitle;
    private String metaDescription;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "page_config_featured_products", joinColumns = @JoinColumn(name = "page_config_id"))
    @Column(name = "product_id")
    @OrderColumn(name = "display_order")
    @Builder.Default
    private List<Long> featuredProductIds = new ArrayList<>();
}
