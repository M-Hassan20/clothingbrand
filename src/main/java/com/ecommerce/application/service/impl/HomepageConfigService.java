package com.ecommerce.application.service.impl;

import com.ecommerce.application.dto.request.CarouselSlideRequest;
import com.ecommerce.application.dto.request.HomepageConfigRequest;
import com.ecommerce.application.dto.response.CarouselSlideResponse;
import com.ecommerce.application.dto.response.CategoryResponse;
import com.ecommerce.application.dto.response.HomepageConfigResponse;
import com.ecommerce.application.dto.response.ProductResponse;
import com.ecommerce.application.entity.Category;
import com.ecommerce.application.entity.HomepageCarouselSlide;
import com.ecommerce.application.entity.HomepageConfig;
import com.ecommerce.application.entity.Product;
import com.ecommerce.application.enums.CarouselLinkType;
import com.ecommerce.application.enums.HeroType;
import com.ecommerce.application.enums.HomepageConfigStatus;
import com.ecommerce.application.mapper.ProductMapper;
import com.ecommerce.application.repository.CategoryRepository;
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
    private final CategoryRepository categoryRepository;
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

        draft.setHeroType(request.getHeroType() != null ? request.getHeroType() : HeroType.SPLIT);
        draft.setHeroTitle(request.getHeroTitle());
        draft.setHeroSubtitle(request.getHeroSubtitle());
        draft.setHeroImageUrl(request.getHeroImageUrl());
        draft.setCtaText(request.getCtaText());
        draft.setCtaLink(request.getCtaLink());
        draft.setCarouselIntervalSeconds(request.getCarouselIntervalSeconds() != null ? request.getCarouselIntervalSeconds() : 5);

        draft.setFeaturedProductIds(request.getFeaturedProductIds() != null
                ? request.getFeaturedProductIds() : new ArrayList<>());

        // Replace slide collection on draft (orphanRemoval handles old entities)
        draft.getSlides().clear();
        if (request.getSlides() != null) {
            int order = 0;
            for (CarouselSlideRequest slideReq : request.getSlides()) {
                HomepageCarouselSlide slide = HomepageCarouselSlide.builder()
                        .imageUrl(slideReq.getImageUrl())
                        .title(slideReq.getTitle())
                        .subtitle(slideReq.getSubtitle())
                        .ctaText(slideReq.getCtaText())
                        .linkType(slideReq.getLinkType() != null ? slideReq.getLinkType() : CarouselLinkType.NONE)
                        .targetId(slideReq.getTargetId())
                        .customUrl(slideReq.getCustomUrl())
                        .displayOrder(slideReq.getDisplayOrder() != null ? slideReq.getDisplayOrder() : order++)
                        .homepageConfig(draft)
                        .build();
                draft.getSlides().add(slide);
            }
        }

        return toResponse(repository.save(draft), true);
    }

    @Transactional
    public HomepageConfigResponse publish() {
        HomepageConfig draft = repository.findByStatus(HomepageConfigStatus.DRAFT)
                .orElseThrow(() -> new RuntimeException("No draft to publish"));

        HomepageConfig published = repository.findByStatus(HomepageConfigStatus.PUBLISHED)
                .orElseGet(() -> HomepageConfig.builder().status(HomepageConfigStatus.PUBLISHED).build());

        published.setHeroType(draft.getHeroType());
        published.setHeroTitle(draft.getHeroTitle());
        published.setHeroSubtitle(draft.getHeroSubtitle());
        published.setHeroImageUrl(draft.getHeroImageUrl());
        published.setCtaText(draft.getCtaText());
        published.setCtaLink(draft.getCtaLink());
        published.setCarouselIntervalSeconds(draft.getCarouselIntervalSeconds());
        published.setFeaturedProductIds(new ArrayList<>(draft.getFeaturedProductIds()));

        // Value-based deep-copy of slides onto published entity
        published.getSlides().clear();
        int order = 0;
        for (HomepageCarouselSlide draftSlide : draft.getSlides()) {
            HomepageCarouselSlide pubSlide = HomepageCarouselSlide.builder()
                    .imageUrl(draftSlide.getImageUrl())
                    .title(draftSlide.getTitle())
                    .subtitle(draftSlide.getSubtitle())
                    .ctaText(draftSlide.getCtaText())
                    .linkType(draftSlide.getLinkType())
                    .targetId(draftSlide.getTargetId())
                    .customUrl(draftSlide.getCustomUrl())
                    .displayOrder(draftSlide.getDisplayOrder() != null ? draftSlide.getDisplayOrder() : order++)
                    .homepageConfig(published)
                    .build();
            published.getSlides().add(pubSlide);
        }

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
                .heroType(HeroType.SPLIT)
                .heroTitle("Simplicity\nDefined by\nElegance")
                .heroSubtitle("A curated capsule wardrobe constructed with soft beige palettes, luxurious cashmere knits, and editorial outerwear silhouettes designed for modern living.")
                .ctaText("Shop the Collection")
                .ctaLink("/shop")
                .carouselIntervalSeconds(5)
                .slides(new ArrayList<>())
                .featuredProducts(List.of())
                .isPreview(isPreview)
                .build();
    }

    private HomepageConfig seedDraftFromPublishedOrBlank() {
        Optional<HomepageConfig> pubOpt = repository.findByStatus(HomepageConfigStatus.PUBLISHED);
        if (pubOpt.isPresent()) {
            HomepageConfig pub = pubOpt.get();
            HomepageConfig newDraft = HomepageConfig.builder()
                    .status(HomepageConfigStatus.DRAFT)
                    .heroType(pub.getHeroType() != null ? pub.getHeroType() : HeroType.SPLIT)
                    .heroTitle(pub.getHeroTitle())
                    .heroSubtitle(pub.getHeroSubtitle())
                    .heroImageUrl(pub.getHeroImageUrl())
                    .ctaText(pub.getCtaText())
                    .ctaLink(pub.getCtaLink())
                    .carouselIntervalSeconds(pub.getCarouselIntervalSeconds() != null ? pub.getCarouselIntervalSeconds() : 5)
                    .featuredProductIds(new ArrayList<>(pub.getFeaturedProductIds()))
                    .build();

            for (HomepageCarouselSlide pubSlide : pub.getSlides()) {
                HomepageCarouselSlide draftSlide = HomepageCarouselSlide.builder()
                        .imageUrl(pubSlide.getImageUrl())
                        .title(pubSlide.getTitle())
                        .subtitle(pubSlide.getSubtitle())
                        .ctaText(pubSlide.getCtaText())
                        .linkType(pubSlide.getLinkType())
                        .targetId(pubSlide.getTargetId())
                        .customUrl(pubSlide.getCustomUrl())
                        .displayOrder(pubSlide.getDisplayOrder())
                        .homepageConfig(newDraft)
                        .build();
                newDraft.getSlides().add(draftSlide);
            }
            return repository.save(newDraft);
        }

        return repository.save(HomepageConfig.builder()
                .status(HomepageConfigStatus.DRAFT)
                .heroType(HeroType.SPLIT)
                .heroTitle("Simplicity\nDefined by\nElegance")
                .heroSubtitle("A curated capsule wardrobe constructed with soft beige palettes, luxurious cashmere knits, and editorial outerwear silhouettes designed for modern living.")
                .ctaText("Shop the Collection")
                .ctaLink("/shop")
                .carouselIntervalSeconds(5)
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
                        Optional<Product> pOpt = productRepository.findById(id);
                        return pOpt.isPresent() ? productMapper.toResponse(pOpt.get()) : null;
                    })
                    .filter(Objects::nonNull)
                    .toList();
        }

        List<CarouselSlideResponse> slideResponses = new ArrayList<>();
        if (config.getSlides() != null) {
            for (HomepageCarouselSlide slide : config.getSlides()) {
                ProductResponse resolvedProduct = null;
                CategoryResponse resolvedCategory = null;

                if (slide.getLinkType() == CarouselLinkType.PRODUCT && slide.getTargetId() != null) {
                    Optional<Product> pOpt = productRepository.findById(slide.getTargetId());
                    if (pOpt.isPresent()) {
                        resolvedProduct = productMapper.toResponse(pOpt.get());
                    }
                } else if (slide.getLinkType() == CarouselLinkType.CATEGORY && slide.getTargetId() != null) {
                    Optional<Category> cOpt = categoryRepository.findById(slide.getTargetId());
                    if (cOpt.isPresent()) {
                        Category c = cOpt.get();
                        resolvedCategory = new CategoryResponse(c.getId(), c.getName());
                    }
                }

                slideResponses.add(CarouselSlideResponse.builder()
                        .id(slide.getId())
                        .imageUrl(slide.getImageUrl())
                        .title(slide.getTitle())
                        .subtitle(slide.getSubtitle())
                        .ctaText(slide.getCtaText())
                        .linkType(slide.getLinkType())
                        .targetId(slide.getTargetId())
                        .customUrl(slide.getCustomUrl())
                        .displayOrder(slide.getDisplayOrder())
                        .resolvedProduct(resolvedProduct)
                        .resolvedCategory(resolvedCategory)
                        .build());
            }
        }

        return HomepageConfigResponse.builder()
                .heroType(config.getHeroType() != null ? config.getHeroType() : HeroType.SPLIT)
                .heroTitle(config.getHeroTitle())
                .heroSubtitle(config.getHeroSubtitle())
                .heroImageUrl(config.getHeroImageUrl())
                .ctaText(config.getCtaText())
                .ctaLink(config.getCtaLink())
                .carouselIntervalSeconds(config.getCarouselIntervalSeconds() != null ? config.getCarouselIntervalSeconds() : 5)
                .slides(slideResponses)
                .featuredProducts(featured)
                .isPreview(isPreview)
                .updatedAt(config.getUpdatedAt() != null ? config.getUpdatedAt() : config.getCreatedAt())
                .build();
    }
}
