package com.ecommerce.application.dto.postex;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostExShipperAdviceRequest {
    private String trackingNumber;
    private String shipperAdvice; // e.g. "RE_ATTEMPT" or "RETURN_TO_SHIPPER"
    private String comments;
}
