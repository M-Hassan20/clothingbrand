package com.ecommerce.application.controller.admin;

import com.ecommerce.application.dto.request.PageConfigRequest;
import com.ecommerce.application.dto.response.ApiResponse;
import com.ecommerce.application.dto.response.ImageUploadResponse;
import com.ecommerce.application.dto.response.PageConfigResponse;
import com.ecommerce.application.enums.PageKey;
import com.ecommerce.application.security.JwtUtil;
import com.ecommerce.application.service.impl.CloudinaryService;
import com.ecommerce.application.service.impl.PageConfigService;
import com.ecommerce.application.service.impl.RevalidationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/page-config")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = "*")
public class AdminPageConfigController {

    private final PageConfigService service;
    private final CloudinaryService storageService;
    private final RevalidationService revalidationService;
    private final JwtUtil jwtUtil;

    @GetMapping("/{pageKey}")
    public ResponseEntity<ApiResponse<PageConfigResponse>> getDraft(@PathVariable PageKey pageKey) {
        return ResponseEntity.ok(ApiResponse.success("Draft retrieved", service.getDraftForAdmin(pageKey)));
    }

    @GetMapping("/preview-token")
    public ResponseEntity<ApiResponse<Map<String, String>>> getPreviewToken(Principal principal) {
        String email = principal != null ? principal.getName() : "admin";
        String previewToken = jwtUtil.generatePreviewToken(email);
        return ResponseEntity.ok(ApiResponse.success("Preview token generated", Map.of("previewToken", previewToken)));
    }

    @PutMapping("/{pageKey}")
    public ResponseEntity<ApiResponse<PageConfigResponse>> updateDraft(
            @PathVariable PageKey pageKey,
            @Valid @RequestBody PageConfigRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Draft saved", service.updateDraft(pageKey, request)));
    }

    @PatchMapping("/{pageKey}/publish")
    public ResponseEntity<ApiResponse<PageConfigResponse>> publish(@PathVariable PageKey pageKey) {
        PageConfigResponse published = service.publish(pageKey);
        revalidationService.revalidate(pageKey.name().toLowerCase());
        return ResponseEntity.ok(ApiResponse.success("Page published successfully", published));
    }

    @PostMapping("/{pageKey}/image")
    public ResponseEntity<ApiResponse<ImageUploadResponse>> uploadBannerImage(
            @PathVariable PageKey pageKey,
            @RequestParam("file") MultipartFile file) throws IOException {
        if (pageKey != PageKey.HOMEPAGE && pageKey != PageKey.ABOUT) {
            throw new IllegalArgumentException("Image upload is only supported for Homepage and About Us pages.");
        }
        ImageUploadResponse response = storageService.uploadImage(file, "pages", pageKey.name().toLowerCase());
        return ResponseEntity.ok(ApiResponse.success("Image uploaded successfully", response));
    }
}
