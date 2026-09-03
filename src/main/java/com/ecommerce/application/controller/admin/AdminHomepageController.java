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
@RequestMapping("/api/admin/homepage")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = "*")
public class AdminHomepageController {

    private final PageConfigService pageConfigService;
    private final CloudinaryService storageService;
    private final RevalidationService revalidationService;
    private final JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<ApiResponse<PageConfigResponse>> getDraft() {
        return ResponseEntity.ok(ApiResponse.success("Draft retrieved", pageConfigService.getDraftForAdmin(PageKey.HOMEPAGE)));
    }

    @GetMapping("/preview-token")
    public ResponseEntity<ApiResponse<Map<String, String>>> getPreviewToken(Principal principal) {
        String email = principal != null ? principal.getName() : "admin";
        String previewToken = jwtUtil.generatePreviewToken(email);
        return ResponseEntity.ok(ApiResponse.success("Preview token generated", Map.of("previewToken", previewToken)));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<PageConfigResponse>> updateDraft(
            @Valid @RequestBody PageConfigRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Draft saved", pageConfigService.updateDraft(PageKey.HOMEPAGE, request)));
    }

    @PatchMapping("/publish")
    public ResponseEntity<ApiResponse<PageConfigResponse>> publish() {
        PageConfigResponse published = pageConfigService.publish(PageKey.HOMEPAGE);
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
