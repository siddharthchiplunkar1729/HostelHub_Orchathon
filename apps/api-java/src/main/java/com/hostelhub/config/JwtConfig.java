package com.hostelhub.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

@Configuration
public class JwtConfig {

    @Bean
    JwtEncoder jwtEncoder(
            @Value("${app.security.jwt-secret:}") String jwtSecret,
            @Value("${app.security.jwt-secret-file:}") String jwtSecretFile
    ) {
        SecretKey secretKey = toSecretKey(resolveJwtSecret(jwtSecret, jwtSecretFile));
        return new NimbusJwtEncoder(new ImmutableSecret<>(secretKey));
    }

    @Bean
    JwtDecoder jwtDecoder(
            @Value("${app.security.jwt-secret:}") String jwtSecret,
            @Value("${app.security.jwt-secret-file:}") String jwtSecretFile
    ) {
        SecretKey secretKey = toSecretKey(resolveJwtSecret(jwtSecret, jwtSecretFile));
        return NimbusJwtDecoder.withSecretKey(secretKey)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
    }

    private SecretKey toSecretKey(String jwtSecret) {
        validateJwtSecret(jwtSecret);
        return new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    private String resolveJwtSecret(String jwtSecret, String jwtSecretFile) {
        boolean hasInlineSecret = jwtSecret != null && !jwtSecret.isBlank();
        boolean hasSecretFile = jwtSecretFile != null && !jwtSecretFile.isBlank();

        if (hasInlineSecret && hasSecretFile) {
            throw new IllegalStateException("Configure only one of JWT_SECRET or JWT_SECRET_FILE");
        }
        if (hasSecretFile) {
            try {
                return Files.readString(Path.of(jwtSecretFile), StandardCharsets.UTF_8).trim();
            } catch (IOException exception) {
                throw new IllegalStateException("Unable to read JWT secret file", exception);
            }
        }

        return jwtSecret;
    }

    private void validateJwtSecret(String jwtSecret) {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException("JWT secret must be configured via JWT_SECRET or JWT_SECRET_FILE");
        }
        if (jwtSecret.length() < 32) {
            throw new IllegalStateException("JWT secret must be at least 32 characters long");
        }

        String normalized = jwtSecret.toLowerCase(Locale.ROOT);
        if (normalized.contains("change-me")
                || normalized.contains("change-this")
                || normalized.contains("replace-with")
                || normalized.contains("example")) {
            throw new IllegalStateException("JWT secret appears to be a placeholder value");
        }
    }
}
