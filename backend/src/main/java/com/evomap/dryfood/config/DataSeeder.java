package com.evomap.dryfood.config;

import com.evomap.dryfood.model.Customer;
import com.evomap.dryfood.model.Order;
import com.evomap.dryfood.model.Order.Status;
import com.evomap.dryfood.model.OrderItem;
import com.evomap.dryfood.model.Product;
import com.evomap.dryfood.model.User;
import com.evomap.dryfood.repository.CustomerRepository;
import com.evomap.dryfood.repository.OrderRepository;
import com.evomap.dryfood.repository.ProductRepository;
import com.evomap.dryfood.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

/**
 * Seed du lieu mau khi database trong, de dashboard co so lieu phan tich ngay.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public DataSeeder(ProductRepository productRepository,
                      CustomerRepository customerRepository,
                      OrderRepository orderRepository,
                      UserRepository userRepository) {
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        seedAdminUser();
        if (productRepository.count() > 0) {
            return;
        }

        List<Product> products = List.of(
                new Product("Mi goi Hao Hao", "DF-001", "Mi - bun", "goi", 4500.0, 120, "Mi goi huong vit, goi 75g", "/images/mi-hao-hao.jpg"),
                new Product("Mi goi Omachi", "DF-002", "Mi - bun", "goi", 8000.0, 90, "Mi bo bap cai Omachi 72g", "/images/mi-omachi.jpg"),
                new Product("Ga tao trang", "DF-003", "Thit", "goi", 35000.0, 40, "Ga tao trang loai 1, goi 500g", "/images/ga-tao.jpg"),
                new Product("Mo kho", "DF-004", "Thit", "goi", 42000.0, 25, "Mo kho ca sa, goi 500g", "/images/mo-kho.jpg"),
                new Product("Ca kho tho", "DF-005", "Hai san", "hop", 55000.0, 15, "Ca kho tho dong hop 200g", "/images/ca-kho.jpg"),
                new Product("Cha bong ca thu", "DF-006", "Hai san", "goi", 48000.0, 8, "Cha bong ca thu nguyen chat 100g", "/images/cha-bong.jpg"),
                new Product("Ruoc toi", "DF-007", "Thit", "hop", 38000.0, 12, "Ruoc toi heo 250g", "/images/ruoc.jpg"),
                new Product("Nem chua ran", "DF-008", "Thit", "goi", 25000.0, 60, "Nem chua ran dong goi 200g", "/images/nem-chua-ran.jpg"),
                new Product("Bong bia kho", "DF-009", "Hat - an vat", "goi", 28000.0, 6, "Bong bia kho gion 200g", "/images/bong-bia.jpg"),
                new Product("Hat dieu rang muoi", "DF-010", "Hat - an vat", "goi", 95000.0, 30, "Hat dieu rang muoi loai 1, 300g", "/images/hat-dieu.jpg"),
                new Product("Hat bi xanh", "DF-011", "Hat - an vat", "goi", 120000.0, 5, "Hat bi xanh tay 250g", "/images/hat-bi.jpg"),
                new Product("Trai cay kho hop", "DF-012", "Trai cay kho", "hop", 65000.0, 20, "Xoai, mit, chuoi kho 400g", "/images/trai-cay-kho.jpg"),
                new Product("Rau cu say", "DF-013", "Rau cu", "goi", 45000.0, 18, "Rau cu say hon hop 200g", "/images/rau-cu.jpg"),
                new Product("Khoai lang vang", "DF-014", "Rau cu", "goi", 32000.0, 40, "Khoai lang vang say, goi 250g", "/images/khoai-lang.jpg"),
                new Product("Muc kho", "DF-015", "Hai san", "goi", 145000.0, 10, "Muc kho nguyen con 250g", "/images/muc-kho.jpg")
        );
        productRepository.saveAll(products);

        List<Customer> customers = List.of(
                new Customer("Nguyen Van An", "an.nguyen@gmail.com", "0912345678", "12 Le Loi, Q1, TP.HCM"),
                new Customer("Tran Thi Binh", "binh.tran@yahoo.com", "0987654321", "45 Nguyen Hue, Q1, TP.HCM"),
                new Customer("Le Van Cuong", "cuong.le@gmail.com", "0903123456", "78 Ba Trieu, Ha Noi"),
                new Customer("Pham Thi Dung", "dung.pham@gmail.com", "0934456789", "23 Tran Hung Dao, Da Nang")
        );
        customerRepository.saveAll(customers);

        seedOrders(products, customers);
    }

    private void seedOrders(List<Product> products, List<Customer> customers) {
        // 10 don hang trai 7 ngay gan day voi trang thai khac nhau
        List<Object[]> plans = List.of(
                new Object[]{0, 1, 5, Status.DELIVERED, 7},
                new Object[]{1, 2, 3, Status.DELIVERED, 6},
                new Object[]{2, 0, 2, Status.SHIPPING, 5},
                new Object[]{3, 1, 4, Status.DELIVERED, 4},
                new Object[]{0, 3, 2, Status.CONFIRMED, 3},
                new Object[]{1, 4, 6, Status.DELIVERED, 3},
                new Object[]{2, 5, 1, Status.PENDING, 2},
                new Object[]{3, 0, 8, Status.DELIVERED, 1},
                new Object[]{0, 2, 2, Status.SHIPPING, 1},
                new Object[]{1, 3, 4, Status.PENDING, 0}
        );

        List<Order> orders = new ArrayList<>();
        for (Object[] plan : plans) {
            int customerIdx = (Integer) plan[0];
            int productIdx = (Integer) plan[1];
            int qty = (Integer) plan[2];
            Status status = (Status) plan[3];
            int daysAgo = (Integer) plan[4];

            Customer customer = customers.get(customerIdx);
            Product product = products.get(productIdx);

            Order order = new Order(customer);
            order.setStatus(status);
            order.setCreatedAt(LocalDateTime.now().minusDays(daysAgo).minusHours((long) (Math.random() * 8)));

            OrderItem item = new OrderItem(product, qty);
            order.addItem(item);

            orders.add(order);
        }
        orderRepository.saveAll(orders);

        // Tru ton kho tuong ung voi cac don da ban
        for (Order o : orders) {
            if (o.getStatus() == Status.CANCELLED) continue;
            o.getItems().forEach(item -> {
                Product p = item.getProduct();
                p.setStock(p.getStock() - item.getQuantity());
                productRepository.save(p);
            });
        }

        System.out.println("[DataSeeder] Seeded " + products.size() + " products, "
                + customers.size() + " customers, " + orders.size() + " orders");
    }

    /**
     * Tai khoan admin mac dinh de dang nhap trang quan ly.
     */
    private void seedAdminUser() {
        if (userRepository.existsByEmail("admin@dryfood.vn")) {
            return;
        }
        User admin = new User(
                "Quan tri vien",
                "admin@dryfood.vn",
                hashPassword("admin123"),
                null,
                null,
                User.Role.ADMIN
        );
        userRepository.save(admin);
        System.out.println("[DataSeeder] Seeded admin account: admin@dryfood.vn / admin123");
    }

    private String hashPassword(String password) {
        try {
            byte[] salt = new byte[16];
            new SecureRandom().nextBytes(salt);
            PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, 120_000, 256);
            SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            byte[] hash = factory.generateSecret(spec).getEncoded();
            return "pbkdf2$" + Base64.getEncoder().encodeToString(salt) + "$" + Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Khong the hash mat khau admin", e);
        }
    }
}
