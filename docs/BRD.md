# Business Requirements Document (BRD)

> **Nguồn dựng:** tổng hợp từ `project-ecommerce/01..10` + `PRODUCT_BACKLOG_ROADMAP.md`
> (roadmap ngày `2026-10-06` là bản mới nhất — khi mâu thuẫn với doc cũ trong `project-ecommerce/`, roadmap thắng).
> **Loại tài liệu:** Intent — chỉ đổi qua Change Request + user duyệt (xem `AGENTS.md` § Doc Impact).

---

## Project Overview

**Project Name:** Ecommerce Team Project
**Version:** 1.0
**Date:** 2026-10-06
**Author:** Team (2 người)

## Business Context

**Problem Statement:**
Cần một **sàn thương mại điện tử nhiều người bán** (kiểu Shopee thu gọn) để người dùng vừa **đăng bán** vừa **mua** sản phẩm vật lý trong cùng một tài khoản. Luồng nghiệp vụ cốt lõi: đăng bán SP → xem SP → giỏ hàng → checkout (tách đơn theo người bán) → thanh toán VNPay → người bán xử lý đơn. Đây là bài test (không phải sản phẩm thương mại), deadline 1 tuần, team 2 người.

**Business Objectives:**
- Chứng minh mô hình **multi-seller**: 1 lần checkout chứa SP của nhiều shop → tạo **N Order** (mỗi seller 1 Order) nhưng **1 giao dịch VNPay**.
- Chứng minh quyền sở hữu tài nguyên (Seller chỉ thao tác SP/đơn của mình; Admin bypass) mà **không cần role `seller` riêng**.
- Chứng minh xử lý tồn kho an toàn (trừ stock nguyên tử khi tạo đơn, rollback khi thanh toán lỗi/hết hạn).
- Chạy được end-to-end trên môi trường deploy (Vercel + Render + MongoDB Atlas) để demo.

**Success Metrics:**
- KPI-01: Happy path E2E PASS — đăng ký 2 user → seller thiết lập shop & đăng bán → buyer thêm giỏ 2 shop → checkout → VNPay sandbox → seller giao hàng.
- KPI-02: 100% Acceptance Criteria của Sprint 1 + Sprint 2 Must-Have đạt.
- KPI-03: Không còn lỗi Blocker/Critical trước demo; Playwright smoke test pass trên URL production.
- KPI-04: Go-live trong 1 tuần (Sprint 0 → 3).

---

## Stakeholders

| Role | Name | Responsibility |
|------|------|----------------|
| Product Owner | Team | Quyết định cuối, chốt scope/ưu tiên |
| Developer x2 | Team | Fullstack per feature (FE→BE), review chéo |
| End User (Guest) | — | Chỉ xem SP, tìm kiếm, lọc (không mua) |
| End User (Customer/Buyer) | — | Mua hàng, lịch sử đơn |
| End User (Seller) | — | Là Customer có gian hàng: đăng bán, xử lý đơn bán |
| Admin | — | Kiểm duyệt: user, category, product, order |

---

## Scope

### In Scope
- **Auth**: đăng ký, đăng nhập, JWT access + refresh, đăng xuất, seed Admin.
- **User & Shop**: profile (`/users/me`), thiết lập gian hàng (`shopName`, `pickupAddress`), trang shop công khai.
- **Category**: Admin CRUD; public xem để lọc.
- **Product**: seller đăng bán/quản lý SP của mình, upload ảnh Cloudinary, tìm kiếm/lọc public.
- **Cart**: chỉ user đăng nhập; giỏ DB; nhóm theo người bán; chặn mua SP của chính mình.
- **Order & Checkout**: checkout đăng nhập → tách đơn theo seller (1 Checkout + N Order), trừ stock nguyên tử, transaction.
- **Payment VNPay**: 1 giao dịch/checkout, IPN + Return idempotent, rollback stock, cron hết hạn 30 phút.
- **Order Management**: lịch sử đơn mua (Customer), đơn bán + cập nhật trạng thái (Seller), xem mọi đơn (Admin).
- **Admin Dashboard**: quản lý user (ban/unban → cascade block SP), block/unblock SP.
- **Go-Live**: security hardening, deploy Vercel + Render + Atlas, smoke test.

### Out of Scope (Won't-Have for MVP)
- Mobile native app (web-only).
- Review / Rating sản phẩm.
- Voucher / Coupon / Discount code.
- Role `seller` riêng / KYC gian hàng (chỉ dùng chung tài khoản, bán = có `shopName`).
- Duyệt SP trước khi hiển thị (Admin kiểm duyệt sau bằng block).
- Biến thể SP (màu/size), thương hiệu, video SP.
- Phí vận chuyển / chọn đơn vị vận chuyển.
- Chia tiền / đối soát / rút tiền cho người bán; hoàn tiền Admin làm thủ công.
- Người mua tự hủy đơn / bấm "Đã nhận hàng"; chat người mua – người bán.
- Realtime notification (Socket.io / WebSocket).
- Email transactional (order confirmation).
- Analytics / Report dashboard; Export PDF/Excel.
- Offline mode / PWA; i18n (chỉ Tiếng Việt / VNĐ); Billing / Subscription.

> **Guest cart / Guest checkout bị loại khỏi MVP** (xem `BR-AUTH-012` và roadmap `US-CART-001`, `US-ORD-001`). Đây là quyết định mới nhất; một số doc cũ trong `project-ecommerce/` vẫn mô tả Guest checkout/localStorage — xem § Open Questions.

---

## Functional Requirements

> Mã FR ánh xạ tới Epic + User Story trong `PRODUCT_BACKLOG_ROADMAP.md`. Chi tiết AC xem roadmap; chi tiết nghiệp vụ xem `project-ecommerce/03-requirements.md` (BR-XXX).

### Module 1: Auth & User (EPIC-01 · US-AUTH-001/002)
**FR-001 (Auth):** Đăng ký bằng email + password (bcrypt), email unique; đăng ký công khai luôn `role = customer`.
- Priority: Must-Have (P0) · Status: Done `[x]`
- Acceptance Criteria: register 201 không trả password · trùng email → 409 · login đúng → access+refresh+user · sai password → 401 · `isActive=false` → 403 "Tài khoản đã bị khóa".

**FR-002 (Auth):** JWT refresh + logout; access 15 phút, refresh 7 ngày.
- Priority: Must-Have (P0) · Status: Done `[x]`
- Acceptance Criteria: refresh hợp lệ → access mới · refresh sai/hết hạn → 401 · logout xóa refresh token (hash SHA-256 trong DB) · ban có hiệu lực ngay mỗi request.

### Module 2: User & Shop (EPIC-08 · US-SELL-001)
**FR-010 (Profile):** `GET/PATCH /users/me` để prefill checkout; `PATCH /users/me/shop` thiết lập `shopName` (3–50) + `pickupAddress`.
- Priority: Must-Have (P0) · Status: Done `[x]`
- Acceptance Criteria: `GET /shops/:sellerId` public trả `shopName`, `joinedAt`, `productCount`; 404 nếu chưa có shop hoặc bị ban; chưa có shop → không được đăng bán (403).

### Module 3: Category (EPIC-02 · US-CAT-001)
**FR-020 (Category):** Admin CRUD category; public xem danh sách active.
- Priority: Must-Have (P0) · Status: Done `[x]`
- Acceptance Criteria: tạo trùng tên → 409 · không xóa category còn SP (mọi shop) → 400 · `slug` tự sinh.

### Module 4: Product (EPIC-02 · US-PRD-001/002)
**FR-030 (Product — Seller):** User có gian hàng đăng bán SP (giá, stock, ≤5 ảnh Cloudinary, category); chỉ sửa/xóa SP của mình; Admin thao tác mọi SP.
- Priority: Must-Have (P0) · Status: To Do `[ ]`
- Acceptance Criteria: `sellerId` gán từ token, bất biến · chưa có shop → 403 · tên ≤120 · >5 ảnh → 400 · PATCH sai chủ → 403, Admin → 200 · DELETE = soft delete (`isActive=false`) · ảnh phải là URL Cloudinary của app.

**FR-031 (Product — Public):** Xem/tìm/lọc/sắp xếp SP với phân trang.
- Priority: Must-Have (P0) · Status: To Do `[ ]`
- Acceptance Criteria: chỉ trả `isActive=true` && `isBlocked=false` · filter `search/categoryId/sellerId/minPrice/maxPrice/sortBy/order` · `stock=0` badge "Hết hàng" · chi tiết SP ẩn/bị block → 404 trừ Owner/Admin.

### Module 5: Cart (EPIC-03 · US-CART-001)
**FR-040 (Cart):** Giỏ hàng DB **chỉ cho user đăng nhập**; nhóm theo người bán; Admin không mua (403).
- Priority: Must-Have (P0) · Status: To Do `[ ]`
- Acceptance Criteria: thiếu token → 401; Guest bấm "Thêm giỏ" → redirect login; Admin POST cart → 403; không thêm SP của chính mình → 400; item hết hàng/ẩn/bị block tự loại khi load; `GET /cart` trả `groups[]` + `totalAmount`.

### Module 6: Order & Checkout (EPIC-04 · US-ORD-001)
**FR-050 (Checkout):** Tạo 1 Checkout + N Order (mỗi seller 1 Order), trừ stock nguyên tử, trong 1 transaction; trả `vnpayUrl`.
- Priority: Must-Have (P0) · Status: To Do `[ ]`
- Acceptance Criteria: yêu cầu đăng nhập, Admin → 403; giá/tên lấy từ DB; thiếu hàng/ẩn/block → 400 all-or-nothing (không tạo gì, stock không đổi); mua SP của mình → 400; trừ stock `stock >= qty`; response có `checkoutId`, `checkoutCode`, `totalAmount`, `expiresAt`, `orders[]`, `vnpayUrl`; mọi Order `pending`.

### Module 7: Payment VNPay (EPIC-05 · US-PAY-001)
**FR-060 (Payment):** 1 giao dịch VNPay/checkout; IPN + Return dùng chung hàm idempotent; rollback khi thất bại/hết hạn.
- Priority: Must-Have (P0) · Status: To Do `[ ]`
- Acceptance Criteria: `vnp_TxnRef = checkoutCode`, `vnp_Amount = totalAmount × 100`, `vnp_ExpireDate`; verify HMAC-SHA512 + số tiền; success → mọi Order `confirmed` + `paid`; fail → mọi Order `cancelled` + hoàn stock; RspCode 00/01/02/04/97/99; mọi callback lưu `payments`; cron mỗi phút expire checkout pending > `expiresAt`; late success ghi `note = late_success_after_expiry`.

### Module 8: Order Management (EPIC-04 · US-ORD-002)
**FR-070:** Customer xem đơn mua (`/orders/my`); Admin xem mọi đơn.
- Priority: Must-Have (P0) · Status: To Do `[ ]`
- Acceptance Criteria: đơn người khác → 404; lọc `status/sellerId/userId`; nhóm hiển thị theo `checkoutCode`.

### Module 9: Seller Order Fulfillment (EPIC-08 · US-SELL-002)
**FR-080:** Seller xem đơn bán (`/orders/selling`) và đẩy state machine giao hàng; Admin cập nhật mọi đơn.
- Priority: Must-Have (P0) · Status: To Do `[ ]`
- Acceptance Criteria: `confirmed→shipping`, `shipping→delivered`, `confirmed→cancelled` (reason bắt buộc); `cancelled→refunded` chỉ Admin, chỉ khi `paid`; không set tay `pending/confirmed` → 400; sai chiều → 400; sai chủ → 403; hoàn stock đúng 1 lần.

### Module 10: Admin (EPIC-06 · US-ADM-001)
**FR-090:** Admin quản lý user + kiểm duyệt SP.
- Priority: Must-Have (P1) · Status: To Do `[ ]`
- Acceptance Criteria: ban user → `isActive=false` + block toàn bộ SP (`blockReason=seller_banned`); unban chỉ mở lại SP `seller_banned`; block SP cần `reason`; Admin không tự ban mình → 400.

### Module 11: Go-Live (EPIC-07 · US-DEPLOY-01..05)
**FR-100:** Security hardening, deploy BE (Render) + FE (Vercel) + Atlas, smoke test Playwright.
- Priority: Must-Have (P0) · Status: To Do `[ ]`

---

## Non-Functional Requirements

| Category | Requirement |
|----------|------------|
| Performance | Trang chủ/tải SP nhanh; API response mục tiêu < 500ms (trừ VNPay/Cloudinary). |
| Security | JWT (access 15m / refresh 7d); bcrypt; `ValidationPipe` whitelist + forbidNonWhitelisted toàn cục chống mass assignment; helmet; throttle `/auth/*`; secrets qua `.env`; CORS chỉ `FRONTEND_URL`; VNPay verify checksum bắt buộc. |
| Correctness | Trừ/hoàn stock nguyên tử; checkout + rollback trong MongoDB transaction (`session.withTransaction`); callback VNPay idempotent. |
| Data integrity | Snapshot giá/tên/ảnh trong `orders.items`; `sellerShopName` snapshot; `sellerId` bất biến. |
| Scalability | Không yêu cầu cao (bài test); modular monolith NestJS + MongoDB Atlas. |
| Availability | Best-effort trên Render free (chú ý service ngủ 15 phút). |
| Accessibility | WCAG 2.1 AA (mục tiêu frontend). |
| Responsive | Mobile-first 375 / 768 / 1280 (xem `skills/responsive-web/`). |

---

## User Roles & Permissions

| Role | Permissions |
|------|------------|
| **Guest** (chưa đăng nhập) | Xem SP, tìm kiếm, lọc, xem chi tiết SP/shop công khai. **Không** giỏ hàng, **không** checkout. |
| **Customer** | Mọi quyền Guest + giỏ hàng DB + checkout + lịch sử đơn mua + (khi có `shopName`) đăng bán, xử lý đơn bán. |
| **Seller** (không phải role riêng) | Customer đang thao tác trên SP/đơn mà `sellerId = user.id`. |
| **Admin** | Quản lý user/category/product/order; **không mua** (cart/checkout → 403), **không đăng bán** (POST /products → 403). |

> Chi tiết guard order + route matrix: `docs/PERMISSION.md`.

---

## Business Rules

> Nguồn canonical: `project-ecommerce/03-requirements.md` (BR-XXX). Tóm tắt nhóm chính:

- **BR-AUTH-001..012** — email unique; bcrypt; token TTL; Admin seed (không API gán role); ban hiệu lực ngay; refresh token lưu hash; Admin chỉ kiểm duyệt (không mua/không bán); **Guest chỉ xem — không giỏ localStorage/không Guest checkout/không merge**.
- **BR-USR-001..004** — profile prefill; phải có `shopName` + `pickupAddress` mới bán được; `shopName` public, không bắt buộc unique; không KYC/duyệt.
- **BR-CAT-001..005** — tên unique; không xóa category còn SP; chỉ Admin CRUD; category dùng chung toàn sàn.
- **BR-PRD-001..013** — 1 SP 1 category; stock ≥ 0; hết hàng vẫn xem, không thêm giỏ; giá nguyên dương VNĐ; ≤5 ảnh Cloudinary; hiển thị khi `isActive && !isBlocked`; `sellerId` bất biến; slug unique toàn sàn + hậu tố; ảnh phải thuộc cloud của app; chống mass assignment khi PATCH.
- **BR-SELL-001..007** — chỉ sửa SP/đơn của mình (sai chủ 403); không mua SP của mình; ban seller → block SP chưa block (`seller_banned`), không ghi đè lý do Admin; block cần lý do; Order giữ snapshot.
- **BR-CHK-001..010** — 1 checkout = N order (theo seller); all-or-nothing; giá từ DB; 1 giao dịch VNPay; hết hạn 30 phút; recipient dùng chung; paid → xóa item giỏ; thiếu phone/address → 400; code ≥10 ký tự random, chỉ chủ xem; **transaction** (`session.withTransaction`) cho createCheckout & restockAndCancel.
- **BR-ORD-001..011** — trừ stock ngay khi tạo (reserve); fail/hết hạn → hủy + hoàn stock; không xóa order; phạm vi xem theo `userId`/`sellerId`; order con độc lập; hoàn stock đúng 1 lần; `cancelReason` bắt buộc khi seller/admin hủy.
- **BR-STT-001..007** — `pending→confirmed` chỉ do VNPay; `confirmed→shipping→delivered` Seller/Admin; hủy theo bảng; `cancelled→refunded` chỉ Admin + đã paid; `delivered`/`refunded` là cuối; sai chiều 400; không hủy tay order `pending`.
- **BR-PAY-001..011** — redirect VNPay; IPN GET; verify HMAC-SHA512 + amount; success/fail xử lý toàn bộ order con; Return/IPN chung hàm idempotent; `vnp_TxnRef=checkoutCode`; lưu mọi callback; cron hết hạn; `vnp_ExpireDate`; chuyển trạng thái checkout bằng cập nhật có điều kiện trong transaction.
- **BR-ADM-001..005** — Admin truy cập tất cả; không tự ban/xóa mình; ban → cascade block; block SP cần lý do; không xóa order.

---

## Constraints

- **Technical:** NestJS + Mongoose (MongoDB) backend; React 18 + Vite + TS + Tailwind + shadcn/ui frontend; REST `/api/v1`; JWT; Cloudinary; VNPay sandbox. MongoDB phải là **replica set** (Atlas free tier) để dùng transaction.
- **Budget:** Chỉ dịch vụ free (Atlas M0, Render free, Vercel free, VNPay sandbox, Cloudinary free). Không CI/CD/Docker/domain riêng.
- **Timeline:** MVP trong **1 tuần**, team 2 người.
- **Regulatory:** Không có yêu cầu GDPR/PCI cụ thể (bài test).

---

## Assumptions

- Roadmap `PRODUCT_BACKLOG_ROADMAP.md` (2026-10-06) là nguồn trạng thái/behavior mới nhất, thắng doc cũ khi mâu thuẫn.
- Atlas free tier (M0) hỗ trợ transaction; local dùng single-node replica set.
- VNPay sandbox merchant + Cloudinary + Atlas credentials có sẵn trước khi code.
- Không cần role `seller` — bán xác định bằng `sellerId` (quyền sở hữu).
- Admin không đăng bán (BR-AUTH-011) — xem Open Questions.

---

## Open Questions / Conflicts cần chốt

- [ ] **Guest cart/checkout**: `BR-AUTH-011/012` + roadmap (mới) nói **KHÔNG** Guest cart/checkout/merge; nhưng `project-ecommerce/02-scope.md`, `03` (BR-CART-001/002/005/006, BR-ORD-001/002), `04-user-flow.md`, `06-api-contract.md` (cart endpoints, `POST /orders` = Optional), `08-task-breakdown.md` (4.4/4.6) vẫn mô tả Guest/localStorage. → Cần thống nhất doc cũ theo BR-AUTH-012.
- [ ] **Admin đăng bán**: `BR-AUTH-011` nói Admin `POST /products` → 403, nhưng `BR-PRD-007` (+ `06`) nói "Mọi user có gian hàng **và Admin** được tạo SP". → Chốt: Admin có được tạo SP không? (BRD này tạm theo BR-AUTH-011: không.)
- [ ] **Transaction bắt buộc hay không**: `BR-CHK-010`, `05`, `10` yêu cầu transaction/replica set; `09-environment-setup.md` (dòng ~144) nói "không bắt buộc replica set/transaction". → Chốt theo BR-CHK-010: có.
- [ ] **Response wrapper**: template gốc ghi `{ success, data }` / `{ success, error, details }`; `06-api-contract.md` ghi `{ success, data, message }` / `{ success, message, errors }`. → Chốt shape thống nhất (BRD tạm theo `06`).
- [ ] **Status Sprint 1**: roadmap đánh dấu `[x]` AUTH-001, AUTH-002, SELL-001, CAT-001; `[ ]` PRD/CART. Xác nhận các `[x]` đã thực sự có code + test (chưa có source trong repo: `docs/generated/inventory.md` = 0 file).
