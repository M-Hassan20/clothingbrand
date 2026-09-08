package com.ecommerce.application.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReturnRequestDTO {
    private String reason;
    private String resolution; // "REFUND" or "EXCHANGE"
    private String bankDetails; // Bank Name + Account Title + IBAN (for COD refunds)
    private String requestedSize; // Desired size for size exchange (XS, S, M, L, XL, XXL)
    private String remarks; // Optional customer notes / remarks
    private String guestEmail;  // Optional, for guest verification
}
