package com.ecotrack.backend.service;

import com.ecotrack.backend.dto.DashboardResponse;
import com.ecotrack.backend.entity.CarbonEntry;
import com.ecotrack.backend.entity.Goal;
import com.ecotrack.backend.entity.LifestyleSurvey;
import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.repository.CarbonEntryRepository;
import com.ecotrack.backend.repository.GoalRepository;
import com.ecotrack.backend.repository.SurveyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final CarbonEntryRepository carbonRepo;
    private final GoalRepository goalRepo;
    private final SurveyRepository surveyRepo;
    private final BadgeService badgeService;
    private final LeaderboardService leaderboardService;
    private final NotificationService notificationService;

    public DashboardResponse getDashboard(User user, String period) {
        LocalDate today = LocalDate.now();

        Double total = carbonRepo.sumByUser(user);
        double totalKg = round1(total != null ? total : 0);

        LocalDate startOfMonth = today.withDayOfMonth(1);
        LocalDate startOfLastMonth = startOfMonth.minusMonths(1);
        LocalDate endOfLastMonth = startOfMonth.minusDays(1);

        Double thisMonthRaw = carbonRepo.sumByUserAndDateBetween(user, startOfMonth, today);
        Double lastMonthRaw = carbonRepo.sumByUserAndDateBetween(user, startOfLastMonth, endOfLastMonth);
        double thisMonthKg = round1(thisMonthRaw != null ? thisMonthRaw : 0);
        double lastMonthKg = round1(lastMonthRaw != null ? lastMonthRaw : 0);
        double changePct = lastMonthKg > 0
            ? Math.round(((thisMonthKg - lastMonthKg) / lastMonthKg) * 1000.0) / 10.0
            : 0;

        LocalDate periodStart;
        String periodLabel;
        switch (period != null ? period : "monthly") {
            case "daily" -> {
                periodStart = today;
                periodLabel = "Today";
            }
            case "weekly" -> {
                periodStart = today.minusDays(6);
                periodLabel = "Last 7 Days";
            }
            default -> {
                periodStart = startOfMonth;
                periodLabel = "This Month";
            }
        }

        Double periodRaw = carbonRepo.sumByUserAndDateBetween(user, periodStart, today);
        double periodKg = round1(periodRaw != null ? periodRaw : 0);

        Map<String, Double> breakdown = new LinkedHashMap<>();
        for (Object[] row : carbonRepo.sumByCategoryForUser(user)) {
            breakdown.put(formatCategoryLabel((String) row[0]), round1((Double) row[1]));
        }

        LocalDate sevenDaysAgo = today.minusDays(6);
        Map<LocalDate, Double> daily = new LinkedHashMap<>();
        for (int i = 6; i >= 0; i--) {
            daily.put(today.minusDays(i), 0.0);
        }
        for (Object[] row : carbonRepo.dailySumForUser(user, sevenDaysAgo)) {
            LocalDate date = (LocalDate) row[0];
            if (daily.containsKey(date)) {
                daily.put(date, round1((Double) row[1]));
            }
        }
        DateTimeFormatter trendFormatter = DateTimeFormatter.ofPattern("MM/dd");
        List<DashboardResponse.WeeklyPoint> trend = daily.entrySet().stream()
            .map(entry -> new DashboardResponse.WeeklyPoint(entry.getKey().format(trendFormatter), entry.getValue()))
            .collect(Collectors.toList());

        List<Map<String, Object>> recentActivities = buildRecentActivities(user);
        String memberSince = user.getCreatedAt() != null
            ? user.getCreatedAt().format(DateTimeFormatter.ofPattern("MMM dd, yyyy"))
            : "";
        Double estimatedFootprint = surveyRepo.findByUser(user)
            .map(LifestyleSurvey::getEstimatedAnnualFootprint)
            .orElse(null);

        Integer leaderboardRank = leaderboardService.getCurrentRank(user);
        List<Map<String, Object>> recentNotifications = notificationService.getRecentNotifications(user, 4);
        long unreadNotifications = notificationService.getUnreadCount(user);
        long activeGoals = goalRepo.countByUserAndStatus(user, "ACTIVE");
        long completedGoals = goalRepo.countByUserAndStatus(user, "COMPLETED");
        long totalBadges = badgeService.countEarnedBadges(user);

        return DashboardResponse.builder()
            .userName(user.getName())
            .memberSince(memberSince)
            .totalCarbonKg(totalKg)
            .thisMonthCarbonKg(thisMonthKg)
            .lastMonthCarbonKg(lastMonthKg)
            .monthlyChangePercent(changePct)
            .periodCarbonKg(periodKg)
            .periodLabel(periodLabel)
            .categoryBreakdown(breakdown)
            .weeklyTrend(trend)
            .recentActivities(recentActivities)
            .recentNotifications(recentNotifications)
            .activeGoal(goalRepo.findFirstByUserAndStatusOrderByCreatedAtDesc(user, "ACTIVE").map(this::toGoalSummary).orElse(null))
            .categoryInsights(buildCategoryInsights(user, today))
            .badgeHighlights(buildBadgeHighlights(user))
            .activeGoals(activeGoals)
            .completedGoals(completedGoals)
            .totalBadges(totalBadges)
            .leaderboardRank(leaderboardRank != null ? leaderboardRank : 0)
            .unreadNotifications(unreadNotifications)
            .estimatedAnnualFootprint(estimatedFootprint)
            .sustainabilityScore(round1(Math.max(
                0,
                Math.min(100, 82 + (completedGoals * 4) + (totalBadges * 2) - (thisMonthKg * 0.45))
            )))
            .build();
    }

    private List<Map<String, Object>> buildRecentActivities(User user) {
        List<Map<String, Object>> recentActivities = new ArrayList<>();
        List<CarbonEntry> entries = carbonRepo.findByUserOrderByDateDescCreatedAtDesc(user);
        for (int i = 0; i < Math.min(5, entries.size()); i++) {
            CarbonEntry entry = entries.get(i);
            Map<String, Object> activity = new LinkedHashMap<>();
            activity.put("date", entry.getDate() != null ? entry.getDate().toString() : "");
            activity.put("category", formatCategoryLabel(entry.getCategory()));
            activity.put("description", entry.getActivity() != null ? entry.getActivity() : "");
            activity.put("emissionAmount", round1(entry.getAmount()));
            recentActivities.add(activity);
        }
        return recentActivities;
    }

    private List<Map<String, Object>> buildCategoryInsights(User user, LocalDate today) {
        LocalDate currentWeekStart = today.minusDays(6);
        LocalDate previousWeekStart = today.minusDays(13);
        LocalDate previousWeekEnd = today.minusDays(7);

        List<CarbonEntry> recentEntries = carbonRepo.findByUserAndDateBetweenOrderByDateAsc(user, previousWeekStart, today);
        LinkedHashSet<String> categories = new LinkedHashSet<>(List.of("transport", "food", "energy"));
        recentEntries.stream()
            .map(CarbonEntry::getCategory)
            .filter(Objects::nonNull)
            .map(String::toLowerCase)
            .forEach(categories::add);

        List<Map<String, Object>> insights = new ArrayList<>();
        for (String category : categories) {
            List<Double> miniTrend = new ArrayList<>();
            for (int i = 6; i >= 0; i--) {
                LocalDate date = today.minusDays(i);
                double value = recentEntries.stream()
                    .filter(entry -> category.equalsIgnoreCase(entry.getCategory()))
                    .filter(entry -> date.equals(entry.getDate()))
                    .mapToDouble(CarbonEntry::getAmount)
                    .sum();
                miniTrend.add(round1(value));
            }

            double currentWeek = recentEntries.stream()
                .filter(entry -> category.equalsIgnoreCase(entry.getCategory()))
                .filter(entry -> !entry.getDate().isBefore(currentWeekStart))
                .mapToDouble(CarbonEntry::getAmount)
                .sum();

            double previousWeek = recentEntries.stream()
                .filter(entry -> category.equalsIgnoreCase(entry.getCategory()))
                .filter(entry -> !entry.getDate().isBefore(previousWeekStart) && !entry.getDate().isAfter(previousWeekEnd))
                .mapToDouble(CarbonEntry::getAmount)
                .sum();

            double changePercent = previousWeek > 0
                ? round1(((currentWeek - previousWeek) / previousWeek) * 100.0)
                : (currentWeek > 0 ? 100.0 : 0.0);

            Map<String, Object> insight = new LinkedHashMap<>();
            insight.put("category", formatCategoryLabel(category));
            insight.put("amount", round1(currentWeek));
            insight.put("changePercent", changePercent);
            insight.put("miniTrend", miniTrend);
            insights.add(insight);
        }
        return insights;
    }

    private List<Map<String, Object>> buildBadgeHighlights(User user) {
        List<Map<String, Object>> badges = new ArrayList<>(badgeService.getBadgesForUser(user));
        badges.sort(Comparator
            .comparing((Map<String, Object> badge) -> !Boolean.TRUE.equals(badge.get("earned")))
            .thenComparing((Map<String, Object> badge) -> ((Number) badge.getOrDefault("progress", 0)).intValue(), Comparator.reverseOrder()));
        return badges.stream().limit(4).toList();
    }

    private Map<String, Object> toGoalSummary(Goal sourceGoal) {
        Goal goal = ensureGoalDefaults(sourceGoal);
        int progressPercentage = goal.getTargetAmount() > 0
            ? (int) Math.min((goal.getCurrentProgress() / goal.getTargetAmount()) * 100, 100)
            : 0;
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("id", goal.getId());
        summary.put("title", goal.getTitle());
        summary.put("category", formatCategoryLabel(goal.getCategory()));
        summary.put("targetAmount", round1(goal.getTargetAmount()));
        summary.put("currentProgress", round1(goal.getCurrentProgress()));
        summary.put("progressPercentage", progressPercentage);
        summary.put("targetPercentage", goal.getBaselineAmount() > 0
            ? round1((goal.getTargetAmount() / goal.getBaselineAmount()) * 100.0)
            : 0.0);
        summary.put("timeframeLabel", formatTimeframe(goal.getTimeframeDays()));
        summary.put("deadline", goal.getDeadline() != null ? goal.getDeadline().toString() : null);
        return summary;
    }

    private Goal ensureGoalDefaults(Goal goal) {
        if (goal.getBaselineAmount() == null || goal.getBaselineAmount() <= 0) {
            goal.setBaselineAmount(Math.max(goal.getTargetAmount() != null ? goal.getTargetAmount() * 4 : 100.0, 100.0));
        }
        if (goal.getTargetAmount() == null || goal.getTargetAmount() <= 0) {
            goal.setTargetAmount(15.0);
        }
        if (goal.getCurrentProgress() == null || goal.getCurrentProgress() < 0) {
            goal.setCurrentProgress(0.0);
        }
        if (goal.getTimeframeDays() == null || goal.getTimeframeDays() <= 0) {
            goal.setTimeframeDays(goal.getDeadline() != null && goal.getDeadline().isAfter(LocalDate.now())
                ? (int) ChronoUnit.DAYS.between(LocalDate.now(), goal.getDeadline())
                : 30);
        }
        return goal;
    }

    private String formatCategoryLabel(String category) {
        if (category == null || category.isBlank()) {
            return "General";
        }
        return switch (category.toLowerCase()) {
            case "food" -> "Food & Diet";
            case "energy" -> "Energy Usage";
            case "transport" -> "Transport";
            case "waste" -> "Waste";
            default -> Character.toUpperCase(category.charAt(0)) + category.substring(1).toLowerCase();
        };
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
