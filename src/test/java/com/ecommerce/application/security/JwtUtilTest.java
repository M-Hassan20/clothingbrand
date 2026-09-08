package com.ecommerce.application.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import static org.assertj.core.api.Assertions.assertThat;

class JwtUtilTest {

    private JwtUtil jwtUtil;
    private final String secret = "supersecretkeyfortestingpurposesmustbelongenoughforhmac256";

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", secret);
        ReflectionTestUtils.setField(jwtUtil, "expiration", 3600000L); // 1 hour
    }

    @Test
    void generateAndExtractClaims() {
        String token = jwtUtil.generateToken("user@test.com", 123L, "CUSTOMER");
        
        assertThat(jwtUtil.extractEmail(token)).isEqualTo("user@test.com");
        assertThat(jwtUtil.extractRole(token)).isEqualTo("CUSTOMER");
        assertThat(jwtUtil.isTokenValid(token)).isTrue();
    }

    @Test
    void extractScope_returnsPreviewForPreviewToken() {
        String token = jwtUtil.generatePreviewToken("admin@test.com");
        
        assertThat(jwtUtil.extractScope(token)).isEqualTo("PREVIEW");
        assertThat(jwtUtil.extractEmail(token)).isEqualTo("admin@test.com");
        assertThat(jwtUtil.isTokenValid(token)).isTrue();
    }

    @Test
    void isTokenValid_returnsFalseForExpiredToken() {
        // Set short/negative expiration to simulate expiration
        ReflectionTestUtils.setField(jwtUtil, "expiration", -10000L); // expired 10s ago
        String token = jwtUtil.generateToken("expired@test.com", 999L, "CUSTOMER");
        
        assertThat(jwtUtil.isTokenValid(token)).isFalse();
    }

    @Test
    void isTokenValid_returnsFalseForInvalidToken() {
        assertThat(jwtUtil.isTokenValid("invalid.token.string")).isFalse();
    }
}
