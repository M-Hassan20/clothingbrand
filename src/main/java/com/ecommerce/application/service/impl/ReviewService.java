package com.ecommerce.application.service.impl;

import com.ecommerce.application.dto.request.ReviewCreateRequest;
import com.ecommerce.application.dto.response.ReviewResponse;
import com.ecommerce.application.entity.Product;
import com.ecommerce.application.entity.Review;
import com.ecommerce.application.entity.User;
import com.ecommerce.application.exception.ResourceNotFoundException;
import com.ecommerce.application.mapper.ReviewMapper;
import com.ecommerce.application.repository.ProductRepository;
import com.ecommerce.application.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserService userService;
    private final OrderService orderService;
    private final ReviewMapper reviewMapper;

    public ReviewResponse getReviewById(Long id) {
        return reviewMapper.toResponse(reviewRepository.findById(id).orElseThrow(() -> new RuntimeException("Review not found with id: "+ id)));
    }

    private Review getReviewEntityById(Long id) {
        return reviewRepository.findById(id).orElseThrow(() -> new RuntimeException("Review not found with id: "+ id));
    }

    public Page<ReviewResponse> getProductReviews(Long productId, Pageable pageable) {
        return reviewRepository.findByProductIdAndIsApprovedTrueOrderByCreatedAtDesc(productId, pageable).map(reviewMapper::toResponse);
    }

    public Page<ReviewResponse> getProductReviewsByRating(Long productId, Integer rating, Pageable pageable) {
        return reviewRepository.findByProductIdAndIsApprovedTrueAndRating(
                productId, rating, pageable).map(reviewMapper::toResponse);
    }

    public Page<ReviewResponse> getVerifiedProductReviews(Long productId, Pageable pageable) {
        return reviewRepository.findByProductIdAndIsApprovedTrueAndIsVerifiedPurchaseTrueOrderByCreatedAtDesc(
                productId, pageable).map(reviewMapper::toResponse);
    }

    public Double getAverageRating(Long productId) {
        Double avg = reviewRepository.getAverageRatingByProductId(productId);
        return avg != null ? avg : 0.0;
    }

    public Long getReviewCount(Long productId) {
        return reviewRepository.getReviewCountByProductId(productId);
    }

    public Map<Integer, Long> getRatingDistribution(Long productId) {
        List<Object[]> results = reviewRepository.getRatingDistribution(productId);
        Map<Integer, Long> distribution = new HashMap<>();

        for(int i = 1; i <= 5; i++) {
            distribution.put(i, 0L);
        }

        for(Object[] result: results) {
            Integer rating = (Integer) result[0];
            Long count = (Long) result[1];
            distribution.put(rating, count);
        }
        return distribution;
    }

    public Page<ReviewResponse> getUserReviews(Long userId, Pageable pageable) {
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable).map(reviewMapper::toResponse);
    }

    public boolean hasUserReviewed(Long productId, Long userId) {
        return reviewRepository.existsByProductIdAndUserId(productId, userId);
    }

    @Transactional
    public ReviewResponse createReview(Long userId, ReviewCreateRequest request) {
        // Validate rating
        if (request.getRating() < 1 || request.getRating() > 5) {
            throw new RuntimeException("Rating must be between 1 and 5");
        }

        // Check if user already reviewed this product
        if (hasUserReviewed(request.getProductId(), userId)) {
            throw new RuntimeException("You have already reviewed this product");
        }

        Product product = productRepository.findById(request.getProductId()).orElseThrow(() -> new ResourceNotFoundException("Product", "ID", request.getProductId()));
        User user = userService.getUserEntityById(userId);

        // Check if user purchased this product
        boolean isVerifiedPurchase = orderService.hasUserPurchasedProduct(userId, request.getProductId());

        Review review = new Review();
        review.setProduct(product);
        review.setUser(user);
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setIsVerifiedPurchase(isVerifiedPurchase);
        review.setIsApproved(true); // Auto-approve or set to false for moderation

        return reviewMapper.toResponse(reviewRepository.save(review));
    }

    @Transactional
    public ReviewResponse updateReview(Long reviewId, Long userId, Integer rating, String comment) {
        Review review = getReviewEntityById(reviewId);

        // Verify user owns this review
        if (!review.getUser().getId().equals(userId)) {
            throw new RuntimeException("You are not authorized to update this review");
        }

        if (rating != null && (rating < 1 || rating > 5)) {
            throw new RuntimeException("Rating must be between 1 and 5");
        }

        if (rating != null) {
            review.setRating(rating);
        }
        if (comment != null) {
            review.setComment(comment);
        }

        return reviewMapper.toResponse(reviewRepository.save(review));
    }

    // Delete review
    @Transactional
    public void deleteReview(Long reviewId, Long userId) {
        Review review = getReviewEntityById(reviewId);

        // Verify user owns this review
        if (!review.getUser().getId().equals(userId)) {
            throw new RuntimeException("You are not authorized to delete this review");
        }

        reviewRepository.deleteById(reviewId);
    }

    // Admin: Get pending reviews for moderation
    public Page<ReviewResponse> getPendingReviews(Pageable pageable) {
        return reviewRepository.findByIsApprovedFalseOrderByCreatedAtDesc(pageable).map(reviewMapper::toResponse);
    }

    // Admin: Approve review
    @Transactional
    public ReviewResponse approveReview(Long reviewId) {
        Review review = getReviewEntityById(reviewId);
        review.setIsApproved(true);
        return reviewMapper.toResponse(reviewRepository.save(review));
    }

    // Admin: Reject review
    @Transactional
    public void rejectReview(Long reviewId) {
        reviewRepository.deleteById(reviewId);
    }
}

