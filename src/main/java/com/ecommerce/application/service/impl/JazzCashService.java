package com.ecommerce.application.service.impl;

import com.ecommerce.application.dto.payment.JazzCashCallbackPayload;
import com.ecommerce.application.dto.payment.JazzCashFormData;
import com.ecommerce.application.dto.payment.JazzCashPaymentRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
public class JazzCashService {

    @Value("${jazzcash.merchant-id}")
    private String merchantId;

    @Value("${jazzcash.password}")
    private String password;

    @Value("${jazzcash.integrity-salt}")
    private String integritySalt;

    @Value("${jazzcash.return-url}")
    private String returnUrl;

    @Value("${jazzcash.currency}")
    private String currency;

    @Value("${jazzcash.txn-expiry-minutes}")
    private int txnExpiryMinutes;

    @Value("${jazzcash.sandbox.mode:true}")
    private boolean sandboxMode;

    @Value("${jazzcash.sandbox.url}")
    private String sandboxUrl;

    @Value("${jazzcash.production.url}")
    private String productionUrl;

    private static final DateTimeFormatter TXN_DATETIME_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    /**
     * Build the form data (fields + secure hash) that will be POSTed to JazzCash's hosted page
     */
    public JazzCashFormData buildPaymentForm(JazzCashPaymentRequest request) {
        LocalDateTime now = LocalDateTime.now();
        String txnDateTime = now.format(TXN_DATETIME_FORMAT);
        String txnExpiryDateTime = now.plusMinutes(txnExpiryMinutes).format(TXN_DATETIME_FORMAT);

        // Unique transaction reference - JazzCash requires format like T + timestamp
        String txnRefNo = "T" + System.currentTimeMillis();

        // Amount must be in paisa (multiply by 100), no decimals
        String amountInPaisa = request.getAmount()
                .multiply(new BigDecimal("100"))
                .setScale(0, BigDecimal.ROUND_HALF_UP)
                .toPlainString();

        // Build fields in the exact order JazzCash expects for hashing
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("pp_Version", "1.1");
        fields.put("pp_TxnType", "MWALLET"); // Or "MIGS" for card payments
        fields.put("pp_Language", "EN");
        fields.put("pp_MerchantID", merchantId);
        fields.put("pp_SubMerchantID", "");
        fields.put("pp_Password", password);
        fields.put("pp_BankID", "");
        fields.put("pp_ProductID", "");
        fields.put("pp_TxnRefNo", txnRefNo);
        fields.put("pp_Amount", amountInPaisa);
        fields.put("pp_TxnCurrency", currency);
        fields.put("pp_TxnDateTime", txnDateTime);
        fields.put("pp_BillReference", "ORDER" + request.getOrderId());
        fields.put("pp_Description", request.getDescription() != null ? request.getDescription() : "Order Payment");
        fields.put("pp_TxnExpiryDateTime", txnExpiryDateTime);
        fields.put("pp_ReturnURL", returnUrl);
        fields.put("ppmpf_1", request.getOrderId().toString()); // Custom field to track our order ID
        fields.put("ppmpf_2", "");
        fields.put("ppmpf_3", "");
        fields.put("ppmpf_4", "");
        fields.put("ppmpf_5", "");

        // Generate secure hash and add it to the fields
        String secureHash = generateSecureHash(fields);
        fields.put("pp_SecureHash", secureHash);

        return JazzCashFormData.builder()
                .actionUrl(getActionUrl())
                .fields(fields)
                .build();
    }

    /**
     * Generate HMAC-SHA256 secure hash as required by JazzCash
     * Algorithm: Sort fields alphabetically by key, concatenate values with "&",
     * prepend integrity salt, then HMAC-SHA256 with integrity salt as key
     */
    private String generateSecureHash(Map<String, String> fields) {
        // JazzCash requires alphabetical sorting of field names (excluding pp_SecureHash itself)
        TreeMap<String, String> sortedFields = new TreeMap<>(fields);

        StringBuilder hashString = new StringBuilder(integritySalt);
        for (Map.Entry<String, String> entry : sortedFields.entrySet()) {
            if (entry.getValue() != null && !entry.getValue().isEmpty()) {
                hashString.append("&").append(entry.getValue());
            }
        }

        return hmacSha256(hashString.toString(), integritySalt);
    }

    /**
     * Verify the secure hash returned in JazzCash's callback to confirm authenticity
     */
    public boolean verifyCallbackHash(JazzCashCallbackPayload payload, Map<String, String> allReturnedFields) {
        String receivedHash = payload.getPp_SecureHash();
        if (receivedHash == null) return false;

        Map<String, String> fieldsForHash = new TreeMap<>(allReturnedFields);
        fieldsForHash.remove("pp_SecureHash");

        StringBuilder hashString = new StringBuilder(integritySalt);
        for (Map.Entry<String, String> entry : new TreeMap<>(fieldsForHash).entrySet()) {
            if (entry.getValue() != null && !entry.getValue().isEmpty()) {
                hashString.append("&").append(entry.getValue());
            }
        }

        String computedHash = hmacSha256(hashString.toString(), integritySalt);
        return computedHash.equalsIgnoreCase(receivedHash);
    }

    /**
     * Check if the response code indicates success
     * JazzCash uses "000" as the success code
     */
    public boolean isPaymentSuccessful(String responseCode) {
        return "000".equals(responseCode);
    }

    private String hmacSha256(String data, String key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                    key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"
            );
            mac.init(secretKeySpec);
            byte[] hashBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));

            // JazzCash expects hex-encoded hash (uppercase)
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString().toUpperCase();
        } catch (Exception e) {
            throw new RuntimeException("Error generating JazzCash secure hash", e);
        }
    }

    private String getActionUrl() {
        return sandboxMode ? sandboxUrl : productionUrl;
    }
}