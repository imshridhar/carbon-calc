package com.ecotrack.backend.service;

import com.ecotrack.backend.entity.Badge;
import com.ecotrack.backend.entity.CarbonEntry;
import com.ecotrack.backend.entity.LifestyleSurvey;
import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.repository.BadgeRepository;
import com.ecotrack.backend.repository.CarbonEntryRepository;
import com.ecotrack.backend.repository.GoalRepository;
import com.ecotrack.backend.repository.SurveyRepository;
import com.ecotrack.backend.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BadgeServiceTest {

    @Mock
    private BadgeRepository badgeRepository;

    @Mock
    private CarbonEntryRepository carbonEntryRepository;

    @Mock
    private SurveyRepository surveyRepository;

    @Mock
    private GoalRepository goalRepository;

    @Mock
    private TransactionRepository transactionRepository;

    private BadgeService badgeService;

    @BeforeEach
    void setUp() {
        badgeService = new BadgeService(
            badgeRepository,
            carbonEntryRepository,
            surveyRepository,
            goalRepository,
            transactionRepository
        );
    }

    @Test
    void awardsTransitCommutersAndUsesCategorySpecificCustomBadgeProgress() {
        User user = User.builder().id(1L).email("member@example.com").build();

        when(carbonEntryRepository.sumByUser(user)).thenReturn(12.0);
        when(carbonEntryRepository.sumByCategoryForUser(user)).thenReturn(List.of(
            new Object[]{"transport", 4.0},
            new Object[]{"energy", 3.0},
            new Object[]{"food", 5.0}
        ));
        when(carbonEntryRepository.findByUserOrderByDateDescCreatedAtDesc(user)).thenReturn(List.of(
            carbonEntry("transport", 4.0),
            carbonEntry("energy", 3.0),
            carbonEntry("food", 5.0)
        ));
        when(carbonEntryRepository.findByUserAndDateBetweenOrderByDateAsc(eq(user), any(LocalDate.class), any(LocalDate.class))).thenReturn(List.of(
            carbonEntry("transport", 4.0),
            carbonEntry("energy", 3.0),
            carbonEntry("food", 5.0)
        ));
        when(surveyRepository.findByUser(user)).thenReturn(Optional.of(
            LifestyleSurvey.builder()
                .primaryTransport("train")
                .hasRenewableEnergy(true)
                .dietType("vegetarian")
                .build()
        ));
        when(goalRepository.countByUserAndStatus(user, "COMPLETED")).thenReturn(1L);
        when(transactionRepository.findByUserOrderByCreatedAtDesc(user)).thenReturn(List.of());
        when(badgeRepository.findByActiveTrue()).thenReturn(List.of(
            Badge.builder()
                .name("Transport Tracker")
                .description("Track transport emissions consistently.")
                .category("transport")
                .thresholdKg(3.0)
                .build(),
            Badge.builder()
                .name("Broken Badge")
                .description("Missing threshold should not leak to users.")
                .category("general")
                .thresholdKg(0.0)
                .build()
        ));

        List<Map<String, Object>> badges = badgeService.getBadgesForUser(user);

        Map<String, Object> greenCommuter = findBadge(badges, "green-commuter");
        assertThat(greenCommuter.get("earned")).isEqualTo(true);
        assertThat(greenCommuter.get("progressLabel")).isEqualTo("Low-emission commute set in your lifestyle profile.");

        Map<String, Object> transportTracker = findBadge(badges, "transport-tracker");
        assertThat(transportTracker.get("current")).isEqualTo(4.0);
        assertThat(transportTracker.get("target")).isEqualTo(3.0);
        assertThat(transportTracker.get("earned")).isEqualTo(true);
        assertThat(transportTracker.get("progressLabel")).isEqualTo("Transport tracked: 4 / 3 kg CO2e tracked");

        Map<String, Object> carbonNeutralist = findBadge(badges, "carbon-neutralist");
        assertThat(carbonNeutralist.get("target")).isEqualTo(12.0);

        assertThat(badges).extracting(badge -> badge.get("code")).doesNotContain("broken-badge");
    }

    @Test
    void keepsWeeklyBalanceLockedUntilThereIsTrackedActivity() {
        User user = User.builder().id(2L).email("quiet@example.com").build();

        when(carbonEntryRepository.sumByUser(user)).thenReturn(0.0);
        when(carbonEntryRepository.sumByCategoryForUser(user)).thenReturn(List.of());
        when(carbonEntryRepository.findByUserOrderByDateDescCreatedAtDesc(user)).thenReturn(List.of());
        when(carbonEntryRepository.findByUserAndDateBetweenOrderByDateAsc(eq(user), any(LocalDate.class), any(LocalDate.class))).thenReturn(List.of());
        when(surveyRepository.findByUser(user)).thenReturn(Optional.empty());
        when(goalRepository.countByUserAndStatus(user, "COMPLETED")).thenReturn(0L);
        when(transactionRepository.findByUserOrderByCreatedAtDesc(user)).thenReturn(List.of());
        when(badgeRepository.findByActiveTrue()).thenReturn(List.of());

        Map<String, Object> weeklyBalance = findBadge(badgeService.getBadgesForUser(user), "weekly-balance");

        assertThat(weeklyBalance.get("earned")).isEqualTo(false);
        assertThat(weeklyBalance.get("progress")).isEqualTo(0);
        assertThat(weeklyBalance.get("statusLabel")).isEqualTo("Locked");
        assertThat(weeklyBalance.get("progressLabel")).isEqualTo("Log activity this week to start progress.");
    }

    private Map<String, Object> findBadge(List<Map<String, Object>> badges, String code) {
        return badges.stream()
            .filter(badge -> code.equals(badge.get("code")))
            .findFirst()
            .orElseThrow();
    }

    private CarbonEntry carbonEntry(String category, double amount) {
        return CarbonEntry.builder()
            .category(category)
            .amount(amount)
            .date(LocalDate.now())
            .build();
    }
}
