package com.ecommerce.application.dto.postex;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class PostExBookingResponse {
    private String statusCode;
    private String statusMessage;
    private DistData dist;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DistData {
        private String trackingNumber;
        private String orderRefNumber;
        private BigDecimal invoicePayment;
        private String customerName;
        private String customerPhone;
        private String deliveryAddress;
        private String cityName;
        private String transactionStatus;
    }
}
