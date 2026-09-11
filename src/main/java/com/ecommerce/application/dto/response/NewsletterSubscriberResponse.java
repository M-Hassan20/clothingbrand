package com.ecommerce.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewsletterSubscriberResponse {

    private Long id;
    private String email;
    private Boolean active;
    private String unsubscribeToken;
    private LocalDateTime subscribedAt;
    private LocalDateTime unsubscribedAt;
}
