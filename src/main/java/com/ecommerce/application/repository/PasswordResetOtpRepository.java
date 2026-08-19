package com.ecommerce.application.repository;

import com.ecommerce.application.entity.PasswordResetOtp;
import com.ecommerce.application.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {

    Optional<PasswordResetOtp> findTopByUserAndOtpCodeAndIsUsedFalseOrderByCreatedAtDesc(User user, String otpCode);

    @Modifying
    @Query("UPDATE PasswordResetOtp p SET p.isUsed = true WHERE p.user = :user AND p.isUsed = false")
    void invalidateAllUnusedOtpsForUser(@Param("user") User user);
}
