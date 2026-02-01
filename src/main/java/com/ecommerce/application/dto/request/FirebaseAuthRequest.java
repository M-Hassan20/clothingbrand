package com.ecommerce.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FirebaseAuthRequest {

    @NotBlank(message = "Firebase ID token is required")
    private String idToken;
}