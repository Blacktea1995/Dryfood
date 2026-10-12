package com.evomap.dryfood.config;

import com.evomap.dryfood.model.Customer;
import com.evomap.dryfood.model.Order;
import com.evomap.dryfood.model.Order.Status;
import com.evomap.dryfood.model.OrderItem;
import com.evomap.dryfood.model.OrderStatusHistory;
import com.evomap.dryfood.model.Product;
import com.evomap.dryfood.model.Review;
import com.evomap.dryfood.model.User;
import com.evomap.dryfood.model.Voucher;
import com.evomap.dryfood.repository.CustomerRepository;
import com.evomap.dryfood.repository.OrderRepository;
import com.evomap.dryfood.repository.OrderStatusHistoryRepository;
import com.evomap.dryfood.repository.ProductRepository;
import com.evomap.dryfood.repository.ReviewRepository;
import com.evomap.dryfood.repository.UserRepository;
import com.evomap.dryfood.repository.VoucherRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Set;
import java.util.HashSet;

/**
 * Seed du lieu mau cho database MySQL (dryfood) - xem/quan ly bang DBeaver.
 * Gom: 165 san pham (15 goc + 150 moi), 300 khach hang, 120 user khach hang,
 * 20 voucher, 1000 don hang trai 12 thang, lich su trang thai, ~800 danh gia.
 * Chi chay 1 lan khi bang products rong.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final VoucherRepository voucherRepository;
    private final OrderStatusHistoryRepository historyRepository;

    public DataSeeder(ProductRepository productRepository,
                      CustomerRepository customerRepository,
                      OrderRepository orderRepository,
                      UserRepository userRepository,
                      ReviewRepository reviewRepository,
                      VoucherRepository voucherRepository,
                      OrderStatusHistoryRepository historyRepository) {
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.reviewRepository = reviewRepository;
        this.voucherRepository = voucherRepository;
        this.historyRepository = historyRepository;
    }

    private final SecureRandom rng = new SecureRandom();
    private static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    @Override
    @Transactional
    public void run(String... args) {
        seedAdminUser();
        if (productRepository.count() > 0) {
            return;
        }

        // 1. San pham: 15 goc + 150 moi = 165
        List<Product> products = buildProducts();
        productRepository.saveAll(products);

        // 2. Khach hang + user dang ky
        List<Customer> customers = buildCustomers(300);
        customerRepository.saveAll(customers);
        List<User> users = buildUsers(120, customers);
        userRepository.saveAll(users);

        // 3. Voucher
        List<Voucher> vouchers = buildVouchers(20);
        voucherRepository.saveAll(vouchers);

        // 4. 1000 don hang + lich su trang thai + tru ton kho
        seedOrders(products, customers, vouchers);

        // 5. ~800 danh gia
        seedReviews(products, users);

        System.out.println("[DataSeeder] Done: 165 products, 300 customers, 120 users, "
                + "20 vouchers, 1000 orders, ~800 reviews");
    }

    // ================= SAN PHAM =================

    private List<Product> buildProducts() {
        List<Product> list = new ArrayList<>();

        // 15 san pham goc (giu nguyen du lieu hien co)
        String[][] base = {
                {"Mi goi Hao Hao", "DF-001", "Mi - bun", "goi", "4500", "120", "Mi goi huong vit, goi 75g"},
                {"Mi goi Omachi", "DF-002", "Mi - bun", "goi", "8000", "90", "Mi bo bap cai Omachi 72g"},
                {"Ga tao trang", "DF-003", "Thit", "goi", "35000", "40", "Ga tao trang loai 1, goi 500g"},
                {"Mo kho", "DF-004", "Thit", "goi", "42000", "25", "Mo kho ca sa, goi 500g"},
                {"Ca kho tho", "DF-005", "Hai san", "hop", "55000", "15", "Ca kho tho dong hop 200g"},
                {"Cha bong ca thu", "DF-006", "Hai san", "goi", "48000", "8", "Cha bong ca thu nguyen chat 100g"},
                {"Ruoc toi", "DF-007", "Thit", "hop", "38000", "12", "Ruoc toi heo 250g"},
                {"Nem chua ran", "DF-008", "Thit", "goi", "25000", "60", "Nem chua ran dong goi 200g"},
                {"Bong bia kho", "DF-009", "Hat - an vat", "goi", "28000", "6", "Bong bia kho gion 200g"},
                {"Hat dieu rang muoi", "DF-010", "Hat - an vat", "goi", "95000", "30", "Hat dieu rang muoi loai 1, 300g"},
                {"Hat bi xanh", "DF-011", "Hat - an vat", "goi", "120000", "5", "Hat bi xanh tay 250g"},
                {"Trai cay kho hop", "DF-012", "Trai cay kho", "hop", "65000", "20", "Xoai, mit, chuoi kho 400g"},
                {"Rau cu say", "DF-013", "Rau cu", "goi", "45000", "18", "Rau cu say hon hop 200g"},
                {"Khoai lang vang", "DF-014", "Rau cu", "goi", "32000", "40", "Khoai lang vang say, goi 250g"},
                {"Muc kho", "DF-015", "Hai san", "goi", "145000", "10", "Muc kho nguyen con 250g"}
        };
        for (String[] p : base) {
            list.add(new Product(p[0], p[1], p[2], p[3],
                    Double.parseDouble(p[4]), Integer.parseInt(p[5]), p[6],
                    "/images/" + slug(p[1]) + ".jpg"));
        }

        list.addAll(buildAdditionalProducts(150, 16));
        return list;
    }

    /** Tao 150 san pham moi (SKU DF-016 -> DF-165) voi ten that, da dang danh muc. */
    private List<Product> buildAdditionalProducts(int count, int startId) {
        // [category, unit, target count, name pool, price pool]
        Object[][] cat = {
                {"Mi - bun", "goi", 20, new String[]{"Mi kho", "Mi gao lan", "Bun kho gao lua", "Pho kho", "Mi y dai", "Bun ram", "Mi cay", "Mi xao kho", "Hu tieu kho", "Bun bo kho"}, new double[]{12000, 15000, 18000, 22000, 16000}},
                {"Thit", "goi", 20, new String[]{"Cha lua", "Gio bo", "Nem kho", "Thit kho tau", "Cha que", "Ruoc bong", "Ruoc cay", "Cha ca thit", "Nem nuong kho", "Thit bam kho"}, new double[]{55000, 60000, 45000, 68000, 52000, 48000}},
                {"Hai san", "goi", 20, new String[]{"Tom kho", "Ruoc ca", "Chao ca thu", "Muc kho", "Ca com kho", "Ngua kho", "Ca kho lang", "Muc rim", "Tom say", "Ca muoi kho"}, new double[]{180000, 95000, 88000, 145000, 120000, 160000}},
                {"Hat - an vat", "goi", 20, new String[]{"Hat dieu rang muoi", "Hat de nuong", "Hat hong dao", "Hat bi han", "Hat oc bo", "Lat hat dieu", "Hat huong duong", "Hat bap rang", "Dau phong rang", "Hat sen say"}, new double[]{95000, 130000, 150000, 120000, 85000, 110000}},
                {"Trai cay kho", "hop", 18, new String[]{"Xoai kho", "Mit kho", "Chuoi kho", "Nhan kho", "Quyt kho", "Sapoche kho", "Dua kho", "Thanh long say", "Vai kho", "Oi say", "Me kho", "Chan chua say"}, new double[]{65000, 72000, 58000, 98000, 76000, 88000}},
                {"Rau cu", "goi", 18, new String[]{"Khoai lang say", "Khoai tay say", "Hanh phi", "Bo kho", "Ca rot say", "Bap xoi", "Cu den say", "Khoai mon say", "Su hao say", "Khoai tay chien", "Ngo kho", "San kho"}, new double[]{34000, 38000, 45000, 52000, 42000, 36000}},
                {"Gia vi", "goi", 18, new String[]{"Bo ot xay", "Tieu den", "Toi say", "Hanh say", "Bot ca ri", "Muoi tay", "Bot nghe", "Sa kho", "Que kho", "Bot rieu", "Hat nem chay", "Bot toi"}, new double[]{28000, 65000, 35000, 30000, 25000, 20000}},
                {"Banh keo", "goi", 16, new String[]{"Banh trang nuong", "Banh phong tom", "Keo me xung", "Banh da ke", "Banh gao", "Keo lac", "Banh dau xanh", "Banh khoai mi", "Keo dua", "Banh in", "Banh troi", "Banh cu dai"}, new double[]{25000, 22000, 38000, 20000, 24000, 28000}}
        };

        List<Product> out = new ArrayList<>();
        int idx = startId;
        for (Object[] kind : cat) {
            String category = (String) kind[0];
            String unit = (String) kind[1];
            int target = (Integer) kind[2];
            String[] names = (String[]) kind[3];
            double[] pricePool = (double[]) kind[4];
            String[] weights = unit.equals("hop")
                    ? new String[]{"", " (hop 250g)", " (hop 500g)"}
                    : new String[]{"", " (goi 200g)", " (goi 500g)", " (goi 1kg)"};

            for (int i = 0; i < target; i++) {
                String name = names[i % names.length] + weights[(i / names.length) % weights.length];
                double base = pricePool[rng.nextInt(pricePool.length)];
                double price = Math.round(base * (0.85 + rng.nextDouble() * 0.4) / 500.0) * 500.0;
                int stock = 5 + rng.nextInt(150);
                String sku = "DF-" + String.format("%03d", idx);
                out.add(new Product(name, sku, category, unit, price, stock,
                        "Thuc pham kho " + name.toLowerCase().trim() + " chon loc, an toan ve sinh",
                        "/images/" + slug(sku) + ".jpg"));
                idx++;
            }
        }
        return out;
    }

    // ================= KHACH HANG & USER =================

    private static final String[] SURNAMES = {
            "Nguyen", "Tran", "Le", "Pham", "Hoang", "Phan", "Vu", "Dang", "Bui", "Do",
            "Ho", "Ngo", "Duong", "Ly", "Trinh", "Vo", "Luong", "Dinh", "Huynh", "Truong"
    };
    private static final String[] MIDDLE = {
            "Van", "Thi", "Quoc", "Huu", "Duc", "Cong", "Minh", "Ngoc", "Thanh", "Xuan",
            "Gia", "Anh", "Hong", "Tien", "Manh", "Tuan", "Phuong", "Kim", "Duy", "My"
    };
    private static final String[] GIVEN = {
            "An", "Anh", "Binh", "Bao", "Chau", "Chien", "Cuong", "Dung", "Duong", "Giang",
            "Hai", "Hieu", "Hoang", "Huong", "Khanh", "Khoa", "Lan", "Linh", "Long", "Mai",
            "Minh", "Nam", "Ngan", "Nhi", "Oanh", "Phuc", "Quan", "Quang", "Sang", "Son",
            "Tam", "Thanh", "Thao", "Thinh", "Trang", "Tu", "Tuan", "Uyen", "Vi", "Vy",
            "Xuyen", "Yen", "Hung", "Nhat", "Dat", "Tien", "Kiet", "Phu", "Thuy", "Ha"
    };

    private List<Customer> buildCustomers(int n) {
        List<Customer> list = new ArrayList<>();
        Set<String> emails = new HashSet<>();
        for (int i = 0; i < n; i++) {
            String name = SURNAMES[rng.nextInt(SURNAMES.length)] + " "
                    + MIDDLE[rng.nextInt(MIDDLE.length)] + " "
                    + GIVEN[rng.nextInt(GIVEN.length)];
            String email = "khach" + (i + 1) + "@dryfood.vn";
            while (emails.contains(email)) {
                email = "khach" + (i + 1) + "_" + rng.nextInt(999) + "@dryfood.vn";
            }
            emails.add(email);
            String phone = "09" + (1 + rng.nextInt(9)) + String.format("%08d", rng.nextInt(100000000));
            String address = (rng.nextInt(400) + 1) + " " + street() + ", " + ward() + ", " + city();
            list.add(new Customer(name, email, phone, address));
        }
        return list;
    }

    private String street() {
        String[] s = {"Nguyen Hue", "Le Loi", "Tran Hung Dao", "Hai Ba Trung", "Ly Thuong Kiet",
                "Phan Xich Long", "Ton Duc Thang", "Ba Trieu", "Dien Bien Phu", "Cong Hoa"};
        return s[rng.nextInt(s.length)];
    }

    private String ward() {
        String[] w = {"Phuong 1", "Phuong 5", "Phuong 10", "Phuong Binh Khanh", "Phuong Tan Phu",
                "Phuong An Hoa", "Phuong My An", "Phuong Thanh Khe", "Phuong Dong Da", "Phuong Binh Trung"};
        return w[rng.nextInt(w.length)];
    }

    private String city() {
        String[] c = {"Q1, TP.HCM", "Tan Binh, TP.HCM", "Ba Dinh, Ha Noi", "Cau Giay, Ha Noi",
                "Hai Chau, Da Nang", "Ninh Kieu, Can Tho", "Hong Bang, Hai Phong", "Thuan Hoa, Hue",
                "Bien Hoa, Dong Nai", "Vung Tau, Ba Ria - Vung Tau"};
        return c[rng.nextInt(c.length)];
    }

    private List<User> buildUsers(int n, List<Customer> customers) {
        List<User> list = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            Customer c = customers.get(i % customers.size());
            User u = new User(c.getName(), c.getEmail(), hashPassword("customer" + (i + 1)),
                    c.getPhone(), c.getAddress(), User.Role.CUSTOMER);
            u.setCustomerId(c.getId());
            list.add(u);
        }
        return list;
    }

    // ================= VOUCHER =================

    private List<Voucher> buildVouchers(int n) {
        LocalDate today = LocalDate.now();
        List<Voucher> list = new ArrayList<>();
        String[] codes = {"GIA5", "GIA10", "GIA15", "GIA20", "GIAM30K", "GIAM50K", "GIAM100K",
                "TET2026", "BLACKFRIDAY", "1212", "KHACHMOI", "FREESHIP", "COMBO1", "VIP10",
                "DACBIET", "MOI2026", "SUMMER", "AUTUMN", "WINTER", "HEXEN"};
        for (int i = 0; i < n; i++) {
            Voucher v = new Voucher();
            v.setCode(codes[i % codes.length] + (i >= codes.length ? (i + 1) : ""));
            v.setType(i % 3 == 0 ? Voucher.Type.PERCENT : Voucher.Type.AMOUNT);
            if (v.getType() == Voucher.Type.PERCENT) {
                v.setValue((double) (5 + rng.nextInt(16))); // 5-20%
                v.setMaxDiscount(50000.0 + rng.nextInt(20) * 10000);
            } else {
                v.setValue((double) (20000 + rng.nextInt(18) * 10000)); // 20k-190k
            }
            v.setMinOrder((double) (100000 + rng.nextInt(4) * 50000));
            v.setStartDate(today.minusDays(rng.nextInt(60)));
            v.setEndDate(today.plusDays(15 + rng.nextInt(90)));
            v.setQuantity(50 + rng.nextInt(450));
            v.setUsedCount(0);
            v.setActive(true);
            v.setDescription("Voucher khuyen mai DryFood " + codes[i % codes.length]);
            list.add(v);
        }
        return list;
    }

    // ================= DON HANG =================

    private void seedOrders(List<Product> products, List<Customer> customers, List<Voucher> vouchers) {
        int total = 1000;
        Status[] statuses = {Status.DELIVERED, Status.DELIVERED, Status.DELIVERED, Status.DELIVERED,
                Status.SHIPPING, Status.SHIPPING, Status.CONFIRMED, Status.PENDING, Status.CANCELLED};
        Order.PaymentMethod[] payments = {Order.PaymentMethod.COD, Order.PaymentMethod.COD,
                Order.PaymentMethod.COD, Order.PaymentMethod.TRANSFER, Order.PaymentMethod.TRANSFER};

        List<Order> orders = new ArrayList<>();
        List<OrderStatusHistory> histories = new ArrayList<>();

        for (int i = 0; i < total; i++) {
            Customer customer = customers.get(rng.nextInt(customers.size()));
            Order order = new Order(customer);
            order.setStatus(statuses[rng.nextInt(statuses.length)]);
            order.setPaymentMethod(payments[rng.nextInt(payments.length)]);

            // Ngay tao trai 365 ngay gan day
            LocalDateTime createdAt = LocalDateTime.now()
                    .minusDays(rng.nextInt(365))
                    .minusHours(rng.nextInt(20))
                    .minusMinutes(rng.nextInt(59));
            order.setCreatedAt(createdAt);

            // Ma don hang dam bao duy nhat: thoi diem tao + so thu tu
            order.setOrderCode("DH" + createdAt.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                    + String.format("%04d", i));

            // 1-4 mat hang moi don
            int itemCount = 1 + rng.nextInt(4);
            Set<Product> picked = new HashSet<>();
            for (int j = 0; j < itemCount; j++) {
                Product p = products.get(rng.nextInt(products.size()));
                if (picked.contains(p)) continue;
                picked.add(p);
                order.addItem(new OrderItem(p, 1 + rng.nextInt(5)));
            }
            if (order.getItems().isEmpty()) {
                order.addItem(new OrderItem(products.get(rng.nextInt(products.size())), 1));
            }

            // Voucher ap dung ngau nhien cho khoang 15% don
            if (rng.nextInt(100) < 15) {
                Voucher v = vouchers.get(rng.nextInt(vouchers.size()));
                double discount = v.discountFor(order.getTotalAmount());
                if (discount > 0) {
                    order.setDiscountAmount(discount);
                    order.setVoucherCode(v.getCode());
                    order.setTotalAmount(order.getTotalAmount() - discount);
                    v.setUsedCount(v.getUsedCount() + 1);
                }
            }

            order.setNote(rng.nextInt(100) < 20 ? "Ghi chu don hang mau " + (i + 1) : null);
            orders.add(order);

            // Lich su trang thai: cac trang thai truoc do + trang thai hien tai
            List<Status> chain = statusChain(order.getStatus());
            for (Status st : chain) {
                OrderStatusHistory h = new OrderStatusHistory(order, st,
                        "Cap nhat trang thai tu dong (seed)");
                h.setCreatedAt(createdAt.plusMinutes(30 + rng.nextInt(1440)));
                histories.add(h);
            }
        }

        // Luu theo tung nhom 100 de tranh stack overflow / transaction qua lon
        for (int i = 0; i < orders.size(); i += 100) {
            orderRepository.saveAll(orders.subList(i, Math.min(i + 100, orders.size())));
        }
        for (int i = 0; i < histories.size(); i += 200) {
            historyRepository.saveAll(histories.subList(i, Math.min(i + 200, histories.size())));
        }

        // Tru ton kho tuong ung cac don da ban (khong tinh CANCELLED)
        for (Order o : orders) {
            if (o.getStatus() == Status.CANCELLED) continue;
            for (OrderItem item : o.getItems()) {
                Product p = item.getProduct();
                p.setStock(Math.max(0, p.getStock() - item.getQuantity()));
            }
        }
        // Giu san pham luon con hang de demo: floor toi thieu 3 moi san pham
        for (Product p : products) {
            if (p.getStock() < 3) {
                p.setStock(3 + rng.nextInt(15));
            }
        }
        productRepository.saveAll(products);

        System.out.println("[DataSeeder] Orders: " + orders.size()
                + ", order items: " + orders.stream().mapToInt(o -> o.getItems().size()).sum()
                + ", status histories: " + histories.size());
    }

    private List<Status> statusChain(Status current) {
        List<Status> chain = new ArrayList<>();
        chain.add(Status.PENDING);
        if (current == Status.CONFIRMED || current == Status.SHIPPING
                || current == Status.DELIVERED || current == Status.CANCELLED) {
            chain.add(Status.CONFIRMED);
        }
        if (current == Status.SHIPPING || current == Status.DELIVERED) {
            chain.add(Status.SHIPPING);
        }
        if (current == Status.DELIVERED) {
            chain.add(Status.DELIVERED);
        }
        if (current == Status.CANCELLED) {
            chain.add(Status.CANCELLED);
        }
        return chain;
    }

    // ================= DANH GIA =================

    private void seedReviews(List<Product> products, List<User> users) {
        String[] good = {"Hang tot, dong goi can than", "Gia hop ly, se mua lai",
                "Chat luong on, giao hang nhanh", "Dong vi ngon, gia dung",
                "San pham sach se, uy tin", "Mua lan 2 roi, chat luong deu",
                "Huong vi tu nhien, khong pha", "Bao bi dep, dung tay san pham"};
        String[] bad = {"Giao hoi cham", "Gia hoi cao so voi chat luong",
                "Dong goi hoi so sai", "Vi chua duoc ngon nhu mong doi"};
        String[] mid = {"Tam on, co the mua lai", "Chat luong kha, gia phai chang",
                "Binh thuong, khong qua noi bat"};

        int target = 800;
        int made = 0;
        int attempt = 0;
        Set<String> seen = new HashSet<>();
        while (made < target && attempt < 3000) {
            attempt++;
            User user = users.get(rng.nextInt(users.size()));
            Product product = products.get(rng.nextInt(products.size()));
            String key = user.getId() + ":" + product.getId();
            if (seen.contains(key)) continue;
            seen.add(key);

            Review r = new Review();
            r.setUser(user);
            r.setProduct(product);
            r.setOrder(null);
            int rating = weightedRating();
            r.setRating(rating);
            if (rating >= 4) {
                r.setComment(good[rng.nextInt(good.length)]);
            } else if (rating <= 2) {
                r.setComment(bad[rng.nextInt(bad.length)]);
            } else {
                r.setComment(mid[rng.nextInt(mid.length)]);
            }
            r.setCreatedAt(LocalDateTime.now().minusDays(rng.nextInt(180)).minusHours(rng.nextInt(12)));
            reviewRepository.save(r);
            made++;
        }
        System.out.println("[DataSeeder] Reviews: " + made);
    }

    private int weightedRating() {
        int roll = rng.nextInt(100);
        if (roll < 55) return 5;
        if (roll < 80) return 4;
        if (roll < 90) return 3;
        if (roll < 97) return 2;
        return 1;
    }

    // ================= ADMIN =================

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
            rng.nextBytes(salt);
            PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, 120_000, 256);
            SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            byte[] hash = factory.generateSecret(spec).getEncoded();
            return "pbkdf2$" + Base64.getEncoder().encodeToString(salt) + "$" + Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Khong the hash mat khau admin", e);
        }
    }

    private String slug(String s) {
        String lower = s.toLowerCase().replace(" ", "-");
        return lower.replaceAll("[^a-z0-9-]", "");
    }
}
