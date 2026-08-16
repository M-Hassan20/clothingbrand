package com.ecommerce.application.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GuestReviewRequest {
    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotBlank(message = "Guest Email is required")
    @Email(message = "Valid Guest Email is required")
    private String guestEmail;

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating cannot exceed 5")
    private Integer rating;

    private String comment;
}
