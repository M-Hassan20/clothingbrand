package com.ecommerce.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HomepageConfigRequest {
    @NotBlank(message = "Hero title is required")
    private String heroTitle;
    private String heroSubtitle;
    private String heroImageUrl;
    private String ctaText;
    private String ctaLink;
    private List<Long> featuredProductIds; // ordered, in the sequence they'll display
}
