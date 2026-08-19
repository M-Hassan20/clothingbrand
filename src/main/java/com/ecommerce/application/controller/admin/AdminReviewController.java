package com.ecommerce.application.controller.admin;

import com.ecommerce.application.dto.response.ApiResponse;
import com.ecommerce.application.dto.response.ReviewResponse;
import com.ecommerce.application.dto.response.ReviewStatsResponse;
import com.ecommerce.application.service.impl.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/reviews")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = "*")
public class AdminReviewController {

    private final ReviewService reviewService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getAllReviews(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) Boolean verified,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<ReviewResponse> reviews = reviewService.getAllReviewsForAdmin(
                search, rating, verified, productId, startDate, endDate, sort, page, size);
        return ResponseEntity.ok(ApiResponse.success("Reviews retrieved successfully", reviews));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<ReviewStatsResponse>> getReviewStats() {
        ReviewStatsResponse stats = reviewService.getOverallReviewStats();
        return ResponseEntity.ok(ApiResponse.success("Review stats retrieved successfully", stats));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReviewByAdmin(@PathVariable Long id) {
        reviewService.deleteReviewByAdmin(id);
        return ResponseEntity.ok(ApiResponse.success("Review removed successfully", null));
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getPendingReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<ReviewResponse> reviews = reviewService.getPendingReviews(pageable);
        return ResponseEntity.ok(ApiResponse.success("Pending reviews retrieved", reviews));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<ReviewResponse>> approveReview(@PathVariable Long id) {
        ReviewResponse review = reviewService.approveReview(id);
        return ResponseEntity.ok(ApiResponse.success("Review approved successfully", review));
    }

    @DeleteMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectReview(@PathVariable Long id) {
        reviewService.rejectReview(id);
        return ResponseEntity.ok(ApiResponse.success("Review rejected successfully", null));
    }
}