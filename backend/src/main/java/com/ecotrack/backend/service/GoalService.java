package com.ecotrack.backend.service;

import com.ecotrack.backend.dto.GoalRequest;
import com.ecotrack.backend.dto.GoalResponse;
import com.ecotrack.backend.entity.Goal;
import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.repository.GoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GoalService {
    private final GoalRepository repo;
    private final NotificationService notificationService;

    public List<GoalResponse> getAll(User user) {
        return repo.findByUserOrderByCreatedAtDesc(user).stream().map(this::toDto).toList();
    }

    public GoalResponse create(User user, GoalRequest req) {
        double baselineAmount = resolveBaselineAmount(req);
        double targetAmount = resolveTargetAmount(req, baselineAmount);
        int timeframeDays = resolveTimeframeDays(req.getTimeframeDays(), req.getDeadline());
        Goal goal = Goal.builder()
            .user(user)
            .title(req.getTitle())
            .description(req.getDescription())
            .category(normalizeCategory(req.getCategory()))
            .baselineAmount(round1(baselineAmount))
            .targetAmount(round1(targetAmount))
            .timeframeDays(timeframeDays)
            .recurrence(normalizeRecurrence(req.getRecurrence()))
            .estimatedSavings(round1(resolveEstimatedSavings(req.getEstimatedSavings(), targetAmount)))
            .deadline(resolveDeadline(req.getDeadline(), timeframeDays))
            .build();
        return toDto(repo.save(applyDefaults(goal)));
    }

    public GoalResponse updateProgress(User user, Long id, Double progress) {
        Goal g = repo.findById(id).filter(x -> x.getUser().getId().equals(user.getId()))
            .orElseThrow(() -> new RuntimeException("Goal not found"));
        boolean wasCompleted = "COMPLETED".equals(g.getStatus());
        Goal normalizedGoal = applyDefaults(g);
        double safeProgress = round1(progress != null ? progress : 0.0);
        normalizedGoal.setCurrentProgress(safeProgress);
        normalizedGoal.setStatus(safeProgress >= normalizedGoal.getTargetAmount() ? "COMPLETED" : "ACTIVE");
        Goal saved = repo.save(normalizedGoal);
        if (!wasCompleted && "COMPLETED".equals(saved.getStatus())) {
            notificationService.createGoalCompletedNotification(user, saved.getTitle());
            notificationService.syncBadgeNotifications(user);
        }
        return toDto(saved);
    }

    public void delete(User user, Long id) {
        Goal g = repo.findById(id).filter(x -> x.getUser().getId().equals(user.getId()))
            .orElseThrow(() -> new RuntimeException("Goal not found"));
        repo.delete(g);
    }

    private GoalResponse toDto(Goal g) {
        Goal goal = applyDefaults(g);
        int progressPercentage = goal.getTargetAmount() > 0
            ? (int) Math.min((goal.getCurrentProgress() / goal.getTargetAmount()) * 100, 100)
            : 0;
        double targetPercentage = goal.getBaselineAmount() > 0
            ? round1((goal.getTargetAmount() / goal.getBaselineAmount()) * 100.0)
            : 0.0;
        long daysRemaining = goal.getDeadline() != null
            ? Math.max(0, ChronoUnit.DAYS.between(LocalDate.now(), goal.getDeadline()))
            : 0L;

        return GoalResponse.builder()
            .id(goal.getId())
            .title(goal.getTitle())
            .description(goal.getDescription())
            .category(goal.getCategory())
            .baselineAmount(round1(goal.getBaselineAmount()))
            .targetAmount(round1(goal.getTargetAmount()))
            .currentProgress(round1(goal.getCurrentProgress()))
            .remainingAmount(round1(Math.max(goal.getTargetAmount() - goal.getCurrentProgress(), 0)))
            .targetPercentage(targetPercentage)
            .timeframeDays(goal.getTimeframeDays())
            .recurrence(goal.getRecurrence())
            .timeframeLabel(formatTimeframe(goal.getTimeframeDays()))
            .estimatedSavings(round1(goal.getEstimatedSavings()))
            .daysRemaining(daysRemaining)
            .unit("kg CO2e")
            .progressPercentage(progressPercentage)
            .deadline(goal.getDeadline())
            .status(goal.getStatus())
            .createdAt(goal.getCreatedAt())
            .build();
    }

    private Goal applyDefaults(Goal goal) {
        if (goal.getCategory() == null || goal.getCategory().isBlank()) {
            goal.setCategory("general");
        }
        if (goal.getTargetAmount() == null || goal.getTargetAmount() <= 0) {
            double fallbackBaseline = goal.getBaselineAmount() != null && goal.getBaselineAmount() > 0
                ? goal.getBaselineAmount()
                : 100.0;
            goal.setTargetAmount(round1(Math.max(10.0, fallbackBaseline * 0.15)));
        }
        if (goal.getBaselineAmount() == null || goal.getBaselineAmount() <= 0) {
            goal.setBaselineAmount(round1(Math.max(goal.getTargetAmount() * 4, goal.getTargetAmount())));
        }
        if (goal.getCurrentProgress() == null || goal.getCurrentProgress() < 0) {
            goal.setCurrentProgress(0.0);
        }
        if (goal.getTimeframeDays() == null || goal.getTimeframeDays() <= 0) {
            goal.setTimeframeDays(resolveTimeframeDays(null, goal.getDeadline()));
        }
        if (goal.getRecurrence() == null || goal.getRecurrence().isBlank()) {
            goal.setRecurrence("WEEKLY");
        }
        if (goal.getEstimatedSavings() == null || goal.getEstimatedSavings() <= 0) {
            goal.setEstimatedSavings(round1(goal.getTargetAmount()));
        }
        if (goal.getDeadline() == null) {
            goal.setDeadline(resolveDeadline(null, goal.getTimeframeDays()));
        }
        if (goal.getStatus() == null || goal.getStatus().isBlank()) {
            goal.setStatus(goal.getCurrentProgress() >= goal.getTargetAmount() ? "COMPLETED" : "ACTIVE");
        }
        return goal;
    }

    private double resolveBaselineAmount(GoalRequest req) {
        if (req.getBaselineAmount() != null && req.getBaselineAmount() > 0) {
            return req.getBaselineAmount();
        }
        if (req.getTargetAmount() != null && req.getTargetAmount() > 0) {
            return Math.max(req.getTargetAmount() * 4, req.getTargetAmount());
        }
        if (req.getTargetPercentage() != null && req.getTargetPercentage() > 0) {
            return 100.0;
        }
        return 100.0;
    }

    private double resolveTargetAmount(GoalRequest req, double baselineAmount) {
        if (req.getTargetAmount() != null && req.getTargetAmount() > 0) {
            return req.getTargetAmount();
        }
        if (req.getTargetPercentage() != null && req.getTargetPercentage() > 0) {
            return baselineAmount * (req.getTargetPercentage() / 100.0);
        }
        return Math.max(10.0, baselineAmount * 0.15);
    }

    private double resolveEstimatedSavings(Double estimatedSavings, double targetAmount) {
        if (estimatedSavings != null && estimatedSavings > 0) {
            return estimatedSavings;
        }
        return targetAmount;
    }

    private int resolveTimeframeDays(Integer timeframeDays, LocalDate deadline) {
        if (timeframeDays != null && timeframeDays > 0) {
            return timeframeDays;
        }
        if (deadline != null && deadline.isAfter(LocalDate.now())) {
            return (int) ChronoUnit.DAYS.between(LocalDate.now(), deadline);
        }
        return 30;
    }

    private LocalDate resolveDeadline(LocalDate deadline, int timeframeDays) {
        if (deadline != null) {
            return deadline;
        }
        return LocalDate.now().plusDays(Math.max(timeframeDays, 7));
    }

    private String normalizeCategory(String category) {
        if (category == null || category.isBlank()) {
            return "general";
        }
        return switch (category.trim().toLowerCase()) {
            case "food & diet", "food-diet" -> "food";
            case "home energy", "home_energy" -> "energy";
            default -> category.trim().toLowerCase();
        };
    }

    private String normalizeRecurrence(String recurrence) {
        if (recurrence == null || recurrence.isBlank()) {
            return "WEEKLY";
        }
        return recurrence.trim().toUpperCase().replace('-', '_').replace(' ', '_');
    }

    private String formatTimeframe(Integer timeframeDays) {
        int safeDays = timeframeDays != null && timeframeDays > 0 ? timeframeDays : 30;
        if (safeDays <= 7) {
            return "Next 7 Days";
        }
        if (safeDays <= 30) {
            return "Next 30 Days";
        }
        if (safeDays <= 90) {
            return "Next 90 Days";
        }
        return "Long-term Goal";
    }

    private double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
