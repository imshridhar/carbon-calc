package com.ecotrack.backend.dto;
import lombok.Data;
import java.time.LocalDate;

@Data
public class CarbonEntryRequest {
    private String category;
    private String activity;
    private Double amount;
    private String unit;
    private String notes;
    private LocalDate date;
}
