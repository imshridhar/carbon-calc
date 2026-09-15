package com.ecotrack.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "lifestyle_surveys")
public class LifestyleSurvey {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    private String primaryTransport;
    private Double weeklyDrivingKm;
    private String carType;
    private String homeHeating;
    private Double monthlyElectricityKwh;
    private Boolean hasRenewableEnergy;
    private String dietType;
    private Integer meatMealsPerWeek;
    private Boolean buysLocalFood;
    private String shoppingHabits;
    private Boolean buysSecondHand;
    private Integer shortFlightsPerYear;
    private Integer longFlightsPerYear;
    private Double estimatedAnnualFootprint;
}
