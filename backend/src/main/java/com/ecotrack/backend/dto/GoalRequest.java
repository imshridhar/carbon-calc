package com.ecotrack.backend.dto;
import lombok.Data;
import java.time.LocalDate;

@Data
public class GoalRequest {
    private String title;
    private String description;
    private String category;
    private Double baselineAmount;
    private Double targetAmount;
    private Double targetPercentage;
    private Integer timeframeDays;
    private String recurrence;
    private Double estimatedSavings;
    private LocalDate deadline;
}
