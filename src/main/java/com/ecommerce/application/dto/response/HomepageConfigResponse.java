package com.ecommerce.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomepageConfigResponse {
    private String heroTitle;
    private String heroSubtitle;
    private String heroImageUrl;
    private String ctaText;
    private String ctaLink;
    private List<ProductResponse> featuredProducts; // resolved full product data, not just IDs
    private Boolean isPreview;
    private LocalDateTime updatedAt;
}
