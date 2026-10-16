# Deploy DryFood — hướng dẫn cấu hình

Tài liệu này liệt kê các biến môi trường (env vars) cần đặt trên Render/Vercel để backend + frontend chạy đúng trên cloud.

## 1. Backend (Render — web service `dryfood-backend`)

Vào **Render Dashboard → dryfood-backend → Environment → Add Environment Variable**.

### Bắt buộc — kết nối MySQL cloud (Aiven)

```env
SPRING_DATASOURCE_URL=jdbc:mysql://<host>:<port>/<dbname>?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Ho_Chi_Minh&sslMode=REQUIRED
SPRING_DATASOURCE_USERNAME=<user>
SPRING_DATASOURCE_PASSWORD=<password>
```

- Lấy 4 giá trị `<host>`, `<port>`, `<dbname>`, `<user>` + password từ **Aiven Console → service MySQL → Overview** (tab *Connection strings*).
- Aiven yêu cầu SSL nên dùng `sslMode=REQUIRED` (khác local đang `DISABLED`).
- `spring.jpa.hibernate.ddl-auto=update` (mặc định) sẽ tự tạo/cập nhật bảng lần đầu.

### Tùy chọn — OpenAI (trợ lý AI chatbox)

```env
OPENAI_API_KEY=sk-...
# OPENAI_MODEL=gpt-4o-mini   # tùy chọn, mặc định gpt-4o-mini
```

- **Không có key vẫn chạy bình thường:** chatbox tự fallback về trả lời theo quy tắc (rule) trên dữ liệu thật.
- Khi có key + credit, chatbox tự dùng AI thật, không cần đổi code.

### Ghi chú
- `server.port=${PORT:8080}` — Render tự set `PORT` (log cho thấy dùng `10000`), không cần cấu hình thêm.
- `healthCheckPath: /api/products` đã có trong `render.yaml` — endpoint public, không cần token.

## 2. Frontend (Vercel)

File `frontend/vercel.json` đã có rewrite:

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://dryfood-2.onrender.com/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- Nếu URL Render đổi (tên service khác), cập nhật `destination` cho khớp.
- Không cần env var nào trên Vercel; frontend gọi API qua rewrite `/api/*`.

## 3. Trình tự redeploy sau khi thay đổi

1. Đặt/sửa env vars trên Render → **Manual Deploy → Deploy latest commit** (hoặc *Clear build cache & deploy* nếu cần).
2. Chờ deploy xong → kiểm tra `https://<service>.onrender.com/api/products` trả 200.
3. Deploy frontend trên Vercel (import repo hoặc redeploy) — không cần đổi gì nếu URL backend giữ nguyên.

## 4. Kiểm tra nhanh sau deploy

- `curl https://<service>.onrender.com/api/products` → `200` + JSON danh sách sản phẩm.
- `curl "https://<service>.onrender.com/api/assistant/chat?q=tim+mi+goi"` → JSON có `text` + `products` (không cần đăng nhập).
- Frontend: mở URL Vercel → `/store` hiện cửa hàng, FAB trợ lý góc phải dưới hoạt động.

## 5. Local dev (tham khảo)

- MySQL local: `127.0.0.1:3306/dryfood`, user `dryfood`, mặc định không cần env (application.properties có sẵn giá trị fallback).
- Muốn chạy local với OpenAI: đặt env `OPENAI_API_KEY` trước khi `java -jar target/dryfood-1.0.0.jar`.
- **Không commit key vào repo** — luôn qua env vars.
