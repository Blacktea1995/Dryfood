package com.evomap.dryfood.service.analytics;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/** Kiem tra AnalyticsValidator. */
public class AnalyticsValidatorTest {

    private static final ObjectMapper JSON = new ObjectMapper();

    private JsonNode valid() throws Exception {
        return JSON.readTree("""
                {
                  "summary": "Doanh thu on dinh, mot vai khach roi bo can cham soc.",
                  "kpi_insights": [{"key": "revenue", "trend": "up", "change_pct": 5.0, "insight": "Tang nhe"}],
                  "revenue_forecast": {
                    "horizon_days": 30, "confidence": "medium", "assumptions": "Du lieu it",
                    "points": [{"date": "2026-11-01", "value": 1000, "lower": 800, "upper": 1200}]
                  },
                  "demand_forecast": [{"product": "Mi Hao Hao", "next_weeks": [10, 12], "stock_risk": "low", "note": ""}],
                  "rfm_segments": [
                    {"name": "VIP", "customers": 14, "avg_value": 2441226, "avg_recency_days": 10, "avg_frequency": 5, "insight": "", "action": ""},
                    {"name": "Roi bo", "customers": 286, "avg_value": 1000000, "avg_recency_days": 176, "avg_frequency": 1, "insight": "", "action": ""}
                  ],
                  "churn_risk": {"high": 53, "medium": 149, "low": 98, "drivers": ["Recency cao"]},
                  "anomalies": [{"level": "warning", "title": "Kho hang", "detail": "Ton thap"}],
                  "recommendations": [{"priority": "high", "title": "Voucher", "detail": "Gui voucher", "expected_impact": "Giun chan"}]
                }
                """);
    }

    @Test
    void jsonHopLePass() throws Exception {
        JsonNode ai = valid();
        List<String> errors = AnalyticsValidator.validate(ai, 300, 1000);
        assertTrue(errors.isEmpty(), "JSON hop le phai pass, errors=" + errors);
    }

    @Test
    void thieuTruongFail() throws Exception {
        JsonNode ai = valid();
        ((com.fasterxml.jackson.databind.node.ObjectNode) ai).remove("summary");
        List<String> errors = AnalyticsValidator.validate(ai, 300, 5000);
        assertFalse(errors.isEmpty());
    }

    @Test
    void lowerLonHonUpperFail() throws Exception {
        JsonNode ai = valid();
        ai.path("revenue_forecast").path("points").get(0);
        // sua lower > upper
        ((com.fasterxml.jackson.databind.node.ObjectNode) ai.path("revenue_forecast").path("points").get(0))
                .put("lower", 2000).put("upper", 1200);
        List<String> errors = AnalyticsValidator.validate(ai, 300, 5000);
        assertFalse(errors.isEmpty(), "lower>upper phai fail");
    }

    @Test
    void tongCustomersLechSuaTheoDB() throws Exception {
        JsonNode ai = valid();
        long dbCount = 400; // DB co 400 khach, RFM AI chi 300 -> lech
        long sum = 0;
        for (JsonNode s : ai.path("rfm_segments")) sum += Math.round(s.path("customers").asDouble());
        assertNotEquals(dbCount, sum, "Tong RFM phai khac 400 de kiem tra sua");
        AnalyticsValidator.fixRfmTotals(ai, dbCount);
        long after = 0;
        for (JsonNode s : ai.path("rfm_segments")) after += Math.round(s.path("customers").asDouble());
        assertEquals(dbCount, after, "fixRfmTotals phai dua tong ve dung DB");
    }

    @Test
    void duBaoAiLech50PercentFail() throws Exception {
        JsonNode ai = valid();
        List<String> errors = AnalyticsValidator.validate(ai, 300, 100000);
        assertFalse(errors.isEmpty(), "Du bao AI lech >50% so voi thong ke phai fail");
    }
}