package com.ecommerce.application.repository;

import com.ecommerce.application.AbstractIntegrationTest;
import com.ecommerce.application.TestDataFactory;
import com.ecommerce.application.entity.Category;
import com.ecommerce.application.entity.Product;
import com.ecommerce.application.entity.ProductVariant;
import com.ecommerce.application.enums.ProductStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
class ProductRepositoryIT extends AbstractIntegrationTest {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    private Category category;
    private Product activeProduct;
    private Product draftProduct;

    @BeforeEach
    void setUp() {
        category = categoryRepository.save((Category) TestDataFactory.aCategory().name("Coats").build());

        activeProduct = (Product) TestDataFactory.aProduct()
                .name("Beige Trench Coat")
                .brand("BrandA")
                .category(category)
                .isActive(true)
                .status(ProductStatus.ACTIVE)
                .build();
        activeProduct = productRepository.save(activeProduct);

        ProductVariant activeVariant = (ProductVariant) TestDataFactory.aVariant()
                .product(activeProduct)
                .price(BigDecimal.valueOf(100.00))
                .stockQuantity(10)
                .sku("BEIGE-TRENCH-M")
                .build();
        productVariantRepository.save(activeVariant);

        draftProduct = (Product) TestDataFactory.aProduct()
                .name("Draft Wool Coat")
                .brand("BrandB")
                .category(category)
                .isActive(false)
                .status(ProductStatus.DRAFT)
                .build();
        draftProduct = productRepository.save(draftProduct);

        ProductVariant draftVariant = (ProductVariant) TestDataFactory.aVariant()
                .product(draftProduct)
                .price(BigDecimal.valueOf(200.00))
                .stockQuantity(5)
                .sku("DRAFT-WOOL-M")
                .build();
        productVariantRepository.save(draftVariant);
    }

    @Test
    void findAllForAdmin_nullFilters_returnsAllProductsIncludingDrafts() {
        Page<Product> page = productRepository.findAllForAdmin(null, null, "ALL", PageRequest.of(0, 10));
        assertThat(page.getContent()).hasSize(2);
    }

    @Test
    void findAllForAdmin_filterByCategoryAndStatus_returnsCorrectProducts() {
        Page<Product> pageActive = productRepository.findAllForAdmin(category.getId(), null, "ACTIVE", PageRequest.of(0, 10));
        assertThat(pageActive.getContent()).containsExactly(activeProduct);

        Page<Product> pageDraft = productRepository.findAllForAdmin(category.getId(), null, "DRAFT", PageRequest.of(0, 10));
        assertThat(pageDraft.getContent()).containsExactly(draftProduct);
    }

    @Test
    void findByFilters_priceRangeBoundariesAreInclusive() {
        // Search minPrice=100.00, maxPrice=100.00 (should find activeProduct)
        Page<Product> page1 = productRepository.findByFilters(
                null, null, BigDecimal.valueOf(100.00), BigDecimal.valueOf(100.00), null, PageRequest.of(0, 10));
        assertThat(page1.getContent()).containsExactly(activeProduct);

        // Search minPrice=100.00, maxPrice=200.00 (should find both active and draft since active is 100, draft is 200, and they are active in DB)
        // Wait, does findByFilters require p.isActive = true? Let's check: Yes, "AND p.isActive = true".
        // Since draftProduct has isActive=false, only activeProduct will be returned.
        Page<Product> page2 = productRepository.findByFilters(
                null, null, BigDecimal.valueOf(100.00), BigDecimal.valueOf(200.00), null, PageRequest.of(0, 10));
        assertThat(page2.getContent()).containsExactly(activeProduct);
    }
}
