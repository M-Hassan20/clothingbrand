package com.ecommerce.application.controller;

import com.ecommerce.application.dto.request.NewsletterSubscribeRequest;
import com.ecommerce.application.dto.response.ApiResponse;
import com.ecommerce.application.dto.response.NewsletterSubscriberResponse;
import com.ecommerce.application.service.NewsletterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/newsletter")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NewsletterController {

    private final NewsletterService newsletterService;

    @PostMapping("/subscribe")
    public ResponseEntity<ApiResponse<NewsletterSubscriberResponse>> subscribe(
            @Valid @RequestBody NewsletterSubscribeRequest request) {
        NewsletterSubscriberResponse response = newsletterService.subscribe(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Thank you for subscribing to Haus of Hafsah!", response));
    }

    @GetMapping("/unsubscribe")
    public ResponseEntity<ApiResponse<Boolean>> unsubscribe(@RequestParam("token") String token) {
        boolean success = newsletterService.unsubscribe(token);
        if (success) {
            return ResponseEntity.ok(ApiResponse.success("You have been successfully unsubscribed from the newsletter.", true));
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid or expired unsubscribe link."));
        }
    }

    @PostMapping("/unsubscribe")
    public ResponseEntity<ApiResponse<Boolean>> unsubscribePost(@RequestParam("token") String token) {
        return unsubscribe(token);
    }
}
