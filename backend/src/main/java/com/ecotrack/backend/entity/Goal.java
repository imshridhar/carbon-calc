package com.ecotrack.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "goals")
public class Goal {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String title;
    private String description;
    private String category;
    private Double baselineAmount;
    private Double targetAmount;
    private Double currentProgress;
    private Integer timeframeDays;
    private String recurrence;
    private Double estimatedSavings;
    private LocalDate deadline;
    private String status;
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = "ACTIVE";
        if (currentProgress == null) currentProgress = 0.0;
        if (baselineAmount == null) baselineAmount = targetAmount != null ? Math.max(targetAmount * 4, targetAmount) : 0.0;
        if (timeframeDays == null || timeframeDays <= 0) timeframeDays = 30;
        if (recurrence == null || recurrence.isBlank()) recurrence = "WEEKLY";
        if (estimatedSavings == null) estimatedSavings = targetAmount != null ? targetAmount : 0.0;
    }
}
