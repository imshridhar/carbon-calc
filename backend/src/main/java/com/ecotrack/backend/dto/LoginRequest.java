package com.ecotrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data

@NoArgsConstructor // <--- Required for JSON parsing
@AllArgsConstructor
public class LoginRequest {
    private String email;
    private String password;
}