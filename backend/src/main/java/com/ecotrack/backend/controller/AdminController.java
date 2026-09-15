package com.ecotrack.backend.controller;

import com.ecotrack.backend.entity.Badge;
import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.repository.BadgeRepository;
import com.ecotrack.backend.repository.CarbonEntryRepository;
import com.ecotrack.backend.repository.GoalRepository;
import com.ecotrack.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AdminController {

    private final UserRepository userRepo;
    private final CarbonEntryRepository carbonRepo;
    private final GoalRepository goalRepo;
    private final BadgeRepository badgeRepo;

    private boolean isAdmin(User user) {
        return user != null && "ADMIN".equals(user.getRole());
    }

    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics(@AuthenticationPrincipal User user) {
        if (!isAdmin(user)) return ResponseEntity.status(403).body(Map.of("error", "Access denied"));

        long totalUsers = userRepo.count();
        long activeUsers = carbonRepo.countActiveUsers();
        Double totalCo2 = carbonRepo.sumAll();
        double totalKg = totalCo2 != null ? Math.round(totalCo2 * 10.0) / 10.0 : 0;
        double avgPerUser = totalUsers > 0 ? Math.round((totalKg / totalUsers) * 10.0) / 10.0 : 0;
        long totalGoals = goalRepo.count();
        long completedGoals = goalRepo.findAll().stream()
            .filter(g -> "COMPLETED".equals(g.getStatus()))
            .count();

        Map<String, Double> categoryBreakdown = new LinkedHashMap<>();
        for (Object[] row : carbonRepo.sumByCategoryGlobal()) {
            categoryBreakdown.put((String) row[0], Math.round((Double) row[1] * 10.0) / 10.0);
        }

        List<Map<String, Object>> topUsers = new ArrayList<>();
        for (User u : userRepo.findAll()) {
            Double total = carbonRepo.sumByUser(u);
            if (total == null || total == 0) continue;

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id", u.getId());
            entry.put("name", u.getName());
            entry.put("email", u.getEmail());

            double roundedTotal = Math.round(total * 10.0) / 10.0;
            entry.put("totalCo2Kg", roundedTotal);
            entry.put("totalKg", roundedTotal);
            entry.put("role", u.getRole());
            topUsers.add(entry);
        }
        topUsers.sort((a, b) -> Double.compare((Double) b.get("totalCo2Kg"), (Double) a.get("totalCo2Kg")));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalUsers", totalUsers);
        result.put("activeUsers", activeUsers);
        result.put("totalCo2Kg", totalKg);
        result.put("totalCarbonKg", totalKg);
        result.put("avgCo2PerUser", avgPerUser);
        result.put("avgCarbonPerUser", avgPerUser);
        result.put("totalGoals", totalGoals);
        result.put("completedGoals", completedGoals);
        result.put("categoryBreakdown", categoryBreakdown);
        result.put("topUsers", topUsers.stream().limit(10).toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(@AuthenticationPrincipal User user) {
        if (!isAdmin(user)) return ResponseEntity.status(403).body(Map.of("error", "Access denied"));

        List<Map<String, Object>> users = new ArrayList<>();
        for (User u : userRepo.findAll()) {
            Double total = carbonRepo.sumByUser(u);
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("id", u.getId());
            response.put("name", u.getName());
            response.put("email", u.getEmail());
            response.put("role", u.getRole());
            response.put("enabled", u.isEnabled());
            response.put("totalKg", total != null ? Math.round(total * 10.0) / 10.0 : 0);
            response.put("createdAt", u.getCreatedAt());
            users.add(response);
        }
        return ResponseEntity.ok(users);
    }

    @GetMapping("/badges")
    public ResponseEntity<?> getBadges(@AuthenticationPrincipal User user) {
        if (!isAdmin(user)) return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        return ResponseEntity.ok(badgeRepo.findAll().stream().map(this::toBadgeResponse).toList());
    }

    @PostMapping("/badges")
    public ResponseEntity<?> createBadge(@AuthenticationPrincipal User user, @RequestBody Badge req) {
        if (!isAdmin(user)) return ResponseEntity.status(403).body(Map.of("error", "Access denied"));

        String validationError = validateBadge(req);
        if (validationError != null) return ResponseEntity.badRequest().body(Map.of("error", validationError));

        applyBadgeDefaults(req);
        req.setCreatedBy(user);
        req.setActive(true);
        return ResponseEntity.ok(toBadgeResponse(badgeRepo.save(req)));
    }

    @PutMapping("/badges/{id}")
    public ResponseEntity<?> updateBadge(@AuthenticationPrincipal User user,
                                         @PathVariable Long id,
                                         @RequestBody Badge req) {
        if (!isAdmin(user)) return ResponseEntity.status(403).body(Map.of("error", "Access denied"));

        String validationError = validateBadge(req);
        if (validationError != null) return ResponseEntity.badRequest().body(Map.of("error", validationError));

        Badge existing = badgeRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Badge not found"));

        existing.setName(req.getName().trim());
        existing.setDescription(req.getDescription().trim());
        existing.setIcon(defaultIfBlank(req.getIcon(), "Award"));
        existing.setCategory(normalizeBadgeCategory(req.getCategory()));
        existing.setThresholdKg(req.getThresholdKg());
        existing.setColor(defaultIfBlank(req.getColor(), "text-green-600"));
        existing.setBgColor(defaultIfBlank(req.getBgColor(), "bg-green-100"));
        existing.setActive(req.isActive());
        return ResponseEntity.ok(toBadgeResponse(badgeRepo.save(existing)));
    }

    @DeleteMapping("/badges/{id}")
    public ResponseEntity<?> deleteBadge(@AuthenticationPrincipal User user, @PathVariable Long id) {
        if (!isAdmin(user)) return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        badgeRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/goals")
    public ResponseEntity<?> createGlobalGoal(@AuthenticationPrincipal User user,
                                              @RequestBody Map<String, Object> req) {
        if (!isAdmin(user)) return ResponseEntity.status(403).body(Map.of("error", "Access denied"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", System.currentTimeMillis());
        result.put("title", req.get("title"));
        result.put("description", req.get("description"));
        result.put("category", req.get("category"));
        result.put("targetAmount", req.get("targetAmount"));
        result.put("deadline", req.get("deadline"));
        result.put("isGlobal", true);
        result.put("createdBy", user.getName());
        return ResponseEntity.ok(result);
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> changeRole(@AuthenticationPrincipal User admin,
                                        @PathVariable Long id,
                                        @RequestBody Map<String, String> req) {
        if (!isAdmin(admin)) return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        User user = userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(req.get("role"));
        userRepo.save(user);
        return ResponseEntity.ok(Map.of("message", "Role updated"));
    }

    private String validateBadge(Badge badge) {
        if (badge == null) return "Badge payload is required";
        if (badge.getName() == null || badge.getName().isBlank()) return "Badge name is required";
        if (badge.getDescription() == null || badge.getDescription().isBlank()) return "Badge description is required";
        if (badge.getThresholdKg() == null || badge.getThresholdKg() <= 0) return "Badge threshold must be greater than 0";
        return null;
    }

    private void applyBadgeDefaults(Badge badge) {
        badge.setName(badge.getName().trim());
        badge.setDescription(badge.getDescription().trim());
        badge.setIcon(defaultIfBlank(badge.getIcon(), "Award"));
        badge.setCategory(normalizeBadgeCategory(badge.getCategory()));
        badge.setColor(defaultIfBlank(badge.getColor(), "text-green-600"));
        badge.setBgColor(defaultIfBlank(badge.getBgColor(), "bg-green-100"));
    }

    private String normalizeBadgeCategory(String category) {
        if (category == null || category.isBlank()) {
            return "general";
        }
        String normalized = category.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "transport", "food", "energy" -> normalized;
            default -> "general";
        };
    }

    private String defaultIfBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private Map<String, Object> toBadgeResponse(Badge badge) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", badge.getId());
        response.put("name", badge.getName());
        response.put("description", badge.getDescription());
        response.put("icon", badge.getIcon());
        response.put("category", badge.getCategory());
        response.put("thresholdKg", badge.getThresholdKg());
        response.put("color", badge.getColor());
        response.put("bgColor", badge.getBgColor());
        response.put("active", badge.isActive());
        response.put("createdAt", badge.getCreatedAt());
        return response;
    }
}
