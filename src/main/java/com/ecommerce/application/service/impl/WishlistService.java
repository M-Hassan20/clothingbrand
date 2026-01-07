package com.ecommerce.application.service.impl;

import com.ecommerce.application.entity.Wishlist;
import com.ecommerce.application.entity.WishlistItem;
import com.ecommerce.application.entity.ProductVariant;
import com.ecommerce.application.entity.User;
import com.ecommerce.application.repository.WishlistRepository;
import com.ecommerce.application.repository.WishlistItemRepository;
import com.ecommerce.application.service.ProductVariantService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final UserService userService;
    private final ProductVariantService productVariantService;

    @Transactional
    public Wishlist getUserWishlist(Long userId) {
        return wishlistRepository.findByUserId(userId)
                .orElseGet(() -> createWishlist(userId));
    }

    public List<WishlistItem> getWishlistItems(Long userId) {
        Wishlist wishlist = getUserWishlist(userId);
        return wishlistItemRepository.findByWishlistId(wishlist.getId());
    }

    public boolean isProductInWishlist(Long userId, Long productVariantId) {
        Wishlist wishlist = wishlistRepository.findByUserId(userId).orElse(null);
        if (wishlist == null) {
            return false;
        }
        return wishlistItemRepository.existsByWishlistIdAndProductVariantId(
                wishlist.getId(), productVariantId);
    }

    private Wishlist createWishlist(Long userId) {
        User user = userService.getUserById(userId);
        Wishlist wishlist = new Wishlist();
        wishlist.setUser(user);
        return wishlistRepository.save(wishlist);
    }

    // Add to wishlist
    @Transactional
    public WishlistItem addToWishlist(Long userId, Long productVariantId) {
        Wishlist wishlist = getUserWishlist(userId);

        // Check if already in wishlist
        if (wishlistItemRepository.existsByWishlistIdAndProductVariantId(
                wishlist.getId(), productVariantId)) {
            throw new RuntimeException("Product is already in your wishlist");
        }

        ProductVariant productVariant = productVariantService.getVariantById(productVariantId);

        WishlistItem item = new WishlistItem();
        item.setWishlist(wishlist);
        item.setProductVariant(productVariant);

        return wishlistItemRepository.save(item);
    }

    // Remove from wishlist
    @Transactional
    public void removeFromWishlist(Long userId, Long productVariantId) {
        Wishlist wishlist = getUserWishlist(userId);
        wishlistItemRepository.deleteByWishlistIdAndProductVariantId(
                wishlist.getId(), productVariantId);
    }

    // Clear wishlist
    @Transactional
    public void clearWishlist(Long userId) {
        Wishlist wishlist = getUserWishlist(userId);
        List<WishlistItem> items = wishlistItemRepository.findByWishlistId(wishlist.getId());
        wishlistItemRepository.deleteAll(items);
    }
}