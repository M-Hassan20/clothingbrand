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
            case PRIVACY -> "Last Updated: 11th September, 2026";
            case TERMS -> "Last Updated: 11th September, 2026";
            case SHIPPING_RETURNS -> "Delivery timelines, shipping fees, and hassle-free returns.";
        };
    }

    private String getDefaultImageUrl(PageKey pageKey) {
        return switch (pageKey) {
            case HOMEPAGE -> "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600";
            case ABOUT -> "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=1600";
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
            case PRIVACY -> "<p>This Privacy Policy explains how Haus of Hafsah (\"we,\" \"us,\" \"our,\" or the \"Company\") collects, uses, stores, shares, and protects your personal information when you visit our website, create an account, place an order (as a registered customer or as a guest), or otherwise interact with our services (collectively, the \"Service\").</p><p>By using the Service, you agree to the collection and use of information in accordance with this policy. If you do not agree with the terms of this policy, please do not use the Service.</p><h2>1. Information We Collect</h2><h3>1.1 Information You Provide Directly</h3><ul><li><strong>Account Information:</strong> full name, email address, phone number, and password (stored in encrypted/hashed form).</li><li><strong>Order & Checkout Information:</strong> recipient name, shipping address, billing address, phone number, payment method selected, and transaction details.</li><li><strong>Guest Checkout Information:</strong> if you place an order without creating an account, we collect the necessary contact, shipping, and payment information to fulfill your order.</li><li><strong>Customer Support & Communication:</strong> records of your inquiries, communications, or feedback when you contact us.</li></ul><h3>1.2 Information Collected Automatically</h3><ul><li><strong>Log Data:</strong> IP address, browser type, operating system, referring URLs, device type, pages viewed, and timestamps.</li><li><strong>Cookies & Tracking:</strong> standard session cookies and preferences cookies to maintain cart status, user login state, and site performance.</li></ul><h2>2. How We Use Your Information</h2><p>We use your personal data to:</p><ul><li>Process, fulfill, ship, and manage your orders and returns.</li><li>Create, maintain, and manage your customer account.</li><li>Communicate order updates, tracking information, and customer support responses.</li><li>Prevent, detect, and investigate fraudulent transactions or security incidents.</li><li>Comply with applicable legal obligations and enforce our Terms of Service.</li></ul><h2>3. Lawful Basis & Regulatory Compliance</h2><p>We process personal data in accordance with applicable laws in Pakistan, including electronic transactions, cybercrime prevention standards, and consumer protection guidelines. Processing is carried out based on contract performance (fulfilling your order), legal compliance, or our legitimate business interest in offering secure e-commerce services.</p><h2>4. Data Sharing & Third-Party Disclosures</h2><p>We do not sell, rent, or trade your personal data. We share information only with:</p><ul><li><strong>Logistics & Courier Partners:</strong> trusted delivery providers (e.g., PostEx Services Private Limited, or international couriers) solely to deliver your orders.</li><li><strong>Payment Gateways & Financial Institutions:</strong> payment processing partners (e.g., SafePay, bank portals) for transaction processing and verification.</li><li><strong>Service Providers:</strong> web hosting, database, IT infrastructure, and analytics providers operating under confidentiality duties.</li><li><strong>Legal & Regulatory Authorities:</strong> when required by law, court order, or governmental demand.</li></ul><h2>5. Cash on Delivery (COD) & Guest Checkout Data</h2><ul><li><strong>Guest Checkout:</strong> orders placed as a guest require valid contact and delivery details. These are stored securely in our database to manage shipping, returns, and accounting.</li><li><strong>COD Orders:</strong> phone numbers and addresses are verified before order dispatch to ensure successful delivery.</li></ul><h2>6. Data Security</h2><p>We implement technical and organizational measures to safeguard your personal information, including encrypted data transmission (HTTPS/TLS) and secure database access controls. While we take all reasonable precautions, no internet transmission or electronic storage system is 100% secure.</p><h2>7. Data Retention</h2><p>We retain personal data only for as long as necessary to fulfill the purposes for which it was collected, including legal, tax, accounting, and dispute resolution requirements.</p><h2>8. Your Rights</h2><p>Depending on applicable laws, you have the right to:</p><ul><li>Access and review the personal information we hold about you.</li><li>Request correction or updating of inaccurate data.</li><li>Request deletion of your account and personal data (subject to legal retention obligations).</li><li>Opt-out of non-essential communications.</li></ul><p>To exercise your rights, contact us at <a href=\"mailto:info@hausofhafsah.com\">info@hausofhafsah.com</a>.</p><h2>9. Cookies</h2><p>We use cookies to maintain basic functionality (e.g., keeping items in your shopping bag). You can manage or disable cookies in your browser settings; however, disabling cookies may impair core website functions.</p><h2>10. Third-Party Links</h2><p>Our website may contain links to external third-party sites or social media platforms. We are not responsible for the privacy practices or content of third-party websites.</p><h2>11. Children's Privacy</h2><p>Our Service is not directed to individuals under the age of 18. We do not knowingly collect personal data from children.</p><h2>12. Changes to This Privacy Policy</h2><p>We reserve the right to update this Privacy Policy at any time. Changes become effective immediately upon posting on the website. Your continued use of the website following any update signifies your acceptance.</p><h2>13. Contact Us</h2><p>For questions or concerns regarding our Privacy Policy, please contact us at <a href=\"mailto:info@hausofhafsah.com\">info@hausofhafsah.com</a>.</p>";
            case TERMS -> "<p>By accessing Haus of Hafsah or making a purchase, you confirm that you are at least 18 years of age (or visiting under the supervision of a parent/guardian) and legally capable of entering into binding contracts. We reserve the right to refuse service to anyone for any lawful reason at any time.</p><h2>1. General Conditions</h2><p>By accessing Haus of Hafsah or making a purchase, you confirm that you are at least 18 years of age (or visiting under the supervision of a parent/guardian) and legally capable of entering into binding contracts. We reserve the right to refuse service to anyone for any lawful reason at any time.</p><h2>2. Products, Pricing & Accuracy</h2><ul><li><strong>Product Descriptions:</strong> We make every effort to display product colors, fabrics, and descriptions as accurately as possible. However, actual display colors may vary slightly depending on monitor/screen settings.</li><li><strong>Pricing:</strong> All prices are listed in Pakistani Rupees (PKR) unless specified otherwise. Prices are subject to change without notice.</li><li><strong>Stock & Errors:</strong> We reserve the right to limit quantities, correct pricing or typographical errors, or cancel orders placed for products listed at incorrect prices.</li></ul><h2>3. Orders, Acceptance & Cancellations</h2><ul><li><strong>Order Confirmation:</strong> Receipt of an electronic order confirmation does not signify final acceptance of your order.</li><li><strong>Order Reservation:</strong> We reserve the right to accept, decline, or cancel any order for reasons including fraud checks, stock unavailability, or delivery constraints.</li><li><strong>Customer Cancellation:</strong> If you wish to cancel an order, you must contact customer support before dispatch. Once an order has been handed over to the courier, cancellation is not possible.</li></ul><h2>4. Shipping & Delivery</h2><ul><li><strong>Delivery Area:</strong> We currently ship within Pakistan. Delivery to international destinations will be made available as announced.</li><li><strong>Delivery Timelines:</strong> Standard shipping within Pakistan typically takes 2–5 business days. Delivery times are estimates and may be affected by public holidays, weather, or courier delays.</li><li><strong>Shipping Address:</strong> The buyer is responsible for providing accurate contact and delivery information. Re-routing charges due to invalid address details will be borne by the customer.</li></ul><h2>5. Payment Terms</h2><ul><li><strong>Accepted Payment Methods:</strong> Cash on Delivery (COD), Direct Bank Transfer, and approved digital payment gateways (e.g., SafePay when enabled).</li><li><strong>Cash on Delivery:</strong> Payment must be handed to the courier representative in full before opening the package.</li><li><strong>Failed / Unclaimed COD Orders:</strong> Repeated refusal or non-acceptance of COD packages without valid reason may result in permanent suspension of COD privileges for your address/account.</li></ul><h2>6. Promotions & Discount Codes</h2><p>Discount codes and promotional offers cannot be combined with other offers unless explicitly stated. Promotional codes are non-transferable and have no cash value.</p><h2>7. Returns, Exchanges & Refunds</h2><ul><li><strong>Return Window:</strong> Eligible items may be returned or exchanged within 7 days of delivery.</li><li><strong>Eligibility Criteria:</strong> Items must be unworn, unwashed, unaltered, undamaged, and returned with original tags and packaging.</li><li><strong>Non-Returnable Items:</strong> Customized/tailored items, clearance/sale items, and hygienic/innerwear items are final sale.</li><li><strong>Return Shipping:</strong> Customers are responsible for sending return items back to our warehouse unless the return is due to a wrong or defective item sent by us.</li><li><strong>Refunds:</strong> Approved refunds for pre-paid orders will be processed via original payment method or store credit within 7–14 business days. COD refunds will be issued via Bank Transfer or JazzCash/EasyPaisa upon inspection of returned items.</li></ul><h2>8. User Accounts & Security</h2><p>You are responsible for maintaining the confidentiality of your account login credentials. You agree to accept responsibility for all activities that occur under your account. Promptly notify us at <a href=\"mailto:info@hausofhafsah.com\">info@hausofhafsah.com</a> if you suspect unauthorized access.</p><h2>9. User Reviews, Comments & Submissions</h2><p>Any product reviews, comments, feedback, or suggestions submitted to Haus of Hafsah become our property. We reserve the right to edit, publish, or remove comments that are inappropriate, offensive, or misleading.</p><h2>10. Intellectual Property</h2><p>All content on this website—including brand name, logos, product designs, graphics, images, copy, and layout—is the exclusive intellectual property of Haus of Hafsah. Unauthorized copying, reproduction, distribution, or commercial use is strictly prohibited.</p><h2>11. Limitation of Liability</h2><p>To the fullest extent permitted by law, Haus of Hafsah, its directors, employees, or affiliates shall not be liable for any indirect, incidental, special, or consequential damages resulting from your use of the website or purchased products.</p><h2>12. Indemnification</h2><p>You agree to indemnify and hold harmless Haus of Hafsah from any claims, losses, liabilities, expenses, or demands (including legal fees) arising out of your breach of these Terms, misuse of the website, or violation of any law.</p><h2>13. Force Majeure</h2><p>We are not liable for any failure or delay in performing our obligations where such failure arises from events beyond our control, including natural disasters, civil unrest, strikes, internet failures, or courier disruptions.</p><h2>14. Governing Law & Jurisdiction</h2><p>These Terms of Service and Privacy Policy shall be governed by and construed in accordance with the laws of the Islamic Republic of Pakistan. Any legal disputes shall be subject to the exclusive jurisdiction of courts located in Karachi, Pakistan.</p><h2>15. Termination</h2><p>We reserve the right to suspend or terminate your account or access to the Service immediately, without prior notice, if you breach any term of these Terms of Service.</p><h2>16. Severability</h2><p>If any provision of these Terms is found to be invalid or unenforceable, that provision shall be enforced to the maximum extent permissible, and the remaining provisions shall remain in full force and effect.</p><h2>17. Contact Information</h2><p>For questions or concerns regarding our Terms of Service, please contact us:</p><p><strong>Haus of Hafsah</strong><br/>Email: <a href=\"mailto:info@hausofhafsah.com\">info@hausofhafsah.com</a><br/>Phone / WhatsApp: +92 314 8730683<br/>Address: Karachi, Pakistan</p>";
            case SHIPPING_RETURNS -> "<h2>Nationwide Shipping Policy</h2><p>We deliver nationwide across Pakistan using PostEx Services Private Limited. Standard delivery timelines range between 2 to 5 business days for major metro regions including Karachi, Lahore, and Islamabad.</p><p><strong>Note:</strong> We currently ship within Pakistan. Delivery to international destinations will be made available as announced.</p><h2>Returns, Exchanges & Refunds</h2><ul><li><strong>Return Window:</strong> Eligible items may be returned or exchanged within 7 days of delivery.</li><li><strong>Eligibility Criteria:</strong> Items must be unworn, unwashed, unaltered, undamaged, and returned with original tags and packaging.</li><li><strong>Non-Returnable Items:</strong> Customized/tailored items, clearance/sale items, and hygienic/innerwear items are final sale.</li><li><strong>Return Shipping:</strong> Customers are responsible for sending return items back to our warehouse unless the return is due to a wrong or defective item sent by us.</li><li><strong>Refunds:</strong> Approved refunds for pre-paid orders will be processed via original payment method or store credit within 7–14 business days. COD refunds will be issued via Bank Transfer or JazzCash/EasyPaisa upon inspection of returned items.</li></ul>";
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
        return pageKey == PageKey.CONTACT ? "Karachi, Pakistan" : "";
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
                    .imageUrl("https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200")
                    .title("Autumn Editorial Collection")
                    .subtitle("Curated luxury silhouettes crafted from wool and Mongolian cashmere.")
                    .ctaText("Explore Collection")
                    .linkType(CarouselLinkType.NONE)
                    .displayOrder(0)
                    .build());
            defaultSlides.add(CarouselSlideResponse.builder()
                    .imageUrl("https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?q=80&w=1200")
                    .title("Minimalist Outerwear Edit")
                    .subtitle("Double-breasted trench coats and double-faced virgin wool wrap coats.")
                    .ctaText("Shop Outerwear")
                    .linkType(CarouselLinkType.NONE)
                    .displayOrder(1)
                    .build());
            defaultSlides.add(CarouselSlideResponse.builder()
                    .imageUrl("https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=1200")
                    .title("Essential Cashmere & Knits")
                    .subtitle("Timeless basics designed for refined everyday capsule styling.")
                    .ctaText("Shop Knits")
                    .linkType(CarouselLinkType.NONE)
                    .displayOrder(2)
                    .build());
            return defaultSlides;
        }
        return new ArrayList<>();
    }
}

