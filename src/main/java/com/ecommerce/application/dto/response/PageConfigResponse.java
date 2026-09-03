package com.ecommerce.application.dto.response;

import com.ecommerce.application.enums.HeroType;
import com.ecommerce.application.enums.PageConfigStatus;
import com.ecommerce.application.enums.PageKey;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageConfigResponse {

    private Long id;
    private PageKey pageKey;
    private PageConfigStatus status;

    @Builder.Default
    private HeroType heroType = HeroType.SPLIT;

    private String title;
    private String subtitle;
    private String imageUrl;
    private String ctaText;
    private String ctaLink;

    @Builder.Default
    private Integer carouselIntervalSeconds = 5;

    @Builder.Default
    private List<CarouselSlideResponse> slides = new ArrayList<>();

    private String contentHtml;

    private String contactEmail;
    private String contactPhone;
    private String contactAddress;
    private String workingHours;

    private String metaTitle;
    private String metaDescription;

    @Builder.Default
    private List<Long> featuredProductIds = new ArrayList<>();

    @Builder.Default
    private List<ProductResponse> featuredProducts = new ArrayList<>();

    private boolean isPreview;
}
