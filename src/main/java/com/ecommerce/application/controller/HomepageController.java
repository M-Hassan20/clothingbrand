package com.ecommerce.application.controller;

import com.ecommerce.application.dto.response.ApiResponse;
import com.ecommerce.application.dto.response.PageConfigResponse;
import com.ecommerce.application.enums.PageKey;
import com.ecommerce.application.service.impl.PageConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/homepage")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HomepageController {

    private final PageConfigService pageConfigService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageConfigResponse>> getHomepage(
            @RequestParam(required = false) String token,
            @RequestParam(required = false) String previewToken) {
        String activeToken = (token != null && !token.isBlank()) ? token : previewToken;
        return ResponseEntity.ok(ApiResponse.success("Homepage config retrieved", pageConfigService.getPublic(PageKey.HOMEPAGE, activeToken)));
    }
}
