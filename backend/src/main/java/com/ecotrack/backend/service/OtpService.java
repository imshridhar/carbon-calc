package com.ecotrack.backend.service;


import com.ecotrack.backend.entity.Otp;
import com.ecotrack.backend.repository.OtpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpRepository otpRepository;

    public String generateOtp(String email) {

        String otp = String.valueOf(100000 + new Random().nextInt(900000));

        Otp otpEntity = new Otp();
        otpEntity.setEmail(email);
        otpEntity.setOtp(otp);
        otpEntity.setExpiryTime(LocalDateTime.now().plusMinutes(5));

        otpRepository.save(otpEntity);

        return otp;
    }

    public boolean verifyOtp(String email, String enteredOtp) {

        return otpRepository.findByEmail(email)
                .filter(o -> o.getOtp().equals(enteredOtp))
                .filter(o -> o.getExpiryTime().isAfter(LocalDateTime.now()))
                .isPresent();
    }
}