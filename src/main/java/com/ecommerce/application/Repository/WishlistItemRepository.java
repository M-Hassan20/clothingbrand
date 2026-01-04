package com.ecommerce.application.Repository;

import com.ecommerce.application.Entity.Wishlist;
import com.ecommerce.application.Entity.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {
    List<WishlistItem> findByWishlist(Wishlist wishlist);
    List<WishlistItem> findByWishlistId(Long wishlistId);
    Optional<WishlistItem> findByWishlistIdAndProductVariantId(Long wishlistId, Long productVariantId);
    boolean existsByWishlistIdAndProductVariantId(Long wishlistId, Long productVariantId);
    void deleteByWishlistIdAndProductVariantId(Long wishlistId, Long productVariantId);
}
