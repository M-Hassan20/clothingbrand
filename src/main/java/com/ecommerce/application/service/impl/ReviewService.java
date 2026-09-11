package com.ecommerce.application.service.impl;

import com.ecommerce.application.dto.request.ReviewCreateRequest;
import com.ecommerce.application.dto.request.GuestReviewRequest;
import com.ecommerce.application.dto.response.ReviewResponse;
import com.ecommerce.application.entity.Product;
import com.ecommerce.application.entity.Review;
import com.ecommerce.application.repository.UserRepository;
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
    private final UserRepository userRepository;

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
        if (!isVerifiedPurchase) {
            throw new RuntimeException("You can only review products that you have actually purchased.");
        }

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

    @Transactional
    public ReviewResponse createGuestReview(GuestReviewRequest request) {
        User user = userRepository.findByEmail(request.getGuestEmail())
                .orElseThrow(() -> new RuntimeException("We couldn't find a completed order under this email for this product."));

        boolean isVerifiedPurchase = orderService.hasUserPurchasedProduct(user.getId(), request.getProductId());
        if (!isVerifiedPurchase) {
            throw new RuntimeException("We couldn't find a completed order under this email for this product.");
        }

        ReviewCreateRequest createRequest = new ReviewCreateRequest();
        createRequest.setProductId(request.getProductId());
        createRequest.setRating(request.getRating());
        createRequest.setComment(request.getComment());

        return createReview(user.getId(), createRequest);
    }

    // Admin: Get all reviews with filters, search, sorting & pagination
    public Page<ReviewResponse> getAllReviewsForAdmin(
            String search,
            Integer rating,
            Boolean verified,
            Long productId,
            java.time.LocalDateTime startDate,
            java.time.LocalDateTime endDate,
            String sort,
            int page,
            int size) {

        String cleanedSearch = (search != null && !search.trim().isEmpty()) ? search.trim().toLowerCase() : null;
        String searchPattern = (cleanedSearch != null) ? "%" + cleanedSearch + "%" : null;

        org.springframework.data.domain.Sort sortOrder;
        if ("oldest".equalsIgnoreCase(sort)) {
            sortOrder = org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.ASC, "createdAt");
        } else if ("rating_high".equalsIgnoreCase(sort)) {
            sortOrder = org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "rating");
        } else if ("rating_low".equalsIgnoreCase(sort)) {
            sortOrder = org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.ASC, "rating");
        } else {
            sortOrder = org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt");
        }

        Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, sortOrder);

        org.springframework.data.jpa.domain.Specification<Review> spec = (root, query, cb) -> {
            java.util.List<jakarta.persistence.criteria.Predicate> predicates = new java.util.ArrayList<>();

            if (searchPattern != null) {
                jakarta.persistence.criteria.Join<Review, User> userJoin = root.join("user", jakarta.persistence.criteria.JoinType.LEFT);
                jakarta.persistence.criteria.Join<Review, Product> productJoin = root.join("product", jakarta.persistence.criteria.JoinType.LEFT);

                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("comment")), searchPattern),
                    cb.like(cb.lower(userJoin.get("fullName")), searchPattern),
                    cb.like(cb.lower(userJoin.get("email")), searchPattern),
                    cb.like(cb.lower(productJoin.get("name")), searchPattern)
                ));
            }

            if (rating != null) {
                predicates.add(cb.equal(root.get("rating"), rating));
            }

            if (verified != null) {
                predicates.add(cb.equal(root.get("isVerifiedPurchase"), verified));
            }

            if (productId != null) {
                predicates.add(cb.equal(root.get("product").get("id"), productId));
            }

            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
            }

            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        return reviewRepository.findAll(spec, pageable).map(reviewMapper::toResponse);
    }

    // Admin: Get overall review statistics across the entire store
    public com.ecommerce.application.dto.response.ReviewStatsResponse getOverallReviewStats() {
        List<Object[]> overall = reviewRepository.getOverallReviewStats();
        Long totalReviews = 0L;
        Double averageRating = 0.0;

        if (overall != null && !overall.isEmpty() && overall.get(0) != null) {
            Object[] row = overall.get(0);
            if (row[0] != null) totalReviews = (Long) row[0];
            if (row[1] != null) averageRating = (Double) row[1];
        }

        List<Object[]> ratingDist = reviewRepository.getOverallRatingCounts();

        long fiveStar = 0L, fourStar = 0L, threeStar = 0L, twoStar = 0L, oneStar = 0L;
        if (ratingDist != null) {
            for (Object[] r : ratingDist) {
                Integer star = (Integer) r[0];
                Long count = (Long) r[1];
                if (star != null && count != null) {
                    switch (star) {
                        case 5 -> fiveStar = count;
                        case 4 -> fourStar = count;
                        case 3 -> threeStar = count;
                        case 2 -> twoStar = count;
                        case 1 -> oneStar = count;
                    }
                }
            }
        }

        Long verifiedCount = reviewRepository.countVerifiedReviews();
        if (verifiedCount == null) verifiedCount = 0L;

        double roundedAverage = Math.round(averageRating * 10.0) / 10.0;

        return com.ecommerce.application.dto.response.ReviewStatsResponse.builder()
                .totalReviews(totalReviews)
                .averageRating(roundedAverage)
                .fiveStarCount(fiveStar)
                .fourStarCount(fourStar)
                .threeStarCount(threeStar)
                .twoStarCount(twoStar)
                .oneStarCount(oneStar)
                .verifiedCount(verifiedCount)
                .build();
    }

    // Admin: Delete/Remove review
    @Transactional
    public void deleteReviewByAdmin(Long reviewId) {
        Review review = getReviewEntityById(reviewId);
        reviewRepository.delete(review);
    }
}

