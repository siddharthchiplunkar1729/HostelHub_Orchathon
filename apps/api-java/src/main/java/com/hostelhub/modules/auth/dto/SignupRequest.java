package com.hostelhub.modules.auth.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SignupRequest(
        @Email @NotBlank String email,
        @NotBlank @Size(min = 8, max = 72) String password,
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Pattern(regexp = "^[0-9+()\\-\\s]{10,20}$", message = "must contain a valid phone number") String phone,
        String role,
        @Valid StudentSignupData studentData
) {
    public record StudentSignupData(
            @Size(max = 50) String rollNumber,
            @Size(max = 120) String department,
            @Size(max = 120) String course,
            @Min(1) @Max(8) Integer year
    ) {
    }
}
