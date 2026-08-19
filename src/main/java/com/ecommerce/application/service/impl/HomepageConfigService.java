package com.ecommerce.application.service.impl;

import com.ecommerce.application.dto.request.HomepageConfigRequest;
import com.ecommerce.application.dto.response.HomepageConfigResponse;
import com.ecommerce.application.dto.response.ProductResponse;
import com.ecommerce.application.entity.HomepageConfig;
import com.ecommerce.application.enums.HomepageConfigStatus;
import com.ecommerce.application.mapper.ProductMapper;
import com.ecommerce.application.repository.HomepageConfigRepository;
import com.ecommerce.application.repository.ProductRepository;
import com.ecommerce.application.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HomepageConfigService {

    private final HomepageConfigRepository repository;
    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    private final JwtUtil jwtUtil;

    // Admin: always returns the draft, auto-creating one (seeded from published, or blank) if it doesn't exist yet
    @Transactional
    public HomepageConfigResponse getDraftForAdmin() {
        HomepageConfig draft = repository.findByStatus(HomepageConfigStatus.DRAFT)
                .orElseGet(this::seedDraftFromPublishedOrBlank);
        return toResponse(draft, true);
    }

    @Transactional
    public HomepageConfigResponse updateDraft(HomepageConfigRequest request) {
        HomepageConfig draft = repository.findByStatus(HomepageConfigStatus.DRAFT)
                .orElseGet(this::seedDraftFromPublishedOrBlank);

        draft.setHeroTitle(request.getHeroTitle());
        draft.setHeroSubtitle(request.getHeroSubtitle());
        draft.setHeroImageUrl(request.getHeroImageUrl());
        draft.setCtaText(request.getCtaText());
        draft.setCtaLink(request.getCtaLink());
        draft.setFeaturedProductIds(request.getFeaturedProductIds() != null
                ? request.getFeaturedProductIds() : new ArrayList<>());

        return toResponse(repository.save(draft), true);
    }

    @Transactional
    public HomepageConfigResponse publish() {
        HomepageConfig draft = repository.findByStatus(HomepageConfigStatus.DRAFT)
                .orElseThrow(() -> new RuntimeException("No draft to publish"));

        HomepageConfig published = repository.findByStatus(HomepageConfigStatus.PUBLISHED)
                .orElseGet(() -> HomepageConfig.builder().status(HomepageConfigStatus.PUBLISHED).build());

        published.setHeroTitle(draft.getHeroTitle());
        published.setHeroSubtitle(draft.getHeroSubtitle());
        published.setHeroImageUrl(draft.getHeroImageUrl());
        published.setCtaText(draft.getCtaText());
        published.setCtaLink(draft.getCtaLink());
        published.setFeaturedProductIds(new ArrayList<>(draft.getFeaturedProductIds()));

        return toResponse(repository.save(published), false);
    }

    // Public: returns published config, or the draft if a valid admin preview token is supplied
    public HomepageConfigResponse getPublic(String previewToken) {
        if (isValidAdminPreviewToken(previewToken)) {
            Optional<HomepageConfig> draftOpt = repository.findByStatus(HomepageConfigStatus.DRAFT);
            if (draftOpt.isPresent()) {
                return toResponse(draftOpt.get(), true);
            }
            return getPublishedOrDefault(false);
        }
        return getPublishedOrDefault(false);
    }

    private HomepageConfigResponse getPublishedOrDefault(boolean isPreview) {
        Optional<HomepageConfig> pubOpt = repository.findByStatus(HomepageConfigStatus.PUBLISHED);
        if (pubOpt.isPresent()) {
            return toResponse(pubOpt.get(), isPreview);
        }
        return HomepageConfigResponse.builder()
                .heroTitle("Simplicity\nDefined by\nElegance")
                .heroSubtitle("A curated capsule wardrobe constructed with soft beige palettes, luxurious cashmere knits, and editorial outerwear silhouettes designed for modern living.")
                .ctaText("Shop the Collection")
                .ctaLink("/shop")
                .featuredProducts(List.of())
                .isPreview(isPreview)
                .build(); // sensible fallback before the admin has ever published
    }

    private HomepageConfig seedDraftFromPublishedOrBlank() {
        Optional<HomepageConfig> pubOpt = repository.findByStatus(HomepageConfigStatus.PUBLISHED);
        if (pubOpt.isPresent()) {
            HomepageConfig pub = pubOpt.get();
            return repository.save(HomepageConfig.builder()
                    .status(HomepageConfigStatus.DRAFT)
                    .heroTitle(pub.getHeroTitle())
                    .heroSubtitle(pub.getHeroSubtitle())
                    .heroImageUrl(pub.getHeroImageUrl())
                    .ctaText(pub.getCtaText())
                    .ctaLink(pub.getCtaLink())
                    .featuredProductIds(new ArrayList<>(pub.getFeaturedProductIds()))
                    .build());
        }
        return repository.save(HomepageConfig.builder()
                .status(HomepageConfigStatus.DRAFT)
                .heroTitle("Simplicity\nDefined by\nElegance")
                .heroSubtitle("A curated capsule wardrobe constructed with soft beige palettes, luxurious cashmere knits, and editorial outerwear silhouettes designed for modern living.")
                .ctaText("Shop the Collection")
                .ctaLink("/shop")
                .build());
    }

    private boolean isValidAdminPreviewToken(String token) {
        if (token == null || token.isBlank()) return false;
        try {
            if (!jwtUtil.isTokenValid(token)) return false;
            String role = jwtUtil.extractRole(token);
            String scope = jwtUtil.extractScope(token);
            return "ADMIN".equals(role) || "PREVIEW".equals(scope);
        } catch (Exception e) {
            return false;
        }
    }

    private HomepageConfigResponse toResponse(HomepageConfig config, boolean isPreview) {
        List<ProductResponse> featured = new ArrayList<>();
        if (config.getFeaturedProductIds() != null) {
            featured = config.getFeaturedProductIds().stream()
                    .map(id -> {
                        var pOpt = productRepository.findById(id);
                        return pOpt.isPresent() ? productMapper.toResponse(pOpt.get()) : null;
                    })
                    .filter(Objects::nonNull) // silently skip if a featured product was since deleted
                    .toList();
        }

        return HomepageConfigResponse.builder()
                .heroTitle(config.getHeroTitle())
                .heroSubtitle(config.getHeroSubtitle())
                .heroImageUrl(config.getHeroImageUrl())
                .ctaText(config.getCtaText())
                .ctaLink(config.getCtaLink())
                .featuredProducts(featured)
                .isPreview(isPreview)
                .updatedAt(config.getUpdatedAt() != null ? config.getUpdatedAt() : config.getCreatedAt())
                .build();
    }
}
