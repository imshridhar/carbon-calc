package com.ecotrack.backend.service;

import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.repository.CarbonEntryRepository;
import com.ecotrack.backend.repository.GoalRepository;
import com.ecotrack.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final UserRepository userRepo;
    private final CarbonEntryRepository carbonRepo;
    private final GoalRepository goalRepo;
    private final BadgeService badgeService;

    public Map<String, Object> getLeaderboard(User currentUser) {
        List<Map<String, Object>> entries = new ArrayList<>();
        boolean currentUserHasEntries = carbonRepo.existsByUser(currentUser);

        for (User user : userRepo.findAll()) {
            if (!carbonRepo.existsByUser(user)) {
                continue;
            }

            Double totalRaw = carbonRepo.sumByUser(user);
            double totalKg = totalRaw != null ? round1(totalRaw) : 0.0;
            double score = round1(Math.max(0, 500 - totalKg));

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("userId", user.getId());
            entry.put("userName", user.getName());
            entry.put("totalCarbonKg", totalKg);
            entry.put("score", score);
            entry.put("impactPercent", round1((score / 500.0) * 100.0));
            entry.put("badgeCount", badgeService.countEarnedBadges(user));
            entry.put("completedGoals", goalRepo.countByUserAndStatus(user, "COMPLETED"));
            entry.put("isCurrentUser", user.getId().equals(currentUser.getId()));
            entries.add(entry);
        }

        entries.sort(Comparator.comparingDouble(entry -> (double) entry.get("totalCarbonKg")));
        for (int index = 0; index < entries.size(); index++) {
            entries.get(index).put("rank", index + 1);
        }

        Integer myRank = entries.stream()
            .filter(entry -> Boolean.TRUE.equals(entry.get("isCurrentUser")))
            .map(entry -> (Integer) entry.get("rank"))
            .findFirst()
            .orElse(null);

        Double myTotalRaw = carbonRepo.sumByUser(currentUser);
        double myTotal = myTotalRaw != null ? round1(myTotalRaw) : 0.0;
        double averageCarbonKg = entries.stream()
            .mapToDouble(entry -> (double) entry.get("totalCarbonKg"))
            .average()
            .orElse(0.0);
        double percentile = myRank != null && !entries.isEmpty()
            ? round1(100.0 - (((double) myRank - 1) / entries.size()) * 100.0)
            : 0.0;

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("entries", entries);
        response.put("currentUserRank", myRank);
        response.put("currentUserTotal", myTotal);
        response.put("currentUserEligible", currentUserHasEntries);
        response.put("currentUserScore", round1(Math.max(0, 500 - myTotal)));
        response.put("currentUserPercentile", percentile);
        response.put("totalParticipants", entries.size());
        response.put("averageCarbonKg", round1(averageCarbonKg));
        response.put("topPerformer", entries.isEmpty() ? null : entries.get(0));
        return response;
    }

    public Integer getCurrentRank(User user) {
        Object rank = getLeaderboard(user).get("currentUserRank");
        return rank instanceof Integer value ? value : null;
    }

    private double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
