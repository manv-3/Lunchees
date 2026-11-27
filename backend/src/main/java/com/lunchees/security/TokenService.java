package com.lunchees.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lunchees.model.AppUser;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TokenService {

    public record TokenPayload(String username, String role, long exp) {}

    private static final long TTL_SECONDS = 24 * 60 * 60;
    private final ObjectMapper objectMapper;
    private final byte[] secretBytes;

    public TokenService(ObjectMapper objectMapper,
                        @Value("${app.jwt.secret:lunchees-abesec-ghaziabad-2026-fsd-secret-key}") String secret) {
        this.objectMapper = objectMapper;
        this.secretBytes = secret.getBytes(StandardCharsets.UTF_8);
    }

    /** Generates a compact HMAC-SHA256 signed token for the authenticated user. */
    public String generateToken(AppUser user) {
        try {
            TokenPayload payload = new TokenPayload(
                    user.getUsername(),
                    user.getRole().name(),
                    Instant.now().getEpochSecond() + TTL_SECONDS
            );
            String encodedPayload = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(objectMapper.writeValueAsBytes(payload));
            String signature = sign(encodedPayload);
            return encodedPayload + "." + signature;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to generate auth token", e);
        }
    }

    /** Verifies token signature and expiration; returns null when invalid. */
    public TokenPayload verifyToken(String token) {
        if (token == null || token.isBlank()) return null;
        String[] parts = token.split("\\.");
        if (parts.length != 2) return null;
        try {
            String expectedSig = sign(parts[0]);
            if (!MessageDigest.isEqual(
                    expectedSig.getBytes(StandardCharsets.UTF_8),
                    parts[1].getBytes(StandardCharsets.UTF_8))) {
                return null;
            }
            byte[] jsonBytes = Base64.getUrlDecoder().decode(parts[0]);
            TokenPayload payload = objectMapper.readValue(jsonBytes, TokenPayload.class);
            if (payload.exp() < Instant.now().getEpochSecond()) {
                return null;
            }
            return payload;
        } catch (Exception e) {
            return null;
        }
    }

    private String sign(String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secretBytes, "HmacSHA256"));
        byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
    }
}
