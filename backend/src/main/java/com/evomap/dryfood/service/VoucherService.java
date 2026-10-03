package com.evomap.dryfood.service;

import com.evomap.dryfood.exception.BadRequestException;
import com.evomap.dryfood.exception.NotFoundException;
import com.evomap.dryfood.model.Voucher;
import com.evomap.dryfood.repository.VoucherRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class VoucherService {

    private final VoucherRepository voucherRepository;

    public VoucherService(VoucherRepository voucherRepository) {
        this.voucherRepository = voucherRepository;
    }

    public List<Voucher> findAll() {
        return voucherRepository.findAllByOrderByIdDesc();
    }

    public Voucher findById(Long id) {
        return voucherRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Khong tim thay voucher id=" + id));
    }

    public Optional<Voucher> findByCode(String code) {
        if (code == null || code.isBlank()) {
            return Optional.empty();
        }
        return voucherRepository.findByCodeIgnoreCase(code.trim());
    }

    @Transactional
    public Voucher create(Voucher voucher) {
        String code = voucher.getCode() == null ? "" : voucher.getCode().trim().toUpperCase();
        if (voucherRepository.findByCodeIgnoreCase(code).isPresent()) {
            throw new BadRequestException("Ma giam gia '" + code + "' da ton tai");
        }
        voucher.setCode(code);
        validate(voucher);
        return voucherRepository.save(voucher);
    }

    @Transactional
    public Voucher update(Long id, Voucher updated) {
        Voucher v = findById(id);
        if (updated.getCode() != null && !updated.getCode().isBlank()) {
            String code = updated.getCode().trim().toUpperCase();
            Optional<Voucher> existing = voucherRepository.findByCodeIgnoreCase(code);
            if (existing.isPresent() && !existing.get().getId().equals(id)) {
                throw new BadRequestException("Ma giam gia '" + code + "' da ton tai");
            }
            v.setCode(code);
        }
        v.setType(updated.getType());
        v.setValue(updated.getValue());
        v.setMaxDiscount(updated.getMaxDiscount());
        v.setMinOrder(updated.getMinOrder());
        v.setStartDate(updated.getStartDate());
        v.setEndDate(updated.getEndDate());
        v.setQuantity(updated.getQuantity());
        v.setActive(updated.getActive());
        v.setDescription(updated.getDescription());
        validate(v);
        return voucherRepository.save(v);
    }

    @Transactional
    public void delete(Long id) {
        voucherRepository.delete(findById(id));
    }

    /**
     * Tinh so tien giam cho tong don orderTotal bang voucher code.
     * Tra ve 0 neu code khong hop le (khong nem loi de checkout van tiep tuc duoc).
     */
    @Transactional
    public double applyDiscount(String code, double orderTotal) {
        Voucher voucher = findByCode(code).orElse(null);
        if (voucher == null || !voucher.isValid() || orderTotal <= 0) {
            return 0;
        }
        if (voucher.getMinOrder() != null && orderTotal < voucher.getMinOrder()) {
            return 0;
        }
        return voucher.discountFor(orderTotal);
    }

    /** Ghi nhan mot lan da dung voucher (khi don hang dat thanh cong). */
    @Transactional
    public void markUsed(String code) {
        Voucher voucher = findByCode(code).orElse(null);
        if (voucher != null) {
            voucher.setUsedCount(voucher.getUsedCount() + 1);
            voucherRepository.save(voucher);
        }
    }

    private void validate(Voucher v) {
        if (v.getEndDate() == null || v.getEndDate().isBefore(v.getStartDate())) {
            throw new BadRequestException("Ngay ket thuc phai >= ngay bat dau");
        }
        if (v.getQuantity() != null && v.getQuantity() < 0) {
            throw new BadRequestException("So luong voucher khong the am");
        }
        if (v.getType() == Voucher.Type.PERCENT && v.getValue() > 100) {
            throw new BadRequestException("Phan tram giam khong duoc qua 100%");
        }
    }
}