package com.ecommerce.application.controller.admin;

import com.ecommerce.application.dto.request.AnnouncementConfigRequest;
import com.ecommerce.application.dto.response.ApiResponse;
import com.ecommerce.application.dto.response.AnnouncementConfigResponse;
import com.ecommerce.application.dto.response.ImageUploadResponse;
import com.ecommerce.application.service.impl.AnnouncementConfigService;
import com.ecommerce.application.service.impl.CloudinaryService;
import com.ecommerce.application.service.impl.RevalidationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/admin/announcement")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = "*")
public class AdminAnnouncementController {

    private final AnnouncementConfigService service;
    private final CloudinaryService storageService;
    private final RevalidationService revalidationService;

    @GetMapping
    public ResponseEntity<ApiResponse<AnnouncementConfigResponse>> getDraft() {
        return ResponseEntity.ok(ApiResponse.success("Draft retrieved", service.getDraftForAdmin()));
    }

    @GetMapping("/published")
    public ResponseEntity<ApiResponse<AnnouncementConfigResponse>> getPublished() {
        return ResponseEntity.ok(ApiResponse.success("Published announcement retrieved", service.getPublishedForAdmin()));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<AnnouncementConfigResponse>> updateDraft(
            @Valid @RequestBody AnnouncementConfigRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Draft saved", service.updateDraft(request)));
    }

    @PatchMapping("/publish")
    public ResponseEntity<ApiResponse<AnnouncementConfigResponse>> publish() {
        AnnouncementConfigResponse published = service.publish();
        revalidationService.revalidate("announcement");
        return ResponseEntity.ok(ApiResponse.success("Announcement published successfully", published));
    }

    @PostMapping("/image")
    public ResponseEntity<ApiResponse<ImageUploadResponse>> uploadImage(
            @RequestParam("file") MultipartFile file) throws IOException {
        ImageUploadResponse response = storageService.uploadImage(file, "announcements", "banner");
        return ResponseEntity.ok(ApiResponse.success("Image uploaded successfully", response));
    }
}
