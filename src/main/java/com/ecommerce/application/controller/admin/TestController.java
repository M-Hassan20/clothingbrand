package com.ecommerce.application.controller.admin;

import com.ecommerce.application.service.impl.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
@CrossOrigin(origins = "*")
public class TestController {

    @Autowired
    private EmailService emailService;

    @GetMapping("/send-test-email")
    public ResponseEntity<String> sendTestEmail(@RequestParam String to) {
        emailService.sendSimpleEmail(to, "Test Email", "This is a test email from Haus of Hafsah!");
        return ResponseEntity.ok("Test email sent to: " + to);
    }

    @GetMapping("/send-welcome-email")
    public ResponseEntity<String> sendWelcomeEmail(@RequestParam String to, @RequestParam String name) {
        emailService.sendWelcomeEmail(to, name);
        return ResponseEntity.ok("Welcome email sent to: " + to);
    }
}

//GET http://localhost:8080/api/test/send-test-email?to=your-email@gmail.com
//GET http://localhost:8080/api/test/send-welcome-email?to=your-email@gmail.com&name=Hassan