# PERMISSION.md — Roles & Guard Order

> ⚠️ Phải **sync với code thật** (model `Role` + seed + guard). Khi chưa có code: nguồn tham chiếu là
> `project-ecommerce/03-requirements.md` (BR-AUTH-011/012, BR-SELL-*), `06-api-contract.md` và
> `PRODUCT_BACKLOG_ROADMAP.md` (bản 2026-10-06). Khi code khác file này → **code thắng**, cập nhật lại.
> Nếu lệch → đọc seed/quyền trong code + chạy `check_commands.docs_inventory`, rồi cập nhật file này.

## Roles

| Role | Mô tả | Nguồn (code) |
|------|-------|--------------|
| `customer` | Người dùng thường; vừa mua vừa **có thể bán** nếu đã thiết lập gian hàng | enum `UserRole` (`07-tech-conventions.md`); public register luôn `customer` |
| `admin` | Quản trị sàn; **chỉ kiểm duyệt**, không mua, không đăng bán | seed script (`ADMIN_EMAIL`/`ADMIN_PASSWORD`) — BR-AUTH-004 |
| _(Guest)_ | Không phải role — chưa đăng nhập, không token | không có document trong `users` |
| _(Seller)_ | **Không phải role** — Customer đang thao tác trên tài nguyên có `sellerId = user.id` | `product.sellerId` / `order.sellerId` |

> **Seller không có enum riêng.** `UserRole = { CUSTOMER, ADMIN }` (xem `project-ecommerce/07-tech-conventions.md`).

## Guard order (thứ tự middleware trên route)

> Thứ tự quan trọng. **Trạng thái wire thực tế:** `ThrottlerGuard` **và** `JwtAuthGuard` đăng ký toàn cục (`APP_GUARD`) — `JwtAuthGuard` wire ở L1 task-01, tôn trọng `@Public()` (route public bypass). `OptionalJwtAuthGuard` dùng ở route public-optional; `RolesGuard`/ownership **áp dụng route-level khi route tương ứng được thêm (L1+)** (chưa wire global). Thứ tự hiệu lực hiện tại: throttle (global) → auth (global, trừ `@Public()`) → role → ownership → handler.

1. `ThrottlerGuard` (global `APP_GUARD`) — rate limit (mặc định 100 req/phút); nhóm `/auth/*` siết qua decorator `@Throttle` (10 req/phút/IP).
2. `JwtAuthGuard` / `OptionalJwtAuthGuard` — verify token, gắn `req.user` (thiếu/sai → 401). `JwtStrategy.validate` đọc `isActive` từ DB mỗi request (BR-AUTH-009) → user bị ban bị từ chối **ngay** (403) dù token còn hạn.
3. `RolesGuard` + `@Roles(ADMIN)` — check role (thiếu quyền → 403). Dùng cho `/admin/*` và CRUD category.
4. `assertOwnerOrAdmin()` ở service — BOLA/IDOR: tài nguyên phải thuộc `req.user` (hoặc admin) — `skills/security/bola-idor.md`.
   - Endpoint **ghi** (`PATCH/DELETE /products/:id`, `PATCH /orders/:id/status`) trên tài nguyên có thật nhưng sai chủ → **403**.
   - Endpoint **đọc** theo "của tôi" (`/orders/my/:id`, `/orders/selling/:id`) lọc owner trong query → không phải của mình → **404** (không lộ tồn tại).
5. handler — `ValidationPipe({ whitelist, forbidNonWhitelisted, transform })` toàn cục (chống mass assignment: `role`, `isActive`, `sellerId`, `isBlocked`, `slug`, `blockReason` không nhận từ body).

## Route ↔ permission matrix

> Điền từ `project-ecommerce/06-api-contract.md` + roadmap. Đây là bảng **overview** để review, không phải nguồn thực thi.
> Ký hiệu Auth: ❌ public · ⚪ Optional (có token → Customer, không → Guest) · ✅ Login · ✅ Admin.

| Route | Method | Auth | Role | Ownership | Ghi chú |
|-------|--------|------|------|-----------|---------|
| `/auth/register` | POST | ❌ | — | — | throttle |
| `/auth/login` | POST | ❌ | — | — | throttle; ban → 403 |
| `/auth/refresh` | POST | ❌ | — | — | verify refresh token hash |
| `/auth/logout` | POST | ✅ Login | — | self | xóa refresh token |
| `/users/me` | GET/PATCH | ✅ Login | — | self | |
| `/users/me/shop` | PATCH | ✅ Login | — | self | |
| `/shops/:sellerId` | GET | ❌ | — | — | 404 nếu chưa có shop / bị ban |
| `/categories` | GET | ❌ | — | — | |
| `/categories/:id` | GET | ❌ | — | — | |
| `/categories` | POST | ✅ Admin | ADMIN | — | tên unique → 409 |
| `/categories/:id` | PATCH/DELETE | ✅ Admin | ADMIN | — | xóa khi còn SP → 400 |
| `/products` | GET | ❌ | — | — | chỉ `isActive && !isBlocked` |
| `/products/my` | GET | ✅ Login | — | self | gồm ẩn/bị block + `blockReason` |
| `/products/:id` | GET | ⚪ Optional | — | owner xem SP ẩn/block, else 404 | |
| `/products` | POST | ✅ Login | — | `sellerId`=token | chưa có shop → 403; **Admin không đăng bán** (BR-AUTH-011) |
| `/products/:id` | PATCH | ✅ Login + Owner | — | self hoặc ADMIN | sai chủ → 403 |
| `/products/:id` | DELETE | ✅ Login + Owner | — | self hoặc ADMIN | soft delete `isActive=false` |
| `/upload/image` | POST | ✅ Login | — | — | jpg/png/webp ≤5MB |
| `/cart` | GET | ✅ Login | — | self | Admin → 403 (BR-AUTH-011) |
| `/cart/items` | POST | ✅ Login | — | self | Admin → 403; SP của mình → 400 |
| `/cart/items/:productId` | PATCH/DELETE | ✅ Login | — | self | Admin → 403 |
| `/cart` | DELETE | ✅ Login | — | self | xóa toàn bộ giỏ |
| `/orders` | POST | ✅ Login | — | self | Admin → 403; **không Guest checkout** (BR-AUTH-012) |
| `/orders/my` | GET | ✅ Login | — | self | lọc `userId` |
| `/orders/my/:id` | GET | ✅ Login | — | self | sai chủ → 404 |
| `/orders/selling` | GET | ✅ Login | — | self (sellerId) | |
| `/orders/selling/:id` | GET | ✅ Login | — | self (sellerId) | sai chủ → 404 |
| `/orders` | GET | ✅ Admin | ADMIN | — | lọc `status/sellerId/userId` |
| `/orders/:id` | GET | ✅ Admin | ADMIN | — | |
| `/orders/:id/status` | PATCH | ✅ Login + Owner | Seller của đơn hoặc ADMIN | sai chủ → 403 | `refunded` chỉ Admin; `pending/confirmed` không set tay → 400 |
| `/checkouts/:checkoutCode` | GET | ✅ Login | — | chủ Checkout | người khác → 404 |
| `/payments/vnpay/return` | GET | ❌ | — | — | verify checksum |
| `/payments/vnpay/ipn` | GET | ❌ | — | — | verify checksum |
| `/admin/users` | GET | ✅ Admin | ADMIN | — | |
| `/admin/users/:id/ban` | PATCH | ✅ Admin | ADMIN | — | không tự ban mình → 400; cascade block SP |
| `/admin/users/:id/unban` | PATCH | ✅ Admin | ADMIN | — | chỉ mở SP `blockReason=seller_banned` |
| `/admin/products` | GET | ✅ Admin | ADMIN | — | gồm ẩn/bị block |
| `/admin/products/:id/block` | PATCH | ✅ Admin | ADMIN | — | `reason` bắt buộc |
| `/admin/products/:id/unblock` | PATCH | ✅ Admin | ADMIN | — | |

## Ghi chú sync

- Khi thêm/sửa role hoặc guard → cập nhật file này **trong cùng task**.
- Không hardcode role string rải rác; dùng enum/hằng chung (`UserRole`).
- **Mâu thuẫn cần chốt**: `06-api-contract.md` đánh dấu `POST /orders` là `⚪ Optional (Guest + Customer)` và còn mô tả cart Guest/`/cart/merge`; `BR-AUTH-012` (mới) chốt **không Guest cart/checkout/merge**. File này theo BR-AUTH-012 (login bắt buộc).
- **Mâu thuẫn cần chốt**: `BR-PRD-007` nói Admin được tạo SP; `BR-AUTH-011` nói Admin `POST /products` → 403. File này theo BR-AUTH-011.
