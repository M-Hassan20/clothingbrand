package com.ecommerce.application.controller;

import com.ecommerce.application.dto.response.ApiResponse;
import com.ecommerce.application.dto.response.AnnouncementConfigResponse;
import com.ecommerce.application.service.impl.AnnouncementConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/announcement")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementConfigService service;

    @GetMapping
    public ResponseEntity<ApiResponse<AnnouncementConfigResponse>> getAnnouncement(
            @RequestParam(required = false) String token,
            @RequestParam(required = false) String previewToken) {
        String activeToken = (token != null && !token.isBlank()) ? token : previewToken;
        return ResponseEntity.ok(ApiResponse.success("Announcement config retrieved", service.getPublic(activeToken)));
    }
}
