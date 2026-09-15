package com.ecotrack.backend.service;

import com.ecotrack.backend.dto.CarbonEntryRequest;
import com.ecotrack.backend.dto.CarbonEntryResponse;
import com.ecotrack.backend.entity.CarbonEntry;
import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.repository.CarbonEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CarbonEntryService {
    private final CarbonEntryRepository repo;
    private final NotificationService notificationService;

    public List<CarbonEntryResponse> getAll(User user) {
        return repo.findByUserOrderByDateDescCreatedAtDesc(user).stream().map(this::toDto).toList();
    }

    public CarbonEntryResponse create(User user, CarbonEntryRequest req) {
        CarbonEntry e = CarbonEntry.builder()
            .user(user).category(req.getCategory()).activity(req.getActivity())
            .amount(req.getAmount()).unit(req.getUnit() != null ? req.getUnit() : "kg CO2")
            .notes(req.getNotes()).date(req.getDate() != null ? req.getDate() : LocalDate.now())
            .build();
        CarbonEntry saved = repo.save(e);
        syncNotifications(user);
        return toDto(saved);
    }

    public CarbonEntryResponse update(User user, Long id, CarbonEntryRequest req) {
        CarbonEntry e = repo.findById(id)
            .filter(x -> x.getUser().getId().equals(user.getId()))
            .orElseThrow(() -> new RuntimeException("Entry not found"));
        e.setCategory(req.getCategory()); e.setActivity(req.getActivity());
        e.setAmount(req.getAmount()); e.setUnit(req.getUnit()); e.setNotes(req.getNotes());
        if (req.getDate() != null) e.setDate(req.getDate());
        CarbonEntry saved = repo.save(e);
        syncNotifications(user);
        return toDto(saved);
    }

    public void delete(User user, Long id) {
        CarbonEntry e = repo.findById(id)
            .filter(x -> x.getUser().getId().equals(user.getId()))
            .orElseThrow(() -> new RuntimeException("Entry not found"));
        repo.delete(e);
        syncNotifications(user);
    }

    private void syncNotifications(User user) {
        notificationService.syncBadgeNotifications(user);
        notificationService.syncHighEmissionAlert(user);
        notificationService.syncLeaderboardNotification(user);
    }

    private CarbonEntryResponse toDto(CarbonEntry e) {
        return CarbonEntryResponse.builder()
            .id(e.getId()).category(e.getCategory()).activity(e.getActivity())
            .amount(e.getAmount()).unit(e.getUnit()).notes(e.getNotes())
            .date(e.getDate()).createdAt(e.getCreatedAt()).build();
    }
}
