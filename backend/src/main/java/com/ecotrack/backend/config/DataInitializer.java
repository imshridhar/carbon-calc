package com.ecotrack.backend.config;

import com.ecotrack.backend.entity.Badge;
import com.ecotrack.backend.entity.CarbonEntry;
import com.ecotrack.backend.entity.Goal;
import com.ecotrack.backend.entity.LifestyleSurvey;
import com.ecotrack.backend.entity.MarketplaceItem;
import com.ecotrack.backend.entity.PurchaseTransaction;
import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.entity.UserNotification;
import com.ecotrack.backend.repository.BadgeRepository;
import com.ecotrack.backend.repository.CarbonEntryRepository;
import com.ecotrack.backend.repository.GoalRepository;
import com.ecotrack.backend.repository.MarketplaceItemRepository;
import com.ecotrack.backend.repository.NotificationRepository;
import com.ecotrack.backend.repository.SurveyRepository;
import com.ecotrack.backend.repository.TransactionRepository;
import com.ecotrack.backend.repository.UserRepository;
import com.ecotrack.backend.service.SurveyService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {
    private static final String BALANCED_TRACKER_LEGACY_DESCRIPTION = "Log transport, food, and energy activity in one week.";
    private static final String BALANCED_TRACKER_DESCRIPTION = "Track at least 25 kg CO2 across your activities to build a consistent baseline.";
    private static final String SURVEY_ACTIVITY_PREFIX = "[Survey]";
    private static final double LEGACY_SEEDED_WEEKLY_KM = 45.0;

    private final UserRepository userRepository;
    private final CarbonEntryRepository carbonEntryRepository;
    private final GoalRepository goalRepository;
    private final SurveyRepository surveyRepository;
    private final BadgeRepository badgeRepository;
    private final MarketplaceItemRepository marketplaceRepository;
    private final TransactionRepository transactionRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final SurveyService surveyService;

    @Value("${app.seed-demo-data:true}")
    private boolean seedDemoData;

    @Value("${app.admin.name:CarbonCalc Admin}")
    private String adminName;

    @Value("${app.admin.email:admin@carboncalc.com}")
    private String adminEmail;

    @Value("${app.admin.password:Admin@123}")
    private String adminPassword;

    @Override
    public void run(ApplicationArguments args) {
        if (!seedDemoData) {
            return;
        }

        User admin = upsertUser(adminName, adminEmail, adminPassword, "ADMIN", LocalDateTime.now().minusMonths(6));
        User ava = upsertUser("Ava Green", "ava@carboncalc.com", "User@123", "USER", LocalDateTime.now().minusMonths(4));
        User liam = upsertUser("Liam Woods", "liam@carboncalc.com", "User@123", "USER", LocalDateTime.now().minusMonths(3));

        SurveySeedProfile adminSurvey = new SurveySeedProfile("train", 120.0, null, "electric", 85.0, true, "vegetarian", 2, true, "moderate", true, 1, 0);
        SurveySeedProfile avaSurvey = new SurveySeedProfile("bicycle", 40.0, null, "electric", 12.0, true, "vegan", 0, true, "moderate", true, 0, 0);
        SurveySeedProfile liamSurvey = new SurveySeedProfile("car", 80.0, "hybrid", "electric", 210.0, false, "omnivore", 14, true, "moderate", true, 3, 1);

        seedOrBackfillSurvey(admin, adminSurvey);
        seedOrBackfillSurvey(ava, avaSurvey);
        seedOrBackfillSurvey(liam, liamSurvey);

        seedEntriesIfMissing(admin, List.of(
            entry("transport", "Metro commute", 4.8, 6),
            entry("food", "Vegetarian lunch plan", 2.4, 5),
            entry("energy", "Apartment electricity", 3.6, 4),
            entry("transport", "Weekend ride-share", 5.1, 2)
        ));
        seedEntriesIfMissing(ava, List.of(
            entry("transport", "Cycling commute", 0.8, 6),
            entry("food", "Plant-based groceries", 1.6, 5),
            entry("energy", "Solar-backed apartment", 1.9, 3)
        ));
        seedEntriesIfMissing(liam, List.of(
            entry("transport", "SUV commute", 9.7, 6),
            entry("food", "Takeout meals", 4.3, 4),
            entry("energy", "Home electricity", 6.5, 3),
            entry("transport", "Airport trip", 11.2, 1)
        ));

        seedGoalsIfMissing(admin, List.of(
            goal("Reduce transport emissions", "Swap at least three commute days a week to metro, biking, or walking.", "transport", 180.0, 40.0, 18.0, 30, "WEEKLY", LocalDate.now().plusDays(21), "ACTIVE"),
            goal("Lower monthly energy use", "Keep home electricity usage below your target for the full month.", "energy", 140.0, 30.0, 30.0, 30, "WEEKLY", LocalDate.now().minusDays(2), "COMPLETED")
        ));
        seedGoalsIfMissing(ava, List.of(
            goal("Stay bike-first", "Keep cycling as the primary commute option this month.", "transport", 90.0, 20.0, 9.0, 30, "WEEKLY", LocalDate.now().plusDays(15), "ACTIVE")
        ));
        seedGoalsIfMissing(liam, List.of(
            goal("Cut food emissions", "Swap high-impact meals for lower-emission options twice a week.", "food", 160.0, 35.0, 12.0, 45, "WEEKLY", LocalDate.now().plusDays(28), "ACTIVE")
        ));

        seedBadgesIfMissing(admin);
        seedMarketplaceIfMissing();
        seedTransactionsIfMissing(ava, liam);
        seedNotificationsIfMissing(admin, ava, liam);
        backfillSeededBadgeDefinitions(admin);
        backfillGoalMetadata();
    }

    private User upsertUser(String name, String email, String password, String role, LocalDateTime createdAt) {
        User user = userRepository.findByEmail(email).orElseGet(User::new);
        boolean isNewUser = user.getId() == null && (user.getEmail() == null || user.getEmail().isBlank());
        user.setName(name);
        user.setEmail(email);
        if (isNewUser || user.getPassword() == null || user.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(password));
        }
        user.setRole(role);
        user.setEnabled(true);
        if (user.getCreatedAt() == null) {
            user.setCreatedAt(createdAt);
        }
        return userRepository.save(user);
    }

    private void seedOrBackfillSurvey(User user, SurveySeedProfile profile) {
        LifestyleSurvey existingSurvey = surveyRepository.findByUser(user).orElse(null);

        if (existingSurvey == null) {
            surveyService.save(user, profile.toSurvey(), false);
            return;
        }

        if (isLegacySeededSurvey(existingSurvey, profile)) {
            surveyService.save(user, profile.toSurvey(), false);
            return;
        }

        if (!hasSurveyDerivedEntryForToday(user)) {
            surveyService.save(user, existingSurvey, false);
        }
    }

    private boolean isLegacySeededSurvey(LifestyleSurvey survey, SurveySeedProfile profile) {
        return matchesText(survey.getPrimaryTransport(), profile.primaryTransport())
            && matchesNumber(survey.getWeeklyDrivingKm(), LEGACY_SEEDED_WEEKLY_KM)
            && matchesText(survey.getCarType(), "hybrid")
            && matchesText(survey.getHomeHeating(), profile.homeHeating())
            && matchesNumber(survey.getMonthlyElectricityKwh(), profile.monthlyElectricityKwh())
            && matchesBoolean(survey.getHasRenewableEnergy(), profile.renewableEnergy())
            && matchesText(survey.getDietType(), profile.dietType())
            && matchesInteger(survey.getMeatMealsPerWeek(), profile.meatMealsPerWeek())
            && matchesBoolean(survey.getBuysLocalFood(), profile.buysLocalFood())
            && matchesText(survey.getShoppingHabits(), profile.shoppingHabits())
            && matchesBoolean(survey.getBuysSecondHand(), profile.buysSecondHand())
            && matchesInteger(survey.getShortFlightsPerYear(), profile.shortFlightsPerYear())
            && matchesInteger(survey.getLongFlightsPerYear(), profile.longFlightsPerYear());
    }

    private boolean hasSurveyDerivedEntryForToday(User user) {
        return carbonEntryRepository.findByUserAndDate(user, LocalDate.now()).stream()
            .anyMatch(this::isSurveyGeneratedEntry);
    }

    private boolean isSurveyGeneratedEntry(CarbonEntry entry) {
        return entry.getActivity() != null && entry.getActivity().startsWith(SURVEY_ACTIVITY_PREFIX);
    }

    private void seedEntriesIfMissing(User user, List<SeedEntry> entries) {
        boolean hasManualEntries = carbonEntryRepository.findByUserOrderByDateDescCreatedAtDesc(user).stream()
            .anyMatch(entry -> !isSurveyGeneratedEntry(entry));
        if (hasManualEntries) {
            return;
        }

        for (SeedEntry seedEntry : entries) {
            LocalDate entryDate = LocalDate.now().minusDays(seedEntry.daysAgo());
            carbonEntryRepository.save(CarbonEntry.builder()
                .user(user)
                .category(seedEntry.category())
                .activity(seedEntry.activity())
                .amount(seedEntry.amount())
                .unit("kg CO2")
                .notes("Seeded demo data")
                .date(entryDate)
                .createdAt(entryDate.atTime(9, 0))
                .build());
        }
    }

    private void seedGoalsIfMissing(User user, List<Goal> goals) {
        if (!goalRepository.findByUserOrderByCreatedAtDesc(user).isEmpty()) {
            return;
        }

        goalRepository.saveAll(goals.stream().map(goal ->
            Goal.builder()
                .user(user)
                .title(goal.getTitle())
                .description(goal.getDescription())
                .category(goal.getCategory())
                .baselineAmount(goal.getBaselineAmount())
                .targetAmount(goal.getTargetAmount())
                .currentProgress(goal.getCurrentProgress())
                .timeframeDays(goal.getTimeframeDays())
                .recurrence(goal.getRecurrence())
                .estimatedSavings(goal.getEstimatedSavings())
                .deadline(goal.getDeadline())
                .status(goal.getStatus())
                .createdAt(LocalDateTime.now().minusDays(7))
                .build()
        ).toList());
    }

    private void seedBadgesIfMissing(User admin) {
        if (!badgeRepository.findByActiveTrue().isEmpty()) {
            return;
        }

        badgeRepository.saveAll(List.of(
            Badge.builder()
                .name("Climate Champion")
                .description("Track at least 75 kg CO2 across your activities.")
                .icon("Trophy")
                .category("general")
                .thresholdKg(75.0)
                .color("text-amber-600")
                .bgColor("bg-amber-100")
                .active(true)
                .createdBy(admin)
                .build(),
            Badge.builder()
                .name("Balanced Tracker")
                .description(BALANCED_TRACKER_DESCRIPTION)
                .icon("Shield")
                .category("general")
                .thresholdKg(25.0)
                .color("text-indigo-600")
                .bgColor("bg-indigo-100")
                .active(true)
                .createdBy(admin)
                .build()
        ));
    }

    private void backfillSeededBadgeDefinitions(User admin) {
        List<Badge> badges = badgeRepository.findAll();
        boolean updated = false;

        for (Badge badge : badges) {
            if (isLegacyBalancedTrackerBadge(badge)) {
                badge.setDescription(BALANCED_TRACKER_DESCRIPTION);
                if (badge.getThresholdKg() == null || badge.getThresholdKg() <= 0) {
                    badge.setThresholdKg(25.0);
                }
                if (badge.getCategory() == null || badge.getCategory().isBlank()) {
                    badge.setCategory("general");
                }
                if (badge.getCreatedBy() == null) {
                    badge.setCreatedBy(admin);
                }
                updated = true;
            }
        }

        if (updated) {
            badgeRepository.saveAll(badges);
        }
    }

    private boolean isLegacyBalancedTrackerBadge(Badge badge) {
        return badge != null
            && "Balanced Tracker".equalsIgnoreCase(badge.getName())
            && BALANCED_TRACKER_LEGACY_DESCRIPTION.equals(badge.getDescription());
    }

    private void seedMarketplaceIfMissing() {
        if (!marketplaceRepository.findAll().isEmpty()) {
            return;
        }

        marketplaceRepository.saveAll(List.of(
            MarketplaceItem.builder()
                .itemName("Tree Planting Initiative")
                .itemType("tree_planting")
                .price(200.0)
                .description("Sponsor native tree planting in a verified reforestation project.")
                .carbonOffsetValue(10.0)
                .build(),
            MarketplaceItem.builder()
                .itemName("Solar Energy Support")
                .itemType("renewable_energy")
                .price(500.0)
                .description("Contribute to a community solar rollout and offset medium-term energy emissions.")
                .carbonOffsetValue(25.0)
                .build(),
            MarketplaceItem.builder()
                .itemName("Carbon Credit Bundle")
                .itemType("carbon_credit")
                .price(750.0)
                .description("Purchase a verified carbon credit package to offset high-impact activity.")
                .carbonOffsetValue(40.0)
                .build()
        ));
    }

    private void seedTransactionsIfMissing(User ava, User liam) {
        if (marketplaceRepository.findAll().isEmpty()) {
            return;
        }

        List<MarketplaceItem> items = marketplaceRepository.findAllByOrderByCreatedAtDesc();
        MarketplaceItem treePlanting = items.stream()
            .filter(item -> "Tree Planting Initiative".equals(item.getItemName()))
            .findFirst()
            .orElse(items.get(0));
        MarketplaceItem solarSupport = items.stream()
            .filter(item -> "Solar Energy Support".equals(item.getItemName()))
            .findFirst()
            .orElse(items.get(0));

        List<PurchaseTransaction> transactionsToSeed = new ArrayList<>();
        if (!transactionRepository.existsByUserAndMarketplaceItem(ava, treePlanting)) {
            transactionsToSeed.add(PurchaseTransaction.builder()
                .user(ava)
                .marketplaceItem(treePlanting)
                .amount(treePlanting.getPrice())
                .status("COMPLETED")
                .createdAt(LocalDateTime.now().minusDays(3))
                .build());
        }
        if (!transactionRepository.existsByUserAndMarketplaceItem(liam, solarSupport)) {
            transactionsToSeed.add(PurchaseTransaction.builder()
                .user(liam)
                .marketplaceItem(solarSupport)
                .amount(solarSupport.getPrice())
                .status("COMPLETED")
                .createdAt(LocalDateTime.now().minusDays(1))
                .build());
        }

        if (!transactionsToSeed.isEmpty()) {
            transactionRepository.saveAll(transactionsToSeed);
        }
    }

    private void seedNotificationsIfMissing(User admin, User ava, User liam) {
        List<UserNotification> notificationsToSeed = new ArrayList<>();
        addNotificationIfMissing(notificationsToSeed, admin, "Badge unlocked: Green Achiever", "You earned the Green Achiever badge.", "BADGE", false, 4);
        addNotificationIfMissing(notificationsToSeed, ava, "Purchase confirmed", "You purchased Tree Planting Initiative for 200.0 and offset 10.0 kg CO2e.", "MARKETPLACE", false, 3);
        addNotificationIfMissing(notificationsToSeed, ava, "Leaderboard update", "You moved to rank #1 on the leaderboard.", "LEADERBOARD", true, 2);
        addNotificationIfMissing(notificationsToSeed, liam, "High Emission Alert", "Your weekly emissions increased by 18%. Consider reducing transport or energy usage.", "ALERT", false, 1);

        if (!notificationsToSeed.isEmpty()) {
            notificationRepository.saveAll(notificationsToSeed);
        }
    }

    private void addNotificationIfMissing(List<UserNotification> notificationsToSeed, User user, String title, String message, String type, boolean read, int daysAgo) {
        if (!notificationRepository.existsByUserAndTypeAndTitleAndMessage(user, type, title, message)) {
            notificationsToSeed.add(notification(user, title, message, type, read, daysAgo));
        }
    }

    private UserNotification notification(User user, String title, String message, String type, boolean read, int daysAgo) {
        return UserNotification.builder()
            .user(user)
            .title(title)
            .message(message)
            .type(type)
            .read(read)
            .createdAt(LocalDateTime.now().minusDays(daysAgo))
            .build();
    }

    private SeedEntry entry(String category, String activity, double amount, int daysAgo) {
        return new SeedEntry(category, activity, amount, daysAgo);
    }

    private Goal goal(String title, String description, String category, double targetAmount, double currentProgress, LocalDate deadline, String status) {
        return Goal.builder()
            .title(title)
            .description(description)
            .category(category)
            .targetAmount(targetAmount)
            .currentProgress(currentProgress)
            .deadline(deadline)
            .status(status)
            .build();
    }

    private Goal goal(String title, String description, String category, double baselineAmount, double targetAmount, double currentProgress, int timeframeDays, String recurrence, LocalDate deadline, String status) {
        return Goal.builder()
            .title(title)
            .description(description)
            .category(category)
            .baselineAmount(baselineAmount)
            .targetAmount(targetAmount)
            .currentProgress(currentProgress)
            .timeframeDays(timeframeDays)
            .recurrence(recurrence)
            .estimatedSavings(targetAmount)
            .deadline(deadline)
            .status(status)
            .build();
    }

    private void backfillGoalMetadata() {
        List<Goal> goals = goalRepository.findAll();
        boolean updated = false;

        for (Goal goal : goals) {
            if (goal.getBaselineAmount() == null || goal.getBaselineAmount() <= 0) {
                goal.setBaselineAmount(Math.max(goal.getTargetAmount() != null ? goal.getTargetAmount() * 4 : 100.0, 100.0));
                updated = true;
            }
            if (goal.getTimeframeDays() == null || goal.getTimeframeDays() <= 0) {
                goal.setTimeframeDays(goal.getDeadline() != null && goal.getDeadline().isAfter(LocalDate.now())
                    ? (int) java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), goal.getDeadline())
                    : 30);
                updated = true;
            }
            if (goal.getRecurrence() == null || goal.getRecurrence().isBlank()) {
                goal.setRecurrence("WEEKLY");
                updated = true;
            }
            if (goal.getEstimatedSavings() == null || goal.getEstimatedSavings() <= 0) {
                goal.setEstimatedSavings(goal.getTargetAmount() != null ? goal.getTargetAmount() : 0.0);
                updated = true;
            }
        }

        if (updated) {
            goalRepository.saveAll(goals);
        }
    }

    private boolean matchesText(String actual, String expected) {
        if (actual == null && expected == null) {
            return true;
        }
        if (actual == null || expected == null) {
            return false;
        }
        return actual.equalsIgnoreCase(expected);
    }

    private boolean matchesNumber(Double actual, double expected) {
        return actual != null && Math.abs(actual - expected) < 0.0001;
    }

    private boolean matchesBoolean(Boolean actual, boolean expected) {
        return actual != null && actual == expected;
    }

    private boolean matchesInteger(Integer actual, int expected) {
        return actual != null && actual == expected;
    }

    private record SeedEntry(String category, String activity, double amount, int daysAgo) {
    }

    private record SurveySeedProfile(
        String primaryTransport,
        double weeklyDrivingKm,
        String carType,
        String homeHeating,
        double monthlyElectricityKwh,
        boolean renewableEnergy,
        String dietType,
        int meatMealsPerWeek,
        boolean buysLocalFood,
        String shoppingHabits,
        boolean buysSecondHand,
        int shortFlightsPerYear,
        int longFlightsPerYear
    ) {
        private LifestyleSurvey toSurvey() {
            return LifestyleSurvey.builder()
                .primaryTransport(primaryTransport)
                .weeklyDrivingKm(weeklyDrivingKm)
                .carType(carType)
                .homeHeating(homeHeating)
                .monthlyElectricityKwh(monthlyElectricityKwh)
                .hasRenewableEnergy(renewableEnergy)
                .dietType(dietType)
                .meatMealsPerWeek(meatMealsPerWeek)
                .buysLocalFood(buysLocalFood)
                .shoppingHabits(shoppingHabits)
                .buysSecondHand(buysSecondHand)
                .shortFlightsPerYear(shortFlightsPerYear)
                .longFlightsPerYear(longFlightsPerYear)
                .build();
        }
    }
}
