package com.ecommerce.application.dto.response;

import com.ecommerce.application.enums.PageConfigStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnnouncementConfigResponse {

    private Long id;
    private PageConfigStatus status;
    private boolean enabled;
    private String title;
    private String subtitle;
    private String imageUrl;
    private String ctaText;
    private String ctaLink;
    private Integer dismissDays;
    private Boolean isPreview;
    private LocalDateTime updatedAt;
}
