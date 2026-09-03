package com.ecommerce.application.controller;

import com.ecommerce.application.dto.response.ApiResponse;
import com.ecommerce.application.dto.response.PageConfigResponse;
import com.ecommerce.application.enums.PageKey;
import com.ecommerce.application.service.impl.PageConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/page-config")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PageConfigController {

    private final PageConfigService service;

    @GetMapping("/{pageKey}")
    public ResponseEntity<ApiResponse<PageConfigResponse>> getPageConfig(
            @PathVariable PageKey pageKey,
            @RequestParam(required = false) String token) {
        PageConfigResponse response = service.getPublic(pageKey, token);
        return ResponseEntity.ok(ApiResponse.success("Page configuration retrieved", response));
    }
}
