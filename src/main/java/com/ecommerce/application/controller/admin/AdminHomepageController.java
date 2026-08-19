package com.ecommerce.application.controller.admin;

import com.ecommerce.application.dto.request.HomepageConfigRequest;
import com.ecommerce.application.dto.response.ApiResponse;
import com.ecommerce.application.dto.response.HomepageConfigResponse;
import com.ecommerce.application.dto.response.ImageUploadResponse;
import com.ecommerce.application.service.impl.CloudinaryService;
import com.ecommerce.application.service.impl.HomepageConfigService;
import com.ecommerce.application.service.impl.RevalidationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/admin/homepage")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = "*")
public class AdminHomepageController {

    private final HomepageConfigService service;
    private final CloudinaryService storageService;
    private final RevalidationService revalidationService;
    private final com.ecommerce.application.security.JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<ApiResponse<HomepageConfigResponse>> getDraft() {
        return ResponseEntity.ok(ApiResponse.success("Draft retrieved", service.getDraftForAdmin()));
    }

    @GetMapping("/preview-token")
    public ResponseEntity<ApiResponse<java.util.Map<String, String>>> getPreviewToken(java.security.Principal principal) {
        String email = principal != null ? principal.getName() : "admin";
        String previewToken = jwtUtil.generatePreviewToken(email);
        return ResponseEntity.ok(ApiResponse.success("Preview token generated", java.util.Map.of("previewToken", previewToken)));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<HomepageConfigResponse>> updateDraft(
            @Valid @RequestBody HomepageConfigRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Draft saved", service.updateDraft(request)));
    }

    @PatchMapping("/publish")
    public ResponseEntity<ApiResponse<HomepageConfigResponse>> publish() {
        HomepageConfigResponse published = service.publish();
        revalidationService.revalidate("homepage");
        return ResponseEntity.ok(ApiResponse.success("Homepage published", published));
    }

    @PostMapping("/hero-image")
    public ResponseEntity<ApiResponse<ImageUploadResponse>> uploadHeroImage(
            @RequestParam("file") MultipartFile file) throws IOException {
        ImageUploadResponse response = storageService.uploadImage(file, "homepage", "hero");
        return ResponseEntity.ok(ApiResponse.success("Hero image uploaded", response));
    }
}
