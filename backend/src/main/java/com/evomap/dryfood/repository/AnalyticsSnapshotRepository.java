package com.evomap.dryfood.repository;

import com.evomap.dryfood.model.analytics.AnalyticsSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AnalyticsSnapshotRepository extends JpaRepository<AnalyticsSnapshot, Long> {
    Optional<AnalyticsSnapshot> findTopByOrderByCreatedAtDesc();
}