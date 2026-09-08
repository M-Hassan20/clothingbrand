package com.ecommerce.application.service.impl;

import com.ecommerce.application.dto.request.DiscountRequest;
import com.ecommerce.application.dto.response.DiscountValidateResponse;
import com.ecommerce.application.entity.Discount;
import com.ecommerce.application.exception.ResourceNotFoundException;
import com.ecommerce.application.mapper.DiscountMapper;
import com.ecommerce.application.repository.DiscountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.CacheEvict;

import com.ecommerce.application.entity.ProductVariant;
import com.ecommerce.application.entity.Product;
import com.ecommerce.application.entity.Category;
import com.ecommerce.application.enums.DiscountType;


import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class DiscountService {
    private final DiscountRepository discountRepository;
    private final DiscountMapper discountMapper;

    public Discount getDiscountById(Long id) {
        return discountRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Discount", "id", id));
    }

    public Discount getDiscountByCode(String code) {
        return discountRepository.findByCode(code).orElseThrow(() -> new ResourceNotFoundException("Discount", "code", code));
    }

    public Discount validateDiscountCode(String code) {
        if (code == null || code.trim().isEmpty()) {
            throw new RuntimeException("Discount code cannot be empty");
        }
        return discountRepository.findValidDiscountByCode(code.trim().toUpperCase(), LocalDateTime.now())
                .orElseThrow(() -> new RuntimeException("Invalid or expired discount code: " + code));
    }

    public DiscountValidateResponse validateAndCalculateDiscount(String code, BigDecimal orderAmount) {
        Discount discount = validateDiscountCode(code);
        BigDecimal discountAmount = calculateDiscount(discount, orderAmount);
        BigDecimal finalAmount = orderAmount.subtract(discountAmount);
        boolean isFreeShipping = discount.getDiscountType() == DiscountType.FREE_SHIPPING;

        return DiscountValidateResponse.builder()
                .valid(true)
                .code(discount.getCode())
                .discountType(discount.getDiscountType())
                .discountValue(discount.getDiscountValue())
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .isFreeShipping(isFreeShipping)
                .message(isFreeShipping ? "Free Delivery promo applied!" : "Promo code applied successfully!")
                .build();
    }

    public List<Discount> getActiveDiscounts() {
        return discountRepository.findByIsActiveTrue();
    }

    public List<Discount> getAllDiscounts() {
        return discountRepository.findAll();
    }

    // Calculate discount amount
    public BigDecimal calculateDiscount(Discount discount, BigDecimal orderAmount) {
        // Check minimum order amount
        if (discount.getMinOrderAmount() != null &&
                orderAmount.compareTo(discount.getMinOrderAmount()) < 0) {
            throw new RuntimeException(
                    "Order amount must be at least " + discount.getMinOrderAmount() +
                            " to use this discount");
        }

        if (DiscountType.FREE_SHIPPING.equals(discount.getDiscountType())) {
            return BigDecimal.ZERO;
        }

        BigDecimal discountAmount;

        if (DiscountType.PERCENTAGE.equals(discount.getDiscountType())) {
            discountAmount = orderAmount.multiply(discount.getDiscountValue() != null ? discount.getDiscountValue() : BigDecimal.ZERO)
                    .divide(BigDecimal.valueOf(100));

            // Apply maximum discount cap if exists
            if (discount.getMaxDiscountAmount() != null &&
                    discountAmount.compareTo(discount.getMaxDiscountAmount()) > 0) {
                discountAmount = discount.getMaxDiscountAmount();
            }
        } else { // FIXED_AMOUNT
            discountAmount = discount.getDiscountValue() != null ? discount.getDiscountValue() : BigDecimal.ZERO;
        }

        // Ensure discount doesn't exceed order amount
        if (discountAmount.compareTo(orderAmount) > 0) {
            discountAmount = orderAmount;
        }

        return discountAmount;
    }

    /**
     * Check if a Free Shipping / Free COD promotion applies to an order
     */
    public boolean isFreeShippingApplicable(String code, List<com.ecommerce.application.entity.OrderItem> items, BigDecimal orderAmount) {
        LocalDateTime now = LocalDateTime.now();

        // 1. Check if applied promo code is a Free Shipping discount
        if (code != null && !code.trim().isEmpty()) {
            try {
                Discount discount = validateDiscountCode(code);
                if (DiscountType.FREE_SHIPPING.equals(discount.getDiscountType())) {
                    if (discount.getMinOrderAmount() == null || orderAmount.compareTo(discount.getMinOrderAmount()) >= 0) {
                        if (isDiscountApplicableToItems(discount, items)) {
                            return true;
                        }
                    }
                }
            } catch (Exception ignored) {}
        }

        // 2. Check active auto-applied Free Shipping promotions running for limited time
        List<Discount> autoDiscounts = discountRepository.findActiveAutoDiscounts(now);
        for (Discount discount : autoDiscounts) {
            if (DiscountType.FREE_SHIPPING.equals(discount.getDiscountType())) {
                if (discount.getMinOrderAmount() == null || orderAmount.compareTo(discount.getMinOrderAmount()) >= 0) {
                    if (isDiscountApplicableToItems(discount, items)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private boolean isDiscountApplicableToItems(Discount discount, List<com.ecommerce.application.entity.OrderItem> items) {
        boolean hasCategoryRestrictions = discount.getApplicableCategories() != null && !discount.getApplicableCategories().isEmpty();
        boolean hasProductRestrictions = discount.getApplicableProducts() != null && !discount.getApplicableProducts().isEmpty();

        // If no product or category restrictions, applies to ALL products
        if (!hasCategoryRestrictions && !hasProductRestrictions) {
            return true;
        }

        if (items == null || items.isEmpty()) {
            return true;
        }

        for (com.ecommerce.application.entity.OrderItem item : items) {
            if (item.getProductVariant() != null && item.getProductVariant().getProduct() != null) {
                Product product = item.getProductVariant().getProduct();
                if (hasProductRestrictions && discount.getApplicableProducts().contains(product)) {
                    return true;
                }
                if (hasCategoryRestrictions && product.getCategory() != null && discount.getApplicableCategories().contains(product.getCategory())) {
                    return true;
                }
            }
        }

        return false;
    }

    // Apply discount to order
    @Transactional
    public BigDecimal applyDiscount(String code, BigDecimal orderAmount) {
        Discount discount = validateDiscountCode(code);
        BigDecimal discountAmount = calculateDiscount(discount, orderAmount);

        // Increment usage count
        discountRepository.incrementUsageCount(discount.getId());

        return orderAmount.subtract(discountAmount);
    }

    // Create discount (Admin)
    @Transactional
    @CacheEvict(value = {"products", "product", "bestSellers"}, allEntries = true)
    public Discount createDiscount(DiscountRequest request) {
        if (request.getIsAutoApplied() == null) {
            request.setIsAutoApplied(false);
        }

        if (Boolean.FALSE.equals(request.getIsAutoApplied()) && (request.getCode() == null || request.getCode().trim().isEmpty())) {
            throw new RuntimeException("Promo code is required for manually applied discounts");
        }

        if (request.getCode() != null && !request.getCode().trim().isEmpty()) {
            if (discountRepository.findByCode(request.getCode().trim().toUpperCase()).isPresent()) {
                throw new RuntimeException("Discount code already exists: " + request.getCode());
            }
        }

        Discount discount = discountMapper.toEntity(request);
        if (Boolean.TRUE.equals(discount.getIsAutoApplied()) && (discount.getCode() == null || discount.getCode().trim().isEmpty())) {
            discount.setCode("AUTO_" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        } else if (discount.getCode() != null) {
            discount.setCode(discount.getCode().trim().toUpperCase());
        }

        return discountRepository.save(discount);
    }

    // Update discount (Admin)
    @Transactional
    @CacheEvict(value = {"products", "product", "bestSellers"}, allEntries = true)
    public Discount updateDiscount(Long id, DiscountRequest request) {
        Discount discount = getDiscountById(id);

        if (request.getIsAutoApplied() == null) {
            request.setIsAutoApplied(false);
        }

        if (Boolean.FALSE.equals(request.getIsAutoApplied()) && (request.getCode() == null || request.getCode().trim().isEmpty())) {
            throw new RuntimeException("Promo code is required for manually applied discounts");
        }

        if (request.getCode() != null && !request.getCode().trim().isEmpty()) {
            discountRepository.findByCode(request.getCode().trim().toUpperCase()).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    throw new RuntimeException("Discount code already exists: " + request.getCode());
                }
            });
        }

        discountMapper.updateEntityFromRequest(request, discount);

        if (Boolean.TRUE.equals(discount.getIsAutoApplied()) && (discount.getCode() == null || discount.getCode().trim().isEmpty())) {
            discount.setCode("AUTO_" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        } else if (discount.getCode() != null) {
            discount.setCode(discount.getCode().trim().toUpperCase());
        }

        return discountRepository.save(discount);
    }

    // Deactivate discount (Admin)
    @Transactional
    @CacheEvict(value = {"products", "product", "bestSellers"}, allEntries = true)
    public void deactivateDiscount(Long id) {
        Discount discount = getDiscountById(id);
        discount.setIsActive(false);
        discountRepository.save(discount);
    }

    public BigDecimal calculateEffectivePrice(ProductVariant variant) {
        if (variant == null || variant.getPrice() == null) {
            return BigDecimal.ZERO;
        }

        BigDecimal originalPrice = variant.getPrice();
        Product product = variant.getProduct();
        if (product == null) {
            return originalPrice;
        }
        Category category = product.getCategory();

        List<Discount> activeAutoDiscounts = discountRepository.findActiveAutoDiscounts(LocalDateTime.now());
        BigDecimal bestPrice = originalPrice;

        for (Discount discount : activeAutoDiscounts) {
            boolean applies = false;

            // Check if applies directly to this product
            if (discount.getApplicableProducts() != null && discount.getApplicableProducts().contains(product)) {
                applies = true;
            }
            // Check if applies to this product's category
            else if (category != null && discount.getApplicableCategories() != null && discount.getApplicableCategories().contains(category)) {
                applies = true;
            }

            if (applies) {
                BigDecimal discountAmount = BigDecimal.ZERO;

                if (DiscountType.PERCENTAGE.equals(discount.getDiscountType())) {
                    discountAmount = originalPrice.multiply(discount.getDiscountValue())
                            .divide(BigDecimal.valueOf(100));

                    // Apply maximum discount cap if exists
                    if (discount.getMaxDiscountAmount() != null &&
                            discountAmount.compareTo(discount.getMaxDiscountAmount()) > 0) {
                        discountAmount = discount.getMaxDiscountAmount();
                    }
                } else if (DiscountType.FIXED_AMOUNT.equals(discount.getDiscountType())) {
                    discountAmount = discount.getDiscountValue();
                }

                BigDecimal discountedPrice = originalPrice.subtract(discountAmount);
                if (discountedPrice.compareTo(BigDecimal.ZERO) < 0) {
                    discountedPrice = BigDecimal.ZERO;
                }

                if (discountedPrice.compareTo(bestPrice) < 0) {
                    bestPrice = discountedPrice;
                }
            }
        }

        return bestPrice;
    }


}
