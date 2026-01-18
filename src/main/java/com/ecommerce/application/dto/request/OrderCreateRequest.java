package com.ecommerce.application.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderCreateRequest {
    @NotNull(message = "Shipping Address ID is required")
    private Long shippingAddressId;

    @NotEmpty(message = "Order items cannot be empty")
    private List<OrderItemRequest> items;

    private String discountCode;
}
