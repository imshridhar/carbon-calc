package com.ecotrack.backend.repository;

import com.ecotrack.backend.entity.MarketplaceItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MarketplaceItemRepository extends JpaRepository<MarketplaceItem, Long> {
    List<MarketplaceItem> findAllByOrderByCreatedAtDesc();
}
