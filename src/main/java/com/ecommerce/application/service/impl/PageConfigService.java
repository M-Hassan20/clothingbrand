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

    @Transactional(readOnly = true)
    public PageConfigResponse getPublishedForAdmin(PageKey pageKey) {
        PageConfig published = repository.findFirstByPageKeyAndStatusOrderByIdDesc(pageKey, PageConfigStatus.PUBLISHED)
                .orElseGet(() -> PageConfig.builder()
                        .pageKey(pageKey)
                        .status(PageConfigStatus.PUBLISHED)
                        .heroType(HeroType.SPLIT)
                        .title(getDefaultTitle(pageKey))
                        .subtitle(getDefaultSubtitle(pageKey))
                        .imageUrl(getDefaultImageUrl(pageKey))
                        .ctaText(getDefaultCtaText(pageKey))
                        .ctaLink(getDefaultCtaLink(pageKey))
                        .contentHtml(getDefaultContentHtml(pageKey))
                        .contactEmail(getDefaultContactEmail(pageKey))
                        .contactPhone(getDefaultContactPhone(pageKey))
                        .contactAddress(getDefaultContactAddress(pageKey))
                        .workingHours(getDefaultWorkingHours(pageKey))
                        .metaTitle(getDefaultMetaTitle(pageKey))
                        .metaDescription(getDefaultMetaDescription(pageKey))
                        .carouselIntervalSeconds(5)
                        .featuredProductIds(getDefaultFeaturedProductIds(pageKey))
                        .build());
        return toResponse(published, false);
    }

    @Transactional
    public PageConfigResponse getDraftForAdmin(PageKey pageKey) {
        PageConfig draft = repository.findFirstByPageKeyAndStatusOrderByIdDesc(pageKey, PageConfigStatus.DRAFT)
                .orElseGet(() -> seedDraftFromPublishedOrBlank(pageKey));
        return toResponse(draft, true);
    }

    @Transactional
    public PageConfigResponse updateDraft(PageKey pageKey, PageConfigRequest request) {
        PageConfig draft = repository.findFirstByPageKeyAndStatusOrderByIdDesc(pageKey, PageConfigStatus.DRAFT)
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
        PageConfig draft = repository.findFirstByPageKeyAndStatusOrderByIdDesc(pageKey, PageConfigStatus.DRAFT)
                .orElseGet(() -> seedDraftFromPublishedOrBlank(pageKey));

        PageConfig published = repository.findFirstByPageKeyAndStatusOrderByIdDesc(pageKey, PageConfigStatus.PUBLISHED)
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
            Optional<PageConfig> draftOpt = repository.findFirstByPageKeyAndStatusOrderByIdDesc(pageKey, PageConfigStatus.DRAFT);
            if (draftOpt.isPresent()) {
                return toResponse(draftOpt.get(), true);
            }
        }
        return getPublishedOrDefault(pageKey, false);
    }

    private PageConfigResponse getPublishedOrDefault(PageKey pageKey, boolean isPreview) {
        Optional<PageConfig> pubOpt = repository.findFirstByPageKeyAndStatusOrderByIdDesc(pageKey, PageConfigStatus.PUBLISHED);
        if (pubOpt.isPresent()) {
            return toResponse(pubOpt.get(), isPreview);
        }

        return PageConfigResponse.builder()
                .pageKey(pageKey)
                .status(PageConfigStatus.PUBLISHED)
                .heroType(HeroType.SPLIT)
                .title(getDefaultTitle(pageKey))
                .subtitle(getDefaultSubtitle(pageKey))
                .imageUrl(getDefaultImageUrl(pageKey))
                .ctaText(getDefaultCtaText(pageKey))
                .ctaLink(getDefaultCtaLink(pageKey))
                .carouselIntervalSeconds(5)
                .slides(getDefaultSlides(pageKey))
                .contentHtml(getDefaultContentHtml(pageKey))
                .contactEmail(getDefaultContactEmail(pageKey))
                .contactPhone(getDefaultContactPhone(pageKey))
                .contactAddress(getDefaultContactAddress(pageKey))
                .workingHours(getDefaultWorkingHours(pageKey))
                .metaTitle(getDefaultMetaTitle(pageKey))
                .metaDescription(getDefaultMetaDescription(pageKey))
                .featuredProductIds(getDefaultFeaturedProductIds(pageKey))
                .featuredProducts(getDefaultFeaturedProducts(pageKey))
                .isPreview(isPreview)
                .build();
    }

    private PageConfig seedDraftFromPublishedOrBlank(PageKey pageKey) {
        Optional<PageConfig> pubOpt = repository.findFirstByPageKeyAndStatusOrderByIdDesc(pageKey, PageConfigStatus.PUBLISHED);
        if (pubOpt.isPresent()) {
            PageConfig pub = pubOpt.get();
            PageConfig newDraft = PageConfig.builder()
                    .pageKey(pageKey)
                    .status(PageConfigStatus.DRAFT)
                    .heroType(pub.getHeroType() != null ? pub.getHeroType() : HeroType.SPLIT)
                    .title(pub.getTitle() != null && !pub.getTitle().isBlank() ? pub.getTitle() : getDefaultTitle(pageKey))
                    .subtitle(pub.getSubtitle() != null && !pub.getSubtitle().isBlank() ? pub.getSubtitle() : getDefaultSubtitle(pageKey))
                    .imageUrl(pub.getImageUrl() != null && !pub.getImageUrl().isBlank() ? pub.getImageUrl() : getDefaultImageUrl(pageKey))
                    .ctaText(pub.getCtaText() != null && !pub.getCtaText().isBlank() ? pub.getCtaText() : getDefaultCtaText(pageKey))
                    .ctaLink(pub.getCtaLink() != null && !pub.getCtaLink().isBlank() ? pub.getCtaLink() : getDefaultCtaLink(pageKey))
                    .carouselIntervalSeconds(pub.getCarouselIntervalSeconds() != null ? pub.getCarouselIntervalSeconds() : 5)
                    .contentHtml(pub.getContentHtml() != null && !pub.getContentHtml().isBlank() ? pub.getContentHtml() : getDefaultContentHtml(pageKey))
                    .contactEmail(pub.getContactEmail() != null && !pub.getContactEmail().isBlank() ? pub.getContactEmail() : getDefaultContactEmail(pageKey))
                    .contactPhone(pub.getContactPhone() != null && !pub.getContactPhone().isBlank() ? pub.getContactPhone() : getDefaultContactPhone(pageKey))
                    .contactAddress(pub.getContactAddress() != null && !pub.getContactAddress().isBlank() ? pub.getContactAddress() : getDefaultContactAddress(pageKey))
                    .workingHours(pub.getWorkingHours() != null && !pub.getWorkingHours().isBlank() ? pub.getWorkingHours() : getDefaultWorkingHours(pageKey))
                    .metaTitle(pub.getMetaTitle() != null && !pub.getMetaTitle().isBlank() ? pub.getMetaTitle() : getDefaultMetaTitle(pageKey))
                    .metaDescription(pub.getMetaDescription() != null && !pub.getMetaDescription().isBlank() ? pub.getMetaDescription() : getDefaultMetaDescription(pageKey))
                    .featuredProductIds(pub.getFeaturedProductIds() != null && !pub.getFeaturedProductIds().isEmpty() ? new ArrayList<>(pub.getFeaturedProductIds()) : getDefaultFeaturedProductIds(pageKey))
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

        PageConfig initialPub = repository.save(PageConfig.builder()
                .pageKey(pageKey)
                .status(PageConfigStatus.PUBLISHED)
                .heroType(HeroType.SPLIT)
                .title(getDefaultTitle(pageKey))
                .subtitle(getDefaultSubtitle(pageKey))
                .imageUrl(getDefaultImageUrl(pageKey))
                .ctaText(getDefaultCtaText(pageKey))
                .ctaLink(getDefaultCtaLink(pageKey))
                .contentHtml(getDefaultContentHtml(pageKey))
                .contactEmail(getDefaultContactEmail(pageKey))
                .contactPhone(getDefaultContactPhone(pageKey))
                .contactAddress(getDefaultContactAddress(pageKey))
                .workingHours(getDefaultWorkingHours(pageKey))
                .metaTitle(getDefaultMetaTitle(pageKey))
                .metaDescription(getDefaultMetaDescription(pageKey))
                .carouselIntervalSeconds(5)
                .featuredProductIds(getDefaultFeaturedProductIds(pageKey))
                .build());

        return repository.save(PageConfig.builder()
                .pageKey(pageKey)
                .status(PageConfigStatus.DRAFT)
                .heroType(initialPub.getHeroType())
                .title(initialPub.getTitle())
                .subtitle(initialPub.getSubtitle())
                .imageUrl(initialPub.getImageUrl())
                .ctaText(initialPub.getCtaText())
                .ctaLink(initialPub.getCtaLink())
                .contentHtml(initialPub.getContentHtml())
                .contactEmail(initialPub.getContactEmail())
                .contactPhone(initialPub.getContactPhone())
                .contactAddress(initialPub.getContactAddress())
                .workingHours(initialPub.getWorkingHours())
                .metaTitle(initialPub.getMetaTitle())
                .metaDescription(initialPub.getMetaDescription())
                .carouselIntervalSeconds(5)
                .featuredProductIds(new ArrayList<>(initialPub.getFeaturedProductIds()))
                .build());
    }

    private PageConfigResponse toResponse(PageConfig config, boolean isPreview) {
        PageKey pageKey = config.getPageKey();

        String title = config.getTitle() != null && !config.getTitle().isBlank() ? config.getTitle() : getDefaultTitle(pageKey);
        String subtitle = config.getSubtitle() != null && !config.getSubtitle().isBlank() ? config.getSubtitle() : getDefaultSubtitle(pageKey);
        String imageUrl = config.getImageUrl() != null && !config.getImageUrl().isBlank() ? config.getImageUrl() : getDefaultImageUrl(pageKey);
        String ctaText = config.getCtaText() != null && !config.getCtaText().isBlank() ? config.getCtaText() : getDefaultCtaText(pageKey);
        String ctaLink = config.getCtaLink() != null && !config.getCtaLink().isBlank() ? config.getCtaLink() : getDefaultCtaLink(pageKey);
        String contentHtml = config.getContentHtml() != null && !config.getContentHtml().isBlank() ? config.getContentHtml() : getDefaultContentHtml(pageKey);
        String contactEmail = config.getContactEmail() != null && !config.getContactEmail().isBlank() ? config.getContactEmail() : getDefaultContactEmail(pageKey);
        String contactPhone = config.getContactPhone() != null && !config.getContactPhone().isBlank() ? config.getContactPhone() : getDefaultContactPhone(pageKey);
        String contactAddress = config.getContactAddress() != null && !config.getContactAddress().isBlank() ? config.getContactAddress() : getDefaultContactAddress(pageKey);
        String workingHours = config.getWorkingHours() != null && !config.getWorkingHours().isBlank() ? config.getWorkingHours() : getDefaultWorkingHours(pageKey);
        String metaTitle = config.getMetaTitle() != null && !config.getMetaTitle().isBlank() ? config.getMetaTitle() : getDefaultMetaTitle(pageKey);
        String metaDescription = config.getMetaDescription() != null && !config.getMetaDescription().isBlank() ? config.getMetaDescription() : getDefaultMetaDescription(pageKey);
        List<Long> featuredProductIds = config.getFeaturedProductIds() != null && !config.getFeaturedProductIds().isEmpty() ? config.getFeaturedProductIds() : getDefaultFeaturedProductIds(pageKey);

        List<ProductResponse> productResponses = new ArrayList<>();
        if (!featuredProductIds.isEmpty()) {
            List<Product> products = productRepository.findAllById(featuredProductIds);
            Map<Long, Product> productMap = products.stream()
                    .collect(Collectors.toMap(Product::getId, Function.identity()));

            for (Long pid : featuredProductIds) {
                Product p = productMap.get(pid);
                if (p != null) {
                    productResponses.add(productMapper.toResponse(p));
                }
            }
        }

        List<CarouselSlideResponse> slideResponses = new ArrayList<>();
        if (config.getSlides() != null && !config.getSlides().isEmpty()) {
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

        if (slideResponses.isEmpty()) {
            slideResponses = getDefaultSlides(pageKey);
        }

        return PageConfigResponse.builder()
                .id(config.getId())
                .pageKey(config.getPageKey())
                .status(config.getStatus())
                .heroType(config.getHeroType() != null ? config.getHeroType() : HeroType.SPLIT)
                .title(title)
                .subtitle(subtitle)
                .imageUrl(imageUrl)
                .ctaText(ctaText)
                .ctaLink(ctaLink)
                .carouselIntervalSeconds(config.getCarouselIntervalSeconds() != null ? config.getCarouselIntervalSeconds() : 5)
                .slides(slideResponses)
                .contentHtml(contentHtml)
                .contactEmail(contactEmail)
                .contactPhone(contactPhone)
                .contactAddress(contactAddress)
                .workingHours(workingHours)
                .metaTitle(metaTitle)
                .metaDescription(metaDescription)
                .featuredProductIds(featuredProductIds)
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

    private String getDefaultImageUrl(PageKey pageKey) {
        return switch (pageKey) {
            case HOMEPAGE -> "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1600";
            case ABOUT -> "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1600";
            default -> "";
        };
    }

    private String getDefaultCtaText(PageKey pageKey) {
        return switch (pageKey) {
            case HOMEPAGE -> "Shop Collection";
            case ABOUT -> "Explore Collection";
            default -> "";
        };
    }

    private String getDefaultCtaLink(PageKey pageKey) {
        return switch (pageKey) {
            case HOMEPAGE -> "/shop";
            case ABOUT -> "/shop";
            default -> "";
        };
    }

    private String getDefaultContentHtml(PageKey pageKey) {
        return switch (pageKey) {
            case ABOUT -> "<h2>The Aesthetic Language</h2><p>At Haus of Hafsah, we bypass transient trends to focus on core fabrication. Our design language is rooted in minimal, elegant touches. We favor a warm, tactile ivory and beige palette that feels inviting and soft, rather than stark and clinical.</p><p>Each piece is custom-tailored with generous proportions, finished with subtle hairline seams, and structured using clean, premium fabrics like virgin wool, natural linen, and soft cashmere knits.</p><h2>Conscious Craftsmanship</h2><p>We believe that a boutique brand should prioritize sustainability and thoughtful production. We work closely with boutique mills that respect ecological limits and utilize ethical labour.</p><p>By designing modular capsule collections, we help our clients construct long-term wardrobe systems. Every garment is engineered for modular styling, allowing you to combine outerwear, essentials, and knitwear into effortless seasonal edits.</p>";
            case CONTACT -> "<p>Our dedicated boutique concierge team is available to assist you with bespoke sizing consultations, order updates, gift styling advice, and store availability.</p><p>For urgent inquiries or custom orders, please contact our flagship desk directly or submit the inquiry form below.</p>";
            case PRIVACY -> "<p>At <strong>Haus of Hafsah</strong>, we appreciate the trust you place in us. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy details how we collect, use, disclose, and safeguard your data when you visit our website, place an order, or engage with our services.</p><p>This policy complies with standard electronic transaction laws and personal data protection regulations applicable to digital e-commerce operations in Pakistan.</p><h2>1. Information We Collect</h2><p>To fulfill your orders, deliver premium products, and provide a seamless shopping experience, we collect your full name, email address, shipping address, phone number, and payment preferences.</p><h2>2. Contact Us</h2><p>For questions regarding our privacy policy, please reach out to us at: <a href=\"mailto:info@hausofhafsah.com\">info@hausofhafsah.com</a>.</p>";
            case TERMS -> "<p>Welcome to <strong>Haus of Hafsah</strong>. By accessing our store, placing an order, or utilizing our services, you agree to be bound by the following Terms & Conditions. Please read them carefully.</p><h2>1. Order Placement & Availability</h2><p>All orders placed through our storefront are subject to acceptance and item availability. We reserve the right to decline or cancel an order in the event of pricing errors or inventory stock constraints.</p><h2>2. Contact & Customer Support</h2><p>For questions regarding terms of service, please email us at <a href=\"mailto:info@hausofhafsah.com\">info@hausofhafsah.com</a>.</p>";
            case SHIPPING_RETURNS -> "<h2>Nationwide Shipping Policy</h2><p>We deliver nationwide across Pakistan using verified logistics partners including TCS, Leopards Courier, and M&P. Standard delivery timelines range between 2 to 4 business days for major metro regions including Karachi, Lahore, and Islamabad.</p><h2>Returns & Exchanges</h2><p>We offer a hassle-free 7-day replacement policy for unwashed and unused items with original tags and packaging intact. Contact our concierge desk to initiate an exchange or return authorization.</p>";
            default -> "";
        };
    }

    private String getDefaultContactEmail(PageKey pageKey) {
        return pageKey == PageKey.CONTACT ? "info@hausofhafsah.com" : "";
    }

    private String getDefaultContactPhone(PageKey pageKey) {
        return pageKey == PageKey.CONTACT ? "+92 314 8730683" : "";
    }

    private String getDefaultContactAddress(PageKey pageKey) {
        return pageKey == PageKey.CONTACT ? "Block 4, Clifton, Karachi, Pakistan" : "";
    }

    private String getDefaultWorkingHours(PageKey pageKey) {
        return pageKey == PageKey.CONTACT ? "Monday to Friday, 9:00 AM – 6:00 PM (PKT)" : "";
    }

    private String getDefaultMetaTitle(PageKey pageKey) {
        return switch (pageKey) {
            case HOMEPAGE -> "Haus of Hafsah | Official Luxury Store";
            case ABOUT -> "About Us | Haus of Hafsah";
            case CONTACT -> "Contact Us | Haus of Hafsah";
            case PRIVACY -> "Privacy Policy | Haus of Hafsah";
            case TERMS -> "Terms & Conditions | Haus of Hafsah";
            case SHIPPING_RETURNS -> "Shipping & Returns Policy | Haus of Hafsah";
        };
    }

    private String getDefaultMetaDescription(PageKey pageKey) {
        return switch (pageKey) {
            case HOMEPAGE -> "Discover Haus of Hafsah's curated collection of luxury clothing, outerwear, essentials, and knitwear.";
            case ABOUT -> "Learn about Haus of Hafsah's heritage, aesthetic language, and commitment to conscious craftsmanship.";
            case CONTACT -> "Reach out to Haus of Hafsah concierge desk for order inquiries, bespoke sizing guidance, or boutique support.";
            case PRIVACY -> "Read Haus of Hafsah's Privacy Policy outlining how we protect your personal data and information.";
            case TERMS -> "Read Haus of Hafsah's Terms & Conditions governing orders, store usage, and customer services.";
            case SHIPPING_RETURNS -> "Learn about Haus of Hafsah's nationwide delivery timelines, shipping fees, and 7-day replacement policy.";
        };
    }

    private List<Long> getDefaultFeaturedProductIds(PageKey pageKey) {
        if (pageKey == PageKey.HOMEPAGE) {
            return List.of(101L, 102L, 103L, 104L, 105L, 106L);
        }
        return new ArrayList<>();
    }

    private List<ProductResponse> getDefaultFeaturedProducts(PageKey pageKey) {
        List<ProductResponse> list = new ArrayList<>();
        if (pageKey == PageKey.HOMEPAGE) {
            List<Long> ids = getDefaultFeaturedProductIds(pageKey);
            List<Product> products = productRepository.findAllById(ids);
            for (Product p : products) {
                list.add(productMapper.toResponse(p));
            }
        }
        return list;
    }

    private List<CarouselSlideResponse> getDefaultSlides(PageKey pageKey) {
        if (pageKey == PageKey.HOMEPAGE) {
            List<CarouselSlideResponse> defaultSlides = new ArrayList<>();
            defaultSlides.add(CarouselSlideResponse.builder()
                    .imageUrl("https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200")
                    .title("Autumn Editorial Collection")
                    .subtitle("Curated luxury silhouettes crafted from wool and Mongolian cashmere.")
                    .ctaText("Explore Collection")
                    .linkType(CarouselLinkType.NONE)
                    .displayOrder(0)
                    .build());
            defaultSlides.add(CarouselSlideResponse.builder()
                    .imageUrl("https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1200")
                    .title("Minimalist Outerwear Edit")
                    .subtitle("Double-breasted trench coats and double-faced virgin wool wrap coats.")
                    .ctaText("Shop Outerwear")
                    .linkType(CarouselLinkType.NONE)
                    .displayOrder(1)
                    .build());
            return defaultSlides;
        }
        return new ArrayList<>();
    }
}

