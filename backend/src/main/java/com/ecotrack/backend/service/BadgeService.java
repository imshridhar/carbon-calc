package com.ecotrack.backend.service;

import com.ecotrack.backend.entity.CarbonEntry;
import com.ecotrack.backend.entity.PurchaseTransaction;
import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.repository.BadgeRepository;
import com.ecotrack.backend.repository.CarbonEntryRepository;
import com.ecotrack.backend.repository.GoalRepository;
import com.ecotrack.backend.repository.SurveyRepository;
import com.ecotrack.backend.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class BadgeService {
    private static final Set<String> LOW_EMISSION_TRANSPORTS = Set.of(
        "bicycle",
        "walking",
        "bus",
        "train",
        "metro",
        "subway",
        "tram",
        "transit",
        "public_transport"
    );

    private final BadgeRepository badgeRepo;
    private final CarbonEntryRepository carbonRepo;
    private final SurveyRepository surveyRepo;
    private final GoalRepository goalRepo;
    private final TransactionRepository transactionRepository;

    public List<Map<String, Object>> getBadgesForUser(User user) {
        Double totalKgRaw = carbonRepo.sumByUser(user);
        double totalKg = totalKgRaw != null ? totalKgRaw : 0.0;

        double transportKg = 0.0;
        double energyKg = 0.0;
        double foodKg = 0.0;
        for (Object[] row : carbonRepo.sumByCategoryForUser(user)) {
            String category = normalizeCategory(row[0] != null ? row[0].toString() : null);
            double value = row[1] instanceof Number number ? number.doubleValue() : 0.0;
            if ("transport".equals(category)) {
                transportKg = value;
            } else if ("energy".equals(category)) {
                energyKg = value;
            } else if ("food".equals(category)) {
                foodKg = value;
            }
        }

        var survey = surveyRepo.findByUser(user).orElse(null);
        boolean isLowEmissionCommute = survey != null && isLowEmissionTransport(survey.getPrimaryTransport());
        boolean isRenewable = survey != null && Boolean.TRUE.equals(survey.getHasRenewableEnergy());
        boolean isPlantBased = survey != null && ("vegan".equalsIgnoreCase(survey.getDietType()) || "vegetarian".equalsIgnoreCase(survey.getDietType()));
        long completedGoals = goalRepo.countByUserAndStatus(user, "COMPLETED");
        long totalEntries = carbonRepo.findByUserOrderByDateDescCreatedAtDesc(user).size();

        LocalDate today = LocalDate.now();
        LocalDate sevenDaysAgo = today.minusDays(6);
        List<CarbonEntry> recentEntries = carbonRepo.findByUserAndDateBetweenOrderByDateAsc(user, sevenDaysAgo, today);
        double weeklyTotal = recentEntries.stream()
            .mapToDouble(CarbonEntry::getAmount)
            .sum();
        double weeklyEnergyKg = recentEntries.stream()
            .filter(entry -> "energy".equalsIgnoreCase(entry.getCategory()))
            .mapToDouble(CarbonEntry::getAmount)
            .sum();

        List<PurchaseTransaction> transactions = transactionRepository.findByUserOrderByCreatedAtDesc(user);
        double totalOffsets = transactions.stream()
            .filter(transaction -> "COMPLETED".equalsIgnoreCase(transaction.getStatus()))
            .map(PurchaseTransaction::getMarketplaceItem)
            .filter(item -> item != null && item.getCarbonOffsetValue() != null)
            .mapToDouble(item -> item.getCarbonOffsetValue())
            .sum();
        double treeOffsets = transactions.stream()
            .filter(transaction -> "COMPLETED".equalsIgnoreCase(transaction.getStatus()))
            .map(PurchaseTransaction::getMarketplaceItem)
            .filter(item -> item != null && item.getCarbonOffsetValue() != null && "tree_planting".equalsIgnoreCase(item.getItemType()))
            .mapToDouble(item -> item.getCarbonOffsetValue())
            .sum();

        List<Map<String, Object>> badges = new ArrayList<>();
        badges.add(binaryBadge(
            "Green Commuter",
            "Switch to bike, walking, or transit as your default commute.",
            "transport",
            "Car",
            "bg-sky-100",
            "text-sky-600",
            isLowEmissionCommute,
            "habit",
            isLowEmissionCommute
                ? "Low-emission commute set in your lifestyle profile."
                : "Choose bus, train, bicycle, or walking in your lifestyle profile."
        ));
        badges.add(milestoneBadge(
            "Eco Warrior",
            "Complete at least one carbon reduction goal.",
            "goals",
            "Trophy",
            "bg-amber-100",
            "text-amber-600",
            completedGoals,
            1,
            "milestone",
            formatProgressLabel(completedGoals, 1, "goals completed")
        ));
        badges.add(binaryBadge(
            "Plant Based Pro",
            "Adopt a vegetarian or vegan meal profile.",
            "food",
            "Leaf",
            "bg-lime-100",
            "text-lime-600",
            isPlantBased,
            "lifestyle",
            isPlantBased
                ? "Plant-based meal profile saved."
                : "Set your diet profile to vegetarian or vegan."
        ));
        badges.add(binaryBadge(
            "Renewable Master",
            "Enable renewable energy in your home profile.",
            "energy",
            "Zap",
            "bg-yellow-100",
            "text-yellow-600",
            isRenewable,
            "lifestyle",
            isRenewable
                ? "Renewable energy is enabled in your lifestyle profile."
                : "Turn on renewable energy in your lifestyle profile."
        ));
        badges.add(milestoneBadge(
            "Zero Waste Hero",
            "Track seven low-impact activities to build momentum.",
            "tracking",
            "ShieldCheck",
            "bg-emerald-100",
            "text-emerald-600",
            totalEntries,
            7,
            "consistency",
            formatProgressLabel(totalEntries, 7, "entries logged")
        ));

        double carbonNeutralTarget = totalKg > 0 ? totalKg : 1.0;
        badges.add(milestoneBadge(
            "Carbon Neutralist",
            "Offset your tracked emissions through marketplace actions.",
            "offset",
            "Sparkles",
            "bg-violet-100",
            "text-violet-600",
            totalOffsets,
            carbonNeutralTarget,
            "impact",
            totalKg > 0
                ? formatProgressLabel(totalOffsets, totalKg, "kg CO2e offset")
                : "Track some carbon activity before offsetting it."
        ));
        badges.add(milestoneBadge(
            "Forest Guardian",
            "Fund tree planting projects through the marketplace.",
            "offset",
            "TreePine",
            "bg-green-100",
            "text-green-600",
            treeOffsets,
            50,
            "impact",
            formatProgressLabel(treeOffsets, 50, "kg CO2e tree offset")
        ));
        badges.add(limitBadge(
            "Solar Sentinel",
            "Use renewable energy and keep your last 7 days of energy emissions below 10 kg CO2e.",
            "energy",
            "Shield",
            "bg-indigo-100",
            "text-indigo-600",
            weeklyEnergyKg,
            10,
            isRenewable,
            "efficiency",
            !isRenewable
                ? "Enable renewable energy in your profile to start this badge."
                : weeklyEnergyKg > 0
                    ? "Last 7 days: " + formatProgressLabel(weeklyEnergyKg, 10, "kg CO2e")
                    : "Log an energy activity this week to start progress."
        ));
        badges.add(limitBadge(
            "Weekly Balance",
            "Keep your total weekly emissions below 20 kg CO2e.",
            "tracking",
            "Award",
            "bg-rose-100",
            "text-rose-600",
            weeklyTotal,
            20,
            true,
            "challenge",
            weeklyTotal > 0
                ? "This week: " + formatProgressLabel(weeklyTotal, 20, "kg CO2e")
                : "Log activity this week to start progress."
        ));
        badges.add(milestoneBadge(
            "Food Optimizer",
            "Track at least 20 kg of lower-impact food choices.",
            "food",
            "Utensils",
            "bg-orange-100",
            "text-orange-600",
            foodKg,
            20,
            "tracking",
            formatProgressLabel(foodKg, 20, "kg CO2e tracked")
        ));

        for (var adminBadge : badgeRepo.findByActiveTrue()) {
            double threshold = adminBadge.getThresholdKg() != null ? adminBadge.getThresholdKg() : 0.0;
            if (threshold <= 0) {
                continue;
            }

            BadgeMetric metric = resolveAdminBadgeMetric(adminBadge.getCategory(), totalKg, transportKg, energyKg, foodKg);
            badges.add(milestoneBadge(
                adminBadge.getName(),
                adminBadge.getDescription() != null && !adminBadge.getDescription().isBlank()
                    ? adminBadge.getDescription()
                    : "Reach the configured activity threshold to unlock this badge.",
                metric.category(),
                adminBadge.getIcon() != null ? adminBadge.getIcon() : "Award",
                adminBadge.getBgColor() != null ? adminBadge.getBgColor() : "bg-green-100",
                adminBadge.getColor() != null ? adminBadge.getColor() : "text-green-600",
                metric.value(),
                threshold,
                "custom",
                metric.label() + ": " + formatProgressLabel(metric.value(), threshold, "kg CO2e tracked")
            ));
        }

        return badges;
    }

    public long countEarnedBadges(User user) {
        return getBadgesForUser(user).stream()
            .filter(badge -> Boolean.TRUE.equals(badge.get("earned")))
            .count();
    }

    public List<String> getEarnedBadgeNames(User user) {
        return getBadgesForUser(user).stream()
            .filter(badge -> Boolean.TRUE.equals(badge.get("earned")))
            .map(badge -> (String) badge.get("name"))
            .distinct()
            .toList();
    }

    private Map<String, Object> binaryBadge(
            String name,
            String description,
            String category,
            String iconName,
            String bgColor,
            String color,
            boolean earned,
            String tier,
            String progressLabel) {
        return badge(name, description, category, iconName, bgColor, color, 1.0, earned ? 1.0 : 0.0, earned, earned ? 100 : 0, tier, progressLabel);
    }

    private Map<String, Object> milestoneBadge(
            String name,
            String description,
            String category,
            String iconName,
            String bgColor,
            String color,
            double current,
            double target,
            String tier,
            String progressLabel) {
        boolean earned = target > 0 && current >= target;
        int progress = target > 0 ? (int) Math.min(Math.round((current / target) * 100.0), 100) : 0;
        return badge(name, description, category, iconName, bgColor, color, target, current, earned, progress, tier, progressLabel);
    }

    private Map<String, Object> limitBadge(
            String name,
            String description,
            String category,
            String iconName,
            String bgColor,
            String color,
            double measured,
            double limit,
            boolean prerequisiteMet,
            String tier,
            String progressLabel) {
        boolean earned = prerequisiteMet && measured > 0 && measured <= limit;
        int progress = 0;
        if (prerequisiteMet && measured > 0 && limit > 0) {
            progress = (int) Math.min(Math.round((limit / Math.max(measured, limit)) * 100.0), 100);
        }
        return badge(name, description, category, iconName, bgColor, color, limit, measured, earned, progress, tier, progressLabel);
    }

    private Map<String, Object> badge(
            String name,
            String description,
            String category,
            String iconName,
            String bgColor,
            String color,
            double target,
            double current,
            boolean earned,
            int progress,
            String tier,
            String progressLabel) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("code", name.toLowerCase().replace(' ', '-'));
        response.put("name", name);
        response.put("description", description);
        response.put("category", normalizeCategory(category));
        response.put("iconName", iconName);
        response.put("bgColor", bgColor);
        response.put("color", color);
        response.put("target", round1(target));
        response.put("current", round1(current));
        response.put("earned", earned);
        response.put("progress", Math.max(0, Math.min(progress, 100)));
        response.put("tier", tier);
        response.put("statusLabel", earned ? "Earned" : progress > 0 ? "In Progress" : "Locked");
        response.put("progressLabel", progressLabel);
        return response;
    }

    private BadgeMetric resolveAdminBadgeMetric(String category, double totalKg, double transportKg, double energyKg, double foodKg) {
        String normalizedCategory = normalizeCategory(category);
        return switch (normalizedCategory) {
            case "transport" -> new BadgeMetric("transport", transportKg, "Transport tracked");
            case "energy" -> new BadgeMetric("energy", energyKg, "Energy tracked");
            case "food" -> new BadgeMetric("food", foodKg, "Food tracked");
            default -> new BadgeMetric("general", totalKg, "Tracked");
        };
    }

    private boolean isLowEmissionTransport(String primaryTransport) {
        if (primaryTransport == null || primaryTransport.isBlank()) {
            return false;
        }
        return LOW_EMISSION_TRANSPORTS.contains(primaryTransport.trim().toLowerCase(Locale.ROOT));
    }

    private String normalizeCategory(String category) {
        if (category == null || category.isBlank()) {
            return "general";
        }
        return category.trim().toLowerCase(Locale.ROOT);
    }

    private String formatProgressLabel(double current, double target, String unitLabel) {
        return formatValue(current) + " / " + formatValue(target) + " " + unitLabel;
    }

    private String formatValue(double value) {
        double rounded = round1(value);
        if (Math.rint(rounded) == rounded) {
            return Long.toString((long) rounded);
        }
        return String.format(Locale.US, "%.1f", rounded);
    }

    private double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private record BadgeMetric(String category, double value, String label) {
    }
}
