package com.ecommerce.application.config;

import com.ecommerce.application.entity.User;
import com.ecommerce.application.enums.Role;
import com.ecommerce.application.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        System.out.println("Running production database initialization...");

        // 1. Seed Default Admin User if not exists
        try {
            if (userRepository.count() == 0) {
                System.out.println("Seeding default admin user...");
                User admin = User.builder()
                        .email("hausofhafsa@gmail.com")
                        .password(passwordEncoder.encode("Hafsa123"))
                        .fullName("Haus of Hafsah Admin")
                        .role(Role.ADMIN)
                        .isGuest(false)
                        .build();
                userRepository.save(admin);
                System.out.println("Default admin user created: hausofhafsa@gmail.com / Hafsa123");
            }
        } catch (Exception e) {
            System.err.println("Could not seed default admin user: " + e.getMessage());
        }

        // 2. Clean up any leftover mock data or stale page_configs from previous builds
        try {
            jdbcTemplate.execute("DELETE FROM product_variants WHERE product_id BETWEEN 101 AND 106");
            jdbcTemplate.execute("DELETE FROM products WHERE id BETWEEN 101 AND 106");
            jdbcTemplate.execute("DELETE FROM categories WHERE LOWER(name) LIKE '%test%' OR LOWER(name) LIKE '%dummy%'");
            jdbcTemplate.execute("DELETE FROM page_configs");
        } catch (Exception e) {
            // Ignore if tables are empty
        }
    }
}
