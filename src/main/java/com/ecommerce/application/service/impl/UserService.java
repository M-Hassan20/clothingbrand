package com.ecommerce.application.service.impl;

import com.ecommerce.application.exception.ResourceNotFoundException;
import com.ecommerce.application.repository.UserRepository;
import com.ecommerce.application.entity.User;
import com.ecommerce.application.enums.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    public User getUserByFirebaseUid(String firebaseUid) {
        return userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new ResourceNotFoundException("User", "FirebaseUId", firebaseUid));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public boolean existsByFirebaseUid(String firebaseUid) {
        return userRepository.existsByFirebaseUid(firebaseUid);
    }

    // Create user (called after Firebase authentication)
    @Transactional
    public User createUser(String firebaseUid, String email, String fullName) {
        if (existsByFirebaseUid(firebaseUid)) {
            throw new RuntimeException("User already exists with Firebase UID: " + firebaseUid);
        }
        if (existsByEmail(email)) {
            throw new RuntimeException("User already exists with email: " + email);
        }

        User user = new User();
        user.setFirebaseUid(firebaseUid);
        user.setEmail(email);
        user.setFullName(fullName);
        user.setRole(Role.USER); // Default role

        return userRepository.save(user);
    }

    @Transactional
    public User updateUser(Long id, String fullName, String phone) {
        User user = getUserById(id);
        if (fullName != null) {
            user.setFullName(fullName);
        }
        if (phone != null) {
            user.setPhone(phone);
        }
        return userRepository.save(user);
    }

    @Transactional
    public User getOrCreateUser(String firebaseUid, String email, String fullName) {
        return userRepository.findByFirebaseUid(firebaseUid)
                .orElseGet(() -> createUser(firebaseUid, email, fullName));
    }

}
