package com.ecommerce.application.controller;

import com.ecommerce.application.dto.request.FirebaseAuthRequest;
import com.ecommerce.application.dto.request.LoginRequest;
import com.ecommerce.application.dto.request.RegisterRequest;
import com.ecommerce.application.dto.response.ApiResponse;
import com.ecommerce.application.dto.response.AuthResponse;
import com.ecommerce.application.service.impl.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/firebase")
    public ResponseEntity<ApiResponse<AuthResponse>> loginWithFirebase(@Valid @RequestBody FirebaseAuthRequest request) {
        AuthResponse response = authService.loginWithFirebase(request);
        return ResponseEntity.ok(ApiResponse.success("Firebase login successful", response));
    }
}