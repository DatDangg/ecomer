---
spec_version: 1.0.0
updated_at: 2026-10-06
source: docs-first — reverse-engineered from docs/BRD.md, docs/PRD.md, docs/ARCHITECTURE.md, docs/API_SPEC.md, docs/ERD.md, docs/PERMISSION.md, docs/USER_FLOW.md, docs/DESIGN.md + project-ecommerce/*
---

# SPECIFICATIONS.md

<!-- 
  File này được generate từ spec/docs (bootstrap docs-first). Thay đổi sau này đi qua `/change`
  (agent change-request) — KHÔNG chỉnh sửa thủ công.
-->

## Overview

**Project:** Ecommerce Team Project — sàn thương mại điện tử **nhiều người bán** (kiểu Shopee thu gọn), web-only.
**Bối cảnh:** bài test, deadline 1 tuần, team 2 người. Chỉ dùng dịch vụ free tier.
**Mục tiêu:** chứng minh mô hình multi-seller (1 lần checkout = N Order theo seller nhưng **1 giao dịch VNPay**),
quyền sở hữu tài nguyên theo `sellerId` (không có role `seller` riêng), và trừ/hoàn tồn kho nguyên tử trong transaction.

> Nguồn chi tiết: `docs/BRD.md` (intent), `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/USER_FLOW.md`.
> Mâu thuẫn doc đã biết → `docs/BRD.md` § Open Questions.

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Frontend | React 18 + Vite, TypeScript strict, Tailwind CSS + shadcn/ui, React Router v6, Zustand, TanStack Query, Axios, Formik + Yup, i18next (vi), Lucide, react-toastify |
| Backend | NestJS, Mongoose ODM, Passport JWT, class-validator/transformer, `@nestjs/schedule` (cron), Cloudinary SDK, multer, helmet, `@nestjs/throttler` |
| Database | MongoDB >= 7.x — **replica set bắt buộc** để dùng transaction |
| Auth | JWT access (15m) + refresh (7d, hash SHA-256 trong DB) |
| Payment | VNPay sandbox (HMAC-SHA512) |
| Storage | Cloudinary (ảnh SP/category, ≤5 ảnh) |
| Deploy | Vercel (FE) + Render (BE) + MongoDB Atlas M0 |
| Test | Jest (unit) + Playwright (E2E) |

Repo layout (monorepo, 2 project độc lập, không workspace): `backend/` (NestJS, npm) + `frontend/` (React+Vite, pnpm).

## Features

> Mỗi requirement `R-xx` ánh xạ tới FR trong `docs/BRD.md` + Epic/User Story trong `PRODUCT_BACKLOG_ROADMAP.md`.
> Trạng thái: repo **chưa có code** → tất cả backend/frontend là `planned` (dựng mới), trừ các mục đánh dấu.

### R-01 — Auth & User (FR-001, FR-002 · EPIC-01 · Must-Have)
- Đăng ký email + password (bcrypt), email unique; public register luôn `role = customer`.
- Đăng nhập trả access (15m) + refresh (7d) + user; refresh + logout; refresh token lưu **hash SHA-256** (1 token/user).
- Ban hiệu lực ngay mỗi request (`JwtStrategy.validate` đọc `isActive`); Admin seed qua `ADMIN_EMAIL`/`ADMIN_PASSWORD` (không API gán role).
- AC: register 201 không trả password · trùng email 409 · sai password 401 · `isActive=false` → 403 "Tài khoản đã bị khóa" · refresh sai/hết hạn 401.
- _Nguồn: docs/BRD.md FR-001/002, docs/PERMISSION.md, project-ecommerce/03 (BR-AUTH-001..012)._

### R-02 — User & Shop (FR-010 · EPIC-08)
- `GET/PATCH /users/me` prefill checkout; `PATCH /users/me/shop` thiết lập `shopName` (3–50, không bắt buộc unique) + `pickupAddress`.
- `GET /shops/:sellerId` public trả `shopName`, `joinedAt`, `productCount`; 404 nếu chưa có shop hoặc bị ban.
- Chưa có shop → không đăng bán được (403).
- _Nguồn: docs/BRD.md FR-010, project-ecommerce/03 (BR-USR-001..004)._

### R-03 — Category (FR-020 · EPIC-02)
- Admin CRUD category; public xem danh sách active. Tên unique (409); `slug` tự sinh.
- Không xóa category còn SP (mọi shop) → 400.
- _Nguồn: docs/BRD.md FR-020, project-ecommerce/03 (BR-CAT-001..005)._

### R-04 — Product — Seller (FR-030 · EPIC-02)
- User có gian hàng đăng bán SP (giá nguyên dương VNĐ, stock ≥ 0, ≤5 ảnh Cloudinary, 1 category); `sellerId` gán từ token, **bất biến**.
- Chỉ sửa/xóa SP của mình (sai chủ 403); Admin thao tác mọi SP. DELETE = soft delete (`isActive=false`).
- AC: tên ≤120 · >5 ảnh 400 · ảnh phải là URL Cloudinary của app · chống mass assignment khi PATCH (`sellerId`, `slug`, `isBlocked`... không nhận từ body).
- _Nguồn: docs/BRD.md FR-030, project-ecommerce/03 (BR-PRD-001..013), BR-SELL-001..007._

### R-05 — Product — Public (FR-031 · EPIC-02)
- Xem/tìm/lọc/sắp xếp SP có phân trang; chỉ trả `isActive=true && isBlocked=false`.
- Filter `search/categoryId/sellerId/minPrice/maxPrice/sortBy/order`; `sortBy ∈ {price, createdAt, name}` + `order ∈ {asc, desc}` (mặc định `createdAt`/`desc`); `stock=0` badge "Hết hàng".
- Chi tiết SP ẩn/bị block → 404 trừ Owner/Admin. Route `/my` khai báo **trước** `/:id`.
- `GET /products/my` (login) trả SP của chính mình **gồm cả ẩn/bị block** kèm `blockReason`.
- _Nguồn: docs/BRD.md FR-031, docs/API_SPEC.md, docs/ERD.md, docs/PRD.md (F-PRD-02/03)._

### R-06 — Cart (FR-040 · EPIC-03)
- Giỏ DB **chỉ cho user đăng nhập**; nhóm theo người bán; Admin không mua (403); không Guest cart/merge (BR-AUTH-012).
- Không thêm SP của chính mình (400); item hết hàng/ẩn/bị block tự loại khi load.
- `GET /cart` trả `groups[]` + `totalAmount`; giá chỉ hiển thị, tính lại từ DB khi tạo Order.
- _Nguồn: docs/BRD.md FR-040, docs/USER_FLOW.md, docs/API_SPEC.md._

### R-07 — Order & Checkout (FR-050 · EPIC-04)
- `POST /orders` (login, Admin 403) → nhóm items theo `sellerId` → trừ stock nguyên tử (`stock >= qty`, `isActive`, `!isBlocked`) → tạo **1 Checkout + N Order** (mỗi seller 1 Order, đều `pending`) trong **1 MongoDB transaction**.
- All-or-nothing: 1 SP thiếu/hết/ẩn/block hoặc mua SP của mình → 400, không tạo gì, stock không đổi.
- `expiresAt = +30 phút`; response có `checkoutId`, `checkoutCode`, `totalAmount`, `expiresAt`, `orders[]`, `vnpayUrl`.
- _Nguồn: docs/BRD.md FR-050, docs/ERD.md, docs/USER_FLOW.md §4 (BR-CHK-001..010)._

### R-08 — Payment VNPay (FR-060 · EPIC-05)
- 1 giao dịch VNPay/checkout: `vnp_TxnRef = checkoutCode`, `vnp_Amount = totalAmount × 100`, `vnp_ExpireDate = expiresAt` (GMT+7).
- IPN (GET server-to-server) + Return (browser redirect) dùng **chung một hàm idempotent** (`findOneAndUpdate` theo `status: pending`, BR-PAY-011); verify HMAC-SHA512 + số tiền.
- Success → mọi Order con `confirmed` + `paid`, xóa item đã mua khỏi cart. Fail/timeout → mọi Order `cancelled` + hoàn stock (1 lần).
- RspCode 00/01/02/04/97/99; mọi callback (kể cả sai chữ ký) lưu `payments`; cron mỗi phút expire checkout pending > `expiresAt`; late success ghi `note = late_success_after_expiry`.
- _Nguồn: docs/BRD.md FR-060, docs/API_SPEC.md, project-ecommerce/03 (BR-PAY-001..011)._

### R-09 — Order Management (FR-070 · EPIC-04)
- Customer xem đơn mua `/orders/my` (+ `/:id`); nhóm hiển thị theo `checkoutCode`.
- Đơn người khác → 404 (không lộ tồn tại); Admin xem mọi đơn `GET /orders` (+ `/:id`) với filter `status/sellerId/userId`.
- _Nguồn: docs/BRD.md FR-070, docs/PERMISSION.md, docs/PRD.md (F-ORD-02, US-ORD-002)._

### R-13 — Upload ảnh (PRD F-PRD-03 · hỗ trợ R-04)
- `POST /upload/image` (login) — multipart field `file`; nhận `jpeg|png|webp` ≤ 5MB; trả `{ url }` (Cloudinary); SP gửi mảng `images[]` (≤5).
- Chỉ chấp nhận URL thuộc cloud của app (`https://res.cloudinary.com/<CLOUDINARY_CLOUD_NAME>/`).
- _Nguồn: docs/API_SPEC.md, docs/ARCHITECTURE.md §6.1, docs/PRD.md (F-PRD-03), BR-PRD-012._

### R-10 — Seller Order Fulfillment (FR-080 · EPIC-08)
- Seller xem đơn bán `/orders/selling` (+ `/:id`); Admin cập nhật mọi đơn.
- State machine: `confirmed→shipping`, `shipping→delivered`, `confirmed→cancelled` (reason bắt buộc); `cancelled→refunded` **chỉ Admin**, chỉ khi `paid`.
- Không set tay `pending/confirmed` → 400; sai chiều 400; sai chủ 403; hoàn stock đúng 1 lần.
- _Nguồn: docs/BRD.md FR-080, docs/USER_FLOW.md §3, project-ecommerce/03 (BR-STT-001..007)._

### R-11 — Admin (FR-090 · EPIC-06)
- Quản lý user: ban → `isActive=false` + cascade block toàn bộ SP (`blockReason=seller_banned`, **không ghi đè** lý do Admin có sẵn); unban chỉ mở lại SP `seller_banned`.
- Kiểm duyệt SP: block/unblock (reason bắt buộc). Admin không tự ban mình (400); không xóa order.
- Admin không mua (cart/checkout 403), không đăng bán (`POST /products` 403) — theo BR-AUTH-011.
- _Nguồn: docs/BRD.md FR-090, docs/PERMISSION.md, project-ecommerce/03 (BR-ADM-001..005)._

### R-12 — Go-Live (FR-100 · EPIC-07)
- Security hardening, deploy FE (Vercel) + BE (Render) + MongoDB Atlas M0, smoke test Playwright trên URL production.
- _Nguồn: docs/BRD.md FR-100, docs/ARCHITECTURE.md §9, project-ecommerce/10._

## Non-Functional Requirements

| Category | Requirement |
|----------|------------|
| Performance | API response mục tiêu < 500ms (trừ VNPay/Cloudinary); MongoDB index đầy đủ; phân trang `limit` tối đa 100. |
| Security | JWT (access 15m / refresh 7d); bcrypt; `ValidationPipe` whitelist + forbidNonWhitelisted toàn cục (chống mass assignment); helmet; throttle `/auth/*`; secrets qua `.env`; CORS chỉ `FRONTEND_URL`; VNPay verify checksum bắt buộc. |
| Correctness | Trừ/hoàn stock nguyên tử; checkout + rollback trong `session.withTransaction`; callback VNPay idempotent. |
| Data integrity | Snapshot giá/tên/ảnh/recipient/`sellerShopName` trong order; `sellerId` bất biến. |
| Availability | Best-effort trên Render free (chú ý service ngủ ~15 phút); cron bắt kịp khi thức. |
| Accessibility | WCAG 2.1 AA (mục tiêu frontend). |
| Responsive | Mobile-first 375 / 768 / 1280 (xem `skills/responsive-web/`). |
| Code quality (UI rules) | Tối đa 300 dòng/file, 50 dòng/function; TypeScript strict, hạn chế `any`; lucide-react cho icon. |
| i18n | Tiếng Việt / VNĐ (chỉ vi) — i18next. |

> Nguồn: `docs/BRD.md` § Non-Functional Requirements, `docs/PRD.md`, `BRIEF.md`.

## API Endpoints

> Base URL: `http://localhost:3000/api/v1` (dev) · `https://<backend-domain>/api/v1` (prod, Render).
> Mọi response đi qua helper chung `ok()` / `fail()` — contract bất biến:
> `{ success: true, data, message }` · paginated `data = { items, total, page, limit, totalPages }` · lỗi `{ success: false, message, errors? }`.
> Chi tiết request/response: `project-ecommerce/06-api-contract.md`. Ma trận quyền: `docs/PERMISSION.md`.

| Nhóm | Prefix | Endpoints (ví dụ) | Auth |
|------|--------|-------------------|------|
| Auth | `/auth` | `POST /register`, `POST /login`, `POST /refresh`, `POST /logout` | ❌ / ✅ |
| User & Shop | `/users`, `/shops` | `GET/PATCH /users/me`, `PATCH /users/me/shop`, `GET /shops/:sellerId` | ✅ / ❌ |
| Category | `/categories` | `GET /categories`, `GET /categories/:id`, `POST/PATCH/DELETE /categories/:id` | ❌ / ✅ Admin |
| Product | `/products` | `GET /products`, `GET /products/my`, `GET/PATCH/DELETE /products/:id`, `POST /products` | ❌ / ✅ Login / Owner |
| Upload | `/upload` | `POST /upload/image` | ✅ Login |
| Cart | `/cart` | `GET /cart`, `POST /cart/items`, `PATCH/DELETE /cart/items/:productId`, `DELETE /cart` | ✅ Login (Admin 403) |
| Order & Checkout | `/orders`, `/checkouts` | `POST /orders`, `GET /orders/my[/:id]`, `GET /orders/selling[/:id]`, `GET /orders[/:id]`, `PATCH /orders/:id/status`, `GET /checkouts/:checkoutCode` | ✅ Login / Owner / Admin |
| Payment | `/payments/vnpay` | `GET /return`, `GET /ipn` | ❌ (VNPay gọi) |
| Admin | `/admin` | `GET /admin/users`, `PATCH /admin/users/:id/ban\|unban`, `GET /admin/products`, `PATCH /admin/products/:id/block\|unblock` | ✅ Admin |

**Error codes:** 200/201 · 400 (validation/hết hàng/sai state/mua SP của mình) · 401 (token) · 403 (quyền/sai chủ/chưa có shop/bị ban/Admin mua-bán) · 404 (không tồn tại hoặc "của tôi" của người khác) · 409 (email/category trùng) · 429 (rate limited) · 500.
**Rate limit:** `/auth/*` 10 req/phút/IP; API ~100 req/phút/user; `limit` phân trang tối đa 100.
**Health check (deploy gate):** `GET /api/v1/categories` → 200 xác nhận BE up + DB kết nối (roadmap US-DEPLOY-03).

## Database Schema

**Type:** MongoDB >= 7.x (replica set bắt buộc cho transaction) · **ORM:** Mongoose · **Migration:** không dùng migration versioned (schema-less).
Chi tiết field/enum: `project-ecommerce/05-database-erd.md`. Overview + index: `docs/ERD.md`.

| Collection | Mục đích | Quan hệ chính |
|------------|----------|---------------|
| `users` | Tài khoản — 2 vai (mua & bán qua `shopName`/`pickupAddress`); enum `UserRole = { customer, admin }` | 1–1 `carts`; 1–n `products` (sellerId); 1–n `orders` (userId/sellerId); 1–n `checkouts` |
| `categories` | Danh mục SP dùng chung; `slug` unique | 1–n `products` |
| `products` | SP vật lý 1 người bán (`sellerId` bất biến); `isActive`/`isBlocked` tách biệt | belongs to `users` (seller) + `categories`; snapshot vào `orders.items` |
| `carts` | Giỏ user đăng nhập (1 user 1 cart) | belongs to `users`; ref `products` |
| `checkouts` | 1 lần đặt hàng = 1 giao dịch VNPay; gom N order; `checkoutCode` unique | belongs to `users`; 1–n `orders`; 1–n `payments` |
| `orders` | Mỗi order đúng 1 người bán; `items` embedded snapshot | belongs to `checkouts`, `users` (buyer/seller) |
| `payments` | Raw log callback VNPay (kể cả sai chữ ký/muộn) | belongs to `checkouts` (nullable) |

**Rules dữ liệu:** hiển thị công khai `isActive && !isBlocked`; không xóa Order (chỉ đổi trạng thái, `delivered`/`refunded` là cuối); snapshot giá/tên/ảnh/recipient/`sellerShopName`; atomic stock qua `updateOne({ _id, stock: { $gte: qty }, isActive: true, isBlocked: false }, { $inc: { stock: -qty } })`; `createCheckout` + `restockAndCancel` trong `session.withTransaction`; idempotent checkout bằng `findOneAndUpdate({ _id, status: 'pending' }, ...)` dùng chung IPN/Return/cron.
**Index chính:** `users.email` unique · `categories.slug` unique · `products.slug` unique · `products.sellerId/categoryId/name(text)/price` + compound `{isActive,isBlocked}` · `checkouts.checkoutCode` unique + compound `{status,expiresAt}` · `orders.orderCode` unique + `orders.checkoutId/userId/sellerId/status/createdAt` + compound `{sellerId,createdAt}`, `{userId,createdAt}`.

## Authentication

- **JWT:** access TTL **15 phút**, refresh TTL **7 ngày**; refresh token lưu **hash SHA-256** trong `users` (1 token/user — đăng nhập thiết bị mới vô hiệu hóa token cũ).
- `Authorization: Bearer <access_token>`; `JwtStrategy.validate` đọc `isActive` từ DB mỗi request → ban hiệu lực **ngay** (403) dù token còn hạn.
- **Roles:** `customer` (public register mặc định; bán khi có `shopName`), `admin` (seed only). Guest không phải role. Seller không phải role riêng — xác định bằng `sellerId = user.id`.
- **Guard order:** `JwtAuthGuard`/`OptionalJwtAuthGuard` → `RolesGuard` → `assertOwnerOrAdmin()` (ghi sai chủ 403; đọc "của tôi" sai chủ 404) → `@nestjs/throttler` → handler.
- **Hardening:** bcrypt; `ValidationPipe({ whitelist, forbidNonWhitelisted, transform })` toàn cục (chặn mass assignment `role/isActive/sellerId/isBlocked/slug/blockReason`); helmet; throttle `/auth/*`; CORS chỉ `FRONTEND_URL`; VNPay verify HMAC-SHA512 bắt buộc.

## Scalability Profile (OPTIONAL — chỉ khi user bật Scalability Option)

- **Scalability Option:** off
- **Tier:** —
- **CCU dự kiến:** —
- **Peak RPS ước tính:** —
- **Tỉ lệ đọc/ghi:** —
- **Peak/off-peak chênh lệch:** —
- **Tăng trưởng 6–12 tháng:** —
- **Availability (SLA):** best-effort (Render free ngủ ~15 phút)
- **Recovery (RTO/RPO):** —

> Không bật → đi theo mặc định đơn giản: modular monolith NestJS + stateless + MongoDB Atlas M0.

## Deployment

```
Browser → Vercel (FE static, vercel.json SPA rewrite)
        → Render Web Service (BE NestJS, nghe process.env.PORT trên 0.0.0.0)
        → MongoDB Atlas M0 (replica set)
VNPay → Return/IPN URL public của Render
```

- BE build `npm install --include=dev && npm run build`; start `npm run start:prod`.
- FE `VITE_API_URL` nhúng lúc build → đổi phải redeploy.
- Không CI/CD, không Docker, không domain riêng (bài test free tier). Chi tiết: `project-ecommerce/10-deployment.md`, `docs/ARCHITECTURE.md §9`.

---

*Generated by: /spec-init (docs-first — reverse-engineer từ docs canonical)*
*Validated by: .agent/spec-validator.md*
