package com.ecotrack.backend.dto;

import lombok.Data;

@Data
public class MarketplaceItemRequest {
    private String itemName;
    private String itemType;
    private Double price;
    private String description;
    private Double carbonOffsetValue;
}
