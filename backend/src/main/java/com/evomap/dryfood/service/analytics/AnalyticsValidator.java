package com.evomap.dryfood.service.analytics;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.ArrayList;
import java.util.List;

/**
 * Validator snapshot tu OpenAI theo schema trong task.
 * Tra ve danh sach loi; rong = hop le.
 */
public class AnalyticsValidator {

    /** Kiem tra JSON theo schema; tra ve danh sach loi (rong = OK). */
    public static List<String> validate(JsonNode ai, long dbCustomerCount, double dbAvgRevenue) {
        List<String> errors = new ArrayList<>();
        if (ai == null || !ai.isObject()) {
            errors.add("AI response khong phai object");
            return errors;
        }
        requireString(errors, ai, "summary");
        requireArray(errors, ai, "kpi_insights");
        requireObject(errors, ai, "revenue_forecast");
        requireArray(errors, ai, "demand_forecast");
        requireArray(errors, ai, "rfm_segments");
        requireObject(errors, ai, "churn_risk");
        requireArray(errors, ai, "anomalies");
        requireArray(errors, ai, "recommendations");

        // revenue_forecast: lower <= value <= upper, khong am, khong NaN
        JsonNode rev = ai.path("revenue_forecast");
        if (rev.isObject()) {
            JsonNode points = rev.path("points");
            if (!points.isArray() || points.isEmpty()) {
                errors.add("revenue_forecast.points trong");
            } else {
                for (JsonNode p : points) {
                    if (!p.has("value") || !p.has("lower") || !p.has("upper")) {
                        errors.add("revenue_forecast.points thieu truong value/lower/upper");
                        break;
                    }
                    double v = p.path("value").asDouble();
                    double lo = p.path("lower").asDouble();
                    double up = p.path("upper").asDouble();
                    if (Double.isNaN(v) || Double.isNaN(lo) || Double.isNaN(up)) {
                        errors.add("revenue_forecast.points chua NaN");
                        break;
                    }
                    if (v < 0 || lo < 0) {
                        errors.add("revenue_forecast.points co gia tri am");
                        break;
                    }
                    if (lo > v || v > up) {
                        errors.add("revenue_forecast.points: lower<=value<=upper vi pham");
                        break;
                    }
                }
                // Doi chieu voi forecast thong ke Java (trong khoang +-50% trung binh)
                if (dbAvgRevenue > 0) {
                    double avg = 0;
                    int cnt = 0;
                    for (JsonNode p : points) {
                        avg += p.path("value").asDouble();
                        cnt++;
                    }
                    if (cnt > 0) {
                        avg /= cnt;
                        if (avg > dbAvgRevenue * 1.5 || avg < dbAvgRevenue * 0.5) {
                            errors.add("Du bao AI lech >50% so voi thong ke Java");
                        }
                    }
                }
            }
        }

        // rfm_segments: avg_recency_days >= 0, khong NaN; tong customers == DB
        JsonNode segs = ai.path("rfm_segments");
        if (segs.isArray()) {
            long sumCustomers = 0;
            for (JsonNode s : segs) {
                double r = s.path("avg_recency_days").asDouble();
                double c = s.path("customers").asDouble();
                if (Double.isNaN(r) || r < 0) errors.add("rfm_segments.avg_recency_days < 0 hoac NaN");
                if (Double.isNaN(c) || c < 0) errors.add("rfm_segments.customers < 0 hoac NaN");
                sumCustomers += Math.round(c);
            }
            if (sumCustomers != dbCustomerCount) {
                errors.add("Tong customers RFM (" + sumCustomers + ") khac tong khach DB (" + dbCustomerCount + ")");
            }
        }

        // churn_risk: high/medium/low khong am
        JsonNode churn = ai.path("churn_risk");
        if (churn.isObject()) {
            for (String k : List.of("high", "medium", "low")) {
                double v = churn.path(k).asDouble();
                if (Double.isNaN(v) || v < 0) errors.add("churn_risk." + k + " am hoac NaN");
            }
        }
        return errors;
    }

    /** Dieu chinh lai rfm_segments.customers theo so DB (neu lech) va them note. */
    public static void fixRfmTotals(JsonNode ai, long dbCustomerCount) {
        JsonNode segs = ai.path("rfm_segments");
        if (!segs.isArray() || segs.isEmpty()) return;
        long sum = 0;
        for (JsonNode s : segs) sum += Math.round(s.path("customers").asDouble());
        if (sum == dbCustomerCount) return;
        // Doi lech -> chuan hoa: giu ty trong, ap tong ve dung so DB
        ArrayNode arr = (ArrayNode) segs;
        double scale = sum == 0 ? 0 : (double) dbCustomerCount / sum;
        for (JsonNode s : arr) {
            if (s instanceof ObjectNode obj) {
                long old = Math.round(obj.path("customers").asDouble());
                obj.put("customers", Math.round(old * scale));
            }
        }
    }

    private static void requireString(List<String> errors, JsonNode root, String field) {
        if (!root.has(field) || !root.path(field).isTextual() || root.path(field).asText().isBlank()) {
            errors.add("Thieu truong text: " + field);
        }
    }

    private static void requireArray(List<String> errors, JsonNode root, String field) {
        if (!root.has(field) || !root.path(field).isArray()) {
            errors.add("Thieu truong array: " + field);
        }
    }

    private static void requireObject(List<String> errors, JsonNode root, String field) {
        if (!root.has(field) || !root.path(field).isObject()) {
            errors.add("Thieu truong object: " + field);
        }
    }
}