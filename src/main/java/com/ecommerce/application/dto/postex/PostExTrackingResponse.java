package com.ecommerce.application.dto.postex;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class PostExTrackingResponse {
    private String statusCode;
    private String statusMessage;
    private TrackingDistData dist;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TrackingDistData {
        private String trackingNumber;
        private String orderRefNumber;
        private String transactionStatus;
        private String transactionStatusId;
        private String transactionStatusDate;
        private String customerName;
        private String customerPhone;
        private String deliveryAddress;
        private BigDecimal invoicePayment;
        private String cityName;
        private String pickupAddressCode;
        private List<TrackingHistory> trackingHistory;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TrackingHistory {
        private String status;
        private String statusId;
        private String statusDate;
        private String comments;
    }
}
