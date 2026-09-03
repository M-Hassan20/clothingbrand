package com.ecommerce.application.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.ecommerce.application.enums.CarouselLinkType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "homepage_carousel_slides")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class HomepageCarouselSlide extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String imageUrl;

    private String title;
    private String subtitle;
    private String ctaText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CarouselLinkType linkType = CarouselLinkType.NONE;

    private Long targetId;
    private String customUrl;

    private Integer displayOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "homepage_config_id")
    @JsonBackReference("homepage-config-slides")
    private HomepageConfig homepageConfig;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "page_config_id")
    @JsonBackReference("page-config-slides")
    private PageConfig pageConfig;
}
