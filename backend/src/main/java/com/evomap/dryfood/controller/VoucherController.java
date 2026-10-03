package com.evomap.dryfood.controller;

import com.evomap.dryfood.model.User;
import com.evomap.dryfood.model.Voucher;
import com.evomap.dryfood.service.VoucherService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/vouchers")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class VoucherController {

    private final VoucherService voucherService;

    public VoucherController(VoucherService voucherService) {
        this.voucherService = voucherService;
    }

    @GetMapping
    public java.util.List<Voucher> list(@RequestAttribute("user") User user) {
        return voucherService.findAll();
    }

    /** Tinh so tien giam chinh xac cho mot tong don (dung de xem truoc o checkout). */
    @GetMapping("/discount")
    public Map<String, Object> previewDiscount(@RequestParam String code,
                                               @RequestParam double orderTotal) {
        double discount = voucherService.applyDiscount(code, orderTotal);
        return Map.of("code", code == null ? "" : code.toUpperCase(),
                "discount", discount,
                "finalTotal", Math.max(0, orderTotal - discount));
    }

    @PostMapping
    public ResponseEntity<Voucher> create(@Valid @RequestBody Voucher voucher,
                                          @RequestAttribute("user") User user) {
        requireAdmin(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(voucherService.create(voucher));
    }

    @PutMapping("/{id}")
    public Voucher update(@PathVariable Long id, @Valid @RequestBody Voucher voucher,
                          @RequestAttribute("user") User user) {
        requireAdmin(user);
        return voucherService.update(id, voucher);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @RequestAttribute("user") User user) {
        requireAdmin(user);
        voucherService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private void requireAdmin(User user) {
        if (user.getRole() != User.Role.ADMIN) {
            throw new com.evomap.dryfood.exception.UnauthorizedException("Can tai khoan admin");
        }
    }
}