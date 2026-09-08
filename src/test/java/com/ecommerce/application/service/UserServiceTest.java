package com.ecommerce.application.service;

import com.ecommerce.application.entity.User;
import com.ecommerce.application.enums.Role;
import com.ecommerce.application.repository.UserRepository;
import com.ecommerce.application.service.impl.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    void findOrCreateGuestUser_emailNotFound_createsNewGuestUser() {
        String email = "new-guest@test.com";
        String fullName = "New Guest";
        String phone = "123456789";

        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = userService.findOrCreateGuestUser(email, fullName, phone);

        assertThat(result.getEmail()).isEqualTo(email);
        assertThat(result.getFullName()).isEqualTo(fullName);
        assertThat(result.getPhone()).isEqualTo(phone);
        assertThat(result.getIsGuest()).isTrue();
        assertThat(result.getRole()).isEqualTo(Role.CUSTOMER);
        assertThat(result.getPassword()).isNull();

        verify(userRepository).save(any(User.class));
    }

    @Test
    void findOrCreateGuestUser_existingGuest_reusesAndUpdatesDetails() {
        String email = "existing-guest@test.com";
        User existingGuest = User.builder()
                .id(1L)
                .email(email)
                .fullName("Old Name")
                .phone("000000000")
                .isGuest(true)
                .role(Role.CUSTOMER)
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(existingGuest));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = userService.findOrCreateGuestUser(email, "New Name", "111111111");

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getEmail()).isEqualTo(email);
        assertThat(result.getFullName()).isEqualTo("New Name");
        assertThat(result.getPhone()).isEqualTo("111111111");
        assertThat(result.getIsGuest()).isTrue();

        verify(userRepository).save(existingGuest);
    }

    @Test
    void findOrCreateGuestUser_existingRegisteredUser_reusesAndDoesNotModifySensitiveFields() {
        String email = "registered@test.com";
        User registeredUser = User.builder()
                .id(2L)
                .email(email)
                .fullName("Registered User")
                .phone("999999999")
                .password("encoded-password")
                .firebaseUid("fb-uid-123")
                .isGuest(false)
                .role(Role.CUSTOMER)
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(registeredUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = userService.findOrCreateGuestUser(email, "New Name", "111111111");

        assertThat(result.getId()).isEqualTo(2L);
        assertThat(result.getEmail()).isEqualTo(email);
        assertThat(result.getFullName()).isEqualTo("New Name");
        assertThat(result.getPhone()).isEqualTo("111111111");
        assertThat(result.getIsGuest()).isFalse();
        assertThat(result.getPassword()).isEqualTo("encoded-password");
        assertThat(result.getFirebaseUid()).isEqualTo("fb-uid-123");
        assertThat(result.getRole()).isEqualTo(Role.CUSTOMER);

        verify(userRepository).save(registeredUser);
    }
}
