package com.ecotrack.backend.repository;

import com.ecotrack.backend.entity.MarketplaceItem;
import com.ecotrack.backend.entity.PurchaseTransaction;
import com.ecotrack.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransactionRepository extends JpaRepository<PurchaseTransaction, Long> {
    List<PurchaseTransaction> findByUserOrderByCreatedAtDesc(User user);
    List<PurchaseTransaction> findAllByOrderByCreatedAtDesc();
    boolean existsByUserAndMarketplaceItem(User user, MarketplaceItem marketplaceItem);
}
