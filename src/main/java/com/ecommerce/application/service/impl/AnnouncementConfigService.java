package com.ecommerce.application.service.impl;

import com.ecommerce.application.dto.request.AnnouncementConfigRequest;
import com.ecommerce.application.dto.response.AnnouncementConfigResponse;
import com.ecommerce.application.entity.AnnouncementConfig;
import com.ecommerce.application.enums.PageConfigStatus;
import com.ecommerce.application.repository.AnnouncementConfigRepository;
import com.ecommerce.application.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnnouncementConfigService {

    private final AnnouncementConfigRepository repository;
    private final JwtUtil jwtUtil;

    @Transactional(readOnly = true)
    public AnnouncementConfigResponse getPublishedForAdmin() {
        AnnouncementConfig published = repository.findFirstByStatusOrderByIdDesc(PageConfigStatus.PUBLISHED)
                .orElseGet(() -> AnnouncementConfig.builder()
                        .status(PageConfigStatus.PUBLISHED)
                        .enabled(true)
                        .title("Summer Sale is Live")
                        .subtitle("Enjoy up to 40% off our curated luxury collection silhouettes.")
                        .ctaText("Shop Sale Now")
                        .ctaLink("/shop?collection=sale")
                        .dismissDays(1)
                        .build());
        return toResponse(published, false);
    }

    @Transactional
    public AnnouncementConfigResponse getDraftForAdmin() {
        AnnouncementConfig draft = repository.findFirstByStatusOrderByIdDesc(PageConfigStatus.DRAFT)
                .orElseGet(this::seedDraftFromPublishedOrBlank);
        return toResponse(draft, true);
    }

    @Transactional
    public AnnouncementConfigResponse updateDraft(AnnouncementConfigRequest request) {
        AnnouncementConfig draft = repository.findFirstByStatusOrderByIdDesc(PageConfigStatus.DRAFT)
                .orElseGet(this::seedDraftFromPublishedOrBlank);

        draft.setEnabled(request.isEnabled());
        draft.setTitle(request.getTitle());
        draft.setSubtitle(request.getSubtitle());
        draft.setImageUrl(request.getImageUrl());
        draft.setCtaText(request.getCtaText());
        draft.setCtaLink(request.getCtaLink());
        draft.setDismissDays(request.getDismissDays() != null ? request.getDismissDays() : 1);

        return toResponse(repository.save(draft), true);
    }

    @Transactional
    public AnnouncementConfigResponse publish() {
        AnnouncementConfig draft = repository.findFirstByStatusOrderByIdDesc(PageConfigStatus.DRAFT)
                .orElseThrow(() -> new RuntimeException("No draft to publish"));

        AnnouncementConfig published = repository.findFirstByStatusOrderByIdDesc(PageConfigStatus.PUBLISHED)
                .orElseGet(() -> AnnouncementConfig.builder().status(PageConfigStatus.PUBLISHED).build());

        published.setEnabled(draft.isEnabled());
        published.setTitle(draft.getTitle());
        published.setSubtitle(draft.getSubtitle());
        published.setImageUrl(draft.getImageUrl());
        published.setCtaText(draft.getCtaText());
        published.setCtaLink(draft.getCtaLink());
        published.setDismissDays(draft.getDismissDays());

        return toResponse(repository.save(published), false);
    }

    public AnnouncementConfigResponse getPublic(String previewToken) {
        if (previewToken != null && !previewToken.isBlank() && jwtUtil.validatePreviewToken(previewToken)) {
            Optional<AnnouncementConfig> draftOpt = repository.findFirstByStatusOrderByIdDesc(PageConfigStatus.DRAFT);
            if (draftOpt.isPresent()) {
                return toResponse(draftOpt.get(), true);
            }
        }
        Optional<AnnouncementConfig> pubOpt = repository.findFirstByStatusOrderByIdDesc(PageConfigStatus.PUBLISHED);
        if (pubOpt.isPresent()) {
            return toResponse(pubOpt.get(), false);
        }
        return AnnouncementConfigResponse.builder()
                .enabled(true)
                .status(PageConfigStatus.PUBLISHED)
                .title("Summer Sale is Live")
                .subtitle("Enjoy up to 40% off our curated luxury collection silhouettes.")
                .ctaText("Shop Sale Now")
                .ctaLink("/shop?collection=sale")
                .dismissDays(1)
                .isPreview(false)
                .build();
    }

    private AnnouncementConfig seedDraftFromPublishedOrBlank() {
        Optional<AnnouncementConfig> pubOpt = repository.findFirstByStatusOrderByIdDesc(PageConfigStatus.PUBLISHED);
        if (pubOpt.isPresent()) {
            AnnouncementConfig pub = pubOpt.get();
            return repository.save(AnnouncementConfig.builder()
                    .status(PageConfigStatus.DRAFT)
                    .enabled(pub.isEnabled())
                    .title(pub.getTitle())
                    .subtitle(pub.getSubtitle())
                    .imageUrl(pub.getImageUrl())
                    .ctaText(pub.getCtaText())
                    .ctaLink(pub.getCtaLink())
                    .dismissDays(pub.getDismissDays())
                    .build());
        }
        return repository.save(AnnouncementConfig.builder()
                .status(PageConfigStatus.DRAFT)
                .enabled(false)
                .title("Summer Sale is Live")
                .subtitle("Enjoy up to 40% off our curated luxury collection silhouettes.")
                .ctaText("Shop Sale Now")
                .ctaLink("/shop?collection=sale")
                .dismissDays(1)
                .build());
    }

    private AnnouncementConfigResponse toResponse(AnnouncementConfig config, boolean isPreview) {
        return AnnouncementConfigResponse.builder()
                .id(config.getId())
                .status(config.getStatus())
                .enabled(config.isEnabled())
                .title(config.getTitle())
                .subtitle(config.getSubtitle())
                .imageUrl(config.getImageUrl())
                .ctaText(config.getCtaText())
                .ctaLink(config.getCtaLink())
                .dismissDays(config.getDismissDays() != null ? config.getDismissDays() : 1)
                .isPreview(isPreview)
                .updatedAt(config.getUpdatedAt() != null ? config.getUpdatedAt() : config.getCreatedAt())
                .build();
    }
}
