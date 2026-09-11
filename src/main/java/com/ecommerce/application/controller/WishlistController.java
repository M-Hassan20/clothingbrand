package com.ecommerce.application.controller;

import com.ecommerce.application.dto.response.ApiResponse;
import com.ecommerce.application.dto.response.ProductResponse;
import com.ecommerce.application.dto.response.WishlistItemResponse;
import com.ecommerce.application.dto.response.WishlistResponse;
import com.ecommerce.application.service.impl.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getUserWishlist(@RequestParam Long userId) {
        List<ProductResponse> products = wishlistService.getUserWishlistProducts(userId);
        return ResponseEntity.ok(ApiResponse.success("User Wishlist Products", products));
    }

    @GetMapping("/items")
    public ResponseEntity<ApiResponse<List<WishlistItemResponse>>> getWishlistItems(@RequestParam Long userId) {
        List<WishlistItemResponse> items = wishlistService.getWishlistItems(userId);
        return ResponseEntity.ok(ApiResponse.success("Wishlist Items", items));
    }

    @GetMapping("/check")
    public ResponseEntity<ApiResponse<Boolean>> isProductInWishlist(
            @RequestParam Long userId,
            @RequestParam Long productVariantId) {

        boolean inWishlist = wishlistService.isProductInWishlist(userId, productVariantId);
        return ResponseEntity.ok(ApiResponse.success(inWishlist));
    }

    @PostMapping("/add")
    public ResponseEntity<ApiResponse<WishlistItemResponse>> addToWishlist(
            @RequestParam Long userId,
            @RequestParam Long productVariantId) {

        WishlistItemResponse item = wishlistService.addToWishlist(userId, productVariantId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Item added to wishlist successfully!", item));
    }

    @DeleteMapping("/remove")
    public ResponseEntity<ApiResponse<Void>> removeFromWishlist(
            @RequestParam Long userId,
            @RequestParam Long productVariantId) {

        wishlistService.removeFromWishlist(userId, productVariantId);
        return ResponseEntity.ok(ApiResponse.success("Item removed from wishlist successfully!", null));
    }

    @DeleteMapping("/clear")
    public ResponseEntity<ApiResponse<Void>> clearWishlist(@RequestParam Long userId) {
        wishlistService.clearWishlist(userId);
        return ResponseEntity.ok(ApiResponse.success("Wishlist cleared successfully!", null));
    }
}