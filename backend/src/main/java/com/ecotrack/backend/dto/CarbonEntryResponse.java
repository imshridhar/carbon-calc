package com.ecotrack.backend.dto;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder
public class CarbonEntryResponse {
    private Long id;
    private String category;
    private String activity;
    private Double amount;
    private String unit;
    private String notes;
    private LocalDate date;
    private LocalDateTime createdAt;
}
