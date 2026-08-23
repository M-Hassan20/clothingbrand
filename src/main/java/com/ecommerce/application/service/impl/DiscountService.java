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

        return DiscountValidateResponse.builder()
                .valid(true)
                .code(discount.getCode())
                .discountType(discount.getDiscountType())
                .discountValue(discount.getDiscountValue())
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .message("Promo code applied successfully!")
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

        BigDecimal discountAmount;

        if (discount.getDiscountType().toString().equals("PERCENTAGE")) {
            discountAmount = orderAmount.multiply(discount.getDiscountValue())
                    .divide(BigDecimal.valueOf(100));

            // Apply maximum discount cap if exists
            if (discount.getMaxDiscountAmount() != null &&
                    discountAmount.compareTo(discount.getMaxDiscountAmount()) > 0) {
                discountAmount = discount.getMaxDiscountAmount();
            }
        } else { // FIXED_AMOUNT
            discountAmount = discount.getDiscountValue();
        }

        // Ensure discount doesn't exceed order amount
        if (discountAmount.compareTo(orderAmount) > 0) {
            discountAmount = orderAmount;
        }

        return discountAmount;
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
    public Discount createDiscount(DiscountRequest request) {
        if (discountRepository.findByCode(request.getCode()).isPresent()) {
            throw new RuntimeException("Discount code already exists: " + request.getCode());
        }
        Discount discount = discountMapper.toEntity(request);
        return discountRepository.save(discount);
    }

    // Update discount (Admin)
    @Transactional
    public Discount updateDiscount(Long id, DiscountRequest request) {
        Discount discount = getDiscountById(id);
        discountMapper.updateEntityFromRequest(request, discount);
        return discountRepository.save(discount);
    }

    // Deactivate discount (Admin)
    @Transactional
    public void deactivateDiscount(Long id) {
        Discount discount = getDiscountById(id);
        discount.setIsActive(false);
        discountRepository.save(discount);
    }


}
