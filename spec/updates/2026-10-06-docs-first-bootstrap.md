# Spec Update — 2026-10-06 docs-first-bootstrap

**spec_version:** (chưa có) → 1.0.0 (MINOR)
**Trigger:** initial-build (docs-first bootstrap)
**Requirements:** THÊM R-01..R-13 (toàn bộ, dựng từ docs canonical; R-13 Upload bổ sung theo validator round 1)

**Ghi chú validator round 1:** bổ sung section Non-Functional Requirements, contract `POST /upload/image` (R-13),
`GET /products/my`, health check deploy, enum sort `price|createdAt|name`+`asc|desc`, và tách filter Admin khỏi `/orders/my`.

**Nguồn:** docs-first — reverse-engineer từ `docs/BRD.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`,
`docs/API_SPEC.md`, `docs/ERD.md`, `docs/PERMISSION.md`, `docs/USER_FLOW.md`, `docs/DESIGN.md` +
`project-ecommerce/01..10` + `PRODUCT_BACKLOG_ROADMAP.md`.

**Phạm vi:** 12 nhóm requirement (Auth, User&Shop, Category, Product Seller, Product Public, Cart,
Order&Checkout, Payment VNPay, Order Management, Seller Fulfillment, Admin, Go-Live).

**Trạng thái repo:** chưa có app code (`docs/generated/inventory.md` = 0 file) → toàn bộ là target spec.

**Điểm `[cần xác nhận]` (kế thừa từ `docs/BRD.md` § Open Questions):**
- Guest cart/checkout/merge — chốt theo BR-AUTH-012: KHÔNG.
- Admin có được `POST /products` không — chốt tạm theo BR-AUTH-011: không (403).
- Transaction/replica set bắt buộc — chốt theo BR-CHK-010: có.
- Response wrapper shape — chốt theo `project-ecommerce/06`: `{success, data, message}` / `{success, message, errors}`.
- Status Sprint 1 (`[x]` AUTH/SELL/CAT trên roadmap) — chưa có source để verify.

**Ảnh hưởng:** toàn bộ module — chưa có code nên không có regression; bàn giao lần đầu cho TEST.
