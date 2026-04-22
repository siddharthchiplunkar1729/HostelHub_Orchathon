package com.hostelhub.modules.auth.service;

import com.hostelhub.modules.auth.dto.AuthResponse;
import com.hostelhub.modules.auth.dto.ForgotPasswordRequest;
import com.hostelhub.modules.auth.dto.LoginRequest;
import com.hostelhub.modules.auth.dto.ResetPasswordRequest;
import com.hostelhub.modules.auth.dto.SignupRequest;
import com.hostelhub.modules.students.entity.StudentEntity;
import com.hostelhub.modules.students.repository.StudentRepository;
import com.hostelhub.modules.users.entity.UserEntity;
import com.hostelhub.modules.users.repository.UserRepository;
import com.hostelhub.security.AuthenticatedUser;
import com.hostelhub.security.JwtService;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final String STUDENT_ROLE = "Student";
    private static final Set<String> SELF_SERVICE_SIGNUP_ROLES = Set.of(STUDENT_ROLE);

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final String frontendBaseUrl;
    private final boolean exposeResetUrl;

    public AuthService(
            UserRepository userRepository,
            StudentRepository studentRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            @Value("${app.security.frontend-base-url}") String frontendBaseUrl,
            @Value("${app.security.expose-reset-url:false}") boolean exposeResetUrl
    ) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.frontendBaseUrl = frontendBaseUrl.replaceAll("/$", "");
        this.exposeResetUrl = exposeResetUrl;
    }

    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        UserEntity user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!Boolean.TRUE.equals(user.getIsActive()) || !passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        StudentEntity student = studentRepository.findByUserId(user.getId()).orElse(null);
        return buildAuthResponse(user, student, "Login successful", null);
    }

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        String email = normalizeEmail(request.email());
        String role = normalizeSignupRole(request.role());
        String normalizedPhone = normalizePhone(request.phone());
        String normalizedName = normalizeName(request.name());

        if (normalizedPhone.length() != 10) {
            throw new IllegalArgumentException("Phone number must be exactly 10 digits");
        }

        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        UserEntity user = new UserEntity();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setName(normalizedName);
        user.setPhone(normalizedPhone);
        user.setRole(role);
        user.setCanAccessDashboard(false);
        user.setIsActive(true);
        userRepository.save(user);

        StudentEntity student = null;
        if (STUDENT_ROLE.equals(role)) {
            student = createStudentProfile(user, request.studentData());
        }

        return buildAuthResponse(user, student, "Registration successful", null);
    }

    public AuthResponse me(AuthenticatedUser principal) {
        if (principal == null) {
            throw new IllegalArgumentException("Authentication required");
        }

        UserEntity user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        StudentEntity student = studentRepository.findByUserId(user.getId()).orElse(null);
        return buildAuthResponse(user, student, "Authenticated user", null);
    }

    public AuthResponse forgotPassword(ForgotPasswordRequest request) {
        String email = normalizeEmail(request.email());
        String genericMessage = "If an account with that email exists, a password reset link has been sent.";

        UserEntity user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null || !Boolean.TRUE.equals(user.getIsActive())) {
            return new AuthResponse(true, genericMessage, null, null, null, null, null);
        }

        String token = jwtService.generatePasswordResetToken(user);
        String resetUrl = frontendBaseUrl + "/auth/reset-password?token=" + token;

        return new AuthResponse(true, genericMessage, null, null, null, null, exposeResetUrl ? resetUrl : null);
    }

    @Transactional
    public AuthResponse resetPassword(ResetPasswordRequest request) {
        Jwt jwt;
        try {
            jwt = jwtService.decode(request.token());
        } catch (JwtException exception) {
            throw new IllegalArgumentException("Invalid or expired reset token");
        }

        if (!"password_reset".equals(jwt.getClaimAsString("type"))) {
            throw new IllegalArgumentException("Invalid or expired reset token");
        }

        UUID userId = UUID.fromString(jwt.getSubject());
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token"));
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new IllegalArgumentException("Invalid or expired reset token");
        }

        String passwordVersion = jwt.getClaimAsString("passwordVersion");
        String currentPasswordVersion = jwtService.getPasswordVersion(user.getPassword());
        if (passwordVersion == null || !passwordVersion.equals(currentPasswordVersion)) {
            throw new IllegalArgumentException("Invalid or expired reset token");
        }
        if (passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new IllegalArgumentException("New password must be different from the current password");
        }

        user.setPassword(passwordEncoder.encode(request.password()));
        userRepository.save(user);

        return new AuthResponse(true, "Password reset successful", null, null, null, null, null);
    }

    private AuthResponse buildAuthResponse(
            UserEntity user,
            StudentEntity student,
            String message,
            String devResetUrl
    ) {
        return new AuthResponse(
                true,
                message,
                new AuthResponse.UserProfile(
                        user.getId(),
                        user.getEmail(),
                        user.getRole(),
                        user.getName(),
                        user.getPhone(),
                        Boolean.TRUE.equals(user.getCanAccessDashboard())
                ),
                student == null ? null : new AuthResponse.StudentProfile(
                        student.getId(),
                        student.getRollNumber(),
                        student.getDepartment(),
                        student.getCourse(),
                        student.getYear(),
                        student.getEnrollmentStatus()
                ),
                jwtService.generateAccessToken(user),
                jwtService.generateRefreshToken(user),
                devResetUrl
        );
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeSignupRole(String requestedRole) {
        String normalizedRole = requestedRole == null || requestedRole.isBlank()
                ? STUDENT_ROLE
                : requestedRole.trim();
        if (STUDENT_ROLE.equalsIgnoreCase(normalizedRole)) {
            normalizedRole = STUDENT_ROLE;
        }

        if (!SELF_SERVICE_SIGNUP_ROLES.contains(normalizedRole)) {
            throw new IllegalArgumentException("Only student self-registration is currently supported");
        }

        return normalizedRole;
    }

    private String normalizePhone(String phone) {
        return phone == null ? "" : phone.replaceAll("\\D", "");
    }

    private String normalizeName(String name) {
        return name == null ? "" : name.trim().replaceAll("\\s+", " ");
    }

    private StudentEntity createStudentProfile(UserEntity user, SignupRequest.StudentSignupData studentData) {
        StudentEntity student = new StudentEntity();
        student.setUser(user);
        student.setRollNumber(resolveRollNumber(studentData));
        student.setDepartment(defaultIfBlank(studentData != null ? studentData.department() : null, "General"));
        student.setCourse(defaultIfBlank(studentData != null ? studentData.course() : null, "Basic"));
        student.setYear(studentData != null && studentData.year() != null
                ? studentData.year() : 1);
        student.setEnrollmentStatus("Prospective");
        return studentRepository.save(student);
    }

    private String resolveRollNumber(SignupRequest.StudentSignupData studentData) {
        String requested = studentData != null && studentData.rollNumber() != null
                ? studentData.rollNumber().trim()
                : null;
        if (requested != null && !requested.isBlank()) {
            if (studentRepository.existsByRollNumber(requested)) {
                throw new IllegalArgumentException("Roll number is already registered");
            }
            return requested;
        }

        String generated;
        do {
            generated = "TEMP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
        } while (studentRepository.existsByRollNumber(generated));

        return generated;
    }

    private String defaultIfBlank(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }
}
