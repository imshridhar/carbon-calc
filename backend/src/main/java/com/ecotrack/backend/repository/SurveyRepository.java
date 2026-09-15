package com.ecotrack.backend.repository;

import com.ecotrack.backend.entity.LifestyleSurvey;
import com.ecotrack.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SurveyRepository extends JpaRepository<LifestyleSurvey, Long> {
    Optional<LifestyleSurvey> findByUser(User user);
}
