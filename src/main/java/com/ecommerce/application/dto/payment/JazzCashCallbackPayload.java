package com.ecommerce.application.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JazzCashCallbackPayload {
    private String pp_Amount;
    private String pp_BillReference;
    private String pp_TxnRefNo;
    private String pp_ResponseCode;
    private String pp_ResponseMessage;
    private String pp_SecureHash;
    private String pp_TxnDateTime;
    private String pp_RetrievalReferenceNo;
    private String pp_AuthCode;
}
