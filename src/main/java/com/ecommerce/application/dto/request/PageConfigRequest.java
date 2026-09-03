package com.ecommerce.application.dto.request;

import com.ecommerce.application.enums.PageKey;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageConfigRequest {

    @NotNull(message = "Page key is required")
    private PageKey pageKey;

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
}
