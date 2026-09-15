package com.ecotrack.backend.controller;

import com.ecotrack.backend.dto.CarbonEntryRequest;
import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.service.CarbonEntryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/carbon")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class CarbonEntryController {
    private final CarbonEntryService service;

    @GetMapping
    public ResponseEntity<?> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.getAll(user));
    }

    @PostMapping
    public ResponseEntity<?> create(@AuthenticationPrincipal User user, @RequestBody CarbonEntryRequest req) {
        return ResponseEntity.ok(service.create(user, req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@AuthenticationPrincipal User user, @PathVariable Long id, @RequestBody CarbonEntryRequest req) {
        return ResponseEntity.ok(service.update(user, id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        service.delete(user, id);
        return ResponseEntity.noContent().build();
    }
}
