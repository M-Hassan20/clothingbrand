package com.ecommerce.application.repository;

import com.ecommerce.application.entity.NewsletterSubscriber;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NewsletterSubscriberRepository extends JpaRepository<NewsletterSubscriber, Long> {

    Optional<NewsletterSubscriber> findByEmail(String email);

    Optional<NewsletterSubscriber> findByUnsubscribeToken(String unsubscribeToken);

    Page<NewsletterSubscriber> findByActive(Boolean active, Pageable pageable);

    Page<NewsletterSubscriber> findByEmailContainingIgnoreCase(String query, Pageable pageable);

    List<NewsletterSubscriber> findByActiveTrue();

    long countByActiveTrue();
}
