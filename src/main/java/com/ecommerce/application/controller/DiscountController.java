package com.ecommerce.application.controller;

import com.ecommerce.application.dto.request.DiscountValidateRequest;
import com.ecommerce.application.dto.response.ApiResponse;
import com.ecommerce.application.dto.response.DiscountValidateResponse;
import com.ecommerce.application.service.impl.DiscountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/discounts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DiscountController {

    private final DiscountService discountService;

    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<DiscountValidateResponse>> validateDiscount(
            @Valid @RequestBody DiscountValidateRequest request) {
        DiscountValidateResponse response = discountService.validateAndCalculateDiscount(
                request.getCode(),
                request.getOrderAmount()
        );
        return ResponseEntity.ok(ApiResponse.success("Discount code validated successfully", response));
    }
}
