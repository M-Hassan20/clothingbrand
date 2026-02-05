package com.ecommerce.application.service.impl;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templateEngine;

    @Value("${app.email.from}")
    private String fromEmail;

    @Value("${app.email.from-name}")
    private String fromName;

    @Value("${app.email.admin}")
    private String adminEmail;

    /**
     * Send simple text email
     */
    @Async
    public void sendSimpleEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);

            mailSender.send(message);
            System.out.println("Email sent successfully to: " + to);
        } catch (Exception e) {
            System.err.println("Failed to send email: " + e.getMessage());
            throw new RuntimeException("Failed to send email", e);
        }
    }

    /**
     * Send HTML email with template
     */
    @Async
    public void sendTemplateEmail(String to, String subject, String templateName, Map<String, Object> templateModel) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            // Set email properties
            helper.setFrom(fromEmail, fromName);
            helper.setTo(to);
            helper.setSubject(subject);

            // Process template
            Context context = new Context();
            context.setVariables(templateModel);
            String htmlContent = templateEngine.process(templateName, context);

            helper.setText(htmlContent, true);

            mailSender.send(message);
            System.out.println("Template email sent successfully to: " + to);
        } catch (MessagingException e) {
            System.err.println("Failed to send template email: " + e.getMessage());
            throw new RuntimeException("Failed to send template email", e);
        } catch (Exception e) {
            System.err.println("Unexpected error sending email: " + e.getMessage());
            throw new RuntimeException("Failed to send email", e);
        }
    }

    /**
     * Send welcome email to new user
     */
    public void sendWelcomeEmail(String to, String userName) {
        Map<String, Object> model = Map.of(
                "userName", userName,
                "websiteUrl", "https://hausofhafsah.com"
        );

        sendTemplateEmail(to, "Welcome to Haus of Hafsah!", "welcome-email", model);
    }

    /**
     * Send order confirmation email
     */
    public void sendOrderConfirmationEmail(String to, String userName, Long orderId, String orderTotal) {
        Map<String, Object> model = Map.of(
                "userName", userName,
                "orderId", orderId,
                "orderTotal", orderTotal,
                "orderUrl", "https://hausofhafsah.com/orders/" + orderId
        );

        sendTemplateEmail(to, "Order Confirmation - Order #" + orderId, "order-confirmation", model);
    }

    /**
     * Send password reset email
     */
    public void sendPasswordResetEmail(String to, String userName, String resetToken) {
        Map<String, Object> model = Map.of(
                "userName", userName,
                "resetUrl", "https://hausofhafsah.com/reset-password?token=" + resetToken,
                "expiryHours", 24
        );

        sendTemplateEmail(to, "Reset Your Password", "password-reset", model);
    }

    /**
     * Send order status update email
     */
    public void sendOrderStatusUpdateEmail(String to, String userName, Long orderId, String status) {
        Map<String, Object> model = Map.of(
                "userName", userName,
                "orderId", orderId,
                "status", status,
                "orderUrl", "https://hausofhafsah.com/orders/" + orderId
        );

        sendTemplateEmail(to, "Order Update - Order #" + orderId, "order-status-update", model);
    }

    /**
     * Send admin notification for new order
     */
    public void sendAdminNewOrderNotification(Long orderId, String customerEmail, String orderTotal) {
        Map<String, Object> model = Map.of(
                "orderId", orderId,
                "customerEmail", customerEmail,
                "orderTotal", orderTotal,
                "orderUrl", "https://admin.hausofhafsah.com/orders/" + orderId
        );

        sendTemplateEmail(adminEmail, "New Order Received - #" + orderId, "admin-new-order", model);
    }

    /**
     * Send low stock alert to admin
     */
    public void sendLowStockAlert(String productName, Integer currentStock) {
        Map<String, Object> model = Map.of(
                "productName", productName,
                "currentStock", currentStock
        );

        sendTemplateEmail(adminEmail, "Low Stock Alert - " + productName, "admin-low-stock", model);
    }
}