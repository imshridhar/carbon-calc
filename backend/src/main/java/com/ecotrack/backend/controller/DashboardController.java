package com.ecotrack.backend.controller;

import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class DashboardController {
    private final DashboardService service;

    @GetMapping
    public ResponseEntity<?> get(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "monthly") String period) {
        return ResponseEntity.ok(service.getDashboard(user, period));
    }
}
