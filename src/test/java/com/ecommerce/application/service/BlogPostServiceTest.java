package com.ecommerce.application.service;

import com.ecommerce.application.dto.request.BlogPostRequest;
import com.ecommerce.application.dto.response.BlogPostAdminResponse;
import com.ecommerce.application.dto.response.BlogPostDetailResponse;
import com.ecommerce.application.entity.BlogPost;
import com.ecommerce.application.repository.BlogPostRepository;
import com.ecommerce.application.security.JwtUtil;
import com.ecommerce.application.service.impl.BlogPostService;
import com.ecommerce.application.service.impl.RevalidationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BlogPostServiceTest {

    @Mock private BlogPostRepository blogPostRepository;
    @Mock private JwtUtil jwtUtil;
    @Mock private RevalidationService revalidationService;

    @InjectMocks
    private BlogPostService blogPostService;

    @Test
    void createDraft_withSlugCollision_appendsCorrectSuffix() {
        BlogPostRequest request = new BlogPostRequest("Test Post", "Excerpt", "Cover", "Content", "Author", "Category");

        // mock repository to simulate "test-post" and "test-post-2" already exist, but "test-post-3" is free
        when(blogPostRepository.existsBySlug("test-post")).thenReturn(true);
        when(blogPostRepository.existsBySlug("test-post-2")).thenReturn(true);
        when(blogPostRepository.existsBySlug("test-post-3")).thenReturn(false);
        when(blogPostRepository.save(any(BlogPost.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BlogPostAdminResponse response = blogPostService.createDraft(request);

        assertThat(response.getSlug()).isEqualTo("test-post-3");
        verify(blogPostRepository).save(any(BlogPost.class));
    }

    @Test
    void publish_setsPublishedAtOnlyIfNotAlreadySet() {
        LocalDateTime originalPublishedAt = LocalDateTime.now().minusDays(5);
        BlogPost post = BlogPost.builder()
                .id(1L)
                .isPublished(false)
                .publishedAt(originalPublishedAt)
                .slug("test-post")
                .build();

        when(blogPostRepository.findById(1L)).thenReturn(Optional.of(post));
        when(blogPostRepository.save(post)).thenReturn(post);

        BlogPostAdminResponse response = blogPostService.publish(1L);

        assertThat(response.getIsPublished()).isTrue();
        assertThat(response.getPublishedAt()).isEqualTo(originalPublishedAt); // remains unchanged
        verify(revalidationService).revalidate("blog-posts", "blog-test-post");
    }

    @Test
    void publish_setsPublishedAtIfNull() {
        BlogPost post = BlogPost.builder()
                .id(1L)
                .isPublished(false)
                .publishedAt(null)
                .slug("test-post")
                .build();

        when(blogPostRepository.findById(1L)).thenReturn(Optional.of(post));
        when(blogPostRepository.save(post)).thenReturn(post);

        BlogPostAdminResponse response = blogPostService.publish(1L);

        assertThat(response.getIsPublished()).isTrue();
        assertThat(response.getPublishedAt()).isNotNull();
        verify(revalidationService).revalidate("blog-posts", "blog-test-post");
    }

    @Test
    void getBySlug_unpublishedWithInvalidPreviewToken_throwsNotFound() {
        BlogPost post = BlogPost.builder()
                .slug("draft-post")
                .isPublished(false)
                .build();

        when(blogPostRepository.findBySlug("draft-post")).thenReturn(Optional.of(post));
        when(jwtUtil.isTokenValid("invalid-token")).thenReturn(false);

        assertThatThrownBy(() -> blogPostService.getBySlug("draft-post", "invalid-token"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Blog post not found");
    }

    @Test
    void getBySlug_unpublishedWithValidAdminPreviewToken_returnsDraft() {
        BlogPost post = BlogPost.builder()
                .slug("draft-post")
                .isPublished(false)
                .build();

        when(blogPostRepository.findBySlug("draft-post")).thenReturn(Optional.of(post));
        when(jwtUtil.isTokenValid("valid-admin-token")).thenReturn(true);
        when(jwtUtil.extractRole("valid-admin-token")).thenReturn("ADMIN");

        BlogPostDetailResponse response = blogPostService.getBySlug("draft-post", "valid-admin-token");

        assertThat(response.getSlug()).isEqualTo("draft-post");
        assertThat(response.getIsPreview()).isTrue();
    }
}
