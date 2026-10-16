package com.evomap.dryfood.repository;

import com.evomap.dryfood.model.analytics.AnalyticsJob;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AnalyticsJobRepository extends JpaRepository<AnalyticsJob, Long> {
    Optional<AnalyticsJob> findTopByOrderByCreatedAtDesc();
    List<AnalyticsJob> findByStatus(String status);
}