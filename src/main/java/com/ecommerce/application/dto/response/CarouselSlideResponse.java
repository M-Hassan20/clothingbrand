package com.ecommerce.application.dto.response;

import com.ecommerce.application.enums.CarouselLinkType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CarouselSlideResponse {

    private Long id;
    private String imageUrl;
    private String title;
    private String subtitle;
    private String ctaText;

    private CarouselLinkType linkType;
    private Long targetId;
    private String customUrl;
    private Integer displayOrder;

    private ProductResponse resolvedProduct;
    private CategoryResponse resolvedCategory;
}
