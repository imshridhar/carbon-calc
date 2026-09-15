package com.ecotrack.backend.dto;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder
public class GoalResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private Double baselineAmount;
    private Double targetAmount;
    private Double currentProgress;
    private Double remainingAmount;
    private Double targetPercentage;
    private Integer timeframeDays;
    private String recurrence;
    private String timeframeLabel;
    private Double estimatedSavings;
    private Long daysRemaining;
    private String unit;
    private int progressPercentage;
    private LocalDate deadline;
    private String status;
    private LocalDateTime createdAt;
}
