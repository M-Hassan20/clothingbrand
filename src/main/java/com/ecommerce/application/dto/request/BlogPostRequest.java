package com.ecommerce.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlogPostRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200)
    private String title;

    @Size(max = 500, message = "Excerpt should be brief — under 500 characters")
    private String excerpt;

    private String coverImageUrl;

    @NotBlank(message = "Content cannot be empty")
    private String contentHtml;

    private String authorName;

    private String category;
}