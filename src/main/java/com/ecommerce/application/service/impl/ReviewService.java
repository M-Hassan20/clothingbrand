package com.ecommerce.application.service.impl;

import com.ecommerce.application.entity.Product;
import com.ecommerce.application.entity.Review;
import com.ecommerce.application.entity.User;
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
    private final ProductServiceImpl productService;
    private final UserService userService;
    private final OrderService orderService;

    public Review getReviewById(Long id) {
        return reviewRepository.findById(id).orElseThrow(() -> new RuntimeException("Review not found with id: "+ id));
    }

    public Page<Review> getProductReviews(Long productId, Pageable pageable) {
        return reviewRepository.findByProductIdAndIsApprovedTrueOrderByCreatedAtDesc(productId, pageable);
    }

    public Page<Review> getProductReviewsByRating(Long productId, Integer rating, Pageable pageable) {
        return reviewRepository.findByProductIdAndIsApprovedTrueAndRating(
                productId, rating, pageable);
    }

    public Page<Review> getVerifiedProductReviews(Long productId, Pageable pageable) {
        return reviewRepository.findByProductIdAndIsApprovedTrueAndIsVerifiedPurchaseTrueOrderByCreatedAtDesc(
                productId, pageable);
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

    public Page<Review> getUserReviews(Long userId, Pageable pageable) {
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    public boolean hasUserReviewed(Long productId, Long userId) {
        return reviewRepository.existsByProductIdAndUserId(productId, userId);
    }

    @Transactional
    public Review createReview(Long productId, Long userId, Integer rating, String comment) {
        // Validate rating
        if (rating < 1 || rating > 5) {
            throw new RuntimeException("Rating must be between 1 and 5");
        }

        // Check if user already reviewed this product
        if (hasUserReviewed(productId, userId)) {
            throw new RuntimeException("You have already reviewed this product");
        }

        Product product = productService.getProductById(productId);
        User user = userService.getUserById(userId);

        // Check if user purchased this product
        boolean isVerifiedPurchase = orderService.hasUserPurchasedProduct(userId, productId);

        Review review = new Review();
        review.setProduct(product);
        review.setUser(user);
        review.setRating(rating);
        review.setComment(comment);
        review.setIsVerifiedPurchase(isVerifiedPurchase);
        review.setIsApproved(true); // Auto-approve or set to false for moderation

        return reviewRepository.save(review);
    }

    @Transactional
    public Review updateReview(Long reviewId, Long userId, Integer rating, String comment) {
        Review review = getReviewById(reviewId);

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

        return reviewRepository.save(review);
    }

    // Delete review
    @Transactional
    public void deleteReview(Long reviewId, Long userId) {
        Review review = getReviewById(reviewId);

        // Verify user owns this review
        if (!review.getUser().getId().equals(userId)) {
            throw new RuntimeException("You are not authorized to delete this review");
        }

        reviewRepository.deleteById(reviewId);
    }

    // Admin: Get pending reviews for moderation
    public Page<Review> getPendingReviews(Pageable pageable) {
        return reviewRepository.findByIsApprovedFalseOrderByCreatedAtDesc(pageable);
    }

    // Admin: Approve review
    @Transactional
    public Review approveReview(Long reviewId) {
        Review review = getReviewById(reviewId);
        review.setIsApproved(true);
        return reviewRepository.save(review);
    }

    // Admin: Reject review
    @Transactional
    public void rejectReview(Long reviewId) {
        reviewRepository.deleteById(reviewId);
    }
}

