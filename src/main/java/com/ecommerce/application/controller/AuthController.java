package com.ecommerce.application.controller;

import com.ecommerce.application.dto.request.FirebaseAuthRequest;
import com.ecommerce.application.dto.request.LoginRequest;
import com.ecommerce.application.dto.request.RegisterRequest;
import com.ecommerce.application.dto.response.ApiResponse;
import com.ecommerce.application.dto.response.AuthResponse;
import com.ecommerce.application.dto.request.ForgotPasswordRequest;
import com.ecommerce.application.dto.request.ResetPasswordRequest;
import com.ecommerce.application.service.impl.AuthService;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseCookie;
import org.springframework.http.HttpHeaders;




@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request, HttpServletResponse response) {
        AuthResponse authResponse = authService.register(request);
        setCookie(response, authResponse.getToken());
        return ResponseEntity.ok(ApiResponse.success("Registration successful", authResponse));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        AuthResponse authResponse = authService.login(request);
        setCookie(response, authResponse.getToken());
        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }

    @PostMapping("/firebase")
    public ResponseEntity<ApiResponse<AuthResponse>> loginWithFirebase(@Valid @RequestBody FirebaseAuthRequest request, HttpServletResponse response) {
        AuthResponse authResponse = authService.loginWithFirebase(request);
        setCookie(response, authResponse.getToken());
        return ResponseEntity.ok(ApiResponse.success("Firebase login successful", authResponse));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("token", "")
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success("If an account exists with this email, a 6-digit verification code has been sent.", null));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password updated successfully. You can now log in.", null));
    }

    private void setCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from("token", token)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(7 * 24 * 60 * 60) // 7 days
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}