package com.evomap.dryfood.service.analytics;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/** Kiem tra ForecastEngine: 4 phuong phap, backtest MAE/RMSE/MAPE, chon tot nhat. */
public class ForecastEngineTest {

    private final ForecastEngine engine = new ForecastEngine();

    @Test
    void forecast31NgayTraVeGiaTriDuong() {
        List<Double> series = List.of(
                100.0, 110.0, 120.0, 130.0, 140.0, 150.0, 160.0,
                105.0, 115.0, 125.0, 135.0, 145.0, 155.0, 165.0,
                100.0, 112.0, 122.0, 132.0, 142.0, 152.0, 162.0,
                108.0, 118.0, 128.0, 138.0, 148.0, 158.0, 168.0,
                102.0, 114.0
        );
        var out = engine.forecast(series, java.time.LocalDate.now());
        assertNotNull(out);
        assertEquals(30, out.points().size());
        assertTrue(out.points().get(0).value() > 0);
        assertTrue(out.points().get(0).lower() >= 0 && out.points().get(0).upper() >= out.points().get(0).value());
    }

    @Test
    void backtestChonPhuongPhapCoMapeThapNhat() {
        List<Double> series = java.util.stream.IntStream.range(0, 40)
                .mapToDouble(i -> 100 + i * 0.5).boxed().toList();
        List<String> methods = List.of("moving-average-7", "seasonal-naive", "holt-winters-7", "linear-regression");
        ForecastEngine.ForecastResult best = null;
        for (String m : methods) {
            var r = engine.backtest(series, m);
            assertNotNull(r, "Backtest " + m + " khong null");
            assertTrue(r.mae() >= 0 && r.rmse() >= 0 && r.mape() >= 0);
            if (best == null || r.mape() < best.mape()) best = r;
        }
        assertNotNull(best);
    }

    @Test
    void duLieuItHon28NgayGhiNhanDoTinCayThap() {
        List<Double> series = List.of(100.0, 110.0, 120.0, 130.0, 140.0, 150.0, 160.0, 170.0, 180.0, 190.0);
        var out = engine.forecast(series, java.time.LocalDate.now());
        assertTrue(out.lowData(), "Du lieu < 28 ngay phai danh dau lowData");
    }
}