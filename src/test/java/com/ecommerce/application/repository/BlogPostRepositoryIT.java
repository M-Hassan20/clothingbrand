package com.ecommerce.application.repository;

import com.ecommerce.application.AbstractIntegrationTest;
import com.ecommerce.application.TestDataFactory;
import com.ecommerce.application.entity.BlogPost;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
class BlogPostRepositoryIT extends AbstractIntegrationTest {

    @Autowired
    private BlogPostRepository blogPostRepository;

    private BlogPost post;

    @BeforeEach
    void setUp() {
        post = (BlogPost) TestDataFactory.aBlogPost().slug("my-awesome-post").build();
        post = blogPostRepository.save(post);
    }

    @Test
    void findBySlug_matchesExactly() {
        Optional<BlogPost> found = blogPostRepository.findBySlug("my-awesome-post");
        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(post.getId());
    }

    @Test
    void findBySlug_caseSensitivityBehavior() {
        // MySQL's default collation (utf8mb4_0900_ai_ci or similar) is case-insensitive.
        // Let's verify if querying with capital letters matches the post in MySQL.
        Optional<BlogPost> found = blogPostRepository.findBySlug("MY-AWESOME-POST");
        
        // This test serves to confirm case-insensitive resolution of MySQL.
        assertThat(found).isPresent();
    }
}
