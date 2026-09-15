package com.ecotrack.backend.service;

import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.entity.UserNotification;
import com.ecotrack.backend.repository.CarbonEntryRepository;
import com.ecotrack.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepo;
    private final CarbonEntryRepository carbonRepo;
    private final BadgeService badgeService;
    private final LeaderboardService leaderboardService;

    public List<Map<String, Object>> getNotifications(User user) {
        return notificationRepo.findByUserOrderByCreatedAtDesc(user).stream()
            .map(this::toResponse)
            .toList();
    }

    public List<Map<String, Object>> getRecentNotifications(User user, int limit) {
        return notificationRepo.findByUserOrderByCreatedAtDesc(user).stream()
            .limit(limit)
            .map(this::toResponse)
            .toList();
    }

    public long getUnreadCount(User user) {
        return notificationRepo.countByUserAndReadFalse(user);
    }

    public Map<String, Object> markRead(User user, Long id) {
        UserNotification notification = notificationRepo.findById(id)
            .filter(item -> item.getUser().getId().equals(user.getId()))
            .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setRead(true);
        return toResponse(notificationRepo.save(notification));
    }

    public void delete(User user, Long id) {
        UserNotification notification = notificationRepo.findById(id)
            .filter(item -> item.getUser().getId().equals(user.getId()))
            .orElseThrow(() -> new RuntimeException("Notification not found"));
        notificationRepo.delete(notification);
    }

    public void createNotification(User user, String title, String message, String type) {
        notificationRepo.save(UserNotification.builder()
            .user(user)
            .title(title)
            .message(message)
            .type(type)
            .read(false)
            .build());
    }

    public void createNotificationIfAbsent(User user, String title, String message, String type) {
        if (!notificationRepo.existsByUserAndTypeAndTitleAndMessage(user, type, title, message)) {
            createNotification(user, title, message, type);
        }
    }

    public void createGoalCompletedNotification(User user, String goalTitle) {
        createNotificationIfAbsent(
            user,
            "Goal completed",
            "You completed \"" + goalTitle + "\". Keep the momentum going.",
            "GOAL"
        );
    }

    public void syncBadgeNotifications(User user) {
        for (String badgeName : badgeService.getEarnedBadgeNames(user)) {
            String title = "Badge unlocked: " + badgeName;
            String message = "You earned the " + badgeName + " badge.";
            createNotificationIfAbsent(user, title, message, "BADGE");
        }
    }

    public void syncHighEmissionAlert(User user) {
        LocalDate today = LocalDate.now();
        LocalDate currentWeekStart = today.minusDays(6);
        LocalDate previousWeekStart = currentWeekStart.minusDays(7);
        LocalDate previousWeekEnd = currentWeekStart.minusDays(1);

        Double currentWeekRaw = carbonRepo.sumByUserAndDateBetween(user, currentWeekStart, today);
        Double previousWeekRaw = carbonRepo.sumByUserAndDateBetween(user, previousWeekStart, previousWeekEnd);
        double currentWeek = currentWeekRaw != null ? currentWeekRaw : 0;
        double previousWeek = previousWeekRaw != null ? previousWeekRaw : 0;

        if (previousWeek <= 0 || currentWeek <= previousWeek) {
            return;
        }

        double increasePercent = ((currentWeek - previousWeek) / previousWeek) * 100;
        String title = "High Emission Alert";
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        if (increasePercent >= 15 && !notificationRepo.existsByUserAndTypeAndTitleAndCreatedAtAfter(user, "ALERT", title, todayStart)) {
            createNotification(
                user,
                title,
                "Your weekly emissions increased by " + Math.round(increasePercent) + "%. Consider reducing transport or energy usage.",
                "ALERT"
            );
        }
    }

    public void syncLeaderboardNotification(User user) {
        Integer rank = leaderboardService.getCurrentRank(user);
        if (rank == null || rank > 3) {
            return;
        }

        String title = "Leaderboard update";
        String message = "You moved to rank #" + rank + " on the leaderboard.";
        createNotificationIfAbsent(user, title, message, "LEADERBOARD");
    }

    private Map<String, Object> toResponse(UserNotification notification) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", notification.getId());
        response.put("title", notification.getTitle());
        response.put("message", notification.getMessage());
        response.put("type", notification.getType());
        response.put("read", notification.isRead());
        response.put("createdAt", notification.getCreatedAt());
        return response;
    }
}
