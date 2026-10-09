# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two first-class audiences, both confirmed as equally important:

- **Shop owner / administrator** — runs the day-to-day business: manages products, customers, orders and voucher promotions, and reviews analytics (revenue, demand forecast, churn risk, RFM segments, recommendations).
- **Customer** — a Vietnamese shopper browsing a dried-food storefront, reading product details and reviews, building a cart, checking out, and tracking their own orders and profile.

## Product Purpose

DryFood is a complete dried-food e-commerce system: a customer storefront plus an administrator back-office under one authentication. It is a **graduation / capstone project** (đồ án tốt nghiệp) demonstrating a full-stack commerce application. Success means a complete, coherent, demonstrable system covering the shopping loop (browse → detail → cart → checkout → track) and the operations loop (catalog → orders → vouchers → analytics) end-to-end.

## Positioning

A self-contained e-commerce system notable for pairing a customer storefront with a working analytics/admin layer (demand forecasting, churn risk, RFM segmentation) in a single project — more than a static storefront, and a stronger demonstration of business intelligence than a typical coursework commerce app.

## Operating Context

- The UI is authored in **Vietnamese** (shop, admin, and auth flows). `index.html` declares `lang="vi"`.
- Customer storefront routes: `/store` (home/browse + search + category filter), `/store/product/:id` (detail + reviews), checkout, my orders, profile — plus a cart drawer.
- Admin routes: `/admin` dashboard, products, customers, orders, vouchers, analytics.
- Auth: register/login, token-based (`df_token` in localStorage), role-gated (`ADMIN` vs `CUSTOMER` redirect from `/`).
- Seeded demo data: a seeded admin account (`admin@dryfood.vn`), seeded products/orders/customers. In-memory H2 database (no production persistence).

## Capabilities and Constraints

- **Confirmed capabilities:** product search + category filter; product detail with reviews; cart with drawer; checkout; customer order history; customer profile; admin product/customer/order/voucher management; dashboard; analytics (revenue points, demand forecast, churn-risk customers, RFM segmentation, top products).
- **Technical constraints:** React 18 + Vite + Tailwind CSS 4 frontend; Spring Boot 3 + JPA backend; H2 runtime database (demo data resets; not a long-term datastore); deployed as separate backend (render.yaml) and frontend (vercel.json) services. Currency displayed via `fmtVND` (VND formatting).
- **Undecided / assumptions:** no payment gateway, delivery partner, or real inventory/demand data — these are absent in the code and must not be fabricated. Any analytics claims are computed from demo data.

## Brand Commitments

- **Language is binding:** all customer- and admin-facing copy is Vietnamese and must remain so.
- **Visual world is committed (2026 redesign):** the "Fresh Market" world in `DESIGN.md` (forest + bone + amber, Be Vietnam Pro, Phosphor icons, hairline tables, split hero, product cards with stock ribbons) is the durable visual system. Keep the world; do not drift back to coarse default styling. Brand mark: leaf SVG + "DryFood / Thực phẩm khô" wordmark (no emoji, no favicon 🍜).
- **Anti-tells:** no em-dash, no emoji-as-icon, no decorative gradients/glassmorphism, one accent color only.

## Evidence on Hand

- Seeded data: `backend/.../config/DataSeeder.java` (admin account, demo products, orders, customers).
- Backend domain models and services in `backend/src/main/java/com/evomap/dryfood/` (Product, Order, Customer, Voucher, Review, analytics service classes).
- Frontend routes/pages in `frontend/src/` (`App.jsx`, `pages/*`, `store/*`).
- Deploy configs: `render.yaml` (backend), `frontend/vercel.json` (frontend).
- Product images and real photographs are **not present**; future visual work must not invent customer/order/revenue data, testimonials, or brand imagery not backed by these sources.

## Product Principles

1. **A single complete commerce loop.** The storefront must carry a shopper smoothly from browse to delivered order; the admin suite must carry the operator from catalog to insight.
2. **Both worlds, equally cared for.** Customer and admin are both first-class; neither is a shell beside the other.
3. **Truthful demo.** Everything shown is produced by the system from seeded data — no invented customers, revenue, or social proof.
4. **Vietnamese-first.** Every word a user reads on the surface is Vietnamese and natural, not a translated afterthought.
5. **The analytics layer is a differentiator.** The admin side's forecasting/churn/RFM depth is a product strength and should read as such, not as accidental extra tables.