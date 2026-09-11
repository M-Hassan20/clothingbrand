package com.ecommerce.application.controller;

import com.ecommerce.application.dto.request.ReviewCreateRequest;
import com.ecommerce.application.dto.request.GuestReviewRequest;
import com.ecommerce.application.dto.response.ApiResponse;
import com.ecommerce.application.dto.response.ReviewResponse;
import com.ecommerce.application.service.impl.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getProductReviews(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<ReviewResponse> reviews = reviewService.getProductReviews(productId, pageable);
        return ResponseEntity.ok(ApiResponse.success(reviews));
    }

    @GetMapping("/product/{productId}/rating/{rating}")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getProductReviewsByRating(
            @PathVariable Long productId,
            @PathVariable Integer rating,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<ReviewResponse> reviews = reviewService.getProductReviewsByRating(
                productId, rating, pageable);
        return ResponseEntity.ok(ApiResponse.success(reviews));
    }

    @GetMapping("/product/{productId}/verified")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getVerifiedProductReviews(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<ReviewResponse> reviews = reviewService.getVerifiedProductReviews(productId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Featured Reviews",reviews));
    }

    @GetMapping("/product/{productId}/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProductReviewStats(@PathVariable Long productId) {
        Double averageRating = reviewService.getAverageRating(productId);
        Long reviewCount = reviewService.getReviewCount(productId);
        Map<Integer, Long> distribution = reviewService.getRatingDistribution(productId);

        Map<String, Object> stats = Map.of(
                "averageRating", averageRating,
                "reviewCount", reviewCount,
                "ratingDistribution", distribution
        );

        return ResponseEntity.ok(ApiResponse.success("Review Stats for Product with ID: " + productId, stats));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getUserReviews(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<ReviewResponse> reviews = reviewService.getUserReviews(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(reviews));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @RequestParam Long userId,  // TODO: Get from JWT later
            @Valid @RequestBody ReviewCreateRequest request) {

        ReviewResponse review = reviewService.createReview(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Review created successfully!", review));
    }

    @PostMapping("/guest")
    public ResponseEntity<ApiResponse<ReviewResponse>> createGuestReview(
            @Valid @RequestBody GuestReviewRequest request) {

        ReviewResponse review = reviewService.createGuestReview(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Guest Review created successfully!", review));
    }

    @PutMapping("/{reviewId}")
    public ResponseEntity<ApiResponse<ReviewResponse>> updateReview(
            @PathVariable Long reviewId,
            @RequestParam Long userId,  // TODO: Get from JWT later
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String comment) {

        ReviewResponse review = reviewService.updateReview(reviewId, userId, rating, comment);
        return ResponseEntity.ok(ApiResponse.success("Review updated successfully!" ,review));
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable Long reviewId,
            @RequestParam Long userId) {  // TODO: Get from JWT later

        reviewService.deleteReview(reviewId, userId);
        return ResponseEntity.ok(ApiResponse.success("Review deleted successfully!", null));
    }
}