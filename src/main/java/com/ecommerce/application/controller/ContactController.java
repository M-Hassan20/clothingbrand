package com.ecommerce.application.controller;

import com.ecommerce.application.dto.request.ContactRequest;
import com.ecommerce.application.dto.response.ApiResponse;
import com.ecommerce.application.service.impl.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ContactController {

    private final EmailService emailService;

    @PostMapping
    public ResponseEntity<ApiResponse<String>> submitContactForm(@Valid @RequestBody ContactRequest request) {
        emailService.sendContactInquiryEmail(
                request.getName(),
                request.getEmail(),
                request.getSubject(),
                request.getMessage()
        );
        return ResponseEntity.ok(ApiResponse.success("Your message has been sent successfully.", null));
    }
}
