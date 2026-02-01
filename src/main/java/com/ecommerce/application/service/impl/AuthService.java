package com.ecommerce.application.service.impl;

import com.ecommerce.application.dto.request.FirebaseAuthRequest;
import com.ecommerce.application.dto.request.LoginRequest;
import com.ecommerce.application.dto.request.RegisterRequest;
import com.ecommerce.application.dto.response.AuthResponse;
import com.ecommerce.application.enums.Role;
import com.ecommerce.application.entity.User;
import com.ecommerce.application.repository.UserRepository;
import com.ecommerce.application.security.JwtUtil;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        // Create new user
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setRole(Role.CUSTOMER);

        User savedUser = userRepository.save(user);

        // Generate JWT token
        String token = jwtUtil.generateToken(
                savedUser.getEmail(),
                savedUser.getId(),
                savedUser.getRole().toString()
        );

        return AuthResponse.builder()
                .token(token)
                .userId(savedUser.getId())
                .email(savedUser.getEmail())
                .fullName(savedUser.getFullName())
                .role(savedUser.getRole())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        // Authenticate user
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // Get user details
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate JWT token
        String token = jwtUtil.generateToken(
                user.getEmail(),
                user.getId(),
                user.getRole().toString()
        );

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }

    @Transactional
    public AuthResponse loginWithFirebase(FirebaseAuthRequest request) {
        try {
            // Verify Firebase token
            FirebaseToken decodedToken = FirebaseAuth.getInstance()
                    .verifyIdToken(request.getIdToken());

            String firebaseUid = decodedToken.getUid();
            String email = decodedToken.getEmail();
            String name = decodedToken.getName();

            // Get or create user
            User user = userRepository.findByFirebaseUid(firebaseUid)
                    .orElseGet(() -> {
                        User newUser = new User();
                        newUser.setFirebaseUid(firebaseUid);
                        newUser.setEmail(email);
                        newUser.setFullName(name);
                        newUser.setRole(Role.CUSTOMER);
                        return userRepository.save(newUser);
                    });

            // Generate JWT token
            String token = jwtUtil.generateToken(
                    user.getEmail(),
                    user.getId(),
                    user.getRole().toString()
            );

            return AuthResponse.builder()
                    .token(token)
                    .userId(user.getId())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .role(user.getRole())
                    .build();

        } catch (FirebaseAuthException e) {
            throw new RuntimeException("Invalid Firebase token: " + e.getMessage());
        }
    }
}