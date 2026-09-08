package com.ecommerce.application.service;

import com.ecommerce.application.dto.request.FirebaseAuthRequest;
import com.ecommerce.application.dto.request.RegisterRequest;
import com.ecommerce.application.dto.response.AuthResponse;
import com.ecommerce.application.entity.User;
import com.ecommerce.application.enums.Role;
import com.ecommerce.application.repository.UserRepository;
import com.ecommerce.application.security.JwtUtil;
import com.ecommerce.application.service.impl.AuthService;
import com.ecommerce.application.service.impl.EmailService;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private AuthService authService;

    @Test
    void register_brandNewEmail_createsRegisteredUser() {
        RegisterRequest request = new RegisterRequest("New User", "new@test.com", "password123", "12345");

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtUtil.generateToken(any(), any(), any())).thenReturn("mock-jwt-token");

        AuthResponse response = authService.register(request);

        assertThat(response.getEmail()).isEqualTo("new@test.com");
        assertThat(response.getFullName()).isEqualTo("New User");
        assertThat(response.getToken()).isEqualTo("mock-jwt-token");

        verify(userRepository).save(argThat(user -> 
            !user.getIsGuest() &&
            user.getRole() == Role.CUSTOMER &&
            user.getPassword().equals("encoded-password")
        ));
        verify(emailService).sendWelcomeEmail("new@test.com", "New User");
    }

    @Test
    void register_existingGuestEmail_claimsAndConvertsGuestToRegistered() {
        RegisterRequest request = new RegisterRequest("Claimed User", "guest@test.com", "password123", "54321");
        User existingGuest = User.builder()
                .id(10L)
                .email("guest@test.com")
                .fullName("Guest User")
                .isGuest(true)
                .role(Role.CUSTOMER)
                .build();

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(existingGuest));
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encoded-password");
        when(userRepository.save(existingGuest)).thenReturn(existingGuest);
        when(jwtUtil.generateToken(any(), any(), any())).thenReturn("mock-jwt-token");

        AuthResponse response = authService.register(request);

        assertThat(response.getEmail()).isEqualTo("guest@test.com");
        assertThat(response.getFullName()).isEqualTo("Claimed User");
        assertThat(response.getToken()).isEqualTo("mock-jwt-token");
        assertThat(existingGuest.getIsGuest()).isFalse();
        assertThat(existingGuest.getPassword()).isEqualTo("encoded-password");
        assertThat(existingGuest.getPhone()).isEqualTo("54321");

        verify(userRepository).save(existingGuest);
    }

    @Test
    void register_existingRegisteredEmail_throwsException() {
        RegisterRequest request = new RegisterRequest("Dup User", "registered@test.com", "password123", "123");
        User existingRegistered = User.builder()
                .email("registered@test.com")
                .isGuest(false)
                .build();

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(existingRegistered));

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Email already in use");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void loginWithFirebase_claimsGuestUserByEmail() throws Exception {
        FirebaseAuthRequest request = new FirebaseAuthRequest();
        request.setIdToken("firebase-token-123");

        try (MockedStatic<FirebaseAuth> firebaseMock = Mockito.mockStatic(FirebaseAuth.class)) {
            FirebaseAuth mockAuth = mock(FirebaseAuth.class);
            FirebaseToken mockToken = mock(FirebaseToken.class);

            firebaseMock.when(FirebaseAuth::getInstance).thenReturn(mockAuth);
            when(mockAuth.verifyIdToken("firebase-token-123")).thenReturn(mockToken);
            when(mockToken.getUid()).thenReturn("fb-uid-999");
            when(mockToken.getEmail()).thenReturn("guest@test.com");
            when(mockToken.getName()).thenReturn("Guest User");

            User existingGuest = User.builder()
                    .id(15L)
                    .email("guest@test.com")
                    .isGuest(true)
                    .role(Role.CUSTOMER)
                    .build();

            when(userRepository.findByFirebaseUid("fb-uid-999")).thenReturn(Optional.empty());
            when(userRepository.findByEmail("guest@test.com")).thenReturn(Optional.of(existingGuest));
            when(userRepository.save(existingGuest)).thenReturn(existingGuest);
            when(jwtUtil.generateToken(any(), any(), any())).thenReturn("mock-jwt-token");

            AuthResponse response = authService.loginWithFirebase(request);

            assertThat(response.getToken()).isEqualTo("mock-jwt-token");
            assertThat(existingGuest.getFirebaseUid()).isEqualTo("fb-uid-999");
            assertThat(existingGuest.getIsGuest()).isFalse();

            verify(userRepository).save(existingGuest);
        }
    }
}
