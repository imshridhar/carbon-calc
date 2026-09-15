package com.ecotrack.backend.service;

import com.ecotrack.backend.dto.TransactionRequest;
import com.ecotrack.backend.entity.MarketplaceItem;
import com.ecotrack.backend.entity.PurchaseTransaction;
import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.repository.MarketplaceItemRepository;
import com.ecotrack.backend.repository.TransactionRepository;
import com.ecotrack.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepo;
    private final MarketplaceItemRepository marketplaceRepo;
    private final UserRepository userRepo;
    private final NotificationService notificationService;

    public Map<String, Object> create(User user, TransactionRequest request) {
        MarketplaceItem item = marketplaceRepo.findById(request.getMarketplaceItemId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Marketplace item not found"));

        PurchaseTransaction transaction = PurchaseTransaction.builder()
            .user(user)
            .marketplaceItem(item)
            .amount(item.getPrice())
            .status("COMPLETED")
            .build();

        PurchaseTransaction saved = transactionRepo.save(transaction);
        String message = "You purchased " + item.getItemName() + " for " + item.getPrice() + " and offset " + round1(item.getCarbonOffsetValue() != null ? item.getCarbonOffsetValue() : 0) + " kg CO2e.";
        notificationService.createNotification(user, "Purchase confirmed", message, "MARKETPLACE");
        return toResponse(saved);
    }

    public List<Map<String, Object>> getUserTransactions(User actor, Long userId) {
        User user = userRepo.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (!user.getId().equals(actor.getId()) && !"ADMIN".equals(actor.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return transactionRepo.findByUserOrderByCreatedAtDesc(user).stream()
            .map(this::toResponse)
            .toList();
    }

    public List<Map<String, Object>> getAllTransactions(User actor) {
        if (!"ADMIN".equals(actor.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return transactionRepo.findAllByOrderByCreatedAtDesc().stream()
            .map(this::toResponse)
            .toList();
    }

    private Map<String, Object> toResponse(PurchaseTransaction transaction) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", transaction.getId());
        response.put("userId", transaction.getUser().getId());
        response.put("userName", transaction.getUser().getName());
        response.put("marketplaceItemId", transaction.getMarketplaceItem().getId());
        response.put("itemName", transaction.getMarketplaceItem().getItemName());
        response.put("itemType", transaction.getMarketplaceItem().getItemType());
        response.put("carbonOffsetValue", transaction.getMarketplaceItem().getCarbonOffsetValue());
        response.put("amount", transaction.getAmount());
        response.put("status", transaction.getStatus());
        response.put("createdAt", transaction.getCreatedAt());
        return response;
    }

    private double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
