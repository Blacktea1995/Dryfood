package com.evomap.dryfood.service;

import com.evomap.dryfood.exception.BadRequestException;
import com.evomap.dryfood.exception.NotFoundException;
import com.evomap.dryfood.model.Customer;
import com.evomap.dryfood.model.Order;
import com.evomap.dryfood.model.Order.Status;
import com.evomap.dryfood.model.OrderStatusHistory;
import com.evomap.dryfood.model.OrderItem;
import com.evomap.dryfood.model.Product;
import com.evomap.dryfood.model.Voucher;
import com.evomap.dryfood.repository.CustomerRepository;
import com.evomap.dryfood.repository.OrderRepository;
import com.evomap.dryfood.repository.OrderStatusHistoryRepository;
import com.evomap.dryfood.repository.ProductRepository;
import com.evomap.dryfood.repository.VoucherRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final OrderStatusHistoryRepository historyRepository;
    private final VoucherRepository voucherRepository;

    public OrderService(OrderRepository orderRepository,
                        CustomerRepository customerRepository,
                        ProductRepository productRepository,
                        OrderStatusHistoryRepository historyRepository,
                        VoucherRepository voucherRepository) {
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
        this.historyRepository = historyRepository;
        this.voucherRepository = voucherRepository;
    }

    public List<Order> findAll(String status) {
        if (status != null && !status.isBlank()) {
            try {
                Status s = Status.valueOf(status.trim().toUpperCase());
                return orderRepository.findByStatusOrderByCreatedAtDesc(s);
            } catch (IllegalArgumentException ex) {
                throw new BadRequestException("Trang thai khong hop le: " + status);
            }
        }
        return orderRepository.findAllByOrderByCreatedAtDesc();
    }

    /**
     * Danh sach don hang cua mot khach hang (dung cho tai khoan CUSTOMER).
     */
    public List<Order> findByCustomer(Long customerId, String status) {
        if (customerId == null) {
            throw new BadRequestException("Tai khoan khong lien ket voi khach hang");
        }
        if (status != null && !status.isBlank()) {
            try {
                Status s = Status.valueOf(status.trim().toUpperCase());
                return orderRepository.findByCustomerIdAndStatusOrderByCreatedAtDesc(customerId, s);
            } catch (IllegalArgumentException ex) {
                throw new BadRequestException("Trang thai khong hop le: " + status);
            }
        }
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    public Order findById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Khong tim thay don hang id=" + id));
    }

    public List<OrderStatusHistory> timeline(Long orderId) {
        return historyRepository.findByOrderIdOrderByCreatedAtAsc(orderId);
    }

    /**
     * Tao don hang: kiem tra ton kho, tru stock, tinh tong tien, ap dung voucher,
     * ghi lai moc trang thai ban dau va hut hang.
     */
    @Transactional
    public Order create(OrderRequest request) {
        Customer customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> new NotFoundException("Khong tim thay khach hang id=" + request.customerId()));

        Order order = new Order(customer);
        order.setNote(request.note());

        Order.PaymentMethod paymentMethod = request.paymentMethod() == null
                ? Order.PaymentMethod.COD
                : request.paymentMethod();
        order.setPaymentMethod(paymentMethod);

        for (OrderRequest.ItemRequest itemReq : request.items()) {
            Product product = productRepository.findById(itemReq.productId())
                    .orElseThrow(() -> new NotFoundException("Khong tim thay san pham id=" + itemReq.productId()));

            int qty = itemReq.quantity();
            if (qty <= 0) {
                throw new BadRequestException("So luong phai lon hon 0");
            }
            if (product.getStock() < qty) {
                throw new BadRequestException(
                        "San pham '" + product.getName() + "' khong du hang (con " + product.getStock() + " " + product.getUnit() + ")");
            }

            product.setStock(product.getStock() - qty);
            productRepository.save(product);

            order.addItem(new OrderItem(product, qty));
        }

        // Ap dung voucher: tinh giam gia tren tong truoc khi luu
        String voucherCode = request.voucherCode();
        double discount = 0;
        if (voucherCode != null && !voucherCode.isBlank()) {
            Optional<Voucher> voucher = voucherRepository.findByCodeIgnoreCase(voucherCode.trim());
            if (voucher.isPresent() && voucher.get().isValid()) {
                discount = voucher.get().discountFor(order.getTotalAmount());
                order.setVoucherCode(voucher.get().getCode());
                order.setDiscountAmount(discount);
                voucher.get().setUsedCount(voucher.get().getUsedCount() + 1);
                voucherRepository.save(voucher.get());
            }
        }
        order.setTotalAmount(order.getTotalAmount() - discount);
        if (order.getTotalAmount() < 0) order.setTotalAmount(0.0);

        Order saved = orderRepository.save(order);

        // Ghi moc trang thai ban dau
        addHistory(saved, Status.PENDING, "Don hang duoc tao");

        return saved;
    }

    /**
     * Cap nhat trang thai don hang + hoan lai ton kho khi huy + ghi dong thoi gian.
     */
    @Transactional
    public Order updateStatus(Long id, String status, String note) {
        Order order = findById(id);
        Status newStatus;
        try {
            newStatus = Status.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Trang thai khong hop le: " + status);
        }

        if (newStatus == order.getStatus()) {
            return order;
        }

        // Huy don: ghi lai stock da tru
        if (newStatus == Status.CANCELLED && order.getStatus() != Status.CANCELLED) {
            restoreStock(order);
        }
        order.setStatus(newStatus);
        Order saved = orderRepository.save(order);
        addHistory(saved, newStatus, note);
        return saved;
    }

    /**
     * Xoa don hang; neu don chua giao/cancellate thi hoan lai ton kho.
     */
    @Transactional
    public void delete(Long id) {
        Order order = findById(id);
        if (order.getStatus() != Status.CANCELLED && order.getStatus() != Status.DELIVERED) {
            restoreStock(order);
        }
        orderRepository.delete(order);
    }

    private void addHistory(Order order, Status status, String note) {
        OrderStatusHistory h = new OrderStatusHistory(order, status, note);
        historyRepository.save(h);
    }

    private void restoreStock(Order order) {
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setStock(product.getStock() + item.getQuantity());
            productRepository.save(product);
        }
    }

    public long countByStatus(Status status) {
        return orderRepository.countByStatus(status);
    }
}