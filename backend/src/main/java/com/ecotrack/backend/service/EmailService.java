package com.ecotrack.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String mailUsername;

    private boolean isMailConfigured() {
        return mailUsername != null
            && !mailUsername.startsWith("YOUR_")
            && !mailUsername.isBlank();
    }

    public void sendOtp(String email, String otp) {
        // Always print to console so OTP works even without email config
        System.out.println("\n========================================");
        System.out.println("  OTP for " + email + " : " + otp);
        System.out.println("========================================\n");

        if (!isMailConfigured()) return;

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("EcoTrack Email Verification 🌿");
            message.setText("Your OTP is: " + otp + "\nValid for 5 minutes.");
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Email send failed (OTP still printed above): " + e.getMessage());
        }
    }

    public void sendResetOtp(String email, String otp) {
        System.out.println("\n========================================");
        System.out.println("  RESET OTP for " + email + " : " + otp);
        System.out.println("========================================\n");

        if (!isMailConfigured()) return;

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("EcoTrack Password Reset Request 🔑");
            message.setText("Your Reset OTP is: " + otp + "\nValid for 15 minutes.\n\nIf you did not request this, please ignore.");
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Email send failed (OTP still printed above): " + e.getMessage());
        }
    }
}
