package com.ecommerce.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlogPostDetailResponse {
    private Long id;
    private String slug;
    private String title;
    private String excerpt;
    private String coverImageUrl;
    private String contentHtml;
    private String authorName;
    private String category;
    private LocalDateTime publishedAt;
    private Boolean isPreview; // true when viewed via preview token on an unpublished post
}