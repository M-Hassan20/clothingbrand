package com.ecommerce.application.service.impl;

import com.ecommerce.application.dto.request.BlogPostRequest;
import com.ecommerce.application.dto.response.BlogPostAdminResponse;
import com.ecommerce.application.dto.response.BlogPostDetailResponse;
import com.ecommerce.application.dto.response.BlogPostSummaryResponse;
import com.ecommerce.application.entity.BlogPost;
import com.ecommerce.application.repository.BlogPostRepository;
import com.ecommerce.application.security.JwtUtil;
import com.ecommerce.application.util.HtmlSanitizerUtil;
import com.ecommerce.application.util.SlugUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BlogPostService {

    private final BlogPostRepository blogPostRepository;
    private final JwtUtil jwtUtil;

    // ---------- Admin operations ----------

    public Page<BlogPostAdminResponse> getAllForAdmin(Pageable pageable) {
        return blogPostRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::toAdminResponse);
    }

    public BlogPostAdminResponse getByIdForAdmin(Long id) {
        return toAdminResponse(getEntityById(id));
    }

    @Transactional
    public BlogPostAdminResponse createDraft(BlogPostRequest request) {
        String slug = generateUniqueSlug(request.getTitle());

        BlogPost post = BlogPost.builder()
                .slug(slug)
                .title(request.getTitle())
                .excerpt(request.getExcerpt())
                .coverImageUrl(request.getCoverImageUrl())
                .contentHtml(HtmlSanitizerUtil.sanitize(request.getContentHtml()))
                .authorName(request.getAuthorName())
                .category(request.getCategory())
                .isPublished(false)
                .build();

        return toAdminResponse(blogPostRepository.save(post));
    }

    @Transactional
    public BlogPostAdminResponse updatePost(Long id, BlogPostRequest request) {
        BlogPost post = getEntityById(id);

        // Re-slug only if the title actually changed, so existing published links don't break needlessly
        if (!post.getTitle().equals(request.getTitle())) {
            post.setSlug(generateUniqueSlug(request.getTitle()));
        }

        post.setTitle(request.getTitle());
        post.setExcerpt(request.getExcerpt());
        post.setCoverImageUrl(request.getCoverImageUrl());
        post.setContentHtml(HtmlSanitizerUtil.sanitize(request.getContentHtml()));
        post.setAuthorName(request.getAuthorName());
        post.setCategory(request.getCategory());

        return toAdminResponse(blogPostRepository.save(post));
    }

    @Transactional
    public BlogPostAdminResponse publish(Long id) {
        BlogPost post = getEntityById(id);
        post.setIsPublished(true);
        if (post.getPublishedAt() == null) {
            post.setPublishedAt(LocalDateTime.now());
        }
        return toAdminResponse(blogPostRepository.save(post));
    }

    @Transactional
    public BlogPostAdminResponse unpublish(Long id) {
        BlogPost post = getEntityById(id);
        post.setIsPublished(false);
        return toAdminResponse(blogPostRepository.save(post));
    }

    @Transactional
    public void deletePost(Long id) {
        blogPostRepository.deleteById(id);
    }

    // ---------- Public operations ----------

    public Page<BlogPostSummaryResponse> getPublished(Pageable pageable) {
        return blogPostRepository.findByIsPublishedTrueOrderByPublishedAtDesc(pageable)
                .map(this::toSummaryResponse);
    }

    /**
     * Public single-post fetch. If the post isn't published, it's only returned
     * when a valid ADMIN preview token is supplied — otherwise treat as not found.
     */
    public BlogPostDetailResponse getBySlug(String slug, String previewToken) {
        BlogPost post = blogPostRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Blog post not found"));

        if (!post.getIsPublished()) {
            if (!isValidAdminPreviewToken(previewToken)) {
                throw new RuntimeException("Blog post not found"); // don't leak existence of drafts
            }
            return toDetailResponse(post, true);
        }

        return toDetailResponse(post, false);
    }

    private boolean isValidAdminPreviewToken(String token) {
        if (token == null || token.isBlank()) return false;
        try {
            return jwtUtil.isTokenValid(token) && "ADMIN".equals(jwtUtil.extractRole(token));
        } catch (Exception e) {
            return false;
        }
    }

    // ---------- Helpers ----------

    private BlogPost getEntityById(Long id) {
        return blogPostRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Blog post not found with id: " + id));
    }

    private String generateUniqueSlug(String title) {
        String base = SlugUtil.toSlug(title);
        String candidate = base;
        int suffix = 2;
        while (blogPostRepository.existsBySlug(candidate)) {
            candidate = base + "-" + suffix++;
        }
        return candidate;
    }

    private BlogPostAdminResponse toAdminResponse(BlogPost post) {
        return BlogPostAdminResponse.builder()
                .id(post.getId())
                .slug(post.getSlug())
                .title(post.getTitle())
                .excerpt(post.getExcerpt())
                .coverImageUrl(post.getCoverImageUrl())
                .contentHtml(post.getContentHtml())
                .authorName(post.getAuthorName())
                .category(post.getCategory())
                .isPublished(post.getIsPublished())
                .publishedAt(post.getPublishedAt())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }

    private BlogPostSummaryResponse toSummaryResponse(BlogPost post) {
        return BlogPostSummaryResponse.builder()
                .id(post.getId())
                .slug(post.getSlug())
                .title(post.getTitle())
                .excerpt(post.getExcerpt())
                .coverImageUrl(post.getCoverImageUrl())
                .authorName(post.getAuthorName())
                .category(post.getCategory())
                .publishedAt(post.getPublishedAt())
                .build();
    }

    private BlogPostDetailResponse toDetailResponse(BlogPost post, boolean isPreview) {
        return BlogPostDetailResponse.builder()
                .id(post.getId())
                .slug(post.getSlug())
                .title(post.getTitle())
                .excerpt(post.getExcerpt())
                .coverImageUrl(post.getCoverImageUrl())
                .contentHtml(post.getContentHtml())
                .authorName(post.getAuthorName())
                .category(post.getCategory())
                .publishedAt(post.getPublishedAt())
                .isPreview(isPreview)
                .build();
    }
}