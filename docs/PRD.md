# Product Requirements Document (PRD)

> **Sản phẩm:** Ecommerce Team Project — sàn thương mại điện tử nhiều người bán (Shopee thu gọn)
> **Version:** 1.0 · **Ngày:** 2026-10-06 · **Owner:** Team (2 người) · **Deadline:** 1 tuần
> **Loại tài liệu:** Intent — chỉ đổi qua Change Request + user duyệt (`AGENTS.md` § Doc Impact).
> **Nguồn:** `project-ecommerce/01..10`, `PRODUCT_BACKLOG_ROADMAP.md` (2026-10-06 — bản mới nhất), `docs/BRD.md`, `docs/API_SPEC.md`, `docs/ERD.md`, `docs/PERMISSION.md`.
> Khi roadmap mâu thuẫn doc cũ trong `project-ecommerce/` → **roadmap thắng** (xem § 13. Open Questions).

---

## 1. Tổng quan sản phẩm

### 1.1 Vision
Một người dùng chỉ cần **một tài khoản** để vừa mua vừa bán. Sàn gom nhiều người bán, nhưng khi người mua thanh toán một lần cho giỏ hàng chứa nhiều shop, hệ thống tự **tách thành nhiều đơn** (mỗi shop một đơn) trong khi chỉ có **một giao dịch thanh toán**. Mỗi người bán chỉ nhìn thấy và xử lý đơn của mình.

### 1.2 Mục tiêu
- **G1:** Cho phép user đăng bán sản phẩm vật lý mà không cần role/KYC riêng — chỉ cần thiết lập gian hàng (`shopName` + `pickupAddress`).
- **G2:** Cho phép người mua đặt hàng nhiều shop, thanh toán một lần qua VNPay.
- **G3:** Quản lý tồn kho an toàn (không bán lố, rollback khi thanh toán thất bại/hết hạn).
- **G4:** Phân tách quyền rõ ràng: Seller chỉ thao tác tài nguyên của mình; Admin kiểm duyệt toàn sàn nhưng không mua/không bán.

### 1.3 Non-goals (trong MVP)
Xem § 11. Out of Scope.

### 1.4 Success Metrics
| Mã | Chỉ số | Mục tiêu |
|----|--------|----------|
| M1 | Happy path E2E | PASS trên URL deploy |
| M2 | AC Sprint 1 + 2 (Must-Have) | 100% đạt |
| M3 | Lỗi Blocker/Critical trước demo | 0 |
| M4 | Playwright smoke test | PASS |
| M5 | Thời gian go-live | ≤ 1 tuần |

---

## 2. Đối tượng người dùng & Personas

| Persona | Mô tả | Việc họ cần làm |
|---------|-------|-----------------|
| **Guest (Minh)** | Khách vãng lai, chưa có tài khoản | Xem SP, tìm kiếm, lọc, xem shop — **không mua** |
| **Buyer (Lan)** | Người mua đã đăng nhập | Thêm giỏ, checkout nhiều shop, thanh toán VNPay, xem lịch sử đơn |
| **Seller (Hùng)** | Buyer đã thiết lập shop | Đăng SP (ảnh Cloudinary), quản lý tồn kho, xử lý đơn bán (giao/hủy) |
| **Admin (Quản trị)** | Nhân viên sàn | Ban/unban user, block/unblock SP, quản lý category, giám sát mọi đơn |
| **System** | Hệ thống | Trừ/hoàn stock, xử lý VNPay callback, cron hết hạn checkout |

> **Không có persona "Seller" riêng ở tầng tài khoản** — Hùng chỉ là Lan đã có `shopName`. `UserRole = { customer, admin }`.

---

## 3. User Journey (tóm tắt)

### 3.1 Guest — chỉ xem
Vào trang chủ → xem/tìm/lọc SP → mở chi tiết SP/shop. Bấm "Thêm giỏ" → **redirect sang đăng nhập** (không có giỏ localStorage).

### 3.2 Buyer — mua hàng
Đăng ký/đăng nhập → thêm SP nhiều shop vào giỏ (nhóm theo shop) → checkout (prefill từ profile, sửa địa chỉ) → tạo Checkout + N Order → redirect VNPay → success: mọi Order `confirmed`; fail: mọi Order `cancelled` + hoàn stock → xem kết quả + lịch sử đơn mua.

### 3.3 Seller — bán hàng
Bấm "Đăng bán" → nếu chưa có shop → thiết lập gian hàng → "Sản phẩm của tôi" → thêm SP (≤5 ảnh) → SP hiển thị ngay → khi có đơn `confirmed` → Giao hàng (`shipping`) → Đã giao (`delivered`); hoặc Hủy + lý do (`cancelled`, hoàn stock).

### 3.4 Admin — kiểm duyệt
Đăng nhập admin → quản lý user (ban/unban, cascade block SP) → block/unblock SP vi phạm → quản lý category → xem/cập nhật mọi đơn (đặc biệt `cancelled → refunded` khi đã thanh toán).

---

## 4. Feature Requirements (chi tiết)

> Mỗi feature gồm: User Story · Priority · Depends-on · Acceptance Criteria · Edge cases · Screens.
> Trạng thái: `[x]` Done · `[/]` In Progress · `[ ]` To Do (theo roadmap).

---

### 4.1 EPIC-01 — Auth & User (Must-Have · P0 · Sprint 1)

#### F-AUTH-01 · Đăng ký tài khoản `[x]`
**User story:** Là khách, tôi muốn tạo tài khoản bằng email + mật khẩu để mua/bán.
- **API:** `POST /api/v1/auth/register`
- **AC:**
  - [ ] Body hợp lệ (email, password ≥8, fullName) → `201`, trả user **không có password**.
  - [ ] Email trùng → `409 Conflict`.
  - [ ] Password lưu bcrypt hash (không plain text).
  - [ ] Đăng ký công khai **luôn** `role = customer` (không có API gán admin — BR-AUTH-004).
  - [ ] FE hiển thị lỗi validate (email format, password min length).
- **Edge:** email hoa/thường (chuẩn hoá lowercase); khoảng trắng đầu/cuối.
- **Screens:** Đăng ký #1 (`02985eddb2fb4abc9abbbacc958c5125`)

#### F-AUTH-02 · Đăng nhập `[x]`
- **API:** `POST /api/v1/auth/login`
- **AC:**
  - [ ] Đúng credentials → `accessToken` + `refreshToken` + `user`.
  - [ ] Sai password → `401`.
  - [ ] `isActive = false` → `403 "Tài khoản đã bị khóa"`.
- **Screens:** Đăng nhập #1–#3 (`8aef…`, `09105…`, `768be…`)

#### F-AUTH-03 · Refresh token `[x]`
- **API:** `POST /api/v1/auth/refresh`
- **AC:**
  - [ ] Refresh hợp lệ → access token mới (15 phút).
  - [ ] Refresh hết hạn/sai → `401`.
  - [ ] FE axios interceptor tự refresh khi gặp `401` rồi retry request gốc; refresh fail → redirect login.
- **Note:** `refreshToken` lưu **hash SHA-256**, mỗi user 1 token; login thiết bị mới vô hiệu token cũ (BR-AUTH-010).

#### F-AUTH-04 · Đăng xuất `[x]`
- **API:** `POST /api/v1/auth/logout`
- **AC:** [ ] Xoá `refreshToken` trong DB; token cũ không dùng lại được.

---

### 4.2 EPIC-08 — Seller Profile & Gian hàng (Must-Have · P0 · Sprint 1)

#### F-SHOP-01 · Profile cá nhân `[x]`
- **API:** `GET /users/me`, `PATCH /users/me`
- **AC:**
  - [ ] `GET` trả profile + `shopName`/`pickupAddress` (null nếu chưa có).
  - [ ] `PATCH` cập nhật `fullName`, `phone`, `address` (dùng prefill checkout).
- **Screens:** Hồ sơ cá nhân #1–#5

#### F-SHOP-02 · Thiết lập gian hàng `[x]`
- **API:** `PATCH /users/me/shop`, `GET /shops/:sellerId`
- **AC:**
  - [ ] `shopName` 3–50 ký tự + `pickupAddress` hợp lệ → `200`; thiếu/sai độ dài → `400`.
  - [ ] `GET /shops/:sellerId` (public) trả `shopName`, `joinedAt`, `productCount`; `404` nếu chưa có shop hoặc bị ban.
  - [ ] Nút "Đăng bán" dẫn tới ShopSetup nếu `shopName = null`.
- **Edge:** đổi `shopName` sau khi có SP → SP cũ vẫn hiển thị tên mới (product populate seller), nhưng Order cũ giữ `sellerShopName` snapshot.
- **Screens:** Thiết lập gian hàng #1–#5, Gian hàng #1

---

### 4.3 EPIC-02 — Category (Must-Have · P0 · Sprint 1)

#### F-CAT-01 · Quản lý Category (Admin) `[x]`
- **API:** `GET /categories`, `GET /categories/:id` (public); `POST/PATCH/DELETE /categories/:id` (Admin)
- **AC:**
  - [ ] Public chỉ thấy category `isActive = true`.
  - [ ] `slug` tự sinh từ `name`.
  - [ ] Tên trùng → `409`.
  - [ ] Xóa category còn SP (của bất kỳ shop) → `400` kèm thông báo.
  - [ ] Admin UI: list + form tạo/sửa + xóa confirm; Public UI: sidebar/nav lọc.
- **Edge:** category có ảnh optional; category dùng chung toàn sàn, seller không tạo mới.
- **Screens:** Admin danh mục #1–#3

---

### 4.4 EPIC-02 — Product (Must-Have · P0 · Sprint 1) `[ ]`

#### F-PRD-01 · Đăng bán & quản lý SP (Seller/Admin) `[ ]`
**User story:** Là seller đã có gian hàng, tôi muốn đăng bán và quản lý SP của mình.
- **API:** `POST /products`, `GET /products/my`, `PATCH /products/:id`, `DELETE /products/:id`, `POST /upload/image`
- **Depends:** F-SHOP-02, F-CAT-01
- **AC:**
  - [ ] `POST /products` → `sellerId` gán từ token (bỏ qua body); chưa có shop → `403`.
  - [ ] `name` ≤120 ký tự; >5 ảnh → `400`.
  - [ ] `PATCH` bởi chủ → `200`; user khác → `403`; Admin → `200`.
  - [ ] `DELETE` = soft delete (`isActive = false`), cùng quy tắc quyền.
  - [ ] Seller tắt `isActive` → SP biến khỏi public; bật lại được **trừ khi** `isBlocked = true`.
  - [ ] `stock` không âm (DTO); `sellerId` bất biến.
  - [ ] Ảnh phải là URL `https://res.cloudinary.com/<cloud>/...` (từ chối URL ngoài → `400`) — BR-PRD-012.
  - [ ] PATCH dùng DTO whitelist (không nhận `sellerId`, `isBlocked`, `blockReason`, `slug`) — chống mass assignment.
  - [ ] `GET /products/my` gồm cả ẩn/bị block (kèm `blockReason`).
- **Edge:** seller giảm stock dưới số lượng người khác đang có trong giỏ → xử lý khi load giỏ/checkout.
- **Screens:** Sản phẩm Seller #1–#3, Sửa sản phẩm #1–#4

#### F-PRD-02 · Xem & tìm kiếm SP (Public) `[ ]`
- **API:** `GET /products`, `GET /products/:id`
- **AC:**
  - [ ] Chỉ trả `isActive = true` **và** `isBlocked = false`; phân trang (`page`, `limit` ≤100).
  - [ ] Filter: `search` (text), `categoryId`, `sellerId`, `minPrice`, `maxPrice`; sort `price|createdAt|name` + `asc|desc`.
  - [ ] `stock = 0` → badge "Hết hàng", không thêm giỏ.
  - [ ] Chi tiết SP trả category name + `seller.shopName`; SP ẩn/block → `404` trừ Owner/Admin.
  - [ ] `isBlocked`/`blockReason` chỉ trả cho Owner/Admin.
- **Screens:** Trang chủ & Danh mục SP, chi tiết (còn hàng chưa login / đã login / hết hàng / chủ shop / chủ shop – bị cấm)

#### F-PRD-03 · Upload ảnh Cloudinary `[ ]`
- **API:** `POST /upload/image` (multipart, field `file`)
- **AC:** [ ] Chỉ `image/jpeg|png|webp`, ≤5MB → trả `{ url }`.

---

### 4.5 EPIC-03 — Cart (Must-Have · P0 · Sprint 1) `[ ]`

#### F-CART-01 · Giỏ hàng (chỉ user đăng nhập) `[ ]`
**User story:** Là buyer, tôi muốn gom SP nhiều shop vào giỏ và xem theo từng shop.
- **API:** `GET /cart`, `POST /cart/items`, `PATCH/DELETE /cart/items/:productId`, `DELETE /cart`
- **Depends:** F-PRD-02
- **AC:**
  - [ ] Chưa đăng nhập bấm "Thêm giỏ" → FE chuyển trang đăng nhập; mọi endpoint `/cart/*` thiếu token → `401`.
  - [ ] Admin gọi `POST /cart/items` → `403`.
  - [ ] `GET /cart` trả `groups[]` (nhóm theo seller + `subtotal`) + `totalAmount`.
  - [ ] `POST /cart/items` validate stock; SP của chính mình → `400`.
  - [ ] `PATCH` cập nhật quantity (không vượt stock); `DELETE` xóa item.
  - [ ] Item `stock=0` hoặc SP ẩn/block bị loại khi load lại giỏ.
  - [ ] FE: CartPage hiển thị theo từng shop, tổng VNĐ, nút checkout.
- **Edge:** quantity cộng dồn cap ở stock; seller bị ban → SP bị block → loại khỏi giỏ.
- **Screens:** Giỏ hàng #1–#2
- **Ghi chú:** **Không có** Guest cart localStorage / `POST /cart/merge` (BR-AUTH-012). Doc cũ còn mô tả — xem § 13.

---

### 4.6 EPIC-04 — Order & Checkout (Must-Have · P0 · Sprint 2) `[ ]`

#### F-ORD-01 · Tạo Checkout & tách đơn theo seller `[ ]`
**User story:** Là buyer, tôi muốn thanh toán một lần cho giỏ nhiều shop; hệ thống tách đơn cho từng shop.
- **API:** `POST /orders`
- **Depends:** F-CART-01
- **AC:**
  - [ ] Yêu cầu đăng nhập (không Guest checkout); Admin → `403`.
  - [ ] Nhóm item theo `sellerId` → **1 Checkout + N Order** (mỗi shop 1), trừ stock **ngay**.
  - [ ] Giá/tên SP lấy từ DB, bỏ qua `price` client gửi.
  - [ ] `recipient` lấy từ profile, cho override address; profile thiếu `phone`/`address` & body không bổ sung → `400` (BR-CHK-008).
  - [ ] Bất kỳ SP `stock < quantity`/ẩn/block → `400` kèm danh sách — **transaction abort, không tạo gì, stock không đổi** (all-or-nothing).
  - [ ] Mua SP của chính mình → `400`.
  - [ ] Trừ stock nguyên tử `stock >= qty`; 2 người mua SP cuối cùng → chỉ 1 thành công.
  - [ ] Toàn bộ (trừ stock + Checkout + N Order) trong **1 MongoDB transaction** (`session.withTransaction`) — BR-CHK-010; tạo URL VNPay **sau** commit.
  - [ ] Response: `checkoutId`, `checkoutCode`, `totalAmount`, `expiresAt`, `orders[]`, `vnpayUrl`; mọi Order `pending`.
- **Edge:** SP ngừng bán giữa lúc thêm giỏ và checkout; seller hủy SP trong lúc checkout.
- **Screens:** Thanh toán #1–#2

#### F-ORD-02 · Xem lịch sử đơn mua (Customer) `[ ]`
- **API:** `GET /orders/my`, `GET /orders/my/:id`
- **AC:**
  - [ ] Đơn mình đã mua (phân trang, mới nhất trước), có `seller.shopName`, `checkoutCode`.
  - [ ] Chi tiết (items snapshot, recipient, status, `totalAmount`); đơn người khác → `404`.
  - [ ] FE nhóm hiển thị theo `checkoutCode` + badge trạng thái.
- **Screens:** Đơn mua #1–#4

---

### 4.7 EPIC-05 — Payment VNPay (Must-Have · P0 · Sprint 2) `[ ]`

#### F-PAY-01 · Thanh toán theo Checkout `[ ]`
- **API:** `GET /payments/vnpay/return`, `GET /payments/vnpay/ipn`, `GET /checkouts/:checkoutCode`
- **Depends:** F-ORD-01
- **AC:**
  - [ ] `vnp_TxnRef = checkoutCode`; `vnp_Amount = totalAmount × 100`; `vnp_ExpireDate = expiresAt` (GMT+7) — BR-PAY-010.
  - [ ] IPN (GET server-to-server) verify HMAC-SHA512 + số tiền → trả `RspCode`/`Message` (00, 01, 02, 04, 97, 99).
  - [ ] Success → Checkout `paid`; **tất cả** Order con `pending → confirmed`, `paymentStatus = paid`.
  - [ ] Fail → Checkout `failed`; **tất cả** Order con `cancelled` (`cancelledBy = system`) + hoàn stock.
  - [ ] Return → verify, gọi **cùng hàm idempotent** với IPN, redirect FE `/checkout/result?checkoutCode=...&status=...`.
  - [ ] IPN/Return trùng/cùng lúc → chỉ xử lý 1 lần (idempotency theo trạng thái Checkout).
  - [ ] Mọi callback (kể cả sai chữ ký) lưu collection `payments`.
  - [ ] `@Cron` mỗi phút: Checkout `pending` quá `expiresAt` (30 phút) → `expired`, hủy Order `pending`, hoàn stock.
  - [ ] Success đến **sau** khi expired → ghi `payments.note = late_success_after_expiry`, trả `02`.
  - [ ] Checkout `paid` → xóa item đã mua khỏi cart DB; `failed`/`expired` giữ giỏ (BR-CHK-007).
- **Edge:** chạy localhost VNPay không gọi được IPN → Return phải đủ sức cập nhật đơn; FE **không tin** `?status=` trên URL, gọi `GET /checkouts/:checkoutCode`.
- **Screens:** Đặt hàng thành công #1–#4

---

### 4.8 EPIC-08 — Seller Order Fulfillment (Must-Have · P0 · Sprint 2) `[ ]`

#### F-SELL-01 · Đơn bán — Seller xử lý `[ ]`
- **API:** `GET /orders/selling`, `GET /orders/selling/:id`, `PATCH /orders/:id/status`
- **Depends:** F-PAY-01
- **AC:**
  - [ ] `GET /orders/selling` chỉ đơn `sellerId = mình`, lọc status, phân trang; `/:id` đơn shop khác → `404`.
  - [ ] Seller: `confirmed→shipping`, `shipping→delivered`, `confirmed→cancelled` (kèm `reason` bắt buộc) → `200`.
  - [ ] Seller không phải chủ → `403`; Seller đặt `refunded` → `403`.
  - [ ] Admin: ngoài các bước trên còn `cancelled→refunded` (chỉ khi `paymentStatus = paid`).
  - [ ] Không ai set tay `pending`/`confirmed` qua API → `400` (`confirmed` chỉ do VNPay).
  - [ ] Chuyển sai chiều (vd `delivered→shipping`) → `400`.
  - [ ] Hủy → hoàn stock đúng 1 lần; gọi hủy 2 lần không hoàn trùng.
  - [ ] Hai đơn con cùng Checkout có trạng thái độc lập.
  - [ ] FE: `SellerOrdersPage` — lọc status, nút Giao/Đã giao/Hủy (dialog lý do).
- **Screens:** Đơn bán #1–#5

---

### 4.9 EPIC-06 — Admin Dashboard (Must-Have · P1 · Sprint 2) `[ ]`

#### F-ADM-01 · Quản lý User & kiểm duyệt SP `[ ]`
- **API:** `GET /admin/users`, `PATCH /admin/users/:id/ban|unban`, `GET /admin/products`, `PATCH /admin/products/:id/block|unblock`
- **Depends:** F-ORD-02, F-SELL-01
- **AC:**
  - [ ] `GET /admin/users` lọc `role`/`isActive`/`search`, phân trang.
  - [ ] Ban → `isActive=false`; user không login được; **toàn bộ SP bị block** (`blockReason = seller_banned`), không ghi đè lý do Admin đã đặt.
  - [ ] Unban → `isActive=true`; chỉ mở lại SP `blockReason = seller_banned`.
  - [ ] `GET /admin/products` gồm mọi SP (ẩn/block), lọc `isBlocked`/`sellerId`.
  - [ ] Block SP cần `reason` bắt buộc; Seller không tự mở lại, vẫn thấy lý do.
  - [ ] Admin không ban chính mình → `400`.
  - [ ] FE: UserTable + BanConfirmDialog; AdminProducts + BlockDialog (nhập lý do).
- **Screens:** Admin người dùng #1–#4, Admin sản phẩm #1–#2, Admin đơn hàng #1–#3

#### F-ADM-02 · Quản lý Order (Admin) `[ ]`
- **AC:** [ ] Xem mọi đơn, lọc `status`/`sellerId`/`userId`; cập nhật trạng thái như Seller + `cancelled→refunded`.

---

## 5. Order State Machine

Áp dụng cho **từng Order** (không phải Checkout):

```
[pending]
    │  Thanh toán VNPay thành công (hệ thống)
    ▼
[confirmed]
    │  Seller của đơn / Admin
    ▼
[shipping]
    │  Seller của đơn / Admin
    ▼
[delivered]              ← trạng thái cuối

[pending]   ──→ [cancelled]   (thanh toán thất bại / hết hạn: CHỈ hệ thống)
[confirmed] ──→ [cancelled]   (Seller của đơn / Admin — trước khi giao; cần reason)
[cancelled] ──→ [refunded]    (CHỈ Admin, chỉ khi đã paid — hoàn tiền thủ công)
```

| Chuyển | Ai | Điều kiện |
|--------|----|-----------|
| `pending → confirmed` | Hệ thống (VNPay) | Không ai chuyển tay |
| `pending → cancelled` | Hệ thống | Thanh toán lỗi / hết hạn |
| `confirmed → shipping` | Seller của đơn · Admin | |
| `shipping → delivered` | Seller của đơn · Admin | |
| `confirmed → cancelled` | Seller của đơn · Admin | `cancelReason` bắt buộc; hoàn stock |
| `cancelled → refunded` | Admin | `paymentStatus = paid` |

> `pending` **không** bị hủy tay bởi Seller/Admin (BR-STT-007) — tránh lệch tiền khi người mua vẫn thanh toán đủ cả Checkout.

**Checkout status:** `pending → paid | failed | expired` (enum `CheckoutStatus`).

---

## 6. Business Rules (tham chiếu)

Canonical: `project-ecommerce/03-requirements.md`. Nhóm:
- **Auth** BR-AUTH-001..012 · **User/Shop** BR-USR-001..004 · **Category** BR-CAT-001..005 · **Product** BR-PRD-001..013
- **Seller** BR-SELL-001..007 · **Cart** BR-CART-001..006 · **Checkout** BR-CHK-001..010
- **Order** BR-ORD-001..011 · **State** BR-STT-001..007 · **Payment** BR-PAY-001..011 · **Admin** BR-ADM-001..005

Các rule then chốt:
1. Stock không âm — trừ nguyên tử `stock >= qty` khi tạo Order (BR-ORD-003).
2. 1 lần checkout = 1 Checkout + N Order + 1 giao dịch VNPay (BR-CHK-001/004).
3. All-or-nothing trong `session.withTransaction` (BR-CHK-002/010).
4. Callback VNPay idempotent, chung hàm cho IPN/Return (BR-PAY-006/011).
5. Seller không mua SP của chính mình (BR-SELL-002).
6. Admin chỉ kiểm duyệt — không mua (cart/order → 403) và không đăng bán (`POST /products` → 403) (BR-AUTH-011).
7. Guest chỉ xem — không giỏ/không checkout/không merge (BR-AUTH-012).

---

## 7. Non-Functional Requirements

| Nhóm | Yêu cầu |
|------|---------|
| Performance | API mục tiêu < 500ms (trừ VNPay/Cloudinary); index MongoDB đầy đủ; phân trang limit ≤100 |
| Security | JWT 15m/7d + bcrypt; `ValidationPipe({whitelist, forbidNonWhitelisted})` chống mass assignment; helmet; throttle `/auth/*` 10 req/phút/IP; CORS chỉ `FRONTEND_URL`; verify HMAC-SHA512 VNPay; không log secret/token |
| Correctness | Atomic stock; transaction checkout/rollback; idempotent callback |
| Data integrity | Snapshot giá/tên/ảnh/recipient/`sellerShopName` trong Order; `sellerId` bất biến |
| Availability | Best-effort (Render free ngủ 15 phút) |
| Accessibility | WCAG 2.1 AA |
| Responsive | Mobile-first 375/768/1280 (`skills/responsive-web/`) |
| Code quality | File < 300 dòng, function < 50 dòng, không `any`, DTO `class-validator` (DoD) |

---

## 8. Release Plan

```
Sprint 0 — Setup & Architecture ✅ DONE
Sprint 1 — Auth · User/Shop · Category · Product · Cart        🔧 IN PROGRESS
   [x] AUTH-001/002 · SELL-001 · CAT-001
   [ ] PRD-001 · PRD-002 · CART-001
Sprint 2 — Order · Payment · Seller Fulfillment · Admin         📋 TO DO
   [ ] ORD-001 · PAY-001 · ORD-002 · SELL-002 · ADM-001
Sprint 3 — Production Hardening & Go-Live (Vercel + Render)     🚀
   [ ] DEPLOY-01..05
```

**Dependency gate:** không bắt đầu story khi `Depends-on` chưa `[x]`.

---

## 9. Analytics & Instrumentation (MVP tối thiểu)

> Không có Analytics dashboard (out of scope). Chỉ log vận hành để debug.
- Log sự kiện: checkout tạo thành công/thất bại, callback VNPay (valid/invalid), cron expire, ban/block.
- `payments` collection là audit trail: `source`, `vnapayData`, `isValidSignature`, `isSuccess`, `note`.
- Health check: `GET /api/v1/categories` → `200`.

---

## 10. Screens & Design

Design tokens, Stitch references và responsive behavior: xem `docs/DESIGN.md`.
Stitch project: `projects/6249429078653284294`. Route FE: xem `project-ecommerce/07-tech-conventions.md`.

---

## 11. Out of Scope (Won't-Have for MVP)

Mobile native · Review/Rating · Voucher/Coupon · role `seller`/KYC · duyệt SP trước · biến thể SP/thương hiệu/video · phí & đơn vị vận chuyển · chia tiền/đối soát/rút tiền · buyer tự hủy/"đã nhận" · chat · realtime notification (Socket.io) · email transactional · Analytics/Report · Export PDF/Excel · Offline/PWA · i18n · Billing/Subscription.

---

## 12. Edge Cases & Error Handling (chọn lọc)

| Tình huống | Xử lý |
|-----------|-------|
| SP hết hàng khi đang ở checkout | `400` + danh sách SP thiếu; không tạo đơn |
| Nhiều user mua SP cuối cùng (race) | Atomic `stock >= qty`; ai thua nhận lỗi hết hàng |
| Giỏ 3 shop, shop thứ 3 hết hàng | Hoàn 2 shop đã trừ; không tạo gì (all-or-nothing) |
| VNPay timeout (không callback) | Cron: Checkout `pending` > 30 phút → `expired` + hủy + hoàn stock |
| VNPay success sau khi expired | `payments.note = late_success_after_expiry`, trả `02`; Admin hoàn tiền thủ công |
| IPN và Return cùng lúc | Idempotent theo trạng thái Checkout — chỉ bên đến trước có hiệu lực |
| localhost không nhận IPN | Return cập nhật đơn (chung hàm) hoặc dùng ngrok |
| Seller tự mua SP của mình | Chặn ở thêm giỏ và `POST /orders` (`400`) |
| Seller sửa giá khi SP đang trong giỏ người khác | Giá giỏ chỉ hiển thị; tính lại từ DB khi tạo Order |
| Seller bị ban khi có đơn `confirmed` chưa giao | Đơn giữ nguyên; Admin quyết định |
| Seller cố mở lại SP bị Admin block | `isActive` đổi được nhưng SP vẫn ẩn (do `isBlocked`); thấy lý do |
| Seller A sửa SP/đơn của B | `403` (ghi) / `404` (đọc "của tôi") |
| Admin hủy Order `pending` | Không cho phép (BR-STT-007) |
| User sửa `?status=success` trên URL | FE không tin; gọi `GET /checkouts/:checkoutCode` |
| Admin gọi thêm giỏ / order / `POST /products` | `403` |

---

## 13. Open Questions / Risks

### Conflicts cần chốt (doc vs doc)
1. **Guest cart/checkout** — BR-AUTH-012 + roadmap chốt KHÔNG; `02/03/04/06/08` cũ mô tả CÓ.
2. **Admin đăng bán** — BR-AUTH-011 nói `POST /products` → 403; BR-PRD-007 nói Admin được tạo.
3. **Transaction** — BR-CHK-010/05/10 yêu cầu; `09` (~dòng 144) nói không bắt buộc.
4. **Response wrapper** — `06` (`message/errors`) vs template gốc (`error/details`).
5. **Trạng thái Sprint 1** — roadmap `[x]` nhưng repo chưa có source (`inventory.md` = 0 file).

### Risks
| Rủi ro | Mức | Giảm thiểu |
|--------|-----|-----------|
| VNPay sandbox phụ thuộc bên ngoài (chữ ký, IPN, merchant) | Cao | Spike tạo URL + verify chữ ký từ Ngày 2; deploy BE sớm để test IPN |
| Transaction cần replica set | Trung | Dùng Atlas M0; local single-node replica set |
| Đường cắt tính năng nếu trễ | Trung | Theo "Đường cắt" `08-task-breakdown.md`; **không cắt** tách đơn/ownership/restock/idempotent |
| Render free ngủ 15 phút | Thấp | Mở URL trước demo; cron bắt kịp khi thức |
| Frontend template refactor tốn thời gian | Trung | Giữ nguyên cấu trúc template, chỉ thêm file mới |

---

## 14. Appendix

| Nội dung | File |
|----------|------|
| Business requirements (intent) | `docs/BRD.md` |
| API overview + pointer | `docs/API_SPEC.md` · `project-ecommerce/06-api-contract.md` |
| Data model | `docs/ERD.md` · `project-ecommerce/05-database-erd.md` |
| Quyền & guard | `docs/PERMISSION.md` |
| Design & screens | `docs/DESIGN.md` |
| Business rules đầy đủ (BR-XXX) | `project-ecommerce/03-requirements.md` |
| User flow chi tiết | `project-ecommerce/04-user-flow.md` |
| Task breakdown & timeline | `project-ecommerce/08-task-breakdown.md` |
| Deploy | `project-ecommerce/10-deployment.md` |
| Backlog & trạng thái | `PRODUCT_BACKLOG_ROADMAP.md` |
