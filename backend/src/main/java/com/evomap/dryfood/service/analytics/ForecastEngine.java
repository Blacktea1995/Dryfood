package com.evomap.dryfood.service.analytics;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Du bao thong ke (Java) + backtest MAE/RMSE/MAPE.
 * 4 phuong phap: trung binh truot 7 ngay, seasonal naive, Holt-Winters chu ky 7, hoi quy tuyen tinh.
 */
@Service
public class ForecastEngine {

    /** Ket qua backtest cua mot phuong phap. */
    public record ForecastResult(String method, double mae, double rmse, double mape) {
    }

    /** Diem du bao. */
    public record ForecastPoint(String date, double value, double lower, double upper) {
    }

    /** Ket qua tong hop: chon phuong phap tot nhat + note. */
    public record ForecastOutput(String method, double mae, double rmse, double mape,
                                 boolean lowData, String note, List<ForecastPoint> points) {
    }

    private static final int HORIZON = 30;
    private static final int MIN_TRAIN = 14;

    public ForecastOutput forecast(List<Double> series, LocalDate startDate) {
        if (series == null || series.isEmpty()) {
            return new ForecastOutput("moving-average-7", 0, 0, 0, true,
                    "Khong co du lieu lich su, do tin cay thap", List.of());
        }
        boolean lowData = series.size() < 28;

        List<String> methods = List.of("moving-average-7", "seasonal-naive", "holt-winters-7", "linear-regression");
        ForecastResult best = null;
        String bestMethod = "moving-average-7";
        for (String m : methods) {
            ForecastResult r = backtest(series, m);
            if (r == null) continue;
            if (best == null || r.mape() < best.mape()) {
                best = r;
                bestMethod = m;
            }
        }
        if (best == null) {
            best = new ForecastResult("moving-average-7", 0, 0, 0);
        }

        List<ForecastPoint> points = new ArrayList<>();
        LocalDate d = startDate.plusDays(1);
        for (int i = 0; i < HORIZON; i++) {
            double v = forecastOne(series, bestMethod, i);
            double err = best.rmse();
            points.add(new ForecastPoint(d.toString(), round2(v),
                    round2(Math.max(0, v - 1.96 * err)), round2(v + 1.96 * err)));
            d = d.plusDays(1);
        }

        String note = lowData
                ? "Du lieu it hon 28 ngay, do tin cay thap"
                : "Phuong phap tot nhat: " + bestMethod + " (MAPE " + pct(best.mape()) + ")";
        return new ForecastOutput(bestMethod, round2(best.mae()), round2(best.rmse()),
                round2(best.mape()), lowData, note, points);
    }

    /** Backtest theo thu tu thoi gian tren 14-28 ngay gan nhat. */
    public ForecastResult backtest(List<Double> series, String method) {
        int n = series.size();
        int train = Math.min(28, Math.max(MIN_TRAIN, n / 2));
        if (n < MIN_TRAIN + 2) return null;
        double sumAbs = 0, sumSq = 0, sumPct = 0;
        int count = 0;
        for (int t = train; t < n; t++) {
            double actual = series.get(t);
            double pred = forecastOne(series.subList(0, t), method, 0);
            double err = actual - pred;
            sumAbs += Math.abs(err);
            sumSq += err * err;
            sumPct += actual == 0 ? 0 : Math.abs(err) / Math.abs(actual);
            count++;
        }
        if (count == 0) return null;
        return new ForecastResult(method, sumAbs / count, Math.sqrt(sumSq / count), sumPct / count);
    }

    /** Du doan 1 diem cach xa `ahead` buoc so voi phan duoi cua series. */
    public double forecastOne(List<Double> series, String method, int ahead) {
        return switch (method) {
            case "moving-average-7" -> movingAverage7(series, ahead);
            case "seasonal-naive" -> seasonalNaive(series, ahead);
            case "holt-winters-7" -> holtWinters(series, ahead);
            case "linear-regression" -> linearRegression(series, ahead);
            default -> movingAverage7(series, ahead);
        };
    }

    private double movingAverage7(List<Double> series, int ahead) {
        int n = series.size();
        if (n == 0) return 0;
        int window = Math.min(7, n);
        double sum = 0;
        for (int i = n - window; i < n; i++) sum += series.get(i);
        return sum / window;
    }

    private double seasonalNaive(List<Double> series, int ahead) {
        int n = series.size();
        if (n == 0) return 0;
        int idx = n - 7;
        while (idx < 0) idx += 7;
        return series.get(Math.min(idx, n - 1));
    }

    private double holtWinters(List<Double> series, int ahead) {
        int n = series.size();
        if (n < 2) return n == 1 ? series.get(0) : 0;
        double alpha = 0.4, gamma = 0.3;
        double level = series.get(0);
        int period = 7;
        double[] seasonal = new double[period];
        double firstSeasonAvg = 0;
        int m = Math.min(period, n);
        for (int i = 0; i < m; i++) firstSeasonAvg += series.get(i);
        firstSeasonAvg = firstSeasonAvg / m;
        for (int i = 0; i < period; i++) {
            seasonal[i] = i < n && firstSeasonAvg != 0 ? series.get(i) / firstSeasonAvg : 1.0;
        }
        for (int i = 1; i < n; i++) {
            double prevLevel = level;
            level = alpha * (series.get(i) / seasonal[i % period]) + (1 - alpha) * prevLevel;
            seasonal[i % period] = gamma * (series.get(i) / (level == 0 ? 1 : level)) + (1 - gamma) * seasonal[i % period];
        }
        return level * seasonal[(n + ahead) % period];
    }

    private double linearRegression(List<Double> series, int ahead) {
        int n = series.size();
        if (n < 2) return n == 1 ? series.get(0) : 0;
        double sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        for (int i = 0; i < n; i++) {
            double x = i;
            double y = series.get(i);
            sumX += x; sumY += y; sumXY += x * y; sumXX += x * x;
        }
        double denom = n * sumXX - sumX * sumX;
        double slope = denom == 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
        double intercept = (sumY - slope * sumX) / n;
        return Math.max(0, intercept + slope * (n + ahead));
    }

    private static String pct(double v) {
        return String.format(java.util.Locale.ROOT, "%.1f%%", v * 100);
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}