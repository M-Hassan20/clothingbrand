package com.ecommerce.application.dto.request;

import com.ecommerce.application.enums.HeroType;
import com.ecommerce.application.enums.PageKey;
import jakarta.validation.constraints.NotNull;
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
public class PageConfigRequest {

    @NotNull(message = "Page key is required")
    private PageKey pageKey;

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
    private List<CarouselSlideRequest> slides = new ArrayList<>();

    private String contentHtml;

    private String contactEmail;
    private String contactPhone;
    private String contactAddress;
    private String workingHours;

    private String metaTitle;
    private String metaDescription;

    @Builder.Default
    private List<Long> featuredProductIds = new ArrayList<>();
}
