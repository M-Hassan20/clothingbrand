package com.ecommerce.application.service.impl;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class RateLimiterService {

    private final StringRedisTemplate redisTemplate;

    // Fallback in-memory cache if Redis is unavailable
    private final Map<String, InMemoryCounter> inMemoryCache = new ConcurrentHashMap<>();

    @Autowired
    public RateLimiterService(@Autowired(required = false) StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    private static class InMemoryCounter {
        int count;
        long expiresAt;

        InMemoryCounter(int initialCount, long ttlSeconds) {
            this.count = initialCount;
            this.expiresAt = Instant.now().getEpochSecond() + ttlSeconds;
        }

        boolean isExpired() {
            return Instant.now().getEpochSecond() >= expiresAt;
        }
    }

    public boolean isAllowed(String key, int maxAttempts, long windowSeconds) {
        try {
            if (redisTemplate != null) {
                Long current = redisTemplate.opsForValue().increment(key);
                if (current != null && current == 1) {
                    redisTemplate.expire(key, windowSeconds, TimeUnit.SECONDS);
                }
                return current != null && current <= maxAttempts;
            }
        } catch (Exception e) {
            log.warn("Redis rate limiter unavailable, falling back to in-memory: {}", e.getMessage());
        }

        // Fallback to In-Memory
        synchronized (inMemoryCache) {
            InMemoryCounter counter = inMemoryCache.get(key);
            if (counter == null || counter.isExpired()) {
                inMemoryCache.put(key, new InMemoryCounter(1, windowSeconds));
                return true;
            } else {
                counter.count++;
                return counter.count <= maxAttempts;
            }
        }
    }

    public long getSecondsUntilReset(String key) {
        try {
            if (redisTemplate != null) {
                Long expire = redisTemplate.getExpire(key, TimeUnit.SECONDS);
                if (expire != null && expire > 0) {
                    return expire;
                }
            }
        } catch (Exception e) {
            log.warn("Error getting Redis TTL: {}", e.getMessage());
        }

        InMemoryCounter counter = inMemoryCache.get(key);
        if (counter != null && !counter.isExpired()) {
            long remaining = counter.expiresAt - Instant.now().getEpochSecond();
            return Math.max(remaining, 1);
        }
        return 60; // Default 1 minute retry fallback
    }

    public String resolveClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp.trim();
        }

        return request.getRemoteAddr();
    }
}
