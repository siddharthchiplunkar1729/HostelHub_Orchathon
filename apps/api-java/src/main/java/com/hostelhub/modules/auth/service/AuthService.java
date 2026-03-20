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
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

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
        String role = request.role() == null || request.role().isBlank() ? "Student" : request.role();
        String normalizedPhone = request.phone().replaceAll("\\D", "");

        if (normalizedPhone.length() != 10) {
            throw new IllegalArgumentException("Phone number must be exactly 10 digits");
        }

        UserEntity existingUser = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (existingUser != null) {
            StudentEntity existingStudent = studentRepository.findByUserId(existingUser.getId()).orElse(null);
            if (existingStudent == null && "Student".equalsIgnoreCase(existingUser.getRole())) {
                existingStudent = createStudentProfile(existingUser, request.studentData());
            }
            return buildAuthResponse(existingUser, existingStudent, "User profile synchronized", null);
        }

        UserEntity user = new UserEntity();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setName(request.name());
        user.setPhone(normalizedPhone);
        user.setRole(role);
        user.setCanAccessDashboard(false);
        user.setIsActive(true);
        userRepository.save(user);

        StudentEntity student = null;
        if ("Student".equalsIgnoreCase(role)) {
            student = createStudentProfile(user, request.studentData());
        }

        return buildAuthResponse(user, student, "Registration successful", null);
    }

    public AuthResponse me(AuthenticatedUser principal) {
        UserEntity user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        StudentEntity student = studentRepository.findByUserId(user.getId()).orElse(null);
        return buildAuthResponse(user, student, "Authenticated user", null);
    }

    public AuthResponse forgotPassword(ForgotPasswordRequest request) {
        String email = normalizeEmail(request.email());
        String genericMessage = "If an account with that email exists, a password reset link has been sent.";

        UserEntity user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null) {
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

        String passwordVersion = jwt.getClaimAsString("passwordVersion");
        String currentPasswordVersion = jwtService.getPasswordVersion(user.getPassword());
        if (passwordVersion == null || !passwordVersion.equals(currentPasswordVersion)) {
            throw new IllegalArgumentException("Invalid or expired reset token");
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

    private StudentEntity createStudentProfile(UserEntity user, SignupRequest.StudentSignupData studentData) {
        StudentEntity student = new StudentEntity();
        student.setUser(user);
        student.setRollNumber(resolveRollNumber(studentData));
        student.setDepartment(studentData != null && studentData.department() != null
                ? studentData.department() : "General");
        student.setCourse(studentData != null && studentData.course() != null
                ? studentData.course() : "Basic");
        student.setYear(studentData != null && studentData.year() != null
                ? studentData.year() : 1);
        student.setEnrollmentStatus("Prospective");
        return studentRepository.save(student);
    }

    private String resolveRollNumber(SignupRequest.StudentSignupData studentData) {
        String requested = studentData != null ? studentData.rollNumber() : null;
        if (requested != null && !requested.isBlank()) {
            if (studentRepository.existsByRollNumber(requested)) {
                return requested; // Reuse if exists (mostly for self-correction)
            }
            return requested;
        }
        return "TEMP-" + System.currentTimeMillis();
    }
}
