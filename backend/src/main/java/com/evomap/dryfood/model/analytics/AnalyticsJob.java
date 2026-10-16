package com.evomap.dryfood.model.analytics;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** Trang thai cong viec phan tich AI (de polling, luu DB de song sot restart). */
@Entity
@Table(name = "analytics_jobs")
public class AnalyticsJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String status = "pending"; // pending/running/done/failed

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(length = 500)
    private String error;

    public AnalyticsJob() {
    }

    public AnalyticsJob(String status) {
        this.status = status;
    }

    public Long getId() { return id; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; this.updatedAt = LocalDateTime.now(); }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public String getError() { return error; }
    public void setError(String error) { this.error = error; this.updatedAt = LocalDateTime.now(); }
}