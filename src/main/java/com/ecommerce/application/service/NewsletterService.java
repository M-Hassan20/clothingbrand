package com.ecommerce.application.service;

import com.ecommerce.application.dto.request.SendNewsletterRequest;
import com.ecommerce.application.dto.response.NewsletterSubscriberResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface NewsletterService {

    NewsletterSubscriberResponse subscribe(String email);

    boolean unsubscribe(String token);

    Page<NewsletterSubscriberResponse> getSubscribers(Boolean active, String search, Pageable pageable);

    long getTotalActiveSubscribers();

    List<NewsletterSubscriberResponse> getAllActiveSubscribers();

    void sendNewsletterBroadcast(SendNewsletterRequest request);
}
