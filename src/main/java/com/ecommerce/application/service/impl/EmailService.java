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

            // Attach inline logo image (cid:logoHeader) for reliable rendering in all email clients
            try {
                org.springframework.core.io.ClassPathResource logoResource =
                        new org.springframework.core.io.ClassPathResource("static/images/icon.png");
                if (logoResource.exists()) {
                    helper.addInline("logoHeader", logoResource, "image/png");
                }
            } catch (Exception ex) {
                System.err.println("Could not attach inline logo resource: " + ex.getMessage());
            }

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
     * Send password reset email with 6-digit OTP code
     */
    public void sendPasswordResetEmail(String to, String userName, String otpCode) {
        Map<String, Object> model = Map.of(
                "userName", userName,
                "otpCode", otpCode,
                "expiryMinutes", 15
        );

        sendTemplateEmail(to, "Password Reset Verification Code", "password-reset", model);
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

    /**
     * Send admin notification for customer return/exchange request
     */
    public void sendAdminReturnRequestNotification(Long orderId, String customerEmail, String returnReason, String returnResolution, String returnBankDetails, String requestedSize, String remarks) {
        Map<String, Object> model = Map.of(
                "orderId", orderId,
                "customerEmail", customerEmail != null ? customerEmail : "N/A",
                "returnReason", returnReason != null ? returnReason : "Not Specified",
                "returnResolution", returnResolution != null ? returnResolution : "REFUND",
                "returnBankDetails", returnBankDetails != null ? returnBankDetails : "N/A (Card Pay)",
                "requestedSize", requestedSize != null ? requestedSize : "N/A",
                "remarks", remarks != null ? remarks : "None",
                "adminUrl", "https://admin.hausofhafsah.com/orders/" + orderId
        );

        sendTemplateEmail(adminEmail, "Action Required: Return Request for Order #" + orderId, "admin-return-request", model);
    }

    /**
     * Send customer email notification when return request status is updated (APPROVED / COMPLETED)
     */
    public void sendCustomerReturnApprovalEmail(String to, String userName, Long orderId, String returnStatus, String returnResolution, Long replacementOrderId) {
        Map<String, Object> model = new java.util.HashMap<>();
        model.put("userName", userName != null ? userName : "Valued Client");
        model.put("orderId", orderId);
        model.put("returnStatus", returnStatus != null ? returnStatus.toUpperCase() : "APPROVED");
        model.put("returnResolution", returnResolution != null ? returnResolution.toUpperCase() : "REFUND");
        model.put("replacementOrderId", replacementOrderId);
        model.put("orderUrl", "https://hausofhafsah.com/account/orders/" + orderId);

        String subject = "Return Request Update (" + (returnStatus != null ? returnStatus.toUpperCase() : "APPROVED") + ") - Order #" + orderId;
        sendTemplateEmail(to, subject, "customer-return-approval", model);
    }

    /**
     * Send contact form inquiry to admin
     */
    public void sendContactInquiryEmail(String name, String email, String subject, String messageText) {
        String content = String.format(
                "You have received a new contact inquiry from the website:\n\n" +
                "Name: %s\n" +
                "Email: %s\n" +
                "Subject: %s\n\n" +
                "Message:\n%s",
                name, email, subject, messageText
        );
        sendSimpleEmail(adminEmail, "New Contact Inquiry: " + subject, content);
    }

    /**
     * Send welcome email to newsletter subscriber
     */
    public void sendNewsletterWelcomeEmail(String to, String unsubscribeToken) {
        String unsubscribeUrl = "https://hausofhafsah.com/unsubscribe?token=" + unsubscribeToken;
        Map<String, Object> model = Map.of(
                "websiteUrl", "https://hausofhafsah.com",
                "unsubscribeUrl", unsubscribeUrl
        );

        sendTemplateEmail(to, "Welcome to the Haus of Hafsah Journal", "newsletter-welcome", model);
    }

    /**
     * Send newsletter campaign broadcast email to a subscriber
     */
    public void sendNewsletterBroadcastEmail(String to, String subject, String contentHtml, String unsubscribeToken) {
        String unsubscribeUrl = "https://hausofhafsah.com/unsubscribe?token=" + unsubscribeToken;
        Map<String, Object> model = Map.of(
                "subject", subject,
                "contentHtml", contentHtml,
                "websiteUrl", "https://hausofhafsah.com",
                "unsubscribeUrl", unsubscribeUrl
        );

        sendTemplateEmail(to, subject, "newsletter-broadcast", model);
    }
}