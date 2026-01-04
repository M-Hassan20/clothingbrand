package com.ecommerce.application.Repository;

import com.ecommerce.application.Entity.Product;
import com.ecommerce.application.Entity.Review;
import com.ecommerce.application.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
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

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId AND r.isApproved = true")
    Double getAverageRatingByProductId(Long productId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.product.id = :productId AND r.isApproved = true")
    Long getReviewCountByProductId(Long productId);
}
