package com.ecommerce.application.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GuestCheckoutRequest {
    @NotBlank(message = "Guest Name is required")
    private String guestName;

    @NotBlank(message = "Guest Email is required")
    @Email(message = "Valid Guest Email is required")
    private String guestEmail;

    @NotBlank(message = "Guest Phone is required")
    private String guestPhone;

    @NotBlank(message = "Shipping Street is required")
    private String shippingStreet;

    @NotBlank(message = "Shipping City is required")
    private String shippingCity;

    @NotBlank(message = "Shipping Country is required")
    private String shippingCountry;

    @NotBlank(message = "Shipping Zip Code is required")
    private String shippingZipCode;

    @NotEmpty(message = "Order items cannot be empty")
    private List<OrderItemRequest> items;

    private String discountCode;
}
