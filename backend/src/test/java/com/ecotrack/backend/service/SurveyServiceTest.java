package com.ecotrack.backend.service;

import com.ecotrack.backend.entity.CarbonEntry;
import com.ecotrack.backend.entity.LifestyleSurvey;
import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.repository.CarbonEntryRepository;
import com.ecotrack.backend.repository.SurveyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SurveyServiceTest {

    @Mock
    private SurveyRepository surveyRepository;

    @Mock
    private CarbonEntryRepository carbonEntryRepository;

    @Mock
    private NotificationService notificationService;

    private SurveyService surveyService;

    @BeforeEach
    void setUp() {
        surveyService = new SurveyService(surveyRepository, carbonEntryRepository, notificationService);
        when(surveyRepository.save(any(LifestyleSurvey.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(carbonEntryRepository.save(any(CarbonEntry.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void savesSurveyUsingSharedCalculationAndReplacesOnlyTodaySurveyEntries() {
        User user = User.builder().id(1L).email("admin@carboncalc.com").build();
        LifestyleSurvey request = LifestyleSurvey.builder()
            .primaryTransport("train")
            .weeklyDrivingKm(120.0)
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
            .build();

        when(surveyRepository.findByUser(user)).thenReturn(Optional.empty());
        when(carbonEntryRepository.findByUserAndDate(eq(user), any(LocalDate.class))).thenReturn(List.of(
            CarbonEntry.builder().activity("[Survey] Daily transport estimate").date(LocalDate.now()).build(),
            CarbonEntry.builder().activity("Manual commute").date(LocalDate.now()).build()
        ));

        LifestyleSurvey saved = surveyService.save(user, request);

        assertThat(saved.getEstimatedAnnualFootprint()).isEqualTo(1456.8);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<CarbonEntry>> deletedCaptor = ArgumentCaptor.forClass(List.class);
        verify(carbonEntryRepository).deleteAll(deletedCaptor.capture());
        assertThat(deletedCaptor.getValue()).hasSize(1);
        assertThat(deletedCaptor.getValue().get(0).getActivity()).startsWith("[Survey]");

        ArgumentCaptor<CarbonEntry> entryCaptor = ArgumentCaptor.forClass(CarbonEntry.class);
        verify(carbonEntryRepository, org.mockito.Mockito.times(3)).save(entryCaptor.capture());
        assertThat(entryCaptor.getAllValues())
            .extracting(CarbonEntry::getCategory, CarbonEntry::getAmount)
            .containsExactlyInAnyOrder(
                org.assertj.core.groups.Tuple.tuple("transport", 1.4),
                org.assertj.core.groups.Tuple.tuple("energy", 0.1),
                org.assertj.core.groups.Tuple.tuple("food", 2.5)
            );

        verify(notificationService).syncBadgeNotifications(user);
        verify(notificationService).syncHighEmissionAlert(user);
        verify(notificationService).syncLeaderboardNotification(user);
    }

    @Test
    void skipsNotificationSyncWhenRequested() {
        User user = User.builder().id(2L).email("ava@carboncalc.com").build();
        LifestyleSurvey request = LifestyleSurvey.builder()
            .primaryTransport("bicycle")
            .weeklyDrivingKm(40.0)
            .homeHeating("electric")
            .monthlyElectricityKwh(12.0)
            .hasRenewableEnergy(true)
            .dietType("vegan")
            .meatMealsPerWeek(0)
            .buysLocalFood(true)
            .shoppingHabits("moderate")
            .buysSecondHand(true)
            .shortFlightsPerYear(0)
            .longFlightsPerYear(0)
            .build();

        when(surveyRepository.findByUser(user)).thenReturn(Optional.empty());
        when(carbonEntryRepository.findByUserAndDate(eq(user), any(LocalDate.class))).thenReturn(List.of());

        LifestyleSurvey saved = surveyService.save(user, request, false);

        assertThat(saved.getEstimatedAnnualFootprint()).isEqualTo(607.2);

        ArgumentCaptor<CarbonEntry> entryCaptor = ArgumentCaptor.forClass(CarbonEntry.class);
        verify(carbonEntryRepository).save(entryCaptor.capture());
        assertThat(entryCaptor.getAllValues())
            .extracting(CarbonEntry::getCategory)
            .containsExactly("food");

        verify(notificationService, never()).syncBadgeNotifications(user);
        verify(notificationService, never()).syncHighEmissionAlert(user);
        verify(notificationService, never()).syncLeaderboardNotification(user);
    }
}
