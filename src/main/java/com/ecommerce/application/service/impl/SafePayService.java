package com.ecommerce.application.service.impl;

import com.ecommerce.application.dto.payment.SafePayCheckoutResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "payment.safepay.enabled", havingValue = "true")
public class SafePayService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${safepay.secret-key}")
    private String secretKey;

    @Value("${safepay.merchant-api-key}")
    private String merchantApiKey;

    @Value("${safepay.webhook-secret}")
    private String webhookSecret;

    @Value("${safepay.sandbox.mode:true}")
    private boolean sandboxMode;

    @Value("${safepay.sandbox.api-url}")
    private String sandboxApiUrl;

    @Value("${safepay.production.api-url}")
    private String productionApiUrl;

    @Value("${safepay.redirect-url}")
    private String redirectUrl;

    @Value("${safepay.cancel-url}")
    private String cancelUrl;

    @Value("${safepay.currency:PKR}")
    private String currency;

    /**
     * Full flow: create tracker -> create auth token -> build checkout URL.
     * Every step below is confirmed either against a real sandbox test run
     * or directly against SafePay's SDK source / official docs — nothing here
     * is a guess.
     */
    public SafePayCheckoutResponse createCheckoutSession(Long orderId, BigDecimal amount, String intent) {
        String trackerToken = createTracker(orderId, amount, intent);
        String authToken = createAuthToken();
        String checkoutUrl = buildCheckoutUrl(trackerToken, authToken, orderId);

        return SafePayCheckoutResponse.builder()
                .trackerToken(trackerToken)
                .checkoutUrl(checkoutUrl)
                .build();
    }

    /**
     * POST /order/payments/v3/ — confirmed endpoint + body shape (official docs +
     * your own successful sandbox test run).
     */
    @SuppressWarnings("unchecked")
    private String createTracker(Long orderId, BigDecimal amount, String intent) {
        String url = getBaseUrl() + "/order/payments/v3/";

        // Amount must be in lowest denomination (paisa) — e.g. Rs 6,000.00 -> 600000
        long amountInPaisa = amount.multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .longValueExact();

        Map<String, Object> body = new HashMap<>();
        body.put("merchant_api_key", merchantApiKey);
        body.put("intent", intent); // "CYBERSOURCE", "MPGS", "PAYFAST", or "RAAST"
        body.put("mode", "payment");
        body.put("entry_mode", "raw");
        body.put("currency", currency);
        body.put("amount", amountInPaisa);
        body.put("metadata", Map.of("order_id", orderId.toString()));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, buildHeaders());

        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
        Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
        Map<String, Object> tracker = (Map<String, Object>) data.get("tracker");
        return (String) tracker.get("token");
    }

    /**
     * POST /client/passport/v1/token — confirmed endpoint from official docs.
     */
    @SuppressWarnings("unchecked")
    private String createAuthToken() {
        String url = getBaseUrl() + "/client/passport/v1/token";

        HttpEntity<Void> entity = new HttpEntity<>(buildHeaders());
        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
        return (String) response.getBody().get("data");
    }

    /**
     * Builds the Checkout URL. Format confirmed directly from a real, working
     * sandbox test run: /embedded/payment/auth with environment, tbt, tracker,
     * source, order_id, cancel_url, redirect_url as query params.
     */
    private String buildCheckoutUrl(String trackerToken, String authToken, Long orderId) {
        String base = getBaseUrl() + "/embedded/payment/auth";

        return base
                + "?environment=" + (sandboxMode ? "sandbox" : "production")
                + "&tbt=" + urlEncode(authToken)
                + "&tracker=" + urlEncode(trackerToken)
                + "&source=hosted"
                + "&order_id=" + urlEncode("order_" + orderId)
                + "&cancel_url=" + urlEncode(cancelUrl)
                + "&redirect_url=" + urlEncode(redirectUrl);
    }

    /**
     * GET /reporter/api/v1/payments/{tracker} — confirmed endpoint from official docs.
     * This is the AUTHORITATIVE source of truth for payment status — used both to
     * verify after the customer returns from checkout, and cross-checked against
     * the webhook. Never rely on the browser redirect alone to confirm a payment.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getTrackerStatus(String trackerToken) {
        String url = getBaseUrl() + "/reporter/api/v1/payments/" + trackerToken;
        HttpEntity<Void> entity = new HttpEntity<>(buildHeaders());
        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
        return response.getBody();
    }

    /**
     * Checks whether a tracker status response indicates a completed payment.
     * Per docs: tracker.state == "TRACKER_ENDED" means success.
     */
    @SuppressWarnings("unchecked")
    public boolean isPaymentSuccessful(Map<String, Object> trackerStatusResponse) {
        Map<String, Object> data = (Map<String, Object>) trackerStatusResponse.get("data");
        Map<String, Object> tracker = (Map<String, Object>) data.get("tracker");
        return "TRACKER_ENDED".equals(tracker.get("state"));
    }

    /**
     * Server-to-server auth. Confirmed from @sfpy/node-core's RequestSender.js source —
     * raw secret key in this custom header, no "Bearer" prefix.
     */
    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-SFPY-MERCHANT-SECRET", secretKey);
        return headers;
    }

    /**
     * Verifies a webhook payload's signature using HMAC-SHA256.
     *
     * CONFIRMED against SafePay's official webhook documentation:
     *   - Algorithm: HMAC-SHA256
     *   - Signed data: `${timestamp}.${rawBody}` — timestamp and raw body concatenated
     *     with a literal period separator
     *   - Signature header: X-SFPY-SIGNATURE
     *   - Timestamp header: X-SFPY-TIMESTAMP
     *   - Keyed with the dedicated webhook secret (distinct from the general secret key —
     *     find it in your Sandbox Dashboard's Webhooks settings)
     *
     * IMPORTANT: rawBody must be the exact, unmodified request body string SafePay sent —
     * re-serializing a parsed object will produce a different hash and always fail.
     */
    public boolean verifyWebhookSignature(String rawBody, String timestamp, String receivedSignature) {
        try {
            String dataToSign = timestamp + "." + rawBody;

            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(
                    webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(keySpec);
            byte[] hashBytes = mac.doFinal(dataToSign.getBytes(StandardCharsets.UTF_8));

            StringBuilder hex = new StringBuilder();
            for (byte b : hashBytes) {
                hex.append(String.format("%02x", b));
            }

            return hex.toString().equalsIgnoreCase(receivedSignature);
        } catch (Exception e) {
            System.err.println("Webhook signature verification failed: " + e.getMessage());
            return false;
        }
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String getBaseUrl() {
        return sandboxMode ? sandboxApiUrl : productionApiUrl;
    }
}