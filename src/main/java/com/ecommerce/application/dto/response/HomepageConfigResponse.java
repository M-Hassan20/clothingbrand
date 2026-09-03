package com.ecommerce.application.dto.response;

import com.ecommerce.application.enums.HeroType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomepageConfigResponse {

    @Builder.Default
    private HeroType heroType = HeroType.SPLIT;

    private String heroTitle;
    private String heroSubtitle;
    private String heroImageUrl;
    private String ctaText;
    private String ctaLink;

    @Builder.Default
    private Integer carouselIntervalSeconds = 5;

    @Builder.Default
    private List<CarouselSlideResponse> slides = new ArrayList<>();

    @Builder.Default
    private List<ProductResponse> featuredProducts = new ArrayList<>();

    private Boolean isPreview;
    private LocalDateTime updatedAt;
}
