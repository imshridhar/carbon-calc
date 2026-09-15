package com.ecotrack.backend.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DashboardResponse {
    private String userName;
    private String memberSince;
    private double totalCarbonKg;
    private double thisMonthCarbonKg;
    private double lastMonthCarbonKg;
    private double monthlyChangePercent;
    private double periodCarbonKg;
    private String periodLabel;
    private Map<String, Double> categoryBreakdown;
    private List<WeeklyPoint> weeklyTrend;
    private List<Map<String, Object>> recentActivities;
    private List<Map<String, Object>> recentNotifications;
    private Map<String, Object> activeGoal;
    private List<Map<String, Object>> categoryInsights;
    private List<Map<String, Object>> badgeHighlights;
    private long activeGoals;
    private long completedGoals;
    private long totalBadges;
    private int leaderboardRank;
    private long unreadNotifications;
    private Double estimatedAnnualFootprint;
    private double sustainabilityScore;

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class WeeklyPoint {
        private String date;
        private double amount;
    }
}
