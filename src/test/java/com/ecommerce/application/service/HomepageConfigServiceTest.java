package com.ecommerce.application.service;

import com.ecommerce.application.dto.response.HomepageConfigResponse;
import com.ecommerce.application.entity.HomepageConfig;
import com.ecommerce.application.enums.HomepageConfigStatus;
import com.ecommerce.application.repository.HomepageConfigRepository;
import com.ecommerce.application.repository.ProductRepository;
import com.ecommerce.application.security.JwtUtil;
import com.ecommerce.application.service.impl.HomepageConfigService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HomepageConfigServiceTest {

    @Mock private HomepageConfigRepository repository;
    @Mock private ProductRepository productRepository;
    @Mock private JwtUtil jwtUtil;

    @InjectMocks
    private HomepageConfigService homepageConfigService;

    @Test
    void publish_copiesDraftToPublishedWithoutLosingDraft() {
        HomepageConfig draft = HomepageConfig.builder()
                .status(HomepageConfigStatus.DRAFT)
                .heroTitle("Draft Title")
                .heroSubtitle("Draft Subtitle")
                .heroImageUrl("draft.jpg")
                .ctaText("Draft CTA")
                .ctaLink("/draft")
                .featuredProductIds(List.of(1L, 2L))
                .build();

        HomepageConfig existingPublished = HomepageConfig.builder()
                .status(HomepageConfigStatus.PUBLISHED)
                .heroTitle("Old Title")
                .build();

        when(repository.findByStatus(HomepageConfigStatus.DRAFT)).thenReturn(Optional.of(draft));
        when(repository.findByStatus(HomepageConfigStatus.PUBLISHED)).thenReturn(Optional.of(existingPublished));
        when(repository.save(any(HomepageConfig.class))).thenAnswer(invocation -> invocation.getArgument(0));

        HomepageConfigResponse response = homepageConfigService.publish();

        assertThat(response.getHeroTitle()).isEqualTo("Draft Title");
        assertThat(response.getHeroSubtitle()).isEqualTo("Draft Subtitle");
        assertThat(response.getHeroImageUrl()).isEqualTo("draft.jpg");
        assertThat(response.getCtaText()).isEqualTo("Draft CTA");
        assertThat(response.getCtaLink()).isEqualTo("/draft");

        verify(repository).save(existingPublished); // verifies the published instance is updated and saved
    }

    @Test
    void getPublic_noPublishedConfig_returnsDefaultFallback() {
        when(repository.findByStatus(HomepageConfigStatus.PUBLISHED)).thenReturn(Optional.empty());

        HomepageConfigResponse response = homepageConfigService.getPublic(null);

        assertThat(response.getHeroTitle()).contains("Simplicity", "Defined by", "Elegance");
        assertThat(response.getHeroSubtitle()).contains("curated capsule wardrobe");
        assertThat(response.getCtaText()).isEqualTo("Shop the Collection");
        assertThat(response.getCtaLink()).isEqualTo("/shop");
        assertThat(response.getFeaturedProducts()).isEmpty();
    }
}
