package com.ecommerce.application.integration;

import com.ecommerce.application.AbstractIntegrationTest;
import com.ecommerce.application.TestDataFactory;
import com.ecommerce.application.dto.request.GuestReviewRequest;
import com.ecommerce.application.entity.*;
import com.ecommerce.application.enums.OrderStatus;
import com.ecommerce.application.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

class GuestReviewVerifiedPurchaseIT extends AbstractIntegrationTest {

    private MockMvc mockMvc;
    @Autowired private WebApplicationContext webApplicationContext;

    @BeforeEach
    void setUpMockMvc() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
    }

    @Autowired private UserRepository userRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private ProductVariantRepository productVariantRepository;
    @Autowired private OrderItemRepository orderItemRepository;
    @Autowired private ReviewRepository reviewRepository;
    @Autowired private ObjectMapper objectMapper;

    private User guestUser;
    private Product product;

    @BeforeEach
    void setUp() {
        guestUser = userRepository.save((User) TestDataFactory.aGuestUser().email("guest-reviewer@test.com").build());
        Category category = categoryRepository.save((Category) TestDataFactory.aCategory().build());
        product = productRepository.save((Product) TestDataFactory.aProduct().category(category).build());
        ProductVariant variant = productVariantRepository.save((ProductVariant) TestDataFactory.aVariant().product(product).build());

        // 1. Seed a guest order marked DELIVERED
        Order order = (Order) TestDataFactory.anOrder().user(guestUser).status(OrderStatus.DELIVERED).build();
        order = orderRepository.save(order);
        OrderItem item = (OrderItem) TestDataFactory.anOrderItem().order(order).productVariant(variant).build();
        orderItemRepository.save(item);
    }

    @Test
    void guestReviewFlow() throws Exception {
        // 2. Submit a guest review for that email + product -> succeeds
        GuestReviewRequest requestSuccess = new GuestReviewRequest();
        requestSuccess.setGuestEmail("guest-reviewer@test.com");
        requestSuccess.setProductId(product.getId());
        requestSuccess.setRating(5);
        requestSuccess.setComment("Amazing trench coat!");

        mockMvc.perform(post("/api/reviews/guest")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestSuccess)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.isVerifiedPurchase").value(true));

        // 3. Submit a guest review for a DIFFERENT email on the same product -> fails
        GuestReviewRequest requestFail = new GuestReviewRequest();
        requestFail.setGuestEmail("different-guest@test.com");
        requestFail.setProductId(product.getId());
        requestFail.setRating(4);
        requestFail.setComment("Cool!");

        mockMvc.perform(post("/api/reviews/guest")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestFail)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("We couldn't find a completed order under this email for this product."));
    }
}
