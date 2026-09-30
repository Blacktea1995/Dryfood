package com.evomap.dryfood.controller;

import com.evomap.dryfood.model.Customer;
import com.evomap.dryfood.model.Order;
import com.evomap.dryfood.model.User;
import com.evomap.dryfood.service.OrderRequest;
import com.evomap.dryfood.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public List<Order> list(@RequestParam(required = false) String status,
                            @RequestAttribute("user") User user) {
        if (user.getRole() == User.Role.CUSTOMER) {
            return orderService.findByCustomer(user.getCustomerId(), status);
        }
        return orderService.findAll(status);
    }

    @GetMapping("/{id}")
    public Order get(@PathVariable Long id, @RequestAttribute("user") User user) {
        Order order = orderService.findById(id);
        if (user.getRole() == User.Role.CUSTOMER && !user.getCustomerId().equals(order.getCustomer().getId())) {
            throw new com.evomap.dryfood.exception.NotFoundException("Khong tim thay don hang id=" + id);
        }
        return order;
    }

    @PostMapping
    public ResponseEntity<Order> create(@Valid @RequestBody OrderRequest request,
                                        @RequestAttribute("user") User user) {
        if (user.getRole() == User.Role.CUSTOMER) {
            // Khach hang chi dat hang bang chinh tai khoan cua minh
            request = new OrderRequest(user.getCustomerId(), request.note(), request.items());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.create(request));
    }

    @PutMapping("/{id}/status")
    public Order updateStatus(@PathVariable Long id, @RequestBody StatusUpdate body) {
        return orderService.updateStatus(id, body.status());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        orderService.delete(id);
        return ResponseEntity.noContent().build();
    }

    public record StatusUpdate(String status) {
    }
}
