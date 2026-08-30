package com.ecommerce.application.integration;

import com.ecommerce.application.AbstractIntegrationTest;
import com.ecommerce.application.TestDataFactory;
import com.ecommerce.application.entity.*;
import com.ecommerce.application.enums.OrderStatus;
import com.ecommerce.application.enums.PaymentStatus;
import com.ecommerce.application.repository.*;
import com.ecommerce.application.service.impl.PaymentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.tomakehurst.wiremock.client.WireMock;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SafePayPaymentFlowIT extends AbstractIntegrationTest {

    private MockMvc mockMvc;
    @Autowired private WebApplicationContext webApplicationContext;

    @BeforeEach
    void setUpMockMvc() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
    }

    @Autowired private OrderRepository orderRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private ProductVariantRepository productVariantRepository;
    @Autowired private OrderItemRepository orderItemRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private ObjectMapper objectMapper;

    private final String webhookSecret = "test-webhook-secret";
    private Order order;

    @BeforeEach
    void setUp() {
        User user = userRepository.save((User) TestDataFactory.aCustomerUser().build());
        Category category = categoryRepository.save((Category) TestDataFactory.aCategory().build());
        Product product = productRepository.save((Product) TestDataFactory.aProduct().category(category).build());
        ProductVariant variant = productVariantRepository.save((ProductVariant) TestDataFactory.aVariant().product(product).build());

        order = (Order) TestDataFactory.anOrder().user(user).status(OrderStatus.PENDING).totalAmount(BigDecimal.valueOf(100.00)).build();
        order = orderRepository.save(order);

        OrderItem item = (OrderItem) TestDataFactory.anOrderItem().order(order).productVariant(variant).build();
        orderItemRepository.save(item);

        // Configure WireMock stubs for SafePay external calls
        configureWireMockStubs();
    }

    private void configureWireMockStubs() {
        // 1. Stub Create Tracker token call
        stubFor(WireMock.post(urlEqualTo("/order/payments/v3/"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("{\"data\": {\"token\": \"track_123\"}}")));

        // 2. Stub Create Auth Token passport call
        stubFor(WireMock.post(urlEqualTo("/client/passport/v1/token"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("{\"data\": \"auth_token_abc\"}")));

        // 3. Stub Get Tracker status check endpoint
        stubFor(WireMock.get(urlEqualTo("/reporter/api/v1/payments/track_123"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("{\"data\": {\"state\": \"TRACKER_ENDED\"}}")));
    }

    private String computeHmacSha256(String data, String key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(keySpec);
            byte[] hashBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hashBytes) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void fullSafePayPaymentCheckoutAndWebhookFlow() throws Exception {
        // 1. Call initiateSafePay checkout session via mockMvc
        mockMvc.perform(post("/api/payments/initiate-safepay/" + order.getId())
                .with(user("customer").roles("CUSTOMER")))
                .andExpect(status().isOk());

        // Assert: payment record is INITIATED and order status updated to PROCESSING
        Payment initiatedPayment = paymentRepository.findByOrderId(order.getId()).orElse(null);
        assertThat(initiatedPayment).isNotNull();
        assertThat(initiatedPayment.getPaymentStatus()).isEqualTo(PaymentStatus.INITIATED);
        assertThat(initiatedPayment.getStripePaymentIntentId()).isEqualTo("track_123");

        Order dbOrderAfterInitiate = orderRepository.findById(order.getId()).orElse(null);
        assertThat(dbOrderAfterInitiate).isNotNull();
        assertThat(dbOrderAfterInitiate.getStatus()).isEqualTo(OrderStatus.PROCESSING);

        // 2. Simulate Webhook callback indicating payment success
        String timestamp = "1700000000";
        String rawBody = "{\"type\":\"payment.succeeded\",\"data\":{\"tracker\":\"track_123\"}}";
        String signature = computeHmacSha256(timestamp + "." + rawBody, webhookSecret);

        mockMvc.perform(post("/api/payments/webhook/safepay")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-SFPY-SIGNATURE", signature)
                .header("X-SFPY-TIMESTAMP", timestamp)
                .content(rawBody))
                .andExpect(status().isOk());

        // Assert: payment record is SUCCESS and order status is CONFIRMED
        Payment successPayment = paymentRepository.findByOrderId(order.getId()).orElse(null);
        assertThat(successPayment).isNotNull();
        assertThat(successPayment.getPaymentStatus()).isEqualTo(PaymentStatus.SUCCESS);

        Order confirmedOrder = orderRepository.findById(order.getId()).orElse(null);
        assertThat(confirmedOrder).isNotNull();
        assertThat(confirmedOrder.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
    }
}
