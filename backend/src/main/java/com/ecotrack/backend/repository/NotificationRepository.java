package com.ecotrack.backend.repository;

import com.ecotrack.backend.entity.User;
import com.ecotrack.backend.entity.UserNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface NotificationRepository extends JpaRepository<UserNotification, Long> {
    List<UserNotification> findByUserOrderByCreatedAtDesc(User user);
    long countByUserAndReadFalse(User user);
    boolean existsByUserAndTypeAndTitle(User user, String type, String title);
    boolean existsByUserAndTypeAndTitleAndMessage(User user, String type, String title, String message);
    boolean existsByUserAndTypeAndTitleAndCreatedAtAfter(User user, String type, String title, LocalDateTime createdAt);
}
