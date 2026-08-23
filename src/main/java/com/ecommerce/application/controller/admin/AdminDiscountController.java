package com.ecommerce.application.controller.admin;

import com.ecommerce.application.dto.request.DiscountRequest;
import com.ecommerce.application.dto.response.ApiResponse;
import com.ecommerce.application.entity.Discount;
import com.ecommerce.application.service.impl.DiscountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/discounts")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = "*")
public class AdminDiscountController {

    private final DiscountService discountService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Discount>>> getAllDiscounts() {
        List<Discount> discounts = discountService.getAllDiscounts();
        return ResponseEntity.ok(ApiResponse.success("All discounts retrieved", discounts));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Discount>> getDiscountById(@PathVariable Long id) {
        Discount discount = discountService.getDiscountById(id);
        return ResponseEntity.ok(ApiResponse.success("Discount retrieved", discount));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Discount>> createDiscount(
            @Valid @RequestBody DiscountRequest request) {

        Discount discount = discountService.createDiscount(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Discount created successfully", discount));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Discount>> updateDiscount(
            @PathVariable Long id,
            @Valid @RequestBody DiscountRequest request) {

        Discount discount = discountService.updateDiscount(id, request);
        return ResponseEntity.ok(ApiResponse.success("Discount updated successfully", discount));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivateDiscount(@PathVariable Long id) {
        discountService.deactivateDiscount(id);
        return ResponseEntity.ok(ApiResponse.success("Discount deactivated successfully", null));
    }
}