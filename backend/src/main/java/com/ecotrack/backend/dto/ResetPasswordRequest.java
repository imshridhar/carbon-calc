package com.ecotrack.backend.dto;


public record ResetPasswordRequest(
        String email,
        String otp,
        String newPassword
) {
}