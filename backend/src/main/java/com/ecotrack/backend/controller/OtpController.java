package com.ecotrack.backend.controller;


import com.ecotrack.backend.service.EmailService;
import com.ecotrack.backend.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/otp")
@RequiredArgsConstructor
public class OtpController {

    private final OtpService otpService;
    private final EmailService emailService;

    @PostMapping("/send")
    public String sendOtp(@RequestParam String email) {

        String otp = otpService.generateOtp(email);
        emailService.sendOtp(email, otp);

        return "OTP sent successfully";
    }

    @PostMapping("/verify")
    public String verifyOtp(@RequestParam String email,
                            @RequestParam String otp) {

        boolean isValid = otpService.verifyOtp(email, otp);

        if (isValid) {
            return "OTP Verified Successfully";
        } else {
            return "Invalid or Expired OTP";
        }
    }
}