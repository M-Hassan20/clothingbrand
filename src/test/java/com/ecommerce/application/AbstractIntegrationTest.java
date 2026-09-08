package com.ecommerce.application;

import com.ecommerce.application.service.impl.CartService;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;
import com.ecommerce.application.repository.*;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.springframework.jdbc.core.JdbcTemplate;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.Mockito;

import com.github.tomakehurst.wiremock.client.WireMock;
import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;

import java.util.List;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public abstract class AbstractIntegrationTest {

    @MockitoBean
    private JavaMailSender mailSender;

    @MockitoBean
    private CartService cartService;

    @Autowired
    protected JdbcTemplate jdbcTemplate;

    public static final WireMockServer wireMockServer =
            new WireMockServer(
                    WireMockConfiguration.options().port(9999)
            );

    static final MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0")
            .withDatabaseName("hausofhafsah_test")
            .withUsername("test")
            .withPassword("test");

    static {
        mysql.start(); // shared across all IT classes in the JVM run
        wireMockServer.start();
        WireMock.configureFor("localhost", 9999);
    }

    @BeforeEach
    public void setUpBase() {
        if (mailSender != null) {
            Mockito.when(mailSender.createMimeMessage()).thenReturn(
                new MimeMessage((Session) null)
            );
        }
        cleanDatabase();
    }

    protected void cleanDatabase() {
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0");
        String schemaName = jdbcTemplate.queryForObject("SELECT DATABASE()", String.class);
        List<String> tableNames = jdbcTemplate.queryForList(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = ?",
            String.class,
            schemaName
        );
        for (String tableName : tableNames) {
            jdbcTemplate.execute("TRUNCATE TABLE " + tableName);
        }
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1");
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mysql::getJdbcUrl);
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("spring.jpa.properties.hibernate.dialect", () -> "org.hibernate.dialect.MySQLDialect");
        registry.add("payment.safepay.enabled", () -> "true");
        registry.add("safepay.sandbox.api-url", () -> "http://localhost:9999");
        registry.add("safepay.production.api-url", () -> "http://localhost:9999");
        registry.add("storefront.revalidate.url", () -> "http://localhost:9999/revalidate");
        registry.add("safepay.secret-key", () -> "test-secret-key");
        registry.add("safepay.merchant-api-key", () -> "test-merchant-key");
        registry.add("safepay.webhook-secret", () -> "test-webhook-secret");
        registry.add("storefront.revalidate.secret", () -> "test-revalidate-secret");
        
        // Add missing environment placeholders for integration tests
        registry.add("JWT_SECRET", () -> "test-jwt-secret-key-must-be-very-long-and-secure-for-testing-purposes");
        registry.add("EMAIL_PORT", () -> "587");
        registry.add("EMAIL_ADDRESS", () -> "test@example.com");
        registry.add("EMAIL_PASSWORD", () -> "testpass");
        registry.add("CLOUDINARY_CLOUD_NAME", () -> "test-cloud");
        registry.add("CLOUDINARY_API_KEY", () -> "test-key");
        registry.add("CLOUDINARY_API_SECRET", () -> "test-secret");

        // Disable docker-compose development support in tests to avoid starting another container
        registry.add("spring.docker.compose.enabled", () -> "false");
    }
}
