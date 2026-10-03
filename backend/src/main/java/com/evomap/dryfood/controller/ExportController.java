package com.evomap.dryfood.controller;

import com.evomap.dryfood.model.Order;
import com.evomap.dryfood.model.OrderItem;
import com.evomap.dryfood.model.Product;
import com.evomap.dryfood.repository.OrderRepository;
import com.evomap.dryfood.repository.ProductRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Xuat du lieu ra CSV de phan tich (diem cong cho do an: admin tai du lieu ve Excel/CSV).
 */
@RestController
@RequestMapping("/api/export")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class ExportController {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public ExportController(OrderRepository orderRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    @GetMapping(value = "/orders.csv", produces = "text/csv")
    public ResponseEntity<String> exportOrders() {
        StringBuilder sb = new StringBuilder();
        sb.append("\uFEFF").append("MaDon,NgayTao,KhachHang,Email,SDT,DiaChi,PhuongThucTT,TrangThai,TongTien,GiamGia,Voucher,GhiChu\n");
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        for (Order o : orderRepository.findAllByOrderByCreatedAtDesc()) {
            sb.append(csv(o.getOrderCode())).append(',')
                    .append(csv(o.getCreatedAt().format(fmt))).append(',')
                    .append(csv(o.getCustomer() == null ? "" : o.getCustomer().getName())).append(',')
                    .append(csv(o.getCustomer() == null ? "" : o.getCustomer().getEmail())).append(',')
                    .append(csv(o.getCustomer() == null ? "" : o.getCustomer().getPhone())).append(',')
                    .append(csv(o.getCustomer() == null ? "" : o.getCustomer().getAddress())).append(',')
                    .append(csv(o.getPaymentMethod() == null ? "" : o.getPaymentMethod().name())).append(',')
                    .append(csv(o.getStatus().name())).append(',')
                    .append(o.getTotalAmount()).append(',')
                    .append(o.getDiscountAmount() == null ? 0 : o.getDiscountAmount()).append(',')
                    .append(csv(o.getVoucherCode())).append(',')
                    .append(csv(o.getNote())).append('\n');
        }
        return csvResponse("don-hang.csv", sb.toString());
    }

    @GetMapping(value = "/order-items.csv", produces = "text/csv")
    public ResponseEntity<String> exportOrderItems() {
        StringBuilder sb = new StringBuilder();
        sb.append("\uFEFF").append("MaDon,NgayTao,KhachHang,SanPham,SKU,SoLuong,DonGia,ThanhTien\n");
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        for (Order o : orderRepository.findAllByOrderByCreatedAtDesc()) {
            for (OrderItem item : o.getItems()) {
                sb.append(csv(o.getOrderCode())).append(',')
                        .append(csv(o.getCreatedAt().format(fmt))).append(',')
                        .append(csv(o.getCustomer() == null ? "" : o.getCustomer().getName())).append(',')
                        .append(csv(item.getProductName())).append(',')
                        .append(csv(item.getProduct() == null ? "" : item.getProduct().getSku())).append(',')
                        .append(item.getQuantity()).append(',')
                        .append(item.getPrice()).append(',')
                        .append(item.getSubtotal()).append('\n');
            }
        }
        return csvResponse("don-hang-chi-tiet.csv", sb.toString());
    }

    @GetMapping(value = "/products.csv", produces = "text/csv")
    public ResponseEntity<String> exportProducts() {
        StringBuilder sb = new StringBuilder();
        sb.append("\uFEFF").append("SKU,Ten,DanhMuc,DonVi,Gia,TonKho,MoTa\n");
        for (Product p : productRepository.findAll()) {
            sb.append(csv(p.getSku())).append(',')
                    .append(csv(p.getName())).append(',')
                    .append(csv(p.getCategory())).append(',')
                    .append(csv(p.getUnit())).append(',')
                    .append(p.getPrice()).append(',')
                    .append(p.getStock()).append(',')
                    .append(csv(p.getDescription())).append('\n');
        }
        return csvResponse("san-pham.csv", sb.toString());
    }

    private ResponseEntity<String> csvResponse(String filename, String body) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(body);
    }

    private String csv(String s) {
        if (s == null) return "";
        String cleaned = s.replace("\"", "\"\"");
        if (cleaned.contains(",") || cleaned.contains("\"") || cleaned.contains("\n")) {
            return "\"" + cleaned + "\"";
        }
        return cleaned;
    }
}