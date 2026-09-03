package com.ecommerce.application.dto.request;

import com.ecommerce.application.enums.CarouselLinkType;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CarouselSlideRequest {

    private Long id;

    @NotBlank(message = "Slide image URL is required")
    private String imageUrl;

    private String title;
    private String subtitle;
    private String ctaText;

    private CarouselLinkType linkType;
    private Long targetId;
    private String customUrl;

    private Integer displayOrder;
}
