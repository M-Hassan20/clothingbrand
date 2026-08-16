
package com.ecommerce.application.repository;

import com.ecommerce.application.entity.BlogPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BlogPostRepository extends JpaRepository<BlogPost, Long> {
    Optional<BlogPost> findBySlug(String slug);
    boolean existsBySlug(String slug);
    Page<BlogPost> findByIsPublishedTrueOrderByPublishedAtDesc(Pageable pageable);
    Page<BlogPost> findAllByOrderByCreatedAtDesc(Pageable pageable);
}