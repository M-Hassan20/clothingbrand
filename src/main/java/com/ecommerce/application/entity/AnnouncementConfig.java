package com.ecommerce.application.entity;

import com.ecommerce.application.enums.PageConfigStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "announcement_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class AnnouncementConfig extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PageConfigStatus status; // DRAFT or PUBLISHED

    @Builder.Default
    private boolean enabled = false;

    private String title;
    private String subtitle;
    private String imageUrl;
    private String ctaText;
    private String ctaLink;

    @Builder.Default
    private Integer dismissDays = 1;
}
