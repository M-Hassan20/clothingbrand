package com.ecommerce.application;

import com.ecommerce.application.entity.*;
import com.ecommerce.application.enums.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;

public class TestDataFactory {

    public static User.UserBuilder<?, ?> aGuestUser() {
        return User.builder()
                .email("guest@test.com")
                .fullName("Guest User")
                .isGuest(true)
                .role(Role.CUSTOMER);
    }

    public static User.UserBuilder<?, ?> aCustomerUser() {
        return User.builder()
                .email("customer@test.com")
                .fullName("Customer User")
                .isGuest(false)
                .role(Role.CUSTOMER);
    }

    public static User.UserBuilder<?, ?> anAdminUser() {
        return User.builder()
                .email("admin@test.com")
                .fullName("Admin User")
                .isGuest(false)
                .role(Role.ADMIN);
    }

    public static Category.CategoryBuilder<?, ?> aCategory() {
        return Category.builder()
                .name("Test Category");
    }

    public static Product.ProductBuilder<?, ?> aProduct() {
        return Product.builder()
                .name("Test Product")
                .description("This is a description for Test Product.")
                .isActive(true)
                .brand("Test Brand")
                .status(ProductStatus.ACTIVE);
    }

    public static ProductVariant.ProductVariantBuilder<?, ?> aVariant() {
        return ProductVariant.builder()
                .size("M")
                .color("Beige")
                .price(BigDecimal.valueOf(100.00))
                .stockQuantity(50)
                .sku("TEST-PROD-M-BEIGE")
                .isActive(true)
                .additionalImageUrls(new ArrayList<>());
    }

    public static Order.OrderBuilder<?, ?> anOrder() {
        return Order.builder()
                .status(OrderStatus.PENDING)
                .totalAmount(BigDecimal.valueOf(100.00))
                .discountAmount(BigDecimal.ZERO);
    }

    public static OrderItem.OrderItemBuilder<?, ?> anOrderItem() {
        return OrderItem.builder()
                .quantity(1)
                .priceSnapshot(BigDecimal.valueOf(100.00))
                .productNameSnapshot("Test Product");
    }

    public static Review.ReviewBuilder<?, ?> aReview() {
        return Review.builder()
                .rating(5)
                .comment("Excellent product!")
                .isVerifiedPurchase(true)
                .isApproved(true);
    }

    public static BlogPost.BlogPostBuilder<?, ?> aBlogPost() {
        return BlogPost.builder()
                .title("Test Blog Post")
                .slug("test-blog-post")
                .excerpt("This is an excerpt.")
                .contentHtml("<p>This is blog content.</p>")
                .authorName("Author")
                .category("Fashion")
                .isPublished(true)
                .publishedAt(LocalDateTime.now());
    }

    public static Discount.DiscountBuilder<?, ?> aDiscount() {
        return Discount.builder()
                .code("PROMO10")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(10.00))
                .minOrderAmount(BigDecimal.ZERO)
                .isActive(true)
                .isAutoApplied(false)
                .currentUsageCount(0)
                .validFrom(LocalDateTime.now().minusDays(1))
                .validUntil(LocalDateTime.now().plusDays(10));
    }

    public static Address.AddressBuilder<?, ?> anAddress() {
        return Address.builder()
                .label("Home")
                .street("123 Test St")
                .city("Test City")
                .country("Test Country")
                .zipCode("12345")
                .isDefault(true);
    }
}
