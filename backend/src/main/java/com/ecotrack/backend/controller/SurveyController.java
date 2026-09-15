package com.ecotrack.backend.controller;

import com.ecotrack.backend.entity.LifestyleSurvey;
import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.repository.SurveyRepository;
import com.ecotrack.backend.service.SurveyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/survey")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class SurveyController {

    private final SurveyRepository surveyRepo;
    private final SurveyService surveyService;

    @GetMapping
    public ResponseEntity<?> get(@AuthenticationPrincipal User user) {
        return surveyRepo.findByUser(user)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.ok(null));
    }

    @PostMapping
    public ResponseEntity<?> save(
            @AuthenticationPrincipal User user,
            @RequestBody LifestyleSurvey req) {
        return ResponseEntity.ok(surveyService.save(user, req));
    }
}
