package com.ecotrack.backend.service;

import com.ecotrack.backend.entity.*;
import com.ecotrack.backend.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final OtpRepository otpRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    public void registerUser(String name, String email, String password) {

        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setEnabled(false);

        userRepository.save(user);

        generateAndSendOtp(email);
    }

    public void generateAndSendOtp(String email) {

        String otpValue = String.valueOf(100000 + new Random().nextInt(900000));

        otpRepository.deleteByEmail(email);

        Otp otp = new Otp();
        otp.setEmail(email);
        otp.setOtp(otpValue);
        otp.setExpiryTime(LocalDateTime.now().plusMinutes(5));

        otpRepository.save(otp);

        emailService.sendOtp(email, otpValue);
    }

    @Transactional
    public boolean verifyOtp(String email, String enteredOtp) {

        Otp otp = otpRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("OTP not found"));

        if (!otp.getOtp().trim().equals(enteredOtp.trim())) return false;
        if (otp.getExpiryTime().isBefore(LocalDateTime.now())) return false;

        User user = userRepository.findByEmail(email).orElseThrow();
        user.setEnabled(true);
        userRepository.save(user);

        otpRepository.deleteByEmail(email);

        return true;
    }
}