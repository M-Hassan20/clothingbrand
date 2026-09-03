package com.ecommerce.application.dto.response;

import com.ecommerce.application.enums.PageConfigStatus;
import com.ecommerce.application.enums.PageKey;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageConfigResponse {

    private Long id;
    private PageKey pageKey;
    private PageConfigStatus status;

    private String title;
    private String subtitle;
    private String imageUrl;
    private String ctaText;
    private String ctaLink;
    private String contentHtml;

    private String contactEmail;
    private String contactPhone;
    private String contactAddress;
    private String workingHours;

    private String metaTitle;
    private String metaDescription;

    private List<Long> featuredProductIds;
    private List<ProductResponse> featuredProducts;

    private boolean isPreview;
}
