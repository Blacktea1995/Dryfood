package com.evomap.dryfood.service;

import com.evomap.dryfood.model.Order;
import com.evomap.dryfood.model.Product;
import com.evomap.dryfood.model.User;
import com.evomap.dryfood.repository.OrderRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.text.DecimalFormat;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Tro ly AI cua DryFood.
 *
 * <p>Hai tang:
 * 1) Tang quy tac (rule): tra san pham, tra cuu don hang cua chinh khach, FAQ
 *    giao hang/thanh toan - tren du lieu that, khong bao gio bia.
 * 2) Tang LLM (tu chon): neu bien moi truong OPENAI_API_KEY duoc dat, goi
 *    OpenAI de viet lai cau tra loi tu nhien - NHUNG chi duoc dung cac
 *    du kien tang 1 cung cap (products/order/ruleText), khong duoc phep bia
 *    them. Neu loi/het han/khong co key -> tu dong dung text cua tang quy tac.
 */
@Service
public class AssistantService {

    private static final Logger log = LoggerFactory.getLogger(AssistantService.class);
    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final Pattern ORDER_CODE = Pattern.compile("(?:DH|dh)?\\s*([0-9]{8,})");

    // OpenAI: key doc tu bien moi truong (KHONG commit vao repo), model cau hinh duoc
    private static final String OPENAI_KEY = System.getenv("OPENAI_API_KEY");
    private static final String OPENAI_MODEL = System.getenv("OPENAI_MODEL") == null
            ? "gpt-4o-mini" : System.getenv("OPENAI_MODEL");
    private static final boolean LLM_ENABLED = OPENAI_KEY != null && !OPENAI_KEY.isBlank();
    private static final String OPENAI_URL = "https://api.openai.com/v1/chat/completions";
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5)).build();

    private final ProductService productService;
    private final OrderRepository orderRepository;

    public AssistantService(ProductService productService, OrderRepository orderRepository) {
        this.productService = productService;
        this.orderRepository = orderRepository;
    }

    public record ProductHit(Long id, String name, Double price, String unit, Integer stock, String imageUrl, String category) {
    }

    public record OrderHit(String orderCode, String status, String statusLabel, Double totalAmount,
                           String createdAt, int itemCount, List<String> items) {
    }

    public record Reply(String text, List<ProductHit> products, OrderHit order, List<String> quickReplies) {
    }

    public Reply answer(String q, User user) {
        if (q == null || q.isBlank()) {
            return new Reply("Bạn muốn hỏi gì về cửa hàng DryFood? Tôi có thể tìm sản phẩm, tra cứu đơn hàng, hoặc giải đáp về giao hàng và thanh toán.",
                    List.of(), null, quickPrompts());
        }
        String lower = normalize(q);

        // 1) Tra cuu don hang theo ma
        if (isOrderLookup(lower)) {
            Reply r = orderAnswer(q, user);
            return polish(r, q, user);
        }

        // 2) FAQ: giao hang / thanh toan / ho tro
        String faq = faqAnswer(lower);
        if (faq != null) {
            return polish(new Reply(faq, List.of(), null, quickPrompts()), q, user);
        }

        // 3) Tra san pham theo tu khoa
        String query = stripQuestionWords(lower);
        List<Product> found = query.isBlank() ? List.of() : productService.search(query).stream().limit(5).toList();
        if (!found.isEmpty()) {
            String text;
            if (found.size() == 1) {
                Product p = found.get(0);
                text = "Tôi tìm thấy: " + p.getName() + " - " + fmt(p.getPrice()) + " ₫/" + p.getUnit()
                        + " (" + (p.getStock() > 0 ? "còn " + p.getStock() + " " + p.getUnit() : "hết hàng") + "). "
                        + "Bạn có thể mở chi tiết sản phẩm hoặc thêm vào giỏ ngay trên trang.";
            } else {
                text = "Tôi tìm được " + found.size() + " sản phẩm phù hợp với '" + query + "'. Bạn tham khảo danh sách bên dưới nhé:";
            }
            return polish(new Reply(text, found.stream().map(this::hit).toList(), null, quickPrompts()), q, user);
        }

        // 4) Khong hieu
        return polish(new Reply(
                "Tôi chưa hiểu rõ câu hỏi '" + q + "'. Bạn có thể hỏi tôi về: tìm sản phẩm theo tên (ví dụ 'mì gói', 'hạt điều'), tra cứu đơn hàng theo mã, hoặc chính sách giao hàng và thanh toán. Nếu cần hỗ trợ thêm, hãy liên hệ qua trang Hồ sơ hoặc đơn hàng của bạn.",
                List.of(), null, quickPrompts()), q, user);
    }

    /**
     * Tang LLM (tu chon): goi OpenAI viet lai loi van tu nhien, chi dung cac du kien
     * co san trong Reply (text, products, order). Loi/khong co key -> giu nguyen rule text.
     */
    private Reply polish(Reply r, String q, User user) {
        if (!LLM_ENABLED) return r;
        try {
            String ruleText = r.text();
            String facts = "Câu hỏi khách: " + q + "\n"
                    + "Thông tin tra cứu được từ hệ thống (KHÔNG được phép bịa thêm, chỉ diễn đạt lại):\n"
                    + ruleText + "\n";
            if (r.products() != null && !r.products().isEmpty()) {
                facts = facts + "Sản phẩm tìm thấy:\n";
                for (ProductHit p : r.products()) {
                    facts = facts + " - " + p.name() + ": " + fmt(p.price()) + " ₫/" + p.unit()
                            + (p.stock() > 0 ? " (còn " + p.stock() + " " + p.unit() + ")" : " (hết hàng)") + "\n";
                }
            }
            if (r.order() != null) {
                facts = facts + "Đơn hàng: mã " + r.order().orderCode()
                        + ", trạng thái " + r.order().statusLabel()
                        + ", tổng tiền " + fmt(r.order().totalAmount())
                        + " ₫, ngày đặt " + r.order().createdAt() + "\n";
            }
            String prompt = "Bạn là trợ lý AI của cửa hàng thực phẩm khô DryFood (tiếng Việt). "
                    + "Trả lời ngắn gọn, thân thiện, tối đa 3-4 câu, KHÔNG bịa thêm sản phẩm/giá/khuyến mãi nào ngoài dữ kiện được cung cấp. "
                    + "Nếu dữ kiện không đủ để trả lời, nói rõ điều đó.\n\n" + facts;
            String ai = callLLM(prompt);
            if (ai != null && !ai.isBlank()) {
                return new Reply(ai.trim(), r.products(), r.order(), r.quickReplies());
            }
        } catch (Exception e) {
            log.info("OpenAI fallback to rule: {}", e.getMessage());
        }
        return r;
    }

    private String callLLM(String prompt) throws Exception {
        // OpenAI chat completions
        ObjectNode body = JSON.createObjectNode();
        body.put("model", OPENAI_MODEL);
        ArrayNode messages = body.putArray("messages");
        ObjectNode system = messages.addObject();
        system.put("role", "system");
        system.put("content", "Bạn là trợ lý AI của cửa hàng thực phẩm khô DryFood. Trả lời ngắn gọn, thân thiện, tối đa 3-4 câu, bằng tiếng Việt. KHÔNG bịa thêm sản phẩm/giá/khuyến mãi nào ngoài dữ kiện được cung cấp. Nếu dữ kiện không đủ, nói rõ điều đó.");
        ObjectNode user = messages.addObject();
        user.put("role", "user");
        user.put("content", prompt);
        body.put("temperature", 0.4);
        body.put("max_tokens", 400);

        HttpRequest req = HttpRequest.newBuilder(URI.create(OPENAI_URL))
                .timeout(Duration.ofSeconds(15))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + OPENAI_KEY)
                .POST(HttpRequest.BodyPublishers.ofString(JSON.writeValueAsString(body)))
                .build();
        HttpResponse<String> res = HTTP.send(req, HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() != 200) {
            log.warn("OpenAI HTTP {}: {}", res.statusCode(), res.body().length() > 200 ? res.body().substring(0, 200) : res.body());
            return null;
        }
        JsonNode root = JSON.readTree(res.body());
        JsonNode text = root.path("choices").path(0).path("message").path("content");
        return text.isMissingNode() || text.isNull() ? null : text.asText();
    }

    private Reply orderAnswer(String raw, User user) {
        Matcher m = ORDER_CODE.matcher(raw.replaceAll("\\s", ""));
        if (!m.find()) {
            return new Reply("Bạn vui lòng gửi mã đơn hàng (ví dụ: DH20261009123456789000) để tôi tra cứu giúp.", List.of(), null, quickPrompts());
        }
        String code = "DH" + m.group(1);
        if (user == null) {
            return new Reply("Để tra cứu đơn hàng theo mã, bạn cần đăng nhập bằng tài khoản đã đặt đơn. Sau khi đăng nhập, gửi lại mã đơn cho tôi nhé. (Khách vẫn có thể xem sản phẩm và dùng các câu hỏi khác.)",
                    List.of(), null, List.of("Tìm mì gói", "Chính sách giao hàng", "Thanh toán như thế nào?"));
        }
        var opt = orderRepository.findByOrderCodeIgnoreCase(code);
        if (opt.isEmpty()) {
            return new Reply("Không tìm thấy đơn hàng mã " + code + ". Bạn kiểm tra lại mã đơn (thường bắt đầu bằng DH) hoặc xem danh sách đơn trong mục 'Đơn của tôi'.",
                    List.of(), null, quickPrompts());
        }
        Order o = opt.get();
        if (user.getRole() == User.Role.CUSTOMER && !user.getCustomerId().equals(o.getCustomer().getId())) {
            return new Reply("Đơn hàng " + code + " không thuộc tài khoản của bạn nên tôi không thể hiện thông tin. Nếu bạn nghĩ đây là nhầm lẫn, hãy liên hệ bộ phận chăm sóc khách hàng.",
                    List.of(), null, quickPrompts());
        }
        List<String> itemNames = o.getItems().stream()
                .map(it -> it.getProduct().getName() + " x" + it.getQuantity())
                .limit(5).toList();
        OrderHit hit = new OrderHit(
                o.getOrderCode(), o.getStatus().name(), statusLabel(o.getStatus().name()),
                o.getTotalAmount(), o.getCreatedAt().format(DT), o.getItems().size(), itemNames);
        String text = "Đơn hàng " + code + " của bạn: trạng thái " + statusLabel(o.getStatus().name())
                + ", tổng tiền " + fmt(o.getTotalAmount()) + " ₫, đặt lúc " + o.getCreatedAt().format(DT) + "."
                + (o.getDiscountAmount() != null && o.getDiscountAmount() > 0 ? " (đã giảm " + fmt(o.getDiscountAmount()) + " ₫)" : "")
                + " Bạn xem chi tiết trong mục 'Đơn của tôi' nhé.";
        return new Reply(text, List.of(), hit, quickPrompts());
    }

    private String faqAnswer(String lower) {
        if (lower.contains("giao hang") || lower.contains("van chuyen") || lower.contains("shipping")
                || lower.contains("bao lau") || lower.contains("mat bao lau") || lower.contains("khi nao nhan")) {
            return "DryFood giao hàng toàn quốc. Đơn được xác nhận trong ngày (giờ hành chính), thời gian giao thường 1-3 ngày với nội thành và 2-5 ngày với tỉnh xa. Chi tiết: xem 'Đơn của tôi' để theo dõi trạng thái, hoặc liên hệ cửa hàng nếu cần giao nhanh.";
        }
        if (lower.contains("thanh toan") || lower.contains("tra tien") || lower.contains("chuyen khoan")
                || lower.contains("cod") || lower.contains("tien mat")) {
            return "DryFood hỗ trợ 2 hình thức: 1) Thanh toán khi nhận hàng (COD) - trả tiền mặt cho người giao; 2) Chuyển khoản trước (TRANSFER) - tôi sẽ gửi thông tin tài khoản sau khi bạn đặt hàng. Bạn chọn hình thức ở bước xác nhận đơn hàng.";
        }
        if (lower.contains("doi tra") || lower.contains("tra hang") || lower.contains("hoan tien")) {
            return "Nếu sản phẩm bị lỗi hoặc giao không đúng, bạn liên hệ cửa hàng trong 7 ngày kể từ khi nhận hàng để được đổi/trả. Sản phẩm còn nguyên bao bì, chưa sử dụng sẽ được ưu tiên xử lý nhanh.";
        }
        if (lower.contains("khuyen mai") || lower.contains("voucher") || lower.contains("ma giam") || lower.contains("giam gia")) {
            return "Bạn có thể nhập mã giảm giá (voucher) ở bước xác nhận đơn hàng. Hệ thống sẽ kiểm tra mã và áp dụng giảm trực tiếp vào tổng tiền. Mã không hợp lệ hoặc chưa đủ điều kiện sẽ được thông báo ngay.";
        }
        if (lower.contains("lien he") || lower.contains("ho tro") || lower.contains("hotline") || lower.contains("email")) {
            return "Bạn có thể nhắn tin tại đây bất cứ lúc nào, hoặc dùng mục 'Hồ sơ' / 'Đơn của tôi' sau khi đăng nhập để cập nhật thông tin và theo dõi đơn hàng.";
        }
        if (lower.contains("dang nhap") || lower.contains("dang ky") || lower.contains("tao tai khoan") || lower.contains("mat khau")) {
            return "Khách có thể xem toàn bộ cửa hàng mà không cần đăng nhập. Khi cần đặt hàng, xem đơn hoặc cập nhật hồ sơ, bạn bấm nút 'Đăng nhập' ở góc phải trên và tạo tài khoản nhanh (hoặc đăng nhập nếu đã có).";
        }
        if (lower.contains("san pham") || lower.contains("gi do") || lower.contains("co gi") || lower.contains("ban gi")) {
            return "DryFood chuyên thực phẩm khô: mì - bún, hải sản khô, thịt khô, hạt - ăn vặt, trái cây khô và rau củ sấy. Bạn gõ tên món bạn muốn tìm, tôi sẽ liệt kê sản phẩm phù hợp.";
        }
        return null;
    }

    private List<String> quickPrompts() {
        return List.of("Tìm mì gói", "Tìm hạt điều", "Chính sách giao hàng", "Thanh toán như thế nào?");
    }

    private ProductHit hit(Product p) {
        return new ProductHit(p.getId(), p.getName(), p.getPrice(), p.getUnit(), p.getStock(),
                p.getImageUrl(), p.getCategory());
    }

    private static String normalize(String s) {
        String lower = s.toLowerCase(Locale.ROOT);
        String[] map = {
                "đ", "d", "ă", "a", "â", "a", "á", "a", "à", "a", "ả", "a", "ã", "a", "ạ", "a",
                "ắ", "a", "ằ", "a", "ẳ", "a", "ẵ", "a", "ặ", "a", "ấ", "a", "ầ", "a", "ẩ", "a", "ẫ", "a", "ậ", "a",
                "é", "e", "è", "e", "ẻ", "e", "ẽ", "e", "ẹ", "e", "ế", "e", "ề", "e", "ể", "e", "ễ", "e", "ệ", "e",
                "í", "i", "ì", "i", "ỉ", "i", "ĩ", "i", "ị", "i",
                "ó", "o", "ò", "o", "ỏ", "o", "õ", "o", "ọ", "o", "ố", "o", "ồ", "o", "ổ", "o", "ỗ", "o", "ộ", "o", "ớ", "o", "ờ", "o", "ở", "o", "ỡ", "o", "ợ", "o",
                "ú", "u", "ù", "u", "ủ", "u", "ũ", "u", "ụ", "u", "ứ", "u", "ừ", "u", "ử", "u", "ữ", "u", "ự", "u",
                "ý", "y", "ỳ", "y", "ỷ", "y", "ỹ", "y", "ỵ", "y",
                "ơ", "o", "ư", "u", "ê", "e", "ô", "o", "đ", "d"
        };
        for (int i = 0; i < map.length; i += 2) {
            lower = lower.replace(map[i], map[i + 1]);
        }
        return lower;
    }

    private static boolean isOrderLookup(String lower) {
        if (lower.contains("don hang") || lower.contains("don da dat") || lower.contains("kiem tra don")
                || lower.contains("tra cuu don") || lower.contains("don cua toi")) {
            return true;
        }
        return lower.contains("dh") && lower.matches(".*dh\\s*[0-9]{8,}.*");
    }

    private static String stripQuestionWords(String lower) {
        for (String w : List.of("tim", "tim kiem", "co", "ban", "cho toi", "hien thi", "muon mua", "gia bao nhieu",
                "gia", "bao nhieu", "sản pham", "san pham", "nao", "gi", "ve", "cua", "moi", "neu co", "xin")) {
            lower = lower.replace(w + " ", "");
        }
        return lower.replace("?", "").replace("  ", " ").trim();
    }

    private static String statusLabel(String status) {
        return switch (status) {
            case "PENDING" -> "Chờ xử lý";
            case "CONFIRMED" -> "Đã xác nhận";
            case "SHIPPING" -> "Đang giao";
            case "DELIVERED" -> "Đã giao";
            case "CANCELLED" -> "Đã huỷ";
            default -> status;
        };
    }

    private static String fmt(Double v) {
        return new DecimalFormat("#,##0").format(v == null ? 0 : v);
    }
}