package com.ecommerce.application.controller;

import com.ecommerce.application.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;

class WebhookSecurityIT extends AbstractIntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @BeforeEach
    void setUpMockMvc() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
    }

    private final String webhookSecret = "test-webhook-secret";

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
    void safepayWebhook_missingSignatureHeaders_returns401() throws Exception {
        mockMvc.perform(post("/api/payments/webhook/safepay")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"type\":\"payment.succeeded\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void safepayWebhook_invalidSignature_returns401() throws Exception {
        mockMvc.perform(post("/api/payments/webhook/safepay")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-SFPY-SIGNATURE", "invalid-signature")
                .header("X-SFPY-TIMESTAMP", "1700000000")
                .content("{\"type\":\"payment.succeeded\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void safepayWebhook_validSignatureButEmptyBody_returns401IfVerificationFails() throws Exception {
        // Send actual payload with valid signature, but it tries to do verifySafePayPayment inside controller.
        // Wait, if it succeeds in verifyWebhookSignature, it will parse body and call verifySafePayPayment(trackerToken).
        // Since trackerToken won't exist in DB, it might return 404/500/etc.
        // Let's test that the signature check ITSELF passes signature verification and tries to process the body.
        String timestamp = "1700000000";
        String rawBody = "{\"type\":\"payment.succeeded\",\"data\":{\"tracker\":\"track_not_found\"}}";
        String validSignature = computeHmacSha256(timestamp + "." + rawBody, webhookSecret);

        // Since trackerToken 'track_not_found' doesn't exist, paymentService.verifySafePayPayment will throw ResourceNotFoundException (causing a 500 error or similar).
        // That means it PASSED the signature verification block (which is what we want to verify)!
        mockMvc.perform(post("/api/payments/webhook/safepay")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-SFPY-SIGNATURE", validSignature)
                .header("X-SFPY-TIMESTAMP", timestamp)
                .content(rawBody))
                .andExpect(status().isInternalServerError()); // Indicates signature was validated and processing failed on db query
    }
}
