package com.ecommerce.application.service.impl;

import com.ecommerce.application.dto.request.CarouselSlideRequest;
import com.ecommerce.application.dto.request.PageConfigRequest;
import com.ecommerce.application.dto.response.CarouselSlideResponse;
import com.ecommerce.application.dto.response.CategoryResponse;
import com.ecommerce.application.dto.response.PageConfigResponse;
import com.ecommerce.application.dto.response.ProductResponse;
import com.ecommerce.application.entity.Category;
import com.ecommerce.application.entity.HomepageCarouselSlide;
import com.ecommerce.application.entity.PageConfig;
import com.ecommerce.application.entity.Product;
import com.ecommerce.application.enums.CarouselLinkType;
import com.ecommerce.application.enums.HeroType;
import com.ecommerce.application.enums.PageConfigStatus;
import com.ecommerce.application.enums.PageKey;
import com.ecommerce.application.mapper.ProductMapper;
import com.ecommerce.application.repository.CategoryRepository;
import com.ecommerce.application.repository.PageConfigRepository;
import com.ecommerce.application.repository.ProductRepository;
import com.ecommerce.application.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PageConfigService {

    private final PageConfigRepository repository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductMapper productMapper;
    private final JwtUtil jwtUtil;

    @Transactional
    public PageConfigResponse getDraftForAdmin(PageKey pageKey) {
        PageConfig draft = repository.findByPageKeyAndStatus(pageKey, PageConfigStatus.DRAFT)
                .orElseGet(() -> seedDraftFromPublishedOrBlank(pageKey));
        return toResponse(draft, true);
    }

    @Transactional
    public PageConfigResponse updateDraft(PageKey pageKey, PageConfigRequest request) {
        PageConfig draft = repository.findByPageKeyAndStatus(pageKey, PageConfigStatus.DRAFT)
                .orElseGet(() -> seedDraftFromPublishedOrBlank(pageKey));

        if (request.getHeroType() != null) {
            draft.setHeroType(request.getHeroType());
        }
        draft.setTitle(request.getTitle());
        draft.setSubtitle(request.getSubtitle());
        draft.setImageUrl(request.getImageUrl());
        draft.setCtaText(request.getCtaText());
        draft.setCtaLink(request.getCtaLink());

        if (request.getCarouselIntervalSeconds() != null) {
            draft.setCarouselIntervalSeconds(request.getCarouselIntervalSeconds());
        }

        draft.setContentHtml(request.getContentHtml());

        draft.setContactEmail(request.getContactEmail());
        draft.setContactPhone(request.getContactPhone());
        draft.setContactAddress(request.getContactAddress());
        draft.setWorkingHours(request.getWorkingHours());

        draft.setMetaTitle(request.getMetaTitle());
        draft.setMetaDescription(request.getMetaDescription());

        if (request.getFeaturedProductIds() != null) {
            draft.setFeaturedProductIds(new ArrayList<>(request.getFeaturedProductIds()));
        }

        // Replace slide collection for HOMEPAGE key
        if (pageKey == PageKey.HOMEPAGE && request.getSlides() != null) {
            draft.getSlides().clear();
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
                        .pageConfig(draft)
                        .build();
                draft.getSlides().add(slide);
            }
        }

        PageConfig saved = repository.save(draft);
        return toResponse(saved, true);
    }

    @Transactional
    public PageConfigResponse publish(PageKey pageKey) {
        PageConfig draft = repository.findByPageKeyAndStatus(pageKey, PageConfigStatus.DRAFT)
                .orElseGet(() -> seedDraftFromPublishedOrBlank(pageKey));

        PageConfig published = repository.findByPageKeyAndStatus(pageKey, PageConfigStatus.PUBLISHED)
                .orElseGet(() -> PageConfig.builder()
                        .pageKey(pageKey)
                        .status(PageConfigStatus.PUBLISHED)
                        .build());

        published.setHeroType(draft.getHeroType());
        published.setTitle(draft.getTitle());
        published.setSubtitle(draft.getSubtitle());
        published.setImageUrl(draft.getImageUrl());
        published.setCtaText(draft.getCtaText());
        published.setCtaLink(draft.getCtaLink());
        published.setCarouselIntervalSeconds(draft.getCarouselIntervalSeconds());
        published.setContentHtml(draft.getContentHtml());

        published.setContactEmail(draft.getContactEmail());
        published.setContactPhone(draft.getContactPhone());
        published.setContactAddress(draft.getContactAddress());
        published.setWorkingHours(draft.getWorkingHours());

        published.setMetaTitle(draft.getMetaTitle());
        published.setMetaDescription(draft.getMetaDescription());

        published.setFeaturedProductIds(new ArrayList<>(draft.getFeaturedProductIds()));

        // Deep copy slides on publish
        if (pageKey == PageKey.HOMEPAGE) {
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
                        .pageConfig(published)
                        .build();
                published.getSlides().add(pubSlide);
            }
        }

        PageConfig savedPublished = repository.save(published);
        return toResponse(savedPublished, false);
    }

    @Transactional(readOnly = true)
    public PageConfigResponse getPublic(PageKey pageKey, String previewToken) {
        if (previewToken != null && jwtUtil.validatePreviewToken(previewToken)) {
            Optional<PageConfig> draftOpt = repository.findByPageKeyAndStatus(pageKey, PageConfigStatus.DRAFT);
            if (draftOpt.isPresent()) {
                return toResponse(draftOpt.get(), true);
            }
        }
        return getPublishedOrDefault(pageKey, false);
    }

    private PageConfigResponse getPublishedOrDefault(PageKey pageKey, boolean isPreview) {
        Optional<PageConfig> pubOpt = repository.findByPageKeyAndStatus(pageKey, PageConfigStatus.PUBLISHED);
        if (pubOpt.isPresent()) {
            return toResponse(pubOpt.get(), isPreview);
        }

        return PageConfigResponse.builder()
                .pageKey(pageKey)
                .status(PageConfigStatus.PUBLISHED)
                .heroType(HeroType.SPLIT)
                .title(getDefaultTitle(pageKey))
                .subtitle(getDefaultSubtitle(pageKey))
                .carouselIntervalSeconds(5)
                .slides(new ArrayList<>())
                .featuredProductIds(new ArrayList<>())
                .featuredProducts(new ArrayList<>())
                .isPreview(isPreview)
                .build();
    }

    private PageConfig seedDraftFromPublishedOrBlank(PageKey pageKey) {
        Optional<PageConfig> pubOpt = repository.findByPageKeyAndStatus(pageKey, PageConfigStatus.PUBLISHED);
        if (pubOpt.isPresent()) {
            PageConfig pub = pubOpt.get();
            PageConfig newDraft = PageConfig.builder()
                    .pageKey(pageKey)
                    .status(PageConfigStatus.DRAFT)
                    .heroType(pub.getHeroType() != null ? pub.getHeroType() : HeroType.SPLIT)
                    .title(pub.getTitle())
                    .subtitle(pub.getSubtitle())
                    .imageUrl(pub.getImageUrl())
                    .ctaText(pub.getCtaText())
                    .ctaLink(pub.getCtaLink())
                    .carouselIntervalSeconds(pub.getCarouselIntervalSeconds() != null ? pub.getCarouselIntervalSeconds() : 5)
                    .contentHtml(pub.getContentHtml())
                    .contactEmail(pub.getContactEmail())
                    .contactPhone(pub.getContactPhone())
                    .contactAddress(pub.getContactAddress())
                    .workingHours(pub.getWorkingHours())
                    .metaTitle(pub.getMetaTitle())
                    .metaDescription(pub.getMetaDescription())
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
                        .pageConfig(newDraft)
                        .build();
                newDraft.getSlides().add(draftSlide);
            }
            return repository.save(newDraft);
        }

        return repository.save(PageConfig.builder()
                .pageKey(pageKey)
                .status(PageConfigStatus.DRAFT)
                .heroType(HeroType.SPLIT)
                .title(getDefaultTitle(pageKey))
                .subtitle(getDefaultSubtitle(pageKey))
                .carouselIntervalSeconds(5)
                .featuredProductIds(new ArrayList<>())
                .build());
    }

    private PageConfigResponse toResponse(PageConfig config, boolean isPreview) {
        List<ProductResponse> productResponses = new ArrayList<>();
        if (config.getFeaturedProductIds() != null && !config.getFeaturedProductIds().isEmpty()) {
            List<Product> products = productRepository.findAllById(config.getFeaturedProductIds());
            Map<Long, Product> productMap = products.stream()
                    .collect(Collectors.toMap(Product::getId, Function.identity()));

            for (Long pid : config.getFeaturedProductIds()) {
                Product p = productMap.get(pid);
                if (p != null) {
                    productResponses.add(productMapper.toResponse(p));
                }
            }
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
                        .linkType(slide.getLinkType() != null ? slide.getLinkType() : CarouselLinkType.NONE)
                        .targetId(slide.getTargetId())
                        .customUrl(slide.getCustomUrl())
                        .displayOrder(slide.getDisplayOrder())
                        .resolvedProduct(resolvedProduct)
                        .resolvedCategory(resolvedCategory)
                        .build());
            }
        }

        return PageConfigResponse.builder()
                .id(config.getId())
                .pageKey(config.getPageKey())
                .status(config.getStatus())
                .heroType(config.getHeroType() != null ? config.getHeroType() : HeroType.SPLIT)
                .title(config.getTitle())
                .subtitle(config.getSubtitle())
                .imageUrl(config.getImageUrl())
                .ctaText(config.getCtaText())
                .ctaLink(config.getCtaLink())
                .carouselIntervalSeconds(config.getCarouselIntervalSeconds() != null ? config.getCarouselIntervalSeconds() : 5)
                .slides(slideResponses)
                .contentHtml(config.getContentHtml())
                .contactEmail(config.getContactEmail())
                .contactPhone(config.getContactPhone())
                .contactAddress(config.getContactAddress())
                .workingHours(config.getWorkingHours())
                .metaTitle(config.getMetaTitle())
                .metaDescription(config.getMetaDescription())
                .featuredProductIds(config.getFeaturedProductIds() != null ? config.getFeaturedProductIds() : new ArrayList<>())
                .featuredProducts(productResponses)
                .isPreview(isPreview)
                .build();
    }

    private String getDefaultTitle(PageKey pageKey) {
        return switch (pageKey) {
            case HOMEPAGE -> "Haus of Hafsah";
            case ABOUT -> "About Haus of Hafsah";
            case CONTACT -> "Contact Us";
            case PRIVACY -> "Privacy Policy";
            case TERMS -> "Terms & Conditions";
            case SHIPPING_RETURNS -> "Shipping & Returns Policy";
        };
    }

    private String getDefaultSubtitle(PageKey pageKey) {
        return switch (pageKey) {
            case HOMEPAGE -> "Luxury Clothing & Accessories";
            case ABOUT -> "Crafting a Legacy of Quiet Luxury";
            case CONTACT -> "We are here to assist with your boutique inquiries.";
            case PRIVACY -> "Last Updated: August 2026";
            case TERMS -> "Last Updated: August 2026";
            case SHIPPING_RETURNS -> "Delivery timelines, shipping fees, and hassle-free returns.";
        };
    }
}
