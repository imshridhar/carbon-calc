package com.ecotrack.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    // Keep this controller for:
    // - profile
    // - update user
    // - dashboard
    // - user-specific operations
}