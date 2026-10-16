package com.evomap.dryfood.model.analytics;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** Snapshot ket qua phan tich AI (hoac fallback) de frontend ve dashboard. */
@Entity
@Table(name = "analytics_snapshots")
public class AnalyticsSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String payloadJson;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private Integer periodDays = 7;

    @Column(nullable = false, length = 20)
    private String status = "done";

    @Column(nullable = false, length = 20)
    private String source; // "ai" hoac "fallback"

    @Column(length = 500)
    private String error;

    public AnalyticsSnapshot() {
    }

    public AnalyticsSnapshot(String payloadJson, Integer periodDays, String source, String error) {
        this.payloadJson = payloadJson;
        this.periodDays = periodDays;
        this.source = source;
        this.error = error;
    }

    public Long getId() { return id; }
    public String getPayloadJson() { return payloadJson; }
    public void setPayloadJson(String payloadJson) { this.payloadJson = payloadJson; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public Integer getPeriodDays() { return periodDays; }
    public void setPeriodDays(Integer periodDays) { this.periodDays = periodDays; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
}