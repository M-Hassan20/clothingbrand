package com.ecommerce.application.service;

import com.ecommerce.application.entity.Discount;
import com.ecommerce.application.enums.DiscountType;
import com.ecommerce.application.repository.DiscountRepository;
import com.ecommerce.application.service.impl.DiscountService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DiscountServiceTest {

    @Mock
    private DiscountRepository discountRepository;

    @InjectMocks
    private DiscountService discountService;

    @Test
    void calculateDiscount_percentageTypeRespectsMaxCap() {
        Discount discount = Discount.builder()
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(20.00)) // 20%
                .maxDiscountAmount(BigDecimal.valueOf(30.00)) // capped at 30
                .minOrderAmount(BigDecimal.ZERO)
                .build();

        // 20% of 200 is 40, which exceeds cap of 30
        BigDecimal discountAmount = discountService.calculateDiscount(discount, BigDecimal.valueOf(200.00));
        assertThat(discountAmount).isEqualByComparingTo(BigDecimal.valueOf(30.00));
    }

    @Test
    void calculateDiscount_fixedTypeDoesNotExceedOrderTotal() {
        Discount discount = Discount.builder()
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(150.00))
                .minOrderAmount(BigDecimal.ZERO)
                .build();

        // fixed discount of 150 applied to order total of 100
        BigDecimal discountAmount = discountService.calculateDiscount(discount, BigDecimal.valueOf(100.00));
        assertThat(discountAmount).isEqualByComparingTo(BigDecimal.valueOf(100.00));
    }

    @Test
    void calculateDiscount_orderBelowMinAmount_throwsException() {
        Discount discount = Discount.builder()
                .minOrderAmount(BigDecimal.valueOf(50.00))
                .build();

        assertThatThrownBy(() -> discountService.calculateDiscount(discount, BigDecimal.valueOf(40.00)))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Order amount must be at least 50.0 to use this discount");
    }

    @Test
    void applyDiscount_incrementsUsageCountAndReturnsRemainingAmount() {
        Discount discount = Discount.builder()
                .id(1L)
                .code("PROMO10")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(10.00)) // 10%
                .minOrderAmount(BigDecimal.ZERO)
                .build();

        when(discountRepository.findValidDiscountByCode(eq("PROMO10"), any(LocalDateTime.class)))
                .thenReturn(Optional.of(discount));

        BigDecimal finalAmount = discountService.applyDiscount("PROMO10", BigDecimal.valueOf(100.00));

        assertThat(finalAmount).isEqualByComparingTo(BigDecimal.valueOf(90.00));
        verify(discountRepository).incrementUsageCount(1L);
    }
}
