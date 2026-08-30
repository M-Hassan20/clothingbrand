package com.ecommerce.application.service;

import com.ecommerce.application.entity.Product;
import com.ecommerce.application.entity.ProductVariant;
import com.ecommerce.application.repository.ProductVariantRepository;
import com.ecommerce.application.service.impl.ProductVariantServiceImpl;
import com.ecommerce.application.service.impl.RevalidationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductVariantServiceTest {

    @Mock
    private ProductVariantRepository productVariantRepository;

    @Mock
    private RevalidationService revalidationService;

    @InjectMocks
    private ProductVariantServiceImpl productVariantService;

    @Test
    void decreaseStock_insufficientStock_throwsException() {
        ProductVariant variant = ProductVariant.builder().id(1L).stockQuantity(5).build();
        when(productVariantRepository.findById(1L)).thenReturn(Optional.of(variant));

        assertThatThrownBy(() -> productVariantService.decreaseStock(1L, 10))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Insufficient Stock for Variant: 1");

        verify(productVariantRepository, never()).save(any());
    }

    @Test
    void decreaseStock_sufficientStock_decrementsAndTriggersRevalidation() {
        Product product = Product.builder().id(100L).build();
        ProductVariant variant = ProductVariant.builder().id(1L).product(product).stockQuantity(15).build();

        when(productVariantRepository.findById(1L)).thenReturn(Optional.of(variant));
        when(productVariantRepository.save(variant)).thenReturn(variant);

        productVariantService.decreaseStock(1L, 5);

        assertThat(variant.getStockQuantity()).isEqualTo(10);
        verify(productVariantRepository).save(variant);
        verify(revalidationService).revalidate("products", "product-100");
    }

    @Test
    void increaseStock_incrementsAndTriggersRevalidation() {
        Product product = Product.builder().id(100L).build();
        ProductVariant variant = ProductVariant.builder().id(1L).product(product).stockQuantity(10).build();

        when(productVariantRepository.findById(1L)).thenReturn(Optional.of(variant));
        when(productVariantRepository.save(variant)).thenReturn(variant);

        productVariantService.increaseStock(1L, 5);

        assertThat(variant.getStockQuantity()).isEqualTo(15);
        verify(productVariantRepository).save(variant);
        verify(revalidationService).revalidate("products", "product-100");
    }
}
