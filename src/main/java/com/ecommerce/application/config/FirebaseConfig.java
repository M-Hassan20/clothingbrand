package com.ecommerce.application.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import jakarta.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;

@Configuration
public class FirebaseConfig {

    @Value("${firebase.storage.bucket}")
    private String storageBucket;

    @Value("${firebase.credentials.base64:${FIREBASE_CREDENTIALS_BASE64:}}")
    private String base64Credentials;

    @PostConstruct
    public void initialize() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                InputStream serviceAccountStream;

                if (base64Credentials != null && !base64Credentials.trim().isEmpty()) {
                    byte[] decodedBytes = Base64.getDecoder().decode(base64Credentials.trim());
                    serviceAccountStream = new ByteArrayInputStream(decodedBytes);
                    System.out.println("Firebase: Initializing using Base64 credentials");
                } else {
                    ClassPathResource resource = new ClassPathResource("firebase-service-account.json");
                    if (resource.exists()) {
                        serviceAccountStream = resource.getInputStream();
                        System.out.println("Firebase: Initializing using classpath file (firebase-service-account.json)");
                    } else {
                        throw new IOException("Firebase credentials not found. Set FIREBASE_CREDENTIALS_BASE64 environment variable or place firebase-service-account.json in classpath resources.");
                    }
                }

                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccountStream))
                        .setStorageBucket(storageBucket)
                        .build();

                FirebaseApp.initializeApp(options);
                System.out.println("Firebase initialized successfully");
            }
        } catch (Exception e) {
            System.err.println("Firebase initialization failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
}