package com.ecommerce.application.controller;

import com.ecommerce.application.dto.response.ApiResponse;
import com.ecommerce.application.dto.response.HomepageConfigResponse;
import com.ecommerce.application.service.impl.HomepageConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/homepage")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HomepageController {

    private final HomepageConfigService service;

    @GetMapping
    public ResponseEntity<ApiResponse<HomepageConfigResponse>> getHomepage(
            @RequestParam(required = false) String previewToken) {
        return ResponseEntity.ok(ApiResponse.success("Homepage config retrieved", service.getPublic(previewToken)));
    }
}
