package com.ecommerce.application.controller;

import com.ecommerce.application.dto.CartDTO;
import com.ecommerce.application.dto.response.ApiResponse;
import com.ecommerce.application.service.impl.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    // For now, we'll use a userId from request param
    // Later, we'll get this from JWT token

    @GetMapping
    public ResponseEntity<ApiResponse<CartDTO>> getCart(@RequestParam String userId) {
        CartDTO cart = cartService.getCart(userId);
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    @PostMapping("/add")
    public ResponseEntity<ApiResponse<CartDTO>> addToCart(
            @RequestParam String userId,
            @RequestParam Long productVariantId,
            @RequestParam Integer quantity) {

        CartDTO cart = cartService.addToCart(userId, productVariantId, quantity);
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    @PutMapping("/update")
    public ResponseEntity<ApiResponse<CartDTO>> updateCartItem(
            @RequestParam String userId,
            @RequestParam Long productVariantId,
            @RequestParam Integer quantity) {

        CartDTO cart = cartService.updateCartItem(userId, productVariantId, quantity);
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    @DeleteMapping("/remove")
    public ResponseEntity<ApiResponse<CartDTO>> removeFromCart(
            @RequestParam String userId,
            @RequestParam Long productVariantId) {

        CartDTO cart = cartService.removeFromCart(userId, productVariantId);
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    @DeleteMapping("/clear")
    public ResponseEntity<ApiResponse<Void>> clearCart(@RequestParam String userId) {
        cartService.clearCart(userId);
        return ResponseEntity.ok(ApiResponse.success("Cart Cleared Successfully",null));
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Integer>> getCartItemCount(@RequestParam String userId) {
        int count = cartService.getCartItemCount(userId);
        return ResponseEntity.ok(ApiResponse.success(count));
    }
}