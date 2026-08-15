package com.ecommerce.application.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JazzCashFormData {
    private String actionUrl;
    private Map<String, String> fields;
}
