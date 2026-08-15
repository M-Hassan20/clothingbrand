package com.ecommerce.application.service.impl;

import com.ecommerce.application.dto.CartDTO;
import com.ecommerce.application.dto.CartItemDTO;
import com.ecommerce.application.entity.ProductVariant;
import com.ecommerce.application.service.ProductVariantService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class CartService {

    private final RedisTemplate<String, String> redisTemplate;
    private final ProductVariantServiceImpl productVariantService;
    private final ObjectMapper objectMapper;

    private static final String CART_KEY_PREFIX = "cart:";
    private static final long CART_EXPIRATION_DAYS = 7;

    public CartDTO getCart(String userId) {
        String key = CART_KEY_PREFIX + userId;
        String cartJson = redisTemplate.opsForValue().get(key);

        if (cartJson != null) {
            try {
                return objectMapper.readValue(cartJson, CartDTO.class);
            } catch (JsonProcessingException e) {
                throw new RuntimeException("Error deserializing cart", e);
            }
        }

        // Return empty cart
        CartDTO cart = new CartDTO();
        cart.setUserId(userId);
        cart.setItems(new ArrayList<>());
        cart.setTotalPrice(BigDecimal.ZERO);
        return cart;
    }

    @Transactional
    public CartDTO addToCart(String userId, Long productVariantId, Integer quantity) {
        ProductVariant variant = productVariantService.useEntity(productVariantId);

        // Check stock
        if (variant.getStockQuantity() < quantity) {
            throw new RuntimeException("Insufficient stock available");
        }

        CartDTO cart = getCart(userId);

        // Check if item already in cart
        CartItemDTO existingItem = cart.getItems().stream()
                .filter(item -> item.getProductVariantId().equals(productVariantId))
                .findFirst()
                .orElse(null);

        if (existingItem != null) {
            // Update quantity
            int newQuantity = existingItem.getQuantity() + quantity;
            if (variant.getStockQuantity() < newQuantity) {
                throw new RuntimeException("Insufficient stock available");
            }
            existingItem.setQuantity(newQuantity);
            existingItem.setSubtotal(variant.getPrice().multiply(BigDecimal.valueOf(newQuantity)));
        } else {
            // Add new item
            CartItemDTO newItem = new CartItemDTO();
            newItem.setProductVariantId(productVariantId);
            newItem.setProductName(variant.getProduct().getName());
            newItem.setVariantName(variant.getSize() + " / " + variant.getColor());
            newItem.setImageUrl(variant.getPublicImageUrl());
            newItem.setQuantity(quantity);
            newItem.setPrice(variant.getPrice());
            newItem.setSubtotal(variant.getPrice().multiply(BigDecimal.valueOf(quantity)));

            cart.getItems().add(newItem);
        }

        // Recalculate total
        cart.setTotalPrice(calculateTotal(cart));
        cart.setLastUpdated(LocalDateTime.now());

        // Save to Redis
        saveCart(userId, cart);

        return cart;
    }

    @Transactional
    public CartDTO updateCartItem(String userId, Long productVariantId, Integer quantity) {
        if (quantity <= 0) {
            return removeFromCart(userId, productVariantId);
        }

        ProductVariant variant = productVariantService.useEntity(productVariantId);

        // Check stock
        if (variant.getStockQuantity() < quantity) {
            throw new RuntimeException("Insufficient stock available");
        }

        CartDTO cart = getCart(userId);

        CartItemDTO item = cart.getItems().stream()
                .filter(i -> i.getProductVariantId().equals(productVariantId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Item not found in cart"));

        item.setQuantity(quantity);
        item.setSubtotal(variant.getPrice().multiply(BigDecimal.valueOf(quantity)));

        // Recalculate total
        cart.setTotalPrice(calculateTotal(cart));
        cart.setLastUpdated(LocalDateTime.now());

        // Save to Redis
        saveCart(userId, cart);

        return cart;
    }

    public CartDTO removeFromCart(String userId, Long productVariantId) {
        CartDTO cart = getCart(userId);

        cart.getItems().removeIf(item ->
                item.getProductVariantId().equals(productVariantId));

        // Recalculate total
        cart.setTotalPrice(calculateTotal(cart));
        cart.setLastUpdated(LocalDateTime.now());

        // Save to Redis
        saveCart(userId, cart);

        return cart;
    }

    public void clearCart(String userId) {
        String key = CART_KEY_PREFIX + userId;
        redisTemplate.delete(key);
    }

    private void saveCart(String userId, CartDTO cart) {
        String key = CART_KEY_PREFIX + userId;
        try {
            String cartJson = objectMapper.writeValueAsString(cart);
            redisTemplate.opsForValue().set(key, cartJson, CART_EXPIRATION_DAYS, TimeUnit.DAYS);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error serializing cart", e);
        }
    }

    private BigDecimal calculateTotal(CartDTO cart) {
        return cart.getItems().stream()
                .map(CartItemDTO::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public int getCartItemCount(String userId) {
        CartDTO cart = getCart(userId);
        return cart.getItems().stream()
                .mapToInt(CartItemDTO::getQuantity)
                .sum();
    }
}