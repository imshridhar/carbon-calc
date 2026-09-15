package com.ecotrack.backend.repository;

import com.ecotrack.backend.entity.CarbonEntry;
import com.ecotrack.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDate;
import java.util.List;

public interface CarbonEntryRepository extends JpaRepository<CarbonEntry, Long> {
    List<CarbonEntry> findByUserOrderByDateDescCreatedAtDesc(User user);
    List<CarbonEntry> findByUserAndDateBetweenOrderByDateAsc(User user, LocalDate from, LocalDate to);
    List<CarbonEntry> findByUserAndDate(User user, LocalDate date);
    boolean existsByUser(User user);

    @Query("SELECT SUM(e.amount) FROM CarbonEntry e WHERE e.user = :user")
    Double sumByUser(User user);

    @Query("SELECT SUM(e.amount) FROM CarbonEntry e WHERE e.user = :user AND e.date >= :from AND e.date <= :to")
    Double sumByUserAndDateBetween(User user, LocalDate from, LocalDate to);

    @Query("SELECT e.category, SUM(e.amount) FROM CarbonEntry e WHERE e.user = :user GROUP BY e.category")
    List<Object[]> sumByCategoryForUser(User user);

    @Query("SELECT e.date, SUM(e.amount) FROM CarbonEntry e WHERE e.user = :user AND e.date >= :from GROUP BY e.date ORDER BY e.date")
    List<Object[]> dailySumForUser(User user, LocalDate from);

    // Admin analytics — global queries
    @Query("SELECT SUM(e.amount) FROM CarbonEntry e")
    Double sumAll();

    @Query("SELECT e.category, SUM(e.amount) FROM CarbonEntry e GROUP BY e.category")
    List<Object[]> sumByCategoryGlobal();

    @Query("SELECT COUNT(DISTINCT e.user) FROM CarbonEntry e")
    Long countActiveUsers();
}
