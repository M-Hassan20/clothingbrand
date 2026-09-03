package com.ecommerce.application.security;

import com.ecommerce.application.service.impl.RateLimiterService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class RateLimitingFilter extends OncePerRequestFilter {

    private final RateLimiterService rateLimiterService;

    // Login Limits: 5 attempts per 15 minutes (900 seconds)
    private static final int LOGIN_MAX_ATTEMPTS = 5;
    private static final long LOGIN_WINDOW_SECONDS = 900;

    // Registration Limits: 3 attempts per 1 hour (3600 seconds)
    private static final int REGISTER_MAX_ATTEMPTS = 3;
    private static final long REGISTER_WINDOW_SECONDS = 3600;

    // Forgot Password Limits: 3 attempts per 1 hour (3600 seconds)
    private static final int FORGOT_PASSWORD_MAX_ATTEMPTS = 3;
    private static final long FORGOT_PASSWORD_WINDOW_SECONDS = 3600;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        if ("POST".equalsIgnoreCase(method)) {
            if (path.endsWith("/api/auth/login")) {
                if (!handleRateLimit(request, response, "login", LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_SECONDS,
                        "Too many login attempts. Please try again in 15 minutes.")) {
                    return;
                }
            } else if (path.endsWith("/api/auth/register")) {
                if (!handleRateLimit(request, response, "register", REGISTER_MAX_ATTEMPTS, REGISTER_WINDOW_SECONDS,
                        "Registration limit reached for this IP address. Please try again in 1 hour.")) {
                    return;
                }
            } else if (path.endsWith("/api/auth/forgot-password")) {
                if (!handleRateLimit(request, response, "forgot-password", FORGOT_PASSWORD_MAX_ATTEMPTS, FORGOT_PASSWORD_WINDOW_SECONDS,
                        "Too many password reset requests. Please try again in 1 hour.")) {
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean handleRateLimit(
            HttpServletRequest request,
            HttpServletResponse response,
            String action,
            int maxAttempts,
            long windowSeconds,
            String errorMessage) throws IOException {

        String clientIp = rateLimiterService.resolveClientIp(request);
        String rateLimitKey = "rate_limit:" + action + ":ip:" + clientIp;

        if (!rateLimiterService.isAllowed(rateLimitKey, maxAttempts, windowSeconds)) {
            long retryAfter = rateLimiterService.getSecondsUntilReset(rateLimitKey);

            response.setStatus(429); // HTTP 429 Too Many Requests
            response.setContentType("application/json");
            response.setHeader("Retry-After", String.valueOf(retryAfter));
            response.setHeader("X-RateLimit-Limit", String.valueOf(maxAttempts));
            response.setHeader("X-RateLimit-Remaining", "0");

            String jsonResponse = String.format(
                    "{\"success\":false,\"message\":\"%s\",\"retryAfterSeconds\":%d}",
                    errorMessage, retryAfter
            );

            response.getWriter().write(jsonResponse);
            return false;
        }

        return true;
    }
}
