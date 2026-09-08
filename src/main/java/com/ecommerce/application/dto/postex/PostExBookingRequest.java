package com.ecommerce.application.dto.postex;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostExBookingRequest {
    private String cityName;
    private String customerName;
    private String customerPhone;
    private String deliveryAddress;
    private BigDecimal invoicePayment;
    private String orderDetail;
    private String orderRefNumber;
    @Builder.Default
    private String orderType = "Normal";
    private String pickupAddressCode;
    private Integer invoiceDivisionId;
    private Integer items;
    private String transactionNotes;
}
