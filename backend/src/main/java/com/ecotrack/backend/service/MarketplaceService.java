package com.ecotrack.backend.service;

import com.ecotrack.backend.dto.MarketplaceItemRequest;
import com.ecotrack.backend.entity.MarketplaceItem;
import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.repository.MarketplaceItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MarketplaceService {

    private final MarketplaceItemRepository marketplaceRepo;

    public List<Map<String, Object>> getAll() {
        return marketplaceRepo.findAllByOrderByCreatedAtDesc().stream()
            .map(this::toResponse)
            .toList();
    }

    public Map<String, Object> getById(Long id) {
        return toResponse(findItem(id));
    }

    public Map<String, Object> create(User user, MarketplaceItemRequest request) {
        requireAdmin(user);
        MarketplaceItem item = MarketplaceItem.builder()
            .itemName(request.getItemName())
            .itemType(request.getItemType())
            .price(request.getPrice())
            .description(request.getDescription())
            .carbonOffsetValue(request.getCarbonOffsetValue())
            .build();
        return toResponse(marketplaceRepo.save(item));
    }

    public Map<String, Object> update(User user, Long id, MarketplaceItemRequest request) {
        requireAdmin(user);
        MarketplaceItem item = findItem(id);
        item.setItemName(request.getItemName());
        item.setItemType(request.getItemType());
        item.setPrice(request.getPrice());
        item.setDescription(request.getDescription());
        item.setCarbonOffsetValue(request.getCarbonOffsetValue());
        return toResponse(marketplaceRepo.save(item));
    }

    public void delete(User user, Long id) {
        requireAdmin(user);
        marketplaceRepo.delete(findItem(id));
    }

    private MarketplaceItem findItem(Long id) {
        return marketplaceRepo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Marketplace item not found"));
    }

    private void requireAdmin(User user) {
        if (user == null || !"ADMIN".equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
    }

    private Map<String, Object> toResponse(MarketplaceItem item) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", item.getId());
        response.put("itemName", item.getItemName());
        response.put("itemType", item.getItemType());
        response.put("price", item.getPrice());
        response.put("description", item.getDescription());
        response.put("carbonOffsetValue", item.getCarbonOffsetValue());
        response.put("createdAt", item.getCreatedAt());
        return response;
    }
}
