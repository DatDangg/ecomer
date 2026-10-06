# Design Doc — Ecommerce MVP (2026-10-06)

> **Nguồn:** tổng hợp từ brainstorm (`SPECIFICATIONS.md` R-01..R-13, `docs/BRD.md`/`PRD.md`/`ARCHITECTURE.md`/`USER_FLOW.md`/`DESIGN.md`, `PRODUCT_BACKLOG_ROADMAP.md`).
> **Trạng thái:** ⏸ chờ user approve (HARD-GATE — chưa code trước khi approve).
> **Config đã chốt:** `.context/project-config.md` · log: `.context/brainstorm-log.md`.

---

## 1. Mục tiêu & phạm vi

Sàn TMĐT **nhiều người bán** (kiểu Shopee thu gọn), web-only, bài test 1 tuần, team 2 người.
1 tài khoản vừa mua vừa bán; **1 checkout = N Order** (mỗi seller 1 Order) nhưng **1 giao dịch VNPay**.
**Must-have:** Auth, User/Shop, Category, Product (seller + public), Cart (login-only), Order/Checkout (transaction),
Payment VNPay, Order Management, Seller Fulfillment, Admin, Go-Live.
**Won't-have:** review/rating, voucher, role seller riêng/KYC, duyệt SP trước, biến thể SP, phí ship, chia tiền,
buyer tự hủy, chat, realtime, email, analytics/export, PWA/offline, i18n (chỉ vi), Guest cart/checkout.

## 2. Kiến trúc & stack

- **Monorepo 2 project độc lập:** `backend/` (NestJS + Mongoose, **npm**) · `frontend/` (React 18 + Vite + TS, **pnpm**).
- **MongoDB** replica set (Atlas M0 / single-node local) bắt buộc cho transaction.
- **REST `/api/v1`**, JWT access 15m + refresh 7d (hash SHA-256), VNPay sandbox, Cloudinary.
- Chi tiết: `docs/ARCHITECTURE.md` (module layout, request lifecycle, design decisions D1–D8).

## 3. Quyết định thiết kế cốt lõi

| # | Quyết định |
|---|-----------|
| D1 | Không có role `seller` — bán xác định bằng quyền sở hữu `sellerId` |
| D2 | 1 Checkout + N Order (mỗi seller 1), 1 giao dịch VNPay (`vnp_TxnRef = checkoutCode`) |
| D3 | Trừ stock ngay khi tạo Order (reserve) + rollback khi fail/expire |
| D4 | MongoDB transaction (`session.withTransaction`) cho `createCheckout` & `restockAndCancel` |
| D5 | Callback VNPay idempotent (`findOneAndUpdate` theo `status: pending`) dùng chung IPN/Return/cron |
| D6 | Snapshot giá/tên/ảnh/recipient/`sellerShopName` trong Order |
| D7 | **Không Guest cart/checkout/merge** (BR-AUTH-012); giỏ chỉ cho user đăng nhập |
| D8 | Deploy đơn giản Vercel + Render + Atlas, không CI/CD/Docker |

## 4. Data & quyền

- Collections: `users`, `categories`, `products`, `carts`, `checkouts`, `orders` (embedded `items`), `payments` — `docs/ERD.md`.
- Hiển thị SP công khai `isActive && !isBlocked`; không xóa Order; `delivered`/`refunded` là cuối.
- Guard order: auth → role → ownership (`assertOwnerOrAdmin`) → throttle → handler; ghi sai chủ 403, đọc "của tôi" sai chủ 404 — `docs/PERMISSION.md`.
- Admin không mua/không bán; ban cascade block SP (`seller_banned`).

## 5. Config vận hành (đã chốt)

| Mục | Giá trị |
|-----|---------|
| Git | `target_branch=staging`, `forbidden_branch=main`, `auto_push_after_pass=false` |
| Package | backend npm · frontend pnpm · `source_roots=[backend, frontend]` |
| DB | `db_tool=other` (Mongoose), `migration_required=false` |
| Models | builder/change_request=`opencode-go/deepseek-v4.1-flash`; reviewer/spec_validator=`opencode-go/gpt-6-luna` |
| Deploy | Vercel (FE) + Render (BE) + Atlas M0; `ci_cd=skip`; monitoring off |
| UI | Tailwind + shadcn/ui, breakpoints 375/768/1280, max 300 dòng/file & 50 dòng/function |

## 6. Kế hoạch triển khai (đề xuất layer — chốt ở `/graph`)

Dự kiến: **L0 Scaffold** (BE/FE + config + DB) → **L1 Auth/User/Shop/Category** → **L2 Product + Upload** →
**L3 Cart + Checkout/Order (transaction)** → **L4 VNPay + Order Mgmt + Seller Fulfillment** →
**L5 Admin Dashboard** → **L6 FE pages/design + Go-Live (deploy + smoke test)**.
Thứ tự cuối cùng + task chi tiết do bước Graph sinh (`tasks/`).

## 7. Rủi ro & Open Questions

- Repo chưa có code → AC của spec chỉ verify được sau khi scaffold (không phải gap spec).
- VNPay localhost không nhận IPN → dựa Return hoặc ngrok.
- Render free ngủ ~15 phút → cron bắt kịp khi thức.
- Docs cũ `project-ecommerce/` còn mâu thuẫn (Guest cart, Admin đăng bán) → theo quyết định ở §3/§Open Questions BRD.
- `docs/DESIGN.md` tokens **provisional** — cần lấy từ Stitch MCP khi dựng UI (bước Design).
