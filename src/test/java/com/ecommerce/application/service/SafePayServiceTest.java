package com.ecommerce.application.service;

import com.ecommerce.application.service.impl.SafePayService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class SafePayServiceTest {

    @InjectMocks
    private SafePayService safePayService;

    private final String webhookSecret = "test-webhook-secret";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(safePayService, "webhookSecret", webhookSecret);
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
    void verifyWebhookSignature_validSignature_returnsTrue() {
        String timestamp = "1700000000";
        String rawBody = "{\"type\":\"payment.succeeded\",\"data\":{\"tracker\":\"track_123\"}}";

        String signature = computeHmacSha256(timestamp + "." + rawBody, webhookSecret);

        boolean result = safePayService.verifyWebhookSignature(rawBody, timestamp, signature);
        assertThat(result).isTrue();
    }

    @Test
    void verifyWebhookSignature_tamperedBody_returnsFalse() {
        String timestamp = "1700000000";
        String rawBody = "{\"type\":\"payment.succeeded\",\"data\":{\"tracker\":\"track_123\"}}";
        String tamperedBody = "{\"type\":\"payment.succeeded\",\"data\":{\"tracker\":\"track_456\"}}";

        String signature = computeHmacSha256(timestamp + "." + rawBody, webhookSecret);

        boolean result = safePayService.verifyWebhookSignature(tamperedBody, timestamp, signature);
        assertThat(result).isFalse();
    }

    @Test
    void verifyWebhookSignature_wrongSecret_returnsFalse() {
        String timestamp = "1700000000";
        String rawBody = "{\"type\":\"payment.succeeded\",\"data\":{\"tracker\":\"track_123\"}}";

        String signature = computeHmacSha256(timestamp + "." + rawBody, "wrong-secret");

        boolean result = safePayService.verifyWebhookSignature(rawBody, timestamp, signature);
        assertThat(result).isFalse();
    }

    @Test
    void isPaymentSuccessful_trackerEnded_returnsTrue() {
        Map<String, Object> response = Map.of(
                "data", Map.of(
                        "state", "TRACKER_ENDED"
                )
        );
        assertThat(safePayService.isPaymentSuccessful(response)).isTrue();
    }

    @Test
    void isPaymentSuccessful_nestedTrackerEnded_returnsTrue() {
        Map<String, Object> response = Map.of(
                "data", Map.of(
                        "tracker", Map.of("state", "TRACKER_ENDED")
                )
        );
        assertThat(safePayService.isPaymentSuccessful(response)).isTrue();
    }

    @Test
    void isPaymentSuccessful_otherState_returnsFalse() {
        Map<String, Object> response = Map.of(
                "data", Map.of(
                        "state", "TRACKER_FAILED"
                )
        );
        assertThat(safePayService.isPaymentSuccessful(response)).isFalse();
    }

    @Test
    void isPaymentSuccessful_nullResponse_returnsFalse() {
        assertThat(safePayService.isPaymentSuccessful(null)).isFalse();
    }
}
