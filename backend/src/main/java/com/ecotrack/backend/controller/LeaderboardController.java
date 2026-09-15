package com.ecotrack.backend.controller;

import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @GetMapping
    public ResponseEntity<?> get(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(leaderboardService.getLeaderboard(currentUser));
    }
}
