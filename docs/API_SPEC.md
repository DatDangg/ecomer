# API Specification — Overview & Pointers

> ⚠️ **Không nhúng code/schema tay ở đây** — sẽ lệch với code thật.
> File này là **overview + pointer** tới source of truth.

## Source of truth (theo thứ tự ưu tiên)

1. **Code thật** — route/controller/validation trong `source_roots` (xem `.context/project-config.md`).
   _Layer 0 đã scaffold `backend/` (NestJS) + `frontend/` (Vite/React); các endpoint nghiệp vụ build dần ở Layer 1+ (auth, product, cart, order, payment, admin)._
2. **Contract chi tiết** — `project-ecommerce/06-api-contract.md` (request/response mẫu, query params, lỗi).
3. **Shared contract types** — `src/shared/types/api.ts` (client & server cùng import). _Chưa tồn tại._
4. **Generated inventory** — `docs/generated/` (tạo bằng `check_commands.docs_inventory`; chỉ chạy lại, không sửa tay).
5. **OpenAPI/Swagger** (nếu có) — file do tooling sinh, không sửa tay.

> Nếu overview này khác code → **code thắng**. Cập nhật overview hoặc chạy lại inventory.

## Base URL

```
Development: http://localhost:3000/api/v1
Production:  https://<backend-domain>/api/v1   (Render, ví dụ https://<service>.onrender.com/api/v1)
```

> **Versioning bắt buộc** — mọi endpoint prefix `/api/v1/`. Frontend đọc base URL từ biến `VITE_*` (đổi giá trị phải redeploy).

## Authentication

`Authorization: Bearer <access_token>` — access token TTL **15 phút**, refresh token TTL **7 ngày**.

- `JwtStrategy.validate` đọc `isActive` từ DB mỗi request → user bị ban bị chặn **ngay** (403), kể cả token còn hạn (BR-AUTH-009).
- `refreshToken` lưu **hash SHA-256** trong `users` (mỗi user 1 token; đăng nhập thiết bị mới vô hiệu hóa token cũ) — BR-AUTH-010.
- Chi tiết hardening: `skills/security/jwt-security.md`.

## Response contract (bất biến)

Mọi response đi qua helper chung `ok()` / `fail()` (không viết tay `res.json()`):

```typescript
// Success
{ "success": true, "data": <payload>, "message": "..." }

// Paginated list — data là object
{ "success": true, "data": { "items": [...], "total": 100, "page": 1, "limit": 20, "totalPages": 5 } }

// Error
{ "success": false, "message": "<message>", "errors": [ ... ] }   // errors optional, validation
```

> Nguồn shape: `project-ecommerce/06-api-contract.md`. Template gốc ghi `error/details` — đã thống nhất theo `06` (`message/errors`).

## Endpoint overview

> Bảng dưới chỉ liệt kê **nhóm endpoint**. Request/response chi tiết lấy từ `project-ecommerce/06-api-contract.md`.
> Auth: ❌ public · ⚪ Optional · ✅ Login · ✅ Admin.

| Nhóm | Prefix | Ví dụ | Auth | Ghi chú |
|------|--------|-------|------|---------|
| Auth | `/auth` | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` | ❌ / ✅ | rate-limit chặt (`skills/security/*`) |
| User & Shop | `/users`, `/shops` | `GET/PATCH /users/me`, `PATCH /users/me/shop`, `GET /shops/:sellerId` | ✅ / ❌ | `:sellerId` public |
| Category | `/categories` | `GET /categories`, `POST/PATCH/DELETE /categories/:id` | ❌ / ✅ Admin | tên unique; không xóa khi còn SP |
| Product | `/products` | `GET /products`, `GET /products/my`, `GET/PATCH/DELETE /products/:id`, `POST /products` | ❌ / ✅ Login / Owner | route `/my` khai báo **trước** `/:id`; chỉ trả `isActive && !isBlocked` khi public |
| Upload | `/upload` | `POST /upload/image` | ✅ Login | Cloudinary; jpg/png/webp ≤5MB |
| Cart | `/cart` | `GET /cart`, `POST /cart/items`, `PATCH/DELETE /cart/items/:productId`, `DELETE /cart` | ✅ Login | **chỉ user đăng nhập**; Admin → 403; không Guest cart/merge (BR-AUTH-012) |
| Order & Checkout | `/orders`, `/checkouts` | `POST /orders`, `GET /orders/my`, `GET /orders/my/:id`, `GET /orders/selling`, `GET /orders/selling/:id`, `GET /orders`, `GET /orders/:id`, `PATCH /orders/:id/status`, `GET /checkouts/:checkoutCode` | ✅ Login / Owner / Admin | khai báo `/my`, `/selling` **trước** `/:id` |
| Payment | `/payments/vnpay` | `GET /payments/vnpay/return`, `GET /payments/vnpay/ipn` | ❌ | VNPay gọi; verify HMAC-SHA512 |
| Admin | `/admin` | `GET /admin/users`, `PATCH /admin/users/:id/ban|unban`, `GET /admin/products`, `PATCH /admin/products/:id/block|unblock` | ✅ Admin | ban cascade block SP |

## Error codes

| Code | Meaning |
|------|---------|
| 200/201 | OK / Created |
| 400 | Bad Request — validation failed, chuyển trạng thái sai, hết hàng, mua SP của mình |
| 401 | Unauthorized — missing/invalid/expired token |
| 403 | Forbidden — thiếu quyền, sai chủ (endpoint ghi), chưa thiết lập shop, tài khoản bị ban, Admin mua/bán |
| 404 | Not Found — không tồn tại, hoặc tài nguyên "của tôi" của người khác (không lộ tồn tại) |
| 409 | Conflict — email/category trùng |
| 429 | Too Many Requests — rate limited |
| 500 | Internal Server Error |

## Rate limiting (policy)

- Auth endpoints: **10 req/phút/IP** (`@nestjs/throttler`, chống dò mật khẩu).
- API endpoints: 100 req/phút/user (mục tiêu).
- Phân trang: `limit` tối đa **100** ở mọi endpoint danh sách.

## Webhooks (VNPay)

> Payload shape lấy từ code publisher, không copy tay vào đây.

- `GET /api/v1/payments/vnpay/ipn` — VNPay gọi server-to-server (**method GET**); trả JSON `{ "RspCode": "00", "Message": "..." }`.
  - `00` xử lý thành công · `01` không tìm thấy `vnp_TxnRef` · `02` checkout đã xử lý (idempotent) · `04` số tiền không khớp · `97` sai chữ ký · `99` lỗi khác.
- `GET /api/v1/payments/vnpay/return` — redirect trình duyệt về `FRONTEND_URL/checkout/result?checkoutCode=...&status=success|failed`.
- IPN và Return dùng **chung một hàm xử lý idempotent** (verify checksum → cập nhật Checkout có điều kiện → cập nhật Order con trong 1 transaction). FE **không tin** `status` trên URL, luôn gọi `GET /checkouts/:checkoutCode`.

## Pointer chi tiết

| Nội dung | File |
|----------|------|
| Request/response mẫu, query params, mã lỗi, RspCode | `project-ecommerce/06-api-contract.md` |
| Quyền theo endpoint (guard/ownership) | `docs/PERMISSION.md` |
| Business rules đằng sau API (BR-XXX) | `project-ecommerce/03-requirements.md` |
| Enum trạng thái (Order/Checkout/Payment) | `project-ecommerce/07-tech-conventions.md` |
