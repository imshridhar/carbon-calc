package com.ecotrack.backend.repository;

import com.ecotrack.backend.entity.Badge;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BadgeRepository extends JpaRepository<Badge, Long> {
    List<Badge> findByActiveTrue();
}
