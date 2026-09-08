package com.ecommerce.application.repository;

import com.ecommerce.application.AbstractIntegrationTest;
import com.ecommerce.application.TestDataFactory;
import com.ecommerce.application.entity.Product;
import com.ecommerce.application.entity.ProductRecommendation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Transactional
class ProductRecommendationRepositoryIT extends AbstractIntegrationTest {

    @Autowired private ProductRecommendationRepository repository;
    @Autowired private ProductRepository productRepository;

    private Product productA;
    private Product productB;

    @BeforeEach
    void setUp() {
        productA = productRepository.save((Product) TestDataFactory.aProduct().name("Product A").build());
        productB = productRepository.save((Product) TestDataFactory.aProduct().name("Product B").build());
    }

    @Test
    void duplicateRecommendations_throwsDataIntegrityViolationException() {
        ProductRecommendation rec1 = ProductRecommendation.builder()
                .product(productA)
                .recommendedProduct(productB)
                .displayOrder(1)
                .build();
        repository.saveAndFlush(rec1);

        ProductRecommendation rec2 = ProductRecommendation.builder()
                .product(productA)
                .recommendedProduct(productB) // duplicate recommended product for same base product
                .displayOrder(2)
                .build();

        // Under MySQL, saving duplicate columns on unique constraint should throw DataIntegrityViolationException
        assertThatThrownBy(() -> repository.saveAndFlush(rec2))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
