package com.ecommerce.application.integration;

import com.ecommerce.application.AbstractIntegrationTest;
import com.ecommerce.application.TestDataFactory;
import com.ecommerce.application.dto.request.GuestCheckoutRequest;
import com.ecommerce.application.dto.request.OrderItemRequest;
import com.ecommerce.application.dto.request.RegisterRequest;
import com.ecommerce.application.dto.response.OrderResponse;
import com.ecommerce.application.entity.Category;
import com.ecommerce.application.entity.Product;
import com.ecommerce.application.entity.ProductVariant;
import com.ecommerce.application.entity.User;
import com.ecommerce.application.repository.*;
import com.ecommerce.application.service.impl.AuthService;
import com.ecommerce.application.service.impl.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class GuestCheckoutFlowIT extends AbstractIntegrationTest {

    @Autowired private OrderService orderService;
    @Autowired private AuthService authService;
    @Autowired private UserRepository userRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private ProductVariantRepository productVariantRepository;
    @Autowired private AddressRepository addressRepository;

    private ProductVariant variant;

    @BeforeEach
    void setUp() {
        Category category = categoryRepository.save((Category) TestDataFactory.aCategory().build());
        Product product = productRepository.save((Product) TestDataFactory.aProduct().category(category).build());
        variant = productVariantRepository.save((ProductVariant) TestDataFactory.aVariant().product(product).build());
    }

    @Test
    void guestCheckoutAndRegistrationClaimFlow() {
        String email = "guest-checkout@test.com";

        // 1. Place a guest order with a new email
        GuestCheckoutRequest request1 = new GuestCheckoutRequest();
        request1.setGuestEmail(email);
        request1.setGuestName("Guest User");
        request1.setGuestPhone("12345");
        request1.setShippingStreet("1 Main St");
        request1.setShippingCity("City");
        request1.setShippingCountry("Country");
        request1.setShippingZipCode("94016");

        OrderItemRequest item = new OrderItemRequest();
        item.setProductVariantId(variant.getId());
        item.setQuantity(2);
        request1.setItems(List.of(item));

        OrderResponse orderResponse1 = orderService.createGuestOrder(request1);
        assertThat(orderResponse1).isNotNull();

        // Assert: one User row created (isGuest = true, password IS NULL)
        List<User> users = userRepository.findAll();
        assertThat(users).hasSize(1);
        User dbGuestUser = users.get(0);
        assertThat(dbGuestUser.getEmail()).isEqualTo(email);
        assertThat(dbGuestUser.getIsGuest()).isTrue();
        assertThat(dbGuestUser.getPassword()).isNull();

        // Assert: Address created
        assertThat(addressRepository.findByUserId(dbGuestUser.getId())).hasSize(1);

        // Assert: Order linked
        assertThat(orderRepository.findByUserId(dbGuestUser.getId())).hasSize(1);

        // 2. Place a second guest order with the SAME email
        GuestCheckoutRequest request2 = new GuestCheckoutRequest();
        request2.setGuestEmail(email);
        request2.setGuestName("Guest User");
        request2.setGuestPhone("12345");
        request2.setShippingStreet("2 Second St");
        request2.setShippingCity("City");
        request2.setShippingCountry("Country");
        request2.setShippingZipCode("94016");
        request2.setItems(List.of(item));

        OrderResponse orderResponse2 = orderService.createGuestOrder(request2);
        assertThat(orderResponse2).isNotNull();

        // Assert: still only one User row exists for that email
        assertThat(userRepository.findAll()).hasSize(1);

        // 3. Register a real account using that same email
        RegisterRequest regRequest = new RegisterRequest("Real User", email, "secretPass123", "99999");
        authService.register(regRequest);

        // Assert: the existing row is claimed (isGuest now false, password set) - not duplicated
        List<User> finalUsers = userRepository.findAll();
        assertThat(finalUsers).hasSize(1);
        User finalUser = finalUsers.get(0);
        assertThat(finalUser.getEmail()).isEqualTo(email);
        assertThat(finalUser.getIsGuest()).isFalse();
        assertThat(finalUser.getPassword()).isNotNull();

        // Assert: both prior guest orders are now queryable for that account
        assertThat(orderRepository.findByUserId(finalUser.getId())).hasSize(2);
    }
}
