# Project Brief

## Project Name
Ecommerce Team Project

## Description
Sàn thương mại điện tử **nhiều người bán** (kiểu Shopee thu gọn): một tài khoản vừa **đăng bán** vừa **mua** sản phẩm vật lý. Luồng chính: đăng bán SP → xem/tìm SP → giỏ hàng (nhóm theo shop) → checkout tách đơn theo người bán → thanh toán VNPay → người bán xử lý đơn. Là bài test, deadline 1 tuần, team 2 người.

## Target Users
- **Guest** — chưa đăng nhập: chỉ xem/tìm/lọc SP (không mua).
- **Customer/Buyer** — đã đăng nhập: giỏ hàng, checkout, lịch sử đơn mua.
- **Seller** — Customer đã thiết lập gian hàng: đăng bán SP, xử lý đơn bán (không phải role riêng).
- **Admin** — kiểm duyệt: user (ban/unban), category, product (block), order.

## Core Features
- Auth: đăng ký/đăng nhập/JWT (access + refresh)/logout, seed Admin.
- User & Shop: profile, thiết lập gian hàng (`shopName` + `pickupAddress`), trang shop công khai.
- Category: Admin CRUD, public xem để lọc.
- Product: seller đăng bán/quản lý SP của mình, upload Cloudinary (≤5 ảnh), tìm kiếm/lọc/sắp xếp.
- Cart: DB cho user đăng nhập, nhóm theo người bán, chặn mua SP của chính mình.
- Order & Checkout: 1 Checkout + N Order theo seller, trừ stock nguyên tử trong transaction.
- Payment: VNPay 1 giao dịch/checkout, IPN + Return idempotent, rollback stock, cron hết hạn 30 phút.
- Order Management: lịch sử đơn mua (Customer), đơn bán + state machine (Seller), xem mọi đơn (Admin).
- Admin Dashboard: ban/unban user (cascade block SP), block/unblock SP.
- Go-Live: security hardening, deploy Vercel (FE) + Render (BE) + MongoDB Atlas, smoke test.

## Non-functional Requirements
- Security: JWT TTL 15m/7d, bcrypt, ValidationPipe whitelist toàn cục, helmet, throttle `/auth/*`, CORS chỉ `FRONTEND_URL`, VNPay verify HMAC-SHA512.
- Correctness: stock nguyên tử; checkout + rollback trong `session.withTransaction`; callback idempotent; snapshot giá/tên trong order.
- Performance: API mục tiêu < 500ms; MongoDB index đầy đủ; phân trang tối đa `limit=100`.
- Availability: best-effort trên Render free (chú ý service ngủ 15 phút).
- Accessibility/Responsive: WCAG 2.1 AA; mobile-first 375/768/1280.

## Notes
- **Won't-have:** Review/Rating, Voucher/Coupon, role `seller` riêng/KYC, duyệt SP trước, biến thể SP, phí vận chuyển, chia tiền/rút tiền, buyer tự hủy/"đã nhận", chat, realtime notification, email transactional, analytics/export, PWA/offline, i18n, subscription.
- **Quyết định mấu chốt:** không có Guest cart / Guest checkout / merge cart (BR-AUTH-012 + roadmap).
- **Nguồn chi tiết:** `project-ecommerce/01..10` + `PRODUCT_BACKLOG_ROADMAP.md`.
- **Canonical docs:** `docs/BRD.md`, `docs/DESIGN.md`, `docs/API_SPEC.md`, `docs/ERD.md`, `docs/PERMISSION.md`.
- Xem mục "Open Questions / Conflicts" trong `docs/BRD.md` để biết các mâu thuẫn doc cần chốt.
