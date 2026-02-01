package com.ecommerce.application.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import javax.annotation.PostConstruct;
import java.io.IOException;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void initialize() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(
                                new ClassPathResource("firebase-service-account.json").getInputStream()))
                        .build();

                FirebaseApp.initializeApp(options);
            }
        } catch (IOException e) {
            // Firebase not configured - skip initialization
            // This allows the app to run without Firebase for JWT-only auth
            System.out.println("Firebase not configured. Social login will not be available.");
        }
    }
}