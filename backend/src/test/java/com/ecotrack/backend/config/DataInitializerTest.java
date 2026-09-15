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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.lenient;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DataInitializerTest {
    private static final String LEGACY_BALANCED_TRACKER_DESCRIPTION = "Log transport, food, and energy activity in one week.";
    private static final String UPDATED_BALANCED_TRACKER_DESCRIPTION = "Track at least 25 kg CO2 across your activities to build a consistent baseline.";

    @Mock
    private UserRepository userRepository;

    @Mock
    private CarbonEntryRepository carbonEntryRepository;

    @Mock
    private GoalRepository goalRepository;

    @Mock
    private SurveyRepository surveyRepository;

    @Mock
    private BadgeRepository badgeRepository;

    @Mock
    private MarketplaceItemRepository marketplaceItemRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private SurveyService surveyService;

    private DataInitializer dataInitializer;

    @BeforeEach
    void setUp() {
        dataInitializer = new DataInitializer(
            userRepository,
            carbonEntryRepository,
            goalRepository,
            surveyRepository,
            badgeRepository,
            marketplaceItemRepository,
            transactionRepository,
            notificationRepository,
            passwordEncoder,
            surveyService
        );

        ReflectionTestUtils.setField(dataInitializer, "seedDemoData", true);
        ReflectionTestUtils.setField(dataInitializer, "adminName", "CarbonCalc Admin");
        ReflectionTestUtils.setField(dataInitializer, "adminEmail", "admin@carboncalc.com");
        ReflectionTestUtils.setField(dataInitializer, "adminPassword", "Admin@123");

        when(passwordEncoder.encode(anyString())).thenAnswer(invocation -> "ENC(" + invocation.getArgument(0) + ")");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        lenient().when(surveyRepository.findByUser(any(User.class))).thenReturn(Optional.of(existingSurvey()));
        when(carbonEntryRepository.findByUserOrderByDateDescCreatedAtDesc(any(User.class))).thenReturn(List.of(
            CarbonEntry.builder().activity("Manual entry").amount(1.0).build()
        ));
        lenient().when(carbonEntryRepository.findByUserAndDate(any(User.class), any(LocalDate.class))).thenReturn(List.of(
            CarbonEntry.builder().activity("[Survey] Daily transport estimate").date(LocalDate.now()).build()
        ));
        when(goalRepository.findByUserOrderByCreatedAtDesc(any(User.class))).thenReturn(List.of(
            Goal.builder().title("Existing Goal").build()
        ));
        when(marketplaceItemRepository.findAll()).thenReturn(seedMarketplaceItems());
        when(marketplaceItemRepository.findAllByOrderByCreatedAtDesc()).thenReturn(seedMarketplaceItems());
        lenient().when(transactionRepository.existsByUserAndMarketplaceItem(any(User.class), any(MarketplaceItem.class))).thenReturn(true);
        lenient().when(notificationRepository.existsByUserAndTypeAndTitleAndMessage(any(User.class), anyString(), anyString(), anyString())).thenReturn(true);
        when(goalRepository.findAll()).thenReturn(List.of());
        when(badgeRepository.findAll()).thenReturn(List.of());
        when(badgeRepository.findByActiveTrue()).thenReturn(List.of(
            Badge.builder().name("Climate Champion").thresholdKg(75.0).active(true).build()
        ));
        lenient().when(surveyService.save(any(User.class), any(LifestyleSurvey.class), eq(false)))
            .thenAnswer(invocation -> invocation.getArgument(1));
    }

    @Test
    void preservesExistingSeedUserPasswordsAcrossRestarts() {
        User existingAdmin = User.builder()
            .id(99L)
            .name("Admin")
            .email("admin@carboncalc.com")
            .password("existing-password-hash")
            .createdAt(LocalDateTime.now().minusDays(30))
            .enabled(false)
            .build();

        when(userRepository.findByEmail(anyString())).thenAnswer(invocation -> {
            String email = invocation.getArgument(0);
            if ("admin@carboncalc.com".equals(email)) {
                return Optional.of(existingAdmin);
            }
            return Optional.empty();
        });

        dataInitializer.run(null);

        ArgumentCaptor<User> savedUsers = ArgumentCaptor.forClass(User.class);
        verify(userRepository, Mockito.times(3)).save(savedUsers.capture());

        User savedAdmin = savedUsers.getAllValues().stream()
            .filter(user -> "admin@carboncalc.com".equals(user.getEmail()))
            .findFirst()
            .orElseThrow();

        assertThat(savedAdmin.getPassword()).isEqualTo("existing-password-hash");
        assertThat(savedAdmin.getRole()).isEqualTo("ADMIN");
        assertThat(savedAdmin.isEnabled()).isTrue();
        verify(surveyService, never()).save(any(User.class), any(LifestyleSurvey.class), eq(false));
    }

    @Test
    void backfillsLegacyBalancedTrackerBadgeDefinitions() {
        Badge legacyBalancedTracker = Badge.builder()
            .name("Balanced Tracker")
            .description(LEGACY_BALANCED_TRACKER_DESCRIPTION)
            .thresholdKg(25.0)
            .category("general")
            .active(true)
            .build();

        when(badgeRepository.findByActiveTrue()).thenReturn(List.of(legacyBalancedTracker));
        when(badgeRepository.findAll()).thenReturn(List.of(legacyBalancedTracker));

        dataInitializer.run(null);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Badge>> savedBadges = ArgumentCaptor.forClass(List.class);
        verify(badgeRepository).saveAll(savedBadges.capture());

        Badge updatedBadge = savedBadges.getValue().get(0);
        assertThat(updatedBadge.getDescription()).isEqualTo(UPDATED_BALANCED_TRACKER_DESCRIPTION);
        assertThat(updatedBadge.getThresholdKg()).isEqualTo(25.0);
        assertThat(updatedBadge.getCategory()).isEqualTo("general");
    }

    @Test
    void repairsLegacyDemoSurveyProfilesThroughSurveyService() {
        User admin = User.builder().id(1L).email("admin@carboncalc.com").build();
        User ava = User.builder().id(2L).email("ava@carboncalc.com").build();
        User liam = User.builder().id(3L).email("liam@carboncalc.com").build();

        when(userRepository.findByEmail(anyString())).thenAnswer(invocation -> {
            String email = invocation.getArgument(0);
            return switch (email) {
                case "admin@carboncalc.com" -> Optional.of(admin);
                case "ava@carboncalc.com" -> Optional.of(ava);
                case "liam@carboncalc.com" -> Optional.of(liam);
                default -> Optional.empty();
            };
        });
        when(surveyRepository.findByUser(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            if ("admin@carboncalc.com".equals(user.getEmail())) {
                return Optional.of(LifestyleSurvey.builder()
                    .primaryTransport("train")
                    .weeklyDrivingKm(45.0)
                    .carType("hybrid")
                    .homeHeating("electric")
                    .monthlyElectricityKwh(85.0)
                    .hasRenewableEnergy(true)
                    .dietType("vegetarian")
                    .meatMealsPerWeek(2)
                    .buysLocalFood(true)
                    .shoppingHabits("moderate")
                    .buysSecondHand(true)
                    .shortFlightsPerYear(1)
                    .longFlightsPerYear(0)
                    .estimatedAnnualFootprint(1868.0)
                    .build());
            }
            return Optional.of(existingSurvey());
        });
        when(carbonEntryRepository.findByUserAndDate(any(User.class), any(LocalDate.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            if ("admin@carboncalc.com".equals(user.getEmail())) {
                return List.of();
            }
            return List.of(CarbonEntry.builder().activity("[Survey] Daily transport estimate").date(LocalDate.now()).build());
        });

        dataInitializer.run(null);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        ArgumentCaptor<LifestyleSurvey> surveyCaptor = ArgumentCaptor.forClass(LifestyleSurvey.class);
        verify(surveyService).save(userCaptor.capture(), surveyCaptor.capture(), eq(false));

        assertThat(userCaptor.getValue().getEmail()).isEqualTo("admin@carboncalc.com");
        assertThat(surveyCaptor.getValue().getPrimaryTransport()).isEqualTo("train");
        assertThat(surveyCaptor.getValue().getWeeklyDrivingKm()).isEqualTo(120.0);
        assertThat(surveyCaptor.getValue().getCarType()).isNull();
        assertThat(surveyCaptor.getValue().getMonthlyElectricityKwh()).isEqualTo(85.0);
        assertThat(surveyCaptor.getValue().getShortFlightsPerYear()).isEqualTo(1);
    }

    @Test
    void seedsTransactionsAndNotificationsIndividuallyForPartialDemoData() {
        when(transactionRepository.existsByUserAndMarketplaceItem(any(User.class), any(MarketplaceItem.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            MarketplaceItem item = invocation.getArgument(1);
            return "ava@carboncalc.com".equals(user.getEmail()) && "Tree Planting Initiative".equals(item.getItemName());
        });
        when(notificationRepository.existsByUserAndTypeAndTitleAndMessage(any(User.class), anyString(), anyString(), anyString())).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            String title = invocation.getArgument(2);
            return "ava@carboncalc.com".equals(user.getEmail()) && "Purchase confirmed".equals(title);
        });

        dataInitializer.run(null);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<PurchaseTransaction>> transactionsCaptor = ArgumentCaptor.forClass(List.class);
        verify(transactionRepository).saveAll(transactionsCaptor.capture());
        assertThat(transactionsCaptor.getValue()).hasSize(1);
        assertThat(transactionsCaptor.getValue().get(0).getUser().getEmail()).isEqualTo("liam@carboncalc.com");
        assertThat(transactionsCaptor.getValue().get(0).getMarketplaceItem().getItemName()).isEqualTo("Solar Energy Support");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<UserNotification>> notificationsCaptor = ArgumentCaptor.forClass(List.class);
        verify(notificationRepository).saveAll(notificationsCaptor.capture());
        assertThat(notificationsCaptor.getValue()).hasSize(3);
        assertThat(notificationsCaptor.getValue())
            .extracting(UserNotification::getTitle)
            .containsExactlyInAnyOrder(
                "Badge unlocked: Green Achiever",
                "Leaderboard update",
                "High Emission Alert"
            );
    }

    private LifestyleSurvey existingSurvey() {
        return LifestyleSurvey.builder()
            .primaryTransport("car")
            .weeklyDrivingKm(70.0)
            .carType("electric")
            .homeHeating("electric")
            .monthlyElectricityKwh(25.0)
            .hasRenewableEnergy(true)
            .dietType("vegan")
            .meatMealsPerWeek(0)
            .buysLocalFood(true)
            .shoppingHabits("moderate")
            .buysSecondHand(true)
            .shortFlightsPerYear(0)
            .longFlightsPerYear(0)
            .estimatedAnnualFootprint(942.0)
            .build();
    }

    private List<MarketplaceItem> seedMarketplaceItems() {
        return List.of(
            MarketplaceItem.builder().itemName("Tree Planting Initiative").price(200.0).build(),
            MarketplaceItem.builder().itemName("Solar Energy Support").price(500.0).build(),
            MarketplaceItem.builder().itemName("Carbon Credit Bundle").price(750.0).build()
        );
    }
}
