package com.hostelhub;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class AuthSecurityIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void signupRejectsDuplicateEmail() {
        ResponseEntity<String> response = restTemplate.postForEntity(
                baseUrl("/api/auth/signup"),
                jsonRequest(Map.of(
                        "email", "warden@example.com",
                        "password", "SecretPass123",
                        "name", "Duplicate User",
                        "phone", "9876543210",
                        "role", "Student"
                )),
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).contains("already exists");
    }

    @Test
    void signupRejectsPrivilegedSelfRegistration() {
        ResponseEntity<String> response = restTemplate.postForEntity(
                baseUrl("/api/auth/signup"),
                jsonRequest(Map.of(
                        "email", "new-warden@example.com",
                        "password", "SecretPass123",
                        "name", "New Warden",
                        "phone", "9876543210",
                        "role", "Warden"
                )),
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).contains("Only student self-registration");
    }

    @Test
    void signupCreatesStudentAccountWithSessionTokens() {
        ResponseEntity<String> response = restTemplate.postForEntity(
                baseUrl("/api/auth/signup"),
                jsonRequest(Map.of(
                        "email", "student1@example.com",
                        "password", "SecretPass123",
                        "name", "Student One",
                        "phone", "9876543210",
                        "role", "Student"
                )),
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).contains("\"token\":");
        assertThat(response.getBody()).contains("\"refreshToken\":");
        assertThat(response.getBody()).contains("\"role\":\"Student\"");
        assertThat(response.getBody()).contains("\"enrollmentStatus\":\"Prospective\"");
    }

    @Test
    void meEndpointRequiresAuthentication() {
        ResponseEntity<String> response = restTemplate.exchange(
                baseUrl("/api/auth/me"),
                HttpMethod.GET,
                new HttpEntity<>(new HttpHeaders()),
                String.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody()).contains("Authentication required");
    }

    private HttpEntity<Map<String, Object>> jsonRequest(Map<String, Object> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, headers);
    }

    private String baseUrl(String path) {
        return "http://localhost:" + port + path;
    }
}
