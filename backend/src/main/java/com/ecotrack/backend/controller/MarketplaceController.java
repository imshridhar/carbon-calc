package com.ecotrack.backend.controller;

import com.ecotrack.backend.dto.MarketplaceItemRequest;
import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.service.MarketplaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/marketplace")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class MarketplaceController {

    private final MarketplaceService marketplaceService;

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(marketplaceService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return ResponseEntity.ok(marketplaceService.getById(id));
    }

    @PostMapping
    public ResponseEntity<?> create(@AuthenticationPrincipal User user, @RequestBody MarketplaceItemRequest request) {
        return ResponseEntity.ok(marketplaceService.create(user, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody MarketplaceItemRequest request) {
        return ResponseEntity.ok(marketplaceService.update(user, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        marketplaceService.delete(user, id);
        return ResponseEntity.noContent().build();
    }
}
