package com.ecotrack.backend.service;

import com.ecotrack.backend.entity.CarbonEntry;
import com.ecotrack.backend.entity.LifestyleSurvey;
import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.repository.CarbonEntryRepository;
import com.ecotrack.backend.repository.SurveyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SurveyService {
    private static final String SURVEY_ACTIVITY_PREFIX = "[Survey]";
    private static final String SURVEY_NOTES = "Auto-generated from lifestyle survey";

    private final SurveyRepository surveyRepo;
    private final CarbonEntryRepository carbonRepo;
    private final NotificationService notificationService;

    public LifestyleSurvey save(User user, LifestyleSurvey request) {
        return save(user, request, true);
    }

    public LifestyleSurvey save(User user, LifestyleSurvey request, boolean syncNotifications) {
        LifestyleSurvey survey = surveyRepo.findByUser(user).orElse(new LifestyleSurvey());
        applySurveyData(survey, request, user);

        SurveyBreakdown breakdown = calculateAnnualBreakdown(survey);
        survey.setEstimatedAnnualFootprint(round1(breakdown.totalAnnualKg()));
        LifestyleSurvey savedSurvey = surveyRepo.save(survey);

        replaceSurveyDerivedEntries(user, breakdown, LocalDate.now());

        if (syncNotifications) {
            notificationService.syncBadgeNotifications(user);
            notificationService.syncHighEmissionAlert(user);
            notificationService.syncLeaderboardNotification(user);
        }

        return savedSurvey;
    }

    private void applySurveyData(LifestyleSurvey target, LifestyleSurvey source, User user) {
        target.setUser(user);
        target.setPrimaryTransport(source.getPrimaryTransport());
        target.setWeeklyDrivingKm(source.getWeeklyDrivingKm());
        target.setCarType(source.getCarType());
        target.setHomeHeating(source.getHomeHeating());
        target.setMonthlyElectricityKwh(source.getMonthlyElectricityKwh());
        target.setHasRenewableEnergy(source.getHasRenewableEnergy());
        target.setDietType(source.getDietType());
        target.setMeatMealsPerWeek(source.getMeatMealsPerWeek());
        target.setBuysLocalFood(source.getBuysLocalFood());
        target.setShoppingHabits(source.getShoppingHabits());
        target.setBuysSecondHand(source.getBuysSecondHand());
        target.setShortFlightsPerYear(source.getShortFlightsPerYear());
        target.setLongFlightsPerYear(source.getLongFlightsPerYear());
    }

    private SurveyBreakdown calculateAnnualBreakdown(LifestyleSurvey survey) {
        double transportKg = 0;
        double energyKg = 0;
        double foodKg = 0;

        String primaryTransport = survey.getPrimaryTransport();
        double weeklyDistanceKm = survey.getWeeklyDrivingKm() != null ? survey.getWeeklyDrivingKm() : 0;

        if ("car".equalsIgnoreCase(primaryTransport)) {
            double factor = "electric".equalsIgnoreCase(survey.getCarType()) ? 0.05 : 0.21;
            transportKg = weeklyDistanceKm * 52 * factor;
        } else if ("bus".equalsIgnoreCase(primaryTransport)) {
            transportKg = weeklyDistanceKm * 52 * 0.089;
        } else if ("train".equalsIgnoreCase(primaryTransport)) {
            transportKg = weeklyDistanceKm * 52 * 0.041;
        }

        if (survey.getShortFlightsPerYear() != null) {
            transportKg += survey.getShortFlightsPerYear() * 250;
        }
        if (survey.getLongFlightsPerYear() != null) {
            transportKg += survey.getLongFlightsPerYear() * 1500;
        }

        if (survey.getMonthlyElectricityKwh() != null) {
            double renewFactor = Boolean.TRUE.equals(survey.getHasRenewableEnergy()) ? 0.05 : 0.5;
            energyKg = survey.getMonthlyElectricityKwh() * 12 * renewFactor;
        }

        String dietType = survey.getDietType() != null ? survey.getDietType().toLowerCase() : "omnivore";
        foodKg = switch (dietType) {
            case "vegan" -> 600;
            case "vegetarian" -> 900;
            case "pescatarian" -> 1100;
            default -> 2000;
        };
        if (survey.getMeatMealsPerWeek() != null && survey.getMeatMealsPerWeek() > 7) {
            foodKg += (survey.getMeatMealsPerWeek() - 7) * 52 * 2.5;
        }

        return new SurveyBreakdown(transportKg, energyKg, foodKg);
    }

    private void replaceSurveyDerivedEntries(User user, SurveyBreakdown breakdown, LocalDate entryDate) {
        List<CarbonEntry> surveyEntries = carbonRepo.findByUserAndDate(user, entryDate).stream()
            .filter(this::isSurveyGeneratedEntry)
            .toList();

        if (!surveyEntries.isEmpty()) {
            carbonRepo.deleteAll(surveyEntries);
        }

        saveDailyEntry(user, "transport", "Daily transport estimate", breakdown.transportAnnualKg(), entryDate);
        saveDailyEntry(user, "energy", "Daily energy estimate", breakdown.energyAnnualKg(), entryDate);
        saveDailyEntry(user, "food", "Daily food estimate", breakdown.foodAnnualKg(), entryDate);
    }

    private void saveDailyEntry(User user, String category, String label, double annualAmountKg, LocalDate entryDate) {
        double dailyAmountKg = round1(annualAmountKg / 365);
        if (dailyAmountKg <= 0) {
            return;
        }

        carbonRepo.save(CarbonEntry.builder()
            .user(user)
            .category(category)
            .activity(SURVEY_ACTIVITY_PREFIX + " " + label)
            .amount(dailyAmountKg)
            .unit("kg CO2")
            .notes(SURVEY_NOTES)
            .date(entryDate)
            .createdAt(LocalDateTime.now())
            .build());
    }

    private boolean isSurveyGeneratedEntry(CarbonEntry entry) {
        return entry.getActivity() != null && entry.getActivity().startsWith(SURVEY_ACTIVITY_PREFIX);
    }

    private double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private record SurveyBreakdown(double transportAnnualKg, double energyAnnualKg, double foodAnnualKg) {
        private double totalAnnualKg() {
            return transportAnnualKg + energyAnnualKg + foodAnnualKg;
        }
    }
}
