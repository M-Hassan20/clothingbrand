package com.ecommerce.application.controller.admin;

import com.ecommerce.application.dto.request.SendNewsletterRequest;
import com.ecommerce.application.dto.response.ApiResponse;
import com.ecommerce.application.dto.response.NewsletterSubscriberResponse;
import com.ecommerce.application.service.NewsletterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/newsletter")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminNewsletterController {

    private final NewsletterService newsletterService;

    @GetMapping("/subscribers")
    public ResponseEntity<ApiResponse<Page<NewsletterSubscriberResponse>>> getSubscribers(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<NewsletterSubscriberResponse> result = newsletterService.getSubscribers(active, search, pageable);

        return ResponseEntity.ok(ApiResponse.success("Subscribers retrieved successfully", result));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats() {
        long totalActive = newsletterService.getTotalActiveSubscribers();
        Map<String, Object> stats = Map.of("totalActiveSubscribers", totalActive);
        return ResponseEntity.ok(ApiResponse.success("Stats retrieved", stats));
    }

    @PostMapping("/send")
    public ResponseEntity<ApiResponse<String>> sendBroadcast(@Valid @RequestBody SendNewsletterRequest request) {
        newsletterService.sendNewsletterBroadcast(request);
        return ResponseEntity.ok(ApiResponse.success("Newsletter campaign broadcast initiated successfully to active subscribers.", null));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportSubscribersCsv() {
        List<NewsletterSubscriberResponse> subscribers = newsletterService.getAllActiveSubscribers();
        StringBuilder csv = new StringBuilder();
        csv.append("ID,Email,SubscribedAt,Active\n");

        for (NewsletterSubscriberResponse sub : subscribers) {
            csv.append(sub.getId()).append(",")
                    .append(sub.getEmail()).append(",")
                    .append(sub.getSubscribedAt() != null ? sub.getSubscribedAt().toString() : "").append(",")
                    .append(sub.getActive()).append("\n");
        }

        byte[] body = csv.toString().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=newsletter_subscribers.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(body);
    }
}
