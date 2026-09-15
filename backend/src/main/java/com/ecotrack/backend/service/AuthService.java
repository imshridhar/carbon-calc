package com.ecotrack.backend.service;

import com.ecotrack.backend.dto.*;
import com.ecotrack.backend.entity.Otp;
import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.repository.OtpRepository;
import com.ecotrack.backend.repository.UserRepository;
import com.ecotrack.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final OtpRepository otpRepository;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService; // Injected EmailService

    /**
     * Handles standard user login with email and password.
     */
    public AuthResponse login(LoginRequest request) {
        // 1. Find User
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        // 2. Check Verification Status
        if (!user.isEnabled()) {
            throw new RuntimeException("Account not verified. Please check your email.");
        }

        // 3. Verify Password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        // 4. Generate Token
        String token = jwtUtil.generateToken(user.getEmail());

        // 5. Build safe User DTO
        UserResponseDto userDetails = UserResponseDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();

        return AuthResponse.builder()
                .user(userDetails)
                .token(token)
                .build();
    }

    /**
     * Handles user creation or retrieval for OAuth2 providers (Google/GitHub).
     */
    @Transactional
    public User saveOAuthUser(String email, String name) {
        return userRepository.findByEmail(email)
                .orElseGet(() -> {
                    // 1. Create the User (set enabled to false)
                    User newUser = User.builder()
                            .email(email)
                            .name(name)
                            .password(passwordEncoder.encode("OAUTH_" + UUID.randomUUID()))
                            .role("USER")
                            .createdAt(LocalDateTime.now())
                            .enabled(false)
                            .build();
                    User savedUser = userRepository.save(newUser);

                    // 2. Generate OTP
                    String otpCode = String.valueOf((int) (Math.random() * 900000) + 100000);

                    // 3. IMPORTANT: Save to the 'OTP' table (matching your UserService logic)
                    // Assuming you have an OtpRepository and Otp entity:
                    Otp otpEntry = new Otp();
                    otpEntry.setEmail(email);
                    otpEntry.setOtp(otpCode);
                    otpEntry.setExpiryTime(LocalDateTime.now().plusMinutes(15));
                    otpRepository.save(otpEntry);

                    // 4. Send the email
                    emailService.sendResetOtp(email, otpCode);

                    return savedUser;
                });
    }

    /**
     * Generates a reset OTP and sends it via email.
     */
    @Transactional
    public void processForgotPassword(ForgotPasswordRequest request) {
        // 1. Find user by email
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("User not found with this email."));

        // 2. Generate 6-digit OTP
        String otp = String.valueOf((int) (Math.random() * 900000) + 100000);

        // 3. Save OTP and Expiry (Valid for 15 minutes)
        user.setOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        // 4. Send Email
        emailService.sendResetOtp(user.getEmail(), otp);
    }

    /**
     * Validates OTP and updates the user password.
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        // 1. Find user
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("User not found."));

        // 2. Validate OTP
        if (user.getOtp() == null || !user.getOtp().equals(request.otp())) {
            throw new RuntimeException("Invalid OTP.");
        }

        // 3. Check Expiry
        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP has expired.");
        }

        // 4. Update Password & Clear OTP fields for security
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        user.setOtp(null);
        user.setOtpExpiry(null);

        userRepository.save(user);
    }
}