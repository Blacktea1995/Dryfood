package com.evomap.dryfood.service;

import com.evomap.dryfood.exception.BadRequestException;
import com.evomap.dryfood.exception.NotFoundException;
import com.evomap.dryfood.model.Customer;
import com.evomap.dryfood.model.Order;
import com.evomap.dryfood.model.Order.Status;
import com.evomap.dryfood.model.OrderItem;
import com.evomap.dryfood.model.Product;
import com.evomap.dryfood.repository.CustomerRepository;
import com.evomap.dryfood.repository.OrderRepository;
import com.evomap.dryfood.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;

    public OrderService(OrderRepository orderRepository,
                        CustomerRepository customerRepository,
                        ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
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

    /**
     * Tao don hang: kiem tra ton kho, tru stock, tinh tong tien.
     */
    @Transactional
    public Order create(OrderRequest request) {
        Customer customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> new NotFoundException("Khong tim thay khach hang id=" + request.customerId()));

        Order order = new Order(customer);
        order.setNote(request.note());

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

        return orderRepository.save(order);
    }

    /**
     * Cap nhat trang thai don hang.
     */
    @Transactional
    public Order updateStatus(Long id, String status) {
        Order order = findById(id);
        Status newStatus;
        try {
            newStatus = Status.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Trang thai khong hop le: " + status);
        }

        // Huy don: hoan lai ton kho
        if (newStatus == Status.CANCELLED && order.getStatus() != Status.CANCELLED) {
            restoreStock(order);
        }
        order.setStatus(newStatus);
        return orderRepository.save(order);
    }

    /**
     * Xoa don hang; neu don chua giao/cancel thi hoan lai ton kho.
     */
    @Transactional
    public void delete(Long id) {
        Order order = findById(id);
        if (order.getStatus() != Status.CANCELLED && order.getStatus() != Status.DELIVERED) {
            restoreStock(order);
        }
        orderRepository.delete(order);
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
