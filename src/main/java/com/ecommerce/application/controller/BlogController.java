package com.ecommerce.application.controller;

import com.ecommerce.application.dto.response.ApiResponse;
import com.ecommerce.application.dto.response.BlogPostDetailResponse;
import com.ecommerce.application.dto.response.BlogPostSummaryResponse;
import com.ecommerce.application.service.impl.BlogPostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/blog")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BlogController {

    private final BlogPostService blogPostService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<BlogPostSummaryResponse>>> getPublishedPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<BlogPostSummaryResponse> posts = blogPostService.getPublished(pageable);
        return ResponseEntity.ok(ApiResponse.success("Blog posts retrieved", posts));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<BlogPostDetailResponse>> getPostBySlug(
            @PathVariable String slug,
            @RequestParam(required = false) String previewToken) {

        BlogPostDetailResponse post = blogPostService.getBySlug(slug, previewToken);
        return ResponseEntity.ok(ApiResponse.success("Blog post retrieved", post));
    }
}