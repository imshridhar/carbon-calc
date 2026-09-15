package com.ecotrack.backend.controller;

import com.ecotrack.backend.dto.GoalRequest;
import com.ecotrack.backend.dto.ProgressRequest;
import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.service.GoalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class GoalController {
    private final GoalService service;

    @GetMapping
    public ResponseEntity<?> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.getAll(user));
    }

    @PostMapping
    public ResponseEntity<?> create(@AuthenticationPrincipal User user, @RequestBody GoalRequest req) {
        return ResponseEntity.ok(service.create(user, req));
    }

    @PatchMapping("/{id}/progress")
    public ResponseEntity<?> updateProgress(@AuthenticationPrincipal User user, @PathVariable Long id, @RequestBody ProgressRequest req) {
        return ResponseEntity.ok(service.updateProgress(user, id, req.getProgress()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        service.delete(user, id);
        return ResponseEntity.noContent().build();
    }
}
