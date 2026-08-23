package com.ecommerce.application.controller;

import com.ecommerce.application.dto.payment.SafePayCheckoutResponse;
import com.ecommerce.application.dto.response.ApiResponse;
import com.ecommerce.application.dto.response.PaymentResponse;
import com.ecommerce.application.service.impl.PaymentService;
import com.ecommerce.application.service.impl.SafePayService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentService paymentService;
    private final SafePayService safePayService;
    private final ObjectMapper objectMapper; // was missing — required by the webhook handler below

    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentByOrderId(@PathVariable Long orderId) {
        PaymentResponse response = paymentService.getPaymentByOrderId(orderId);
        return ResponseEntity.ok(ApiResponse.success("Payment details retrieved", response));
    }

    @PostMapping("/initiate-safepay/{orderId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<SafePayCheckoutResponse>> initiateSafePay(
            @PathVariable Long orderId,
            @RequestParam(required = false, defaultValue = "CYBERSOURCE") String intent) {
        var session = paymentService.initiateSafePayCheckout(orderId, intent);
        return ResponseEntity.ok(ApiResponse.success("Checkout session created", session));
    }

    @GetMapping("/verify-safepay/{trackerToken}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<PaymentResponse>> verifySafePay(@PathVariable String trackerToken) {
        PaymentResponse payment = paymentService.verifySafePayPayment(trackerToken); // now returns a DTO, not the entity
        return ResponseEntity.ok(ApiResponse.success("Payment verified", payment));
    }

    // Webhook endpoint — public, no auth (signature verification replaces auth here).
    // Takes the RAW body as a String, not a parsed Map — required for correct HMAC
    // verification. Only parse it into JSON *after* the signature check passes.
    //
    // Fully confirmed against SafePay's official webhook docs: HMAC-SHA256 over
    // `${timestamp}.${rawBody}`, signature in X-SFPY-SIGNATURE, timestamp in
    // X-SFPY-TIMESTAMP.
    @PostMapping("/webhook/safepay")
    public ResponseEntity<String> handleSafePayWebhook(
            @RequestBody String rawBody,
            @RequestHeader(value = "X-SFPY-SIGNATURE", required = false) String signature,
            @RequestHeader(value = "X-SFPY-TIMESTAMP", required = false) String timestamp) {

        if (signature == null || timestamp == null
                || !safePayService.verifyWebhookSignature(rawBody, timestamp, signature)) {
            return ResponseEntity.status(401).body("Invalid or missing signature");
        }

        try {
            Map<String, Object> payload = objectMapper.readValue(rawBody, Map.class);
            String eventType = (String) payload.get("type");
            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) payload.get("data");
            String trackerToken = (String) data.get("tracker");

            if ("payment.succeeded".equals(eventType)) {
                paymentService.verifySafePayPayment(trackerToken);
            }

            return ResponseEntity.ok("Webhook processed");
        } catch (Exception e) {
            System.err.println("SafePay webhook error: " + e.getMessage());
            return ResponseEntity.status(500).body("Error processing webhook");
        }
    }
}