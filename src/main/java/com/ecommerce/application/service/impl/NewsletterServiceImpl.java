package com.ecommerce.application.service.impl;

import com.ecommerce.application.dto.request.SendNewsletterRequest;
import com.ecommerce.application.dto.response.NewsletterSubscriberResponse;
import com.ecommerce.application.entity.NewsletterSubscriber;
import com.ecommerce.application.repository.NewsletterSubscriberRepository;
import com.ecommerce.application.service.NewsletterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NewsletterServiceImpl implements NewsletterService {

    private final NewsletterSubscriberRepository subscriberRepository;
    private final EmailService emailService;

    @Override
    @Transactional
    public NewsletterSubscriberResponse subscribe(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        Optional<NewsletterSubscriber> existingOpt = subscriberRepository.findByEmail(normalizedEmail);

        NewsletterSubscriber subscriber;
        if (existingOpt.isPresent()) {
            subscriber = existingOpt.get();
            if (!subscriber.getActive()) {
                subscriber.setActive(true);
                subscriber.setSubscribedAt(LocalDateTime.now());
                subscriber.setUnsubscribedAt(null);
                subscriber = subscriberRepository.save(subscriber);
                log.info("Re-activated newsletter subscription for email: {}", normalizedEmail);
                emailService.sendNewsletterWelcomeEmail(subscriber.getEmail(), subscriber.getUnsubscribeToken());
            } else {
                log.info("Email already subscribed to newsletter: {}", normalizedEmail);
            }
        } else {
            String token = UUID.randomUUID().toString();
            subscriber = NewsletterSubscriber.builder()
                    .email(normalizedEmail)
                    .active(true)
                    .unsubscribeToken(token)
                    .subscribedAt(LocalDateTime.now())
                    .build();
            subscriber = subscriberRepository.save(subscriber);
            log.info("Created new newsletter subscription for email: {}", normalizedEmail);
            emailService.sendNewsletterWelcomeEmail(subscriber.getEmail(), subscriber.getUnsubscribeToken());
        }

        return mapToResponse(subscriber);
    }

    @Override
    @Transactional
    public boolean unsubscribe(String token) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }
        Optional<NewsletterSubscriber> subscriberOpt = subscriberRepository.findByUnsubscribeToken(token.trim());
        if (subscriberOpt.isPresent()) {
            NewsletterSubscriber subscriber = subscriberOpt.get();
            if (subscriber.getActive()) {
                subscriber.setActive(false);
                subscriber.setUnsubscribedAt(LocalDateTime.now());
                subscriberRepository.save(subscriber);
                log.info("Unsubscribed email: {} via token", subscriber.getEmail());
            }
            return true;
        }
        return false;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NewsletterSubscriberResponse> getSubscribers(Boolean active, String search, Pageable pageable) {
        Page<NewsletterSubscriber> page;
        if (search != null && !search.trim().isEmpty()) {
            page = subscriberRepository.findByEmailContainingIgnoreCase(search.trim(), pageable);
        } else if (active != null) {
            page = subscriberRepository.findByActive(active, pageable);
        } else {
            page = subscriberRepository.findAll(pageable);
        }
        return page.map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public long getTotalActiveSubscribers() {
        return subscriberRepository.countByActiveTrue();
    }

    @Override
    @Transactional(readOnly = true)
    public List<NewsletterSubscriberResponse> getAllActiveSubscribers() {
        return subscriberRepository.findByActiveTrue().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Async
    public void sendNewsletterBroadcast(SendNewsletterRequest request) {
        List<NewsletterSubscriber> subscribers = subscriberRepository.findByActiveTrue();
        log.info("Starting newsletter broadcast for {} active subscribers. Subject: '{}'", subscribers.size(), request.getSubject());

        int count = 0;
        for (NewsletterSubscriber sub : subscribers) {
            try {
                emailService.sendNewsletterBroadcastEmail(
                        sub.getEmail(),
                        request.getSubject(),
                        request.getContentHtml(),
                        sub.getUnsubscribeToken()
                );
                count++;

                // Throttling to respect Hostinger SMTP rate limits (short delay every batch)
                if (count % 20 == 0) {
                    Thread.sleep(2000);
                }
            } catch (Exception e) {
                log.error("Failed to send broadcast email to subscriber {}: {}", sub.getEmail(), e.getMessage());
            }
        }
        log.info("Finished newsletter broadcast. Successfully sent to {}/{} subscribers.", count, subscribers.size());
    }

    private NewsletterSubscriberResponse mapToResponse(NewsletterSubscriber subscriber) {
        return NewsletterSubscriberResponse.builder()
                .id(subscriber.getId())
                .email(subscriber.getEmail())
                .active(subscriber.getActive())
                .unsubscribeToken(subscriber.getUnsubscribeToken())
                .subscribedAt(subscriber.getSubscribedAt())
                .unsubscribedAt(subscriber.getUnsubscribedAt())
                .build();
    }
}
