package com.ecotrack.backend.controller;

import com.ecotrack.backend.dto.TransactionRequest;
import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping
    public ResponseEntity<?> create(@AuthenticationPrincipal User user, @RequestBody TransactionRequest request) {
        return ResponseEntity.ok(transactionService.create(user, request));
    }

    @GetMapping
    public ResponseEntity<?> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(transactionService.getAllTransactions(user));
    }

    @GetMapping("/user/{id}")
    public ResponseEntity<?> getUserTransactions(@AuthenticationPrincipal User user, @PathVariable Long id) {
        return ResponseEntity.ok(transactionService.getUserTransactions(user, id));
    }
}
