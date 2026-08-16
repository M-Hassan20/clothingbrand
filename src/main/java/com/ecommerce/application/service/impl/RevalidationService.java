package com.ecommerce.application.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RevalidationService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${storefront.revalidate.url}")
    private String revalidateUrl;

    @Value("${storefront.revalidate.secret}")
    private String secret;

    /**
     * Revalidate storefront cache on-demand asynchronously
     */
    @Async
    public void revalidate(String... tags) {
        try {
            if (revalidateUrl == null || revalidateUrl.trim().isEmpty()) {
                return;
            }

            Map<String, Object> body = Map.of(
                "secret", secret,
                "tags", Arrays.asList(tags)
            );
            
            restTemplate.postForEntity(revalidateUrl, body, String.class);
            System.out.println("Storefront cache revalidated for tags: " + Arrays.toString(tags));
        } catch (Exception e) {
            // Log and swallow - must never block main thread actions
            System.err.println("Storefront revalidation failed: " + e.getMessage());
        }
    }
}
