package com.ecommerce.application.service.impl;

import com.ecommerce.application.dto.request.PageConfigRequest;
import com.ecommerce.application.dto.response.PageConfigResponse;
import com.ecommerce.application.dto.response.ProductResponse;
import com.ecommerce.application.entity.PageConfig;
import com.ecommerce.application.entity.Product;
import com.ecommerce.application.enums.PageConfigStatus;
import com.ecommerce.application.enums.PageKey;
import com.ecommerce.application.mapper.ProductMapper;
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

        draft.setTitle(request.getTitle());
        draft.setSubtitle(request.getSubtitle());
        draft.setImageUrl(request.getImageUrl());
        draft.setCtaText(request.getCtaText());
        draft.setCtaLink(request.getCtaLink());
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

        published.setTitle(draft.getTitle());
        published.setSubtitle(draft.getSubtitle());
        published.setImageUrl(draft.getImageUrl());
        published.setCtaText(draft.getCtaText());
        published.setCtaLink(draft.getCtaLink());
        published.setContentHtml(draft.getContentHtml());

        published.setContactEmail(draft.getContactEmail());
        published.setContactPhone(draft.getContactPhone());
        published.setContactAddress(draft.getContactAddress());
        published.setWorkingHours(draft.getWorkingHours());

        published.setMetaTitle(draft.getMetaTitle());
        published.setMetaDescription(draft.getMetaDescription());

        published.setFeaturedProductIds(new ArrayList<>(draft.getFeaturedProductIds()));

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
                .title(getDefaultTitle(pageKey))
                .subtitle(getDefaultSubtitle(pageKey))
                .featuredProductIds(new ArrayList<>())
                .featuredProducts(new ArrayList<>())
                .isPreview(isPreview)
                .build();
    }

    private PageConfig seedDraftFromPublishedOrBlank(PageKey pageKey) {
        Optional<PageConfig> pubOpt = repository.findByPageKeyAndStatus(pageKey, PageConfigStatus.PUBLISHED);
        if (pubOpt.isPresent()) {
            PageConfig pub = pubOpt.get();
            return repository.save(PageConfig.builder()
                    .pageKey(pageKey)
                    .status(PageConfigStatus.DRAFT)
                    .title(pub.getTitle())
                    .subtitle(pub.getSubtitle())
                    .imageUrl(pub.getImageUrl())
                    .ctaText(pub.getCtaText())
                    .ctaLink(pub.getCtaLink())
                    .contentHtml(pub.getContentHtml())
                    .contactEmail(pub.getContactEmail())
                    .contactPhone(pub.getContactPhone())
                    .contactAddress(pub.getContactAddress())
                    .workingHours(pub.getWorkingHours())
                    .metaTitle(pub.getMetaTitle())
                    .metaDescription(pub.getMetaDescription())
                    .featuredProductIds(new ArrayList<>(pub.getFeaturedProductIds()))
                    .build());
        }

        return repository.save(PageConfig.builder()
                .pageKey(pageKey)
                .status(PageConfigStatus.DRAFT)
                .title(getDefaultTitle(pageKey))
                .subtitle(getDefaultSubtitle(pageKey))
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

        return PageConfigResponse.builder()
                .id(config.getId())
                .pageKey(config.getPageKey())
                .status(config.getStatus())
                .title(config.getTitle())
                .subtitle(config.getSubtitle())
                .imageUrl(config.getImageUrl())
                .ctaText(config.getCtaText())
                .ctaLink(config.getCtaLink())
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
