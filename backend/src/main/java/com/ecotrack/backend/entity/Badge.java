package com.ecotrack.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "badges")
public class Badge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private String icon;         // e.g. "Leaf", "Car", "Zap", "TreePine"
    private String category;     // transport, energy, food, general
    private Double thresholdKg;  // kg CO2 threshold to earn this badge
    private String color;        // e.g. "text-green-600"
    private String bgColor;      // e.g. "bg-green-100"
    private boolean active;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (active == false) active = true;
    }
}
