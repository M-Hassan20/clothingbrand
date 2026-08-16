package com.ecommerce.application.entity;

import com.ecommerce.application.enums.Role;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name="users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class User extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = true)  // ✅ Changed to nullable
    private String firebaseUid;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = true)  // ✅ For JWT authentication
    private String password;

    @Column(length = 30)
    private String fullName;

    @Column(nullable = true)  // ✅ Changed to nullable
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('ADMIN', 'CUSTOMER')")  // ✅ Fixed enum
    private Role role;

    @Builder.Default
    private Boolean isGuest = false;
}