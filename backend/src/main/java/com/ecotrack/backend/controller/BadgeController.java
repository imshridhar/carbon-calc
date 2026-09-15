package com.ecotrack.backend.controller;

import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.service.BadgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/badges")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class BadgeController {

    private final BadgeService badgeService;

    @GetMapping("/current")
    public ResponseEntity<?> getCurrentUserBadges(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(badgeService.getBadgesForUser(user));
    }
}
