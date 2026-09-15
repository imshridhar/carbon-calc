package com.ecotrack.backend.dto;


import lombok.Data;

@Data
public class OtpRequest {
    private String email;
    private String otp;
}