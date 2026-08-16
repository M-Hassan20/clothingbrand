package com.ecommerce.application.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Entity
@Table(name = "blog_posts", indexes = {
    @Index(name = "idx_blog_posts_is_published", columnList = "is_published")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class BlogPost extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private String title;

    @Column(length = 500)
    private String excerpt;

    private String coverImageUrl;

    @Column(columnDefinition = "LONGTEXT")
    private String contentHtml;

    private String authorName;

    private String category; // simple free-text tag, e.g. "Styling Tips"

    @Builder.Default
    private Boolean isPublished = false;

    private LocalDateTime publishedAt;
}