# DESIGN.md — DryFood visual world

<!-- impeccable:design-schema 1 -->

## World

**Fresh Market (chợ thực phẩm tươi)**: một cửa hàng thực phẩm khô đáng tin cậy, sạch sẽ, gần gũi. Không phải siêu thị lạnh lẽo, không phải brand hàng hiệu xa xỉ: là nơi người Việt mua đồ khô, hạt và trái cây sấy cho bữa ăn mỗi ngày.

- **Persuade surfaces** (storefront, auth): warm premium-consumer với xanh rừng + bone + amber, typography đậm, hình ảnh thật.
- **Operate surfaces** (admin): cùng palette nhưng density cao hơn, bảng rõ ràng, icon hệ thống.

## Palette

- **Forest** (xanh rừng) — chủ đạo, từ `--color-forest-950` (sidebar, announce bar) đến `--color-forest-100` (chip active bg).
- **Bone** (ngà) — nền `--color-bone-50`, raised `#ffffff`, line `#e2dccb`.
- **Amber** (mật ong) — **một accent duy nhất** `#c98a2b` (CTA hero, badge tồn kho thấp, active admin nav).
- **Status tokens**: success `#22703e`, warning `#8a5b12`, danger `#b3261e` (kèm bg nhạt) — dùng cho trạng thái đơn/khỏ, không thêm màu trang trí.

## Type

- **Be Vietnam Pro** self-hosted (400–800): tối ưu tiếng Việt, giữ nguyên từ trước.
- Display: `display` class = `font-weight 800 · letter-spacing -0.03em · line-height 1.1 · text-wrap balance`. Không dùng Inter, không dùng serif.
- Body: 14–16px, measure ≤ 65ch, `line-height 1.6`.

## Shape & depth

- Radius: card 14px (`--radius-card`), control 10px (`--radius-control`), pill chỉ cho chip/badge. Một hệ thống, không pha trộn.
- Shadow: `--shadow-lift` (10px offset 30px blur) và `--shadow-pop` (18px/40px) — tinted theo ink, không shadow đen.
- Rows trong bảng: `hairline` (border-top 1px) thay vì border-t + border-b trên từng hàng.

## Signature moments

1. **Store hero** — split-screen: message trái (display type, CTA amber), ảnh market thật phải, gradient scrim.
2. **Product card** — ảnh zoom nhẹ khi hover (`img-zoom`), ribbon trạng thái tồn kho (semantic), giá forest-800 to, nút thêm giỏ đầy đủ trạng thái (idle → added).
3. **Announcement bar** — value prop thật, không claim bịa.
4. **Cart drawer** — progress bar miễn phí giao hàng (ngưỡng 200.000 ₫, con số có thật trong copy).
5. **Auth split-screen** — ảnh brand trái + form phải, demo account card rõ ràng.
6. **Admin sidebar** — forest-950, active state amber, topbar breadcrumb.

## Motion

- CSS transitions ngắn 180ms, `--ease-out-exp` cubic-bezier(0.16,1,0.3,1). Chỉ transform/opacity.
- `prefers-reduced-motion: reduce` → tắt toàn bộ (đã có trong index.css).

## States

- Loading: skeleton theo shape thật (product grid, detail).
- Empty: `EmptyState` có icon tròn + title + sub + action.
- Error: inline rose bg, text danger token.
- Focus: outline 2px forest-600, offset 2px.

## Icons

- **Phosphor** một family duy nhất, `weight` nhất quán (regular body, duotone stat icon, bold CTA). Không emoji, không SVG tay vẽ (trừ mark leaf 2 path đơn giản trong BrandMark).

## Accessibility baseline

- Contrast CTA ≥ 5:1 (đo thực tế: add-to-cart 10.25:1, hero amber 5.8:1).
- Label trên input, error dưới input. aria-label đầy đủ cho icon button. Role dialog cho modal/drawer.

## Not in this world

- Gradient text, glassmorphism trang trí, neubrutalist hard shadows, marquee, section numbering, eyebrow spam.
- Em-dash (—) và emoji trong UI.
