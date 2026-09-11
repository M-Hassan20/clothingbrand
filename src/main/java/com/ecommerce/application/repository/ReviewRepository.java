package com.ecommerce.application.repository;

import com.ecommerce.application.entity.Product;
import com.ecommerce.application.entity.Review;
import com.ecommerce.application.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProduct(Product product);
    List<Review> findByProductId(Long productId);
    List<Review> findByUser(User user);
    List<Review> findByUserId(Long userId);
    List<Review> findByProductIdAndIsApprovedTrue(Long productId);
    Optional<Review> findByProductIdAndUserId(Long productId, Long userId);

    Page<Review> findByProductIdAndIsApprovedTrueOrderByCreatedAtDesc(Long productId, Pageable pageable);

    // Filter by rating
    Page<Review> findByProductIdAndIsApprovedTrueAndRating(Long productId, Integer rating, Pageable pageable);

    // Verified purchases only
    Page<Review> findByProductIdAndIsApprovedTrueAndIsVerifiedPurchaseTrueOrderByCreatedAtDesc(
            Long productId, Pageable pageable);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId AND r.isApproved = true")
    Double getAverageRatingByProductId(Long productId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.product.id = :productId AND r.isApproved = true")
    Long getReviewCountByProductId(Long productId);

    @Query("SELECT r.rating, COUNT(r) FROM Review r " +
            "WHERE r.product.id = :productId AND r.isApproved = true " +
            "GROUP BY r.rating " +
            "ORDER BY r.rating DESC")
    List<Object[]> getRatingDistribution(@Param("productId") Long productId);

    Page<Review> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    boolean existsByProductIdAndUserId(Long productId, Long userId);

    // Admin: Pending reviews for moderation
    Page<Review> findByIsApprovedFalseOrderByCreatedAtDesc(Pageable pageable);

    // Admin: Full filtered listing
    @Query("SELECT r FROM Review r WHERE " +
           "(:searchPattern IS NULL OR " +
           " LOWER(r.comment) LIKE :searchPattern OR " +
           " LOWER(r.user.fullName) LIKE :searchPattern OR " +
           " LOWER(r.user.email) LIKE :searchPattern OR " +
           " LOWER(r.product.name) LIKE :searchPattern) AND " +
           "(:rating IS NULL OR r.rating = :rating) AND " +
           "(:verified IS NULL OR r.isVerifiedPurchase = :verified) AND " +
           "(:productId IS NULL OR r.product.id = :productId) AND " +
           "(:startDate IS NULL OR r.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR r.createdAt <= :endDate)")
    Page<Review> findAllForAdmin(
            @Param("searchPattern") String searchPattern,
            @Param("rating") Integer rating,
            @Param("verified") Boolean verified,
            @Param("productId") Long productId,
            @Param("startDate") java.time.LocalDateTime startDate,
            @Param("endDate") java.time.LocalDateTime endDate,
            Pageable pageable
    );

    @Query("SELECT COUNT(r), AVG(r.rating) FROM Review r")
    List<Object[]> getOverallReviewStats();

    @Query("SELECT r.rating, COUNT(r) FROM Review r GROUP BY r.rating")
    List<Object[]> getOverallRatingCounts();

    @Query("SELECT COUNT(r) FROM Review r WHERE r.isVerifiedPurchase = true")
    Long countVerifiedReviews();
}
