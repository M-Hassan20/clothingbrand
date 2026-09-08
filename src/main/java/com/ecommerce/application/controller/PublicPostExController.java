package com.ecommerce.application.controller;

import com.ecommerce.application.dto.postex.PostExTrackingResponse;
import com.ecommerce.application.dto.response.ApiResponse;
import com.ecommerce.application.service.PostExService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tracking")
@RequiredArgsConstructor
public class PublicPostExController {

    private final PostExService postExService;

    @GetMapping("/{trackingNumber}")
    public ResponseEntity<ApiResponse<PostExTrackingResponse>> trackOrder(@PathVariable String trackingNumber) {
        PostExTrackingResponse response = postExService.trackShipment(trackingNumber);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
