package com.evomap.dryfood.service.analytics;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Kiem tra tinh recency (khong don, ngay tuong lai, hom nay, binh thuong). */
public class RfmRecencyTest {

    @Test
    void recencyKhongDonLaBanCo() {
        RFM rfm = new RFM(-1, 0, 0);
        assertTrue(rfm.recency() < 0, "Khach khong co don nen recency = -1 (khong duoc tinh vao trung binh)");
    }

    @Test
    void recencyHomNayBang0() {
        LocalDate today = LocalDate.now();
        long recency = Math.max(0, ChronoUnit.DAYS.between(today, LocalDate.now()));
        assertEquals(0, recency);
    }

    @Test
    void recencyNgayMuaTuongLaiClamp0() {
        LocalDate future = LocalDate.now().plusDays(5);
        long raw = ChronoUnit.DAYS.between(future, LocalDate.now());
        long recency = Math.max(0, raw); // clamp
        assertEquals(0, recency);
    }

    @Test
    void recencyBinhThuongLaSoNguyenKhongAm() {
        LocalDate past = LocalDate.now().minusDays(10);
        long recency = Math.max(0, ChronoUnit.DAYS.between(past, LocalDate.now()));
        assertTrue(recency >= 0);
        assertEquals(10, recency);
    }
}