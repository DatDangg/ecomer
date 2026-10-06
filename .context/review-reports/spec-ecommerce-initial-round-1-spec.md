# Spec Validation — ecommerce initial · round 1

- **Mode:** Spec validation (trước khi chia task/graph) — docs-first bootstrap.
- **Round:** 1
- **Date:** 2026-10-06
- **Validator:** spec-validator (độc lập, read-only source; chỉ ghi report scoped)
- **Đối tượng validate:** `SPECIFICATIONS.md` (spec_version 1.0.0, R-01..R-12) + `spec/updates/2026-10-06-docs-first-bootstrap.md` + `spec/test-scope/current.json` + `spec/CHANGELOG.md`.

## Review level / Reason / Blast radius

- **Review level:** STRICT.
- **Reason:** Repo **chưa có app code** (`docs/generated/inventory.md` = 0 file, `source_roots: []`); spec docs-first là **đầu vào duy nhất** để graph chia layer/task cho toàn bộ 12 nhóm requirement. Sai/thiếu ở spec nhân lên toàn bộ build (auth, order, payment, permission, schema).
- **Blast radius:** Toàn dự án — R-01..R-12 (auth, users/shops, categories, products, cart, order/checkout, payment, order mgmt, fulfillment, admin, deploy) và mọi layer/task sinh từ spec.

## Verify commands + result

```
web typecheck → skip, no app configured
web lint      → skip, no app configured
api typecheck → skip, no app configured
api lint      → skip, no app configured
test          → skip, no app configured
```
`.context/project-config.md`: mọi command `null`, `source_roots: []`, `package_manager: <none>`, `db_tool: none` → skip theo rule "no app configured". Validate là **tĩnh, trên docs**.

## Nguồn đã đọc (canonical / intent)

`docs/BRD.md` (intent), `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/API_SPEC.md`, `docs/ERD.md`, `docs/PERMISSION.md`, `docs/USER_FLOW.md`, `docs/DESIGN.md`, `docs/INDEX.md`, `docs/SPEC_VERSIONING.md`; `PRODUCT_BACKLOG_ROADMAP.md`; `BRIEF.md`; `project-ecommerce/*` (list); `SPECIFICATIONS.md`; `spec/updates|CHANGELOG|test-scope`.

---

## 1. Feature coverage matrix — FR trong `docs/BRD.md` → R-xx trong `SPECIFICATIONS.md`

| Requirement | Source (canonical) | Status trong spec | Note |
|---|---|---|---|
| FR-001 (Auth: register) | BRD §Module1 · PRD F-AUTH-01 | ✅ R-01 | register bcrypt, email unique 409, public role=customer |
| FR-002 (Auth: refresh+logout) | BRD §Module1 · PRD F-AUTH-02/03/04 | ✅ R-01 | access 15m/refresh 7d, hash SHA-256 (1 token/user), ban hiệu lực ngay |
| FR-010 (Profile & Shop) | BRD §Module2 · PRD F-SHOP-01/02 | ✅ R-02 | `/users/me`, `/users/me/shop`, `/shops/:sellerId` public 404 |
| FR-020 (Category) | BRD §Module3 · PRD F-CAT-01 | ✅ R-03 | CRUD, tên unique 409, cấm xóa khi còn SP 400 |
| FR-030 (Product — Seller) | BRD §Module4 · PRD F-PRD-01 | ✅ R-04 (PARTIAL) | covered; chi tiết upload & `/products/my` thiếu (GAP-02) |
| FR-031 (Product — Public) | BRD §Module4 · PRD F-PRD-02 | ✅ R-05 (PARTIAL) | filter/paginate; thiếu enum sort (GAP-04) |
| FR-040 (Cart) | BRD §Module5 · PRD F-CART-01 | ✅ R-06 | login-only, group by seller, Admin 403, no guest/merge |
| FR-050 (Order & Checkout) | BRD §Module6 · PRD F-ORD-01 | ✅ R-07 | 1 Checkout + N Order, transaction, atomic stock, all-or-nothing |
| FR-060 (Payment VNPay) | BRD §Module7 · PRD F-PAY-01 | ✅ R-08 | IPN/Return idempotent, RspCode 00/01/02/04/97/99, cron, late_success |
| FR-070 (Order Management) | BRD §Module8 · PRD F-ORD-02 | ✅ R-09 (PARTIAL) | filter attribution customer vs admin chưa rõ (GAP-05) |
| FR-080 (Seller Fulfillment) | BRD §Module9 · PRD F-SELL-01 | ✅ R-10 | state machine + restock đúng 1 lần + refunded chỉ Admin |
| FR-090 (Admin) | BRD §Module10 · PRD F-ADM-01/02 | ✅ R-11 (+R-09/R-10) | ban cascade, block/unblock; F-ADM-02 dùng chung R-09/R-10 |
| FR-100 (Go-Live) | BRD §Module11 · PRD §8 | ✅ R-12 (PARTIAL) | deploy + smoke; thiếu health check (GAP-03) |
| Upload ảnh (F-PRD-03, không có FR riêng) | PRD F-PRD-03 · PERMISSION · roadmap | ⚠️ PARTIAL (R-04) | endpoint có trong API table nhưng hợp đồng upload thiếu (GAP-02) |

**Kết luận coverage:** 13/13 FR (FR-001..FR-100) **đều có** ánh xạ tới ≥1 R-xx → **không có ❌ MISSING ở cấp FR**. Một số FR là PARTIAL về chi tiết (xem Gaps).

---

## 2. Cross-doc conflict — BRD § Open Questions có được chốt nhất quán?

| # | Conflict gốc | Cách chốt trong SPECIFICATIONS | Nhất quán? |
|---|---|---|---|
| OQ-1 | Guest cart/checkout/merge | R-06 "chỉ user đăng nhập; không Guest cart/merge (BR-AUTH-012)"; R-07 "Admin 403"; update file ghi rõ chốt BR-AUTH-012 | ✅ |
| OQ-2 | Admin đăng bán (`POST /products`) | R-11 "Admin không đăng bán (`POST /products` 403) — theo BR-AUTH-011"; R-04 "Admin thao tác mọi SP" (edit/delete) — không xung đột | ✅ (nhưng API_SPEC/roadmap còn lag — OBS-1) |
| OQ-3 | Transaction/replica set bắt buộc | DB Schema rules "createCheckout + restockAndCancel trong `session.withTransaction`"; Tech Stack "replica set bắt buộc" | ✅ |
| OQ-4 | Response wrapper shape | API section `{success:true,data,message}` / lỗi `{success:false,message,errors?}` — khớp `06`/API_SPEC | ✅ |
| OQ-5 | Status Sprint 1 (`[x]` nhưng chưa có code) | SPEC nêu rõ "repo chưa có code → tất cả `planned`"; test-scope acceptance ghi `[cần xác nhận]` | ✅ (residual, không verify được — xem Residual risk) |

**Conflict mới giữa SPECIFICATIONS và PERMISSION / ERD / API_SPEC:**
- **ERD:** khớp — collections `users/categories/products/carts/checkouts/orders/payments`, quan hệ, index, atomic stock, idempotent checkout, ban cascade đều nhất quán. **Không phát hiện conflict.**
- **PERMISSION:** khớp — role `{customer, admin}`, guard order, ghi sai chủ 403 / đọc "của tôi" 404, Admin không mua/bán. **Không phát hiện conflict.**
- **API_SPEC:** khớp về contract/error/rate-limit. **1 điểm lệch LOW (OBS-1):** dòng Product của `API_SPEC.md` không đánh dấu Admin `POST /products` → 403 trong khi SPEC R-11 (đúng theo BR-AUTH-011/PERMISSION) có. Đây là doc-lag của API_SPEC, không phải lỗi SPEC.

**Không có HIGH conflict.**

---

## 3. Contradiction nội bộ

- R-04 "Admin thao tác mọi SP" (PATCH/DELETE) vs R-11 "Admin không đăng bán (POST 403)" → **không xung đột** (quyền sửa/xóa vs quyền tạo).
- R-07 (tạo Order `pending`, trừ stock trong transaction) vs R-08 (success → `confirmed`+`paid`; fail → `cancelled`+hoàn stock) → **nhất quán**.
- R-08 (fail/timeout hoàn stock) vs R-10 (hủy hoàn stock đúng 1 lần) → **nhất quán** (idempotent).
- R-02 (`/shops/:sellerId` 404 nếu bị ban) vs R-11 (ban cascade block SP) → **nhất quán**.
- Overview "không có role `seller` riêng" vs R-11 "admin seed only" → **nhất quán**.
- **Không phát hiện contradiction nội bộ.**

---

## 4. Edge cases / NFR gaps

**Edge cases:** SPEC phủ tốt các case then chốt — race stock atomic, all-or-nothing (1 SP lỗi → abort), VNPay timeout/cron, late success sau expire, IPN/Return trùng (idempotent), ban cascade không ghi đè lý do block, mass-assignment PATCH. Thiếu tường minh (minor, có ở PRD/USER_FLOW nhưng chưa vào spec): BR-CART-003 khi seller giảm stock dưới qty trong giỏ; kịch bản "localhost không nhận IPN → Return xử lý".

**NFR gaps:** SPECIFICATIONS **không có section NFR** — chỉ gián tiếp có Security (Authentication hardening), Correctness/Data integrity (DB rules), Availability (Scalability Profile). **Thiếu hẳn:** Performance (<500ms), Accessibility (WCAG 2.1 AA), Responsive (375/768/1280), Code quality (file<300/function<50/no any). Nguồn: `docs/BRD.md` §Non-Functional Requirements, `docs/PRD.md` §7, `BRIEF.md`.

---

## Findings — Gaps (MISSING / PARTIAL)

| ID | Loại | Requirement / Nguồn | Gap | Ảnh hưởng task |
|---|---|---|---|---|
| **GAP-01** | ⚠️ PARTIAL | NFR — `docs/BRD.md` §NFR, `docs/PRD.md` §7, `BRIEF.md` | `SPECIFICATIONS.md` không có section NFR: Performance <500ms, WCAG 2.1 AA, Responsive 375/768/1280, Code quality (file<300, function<50, no `any`) | Graph/reviewer thiếu acceptance gate cho Phase 3 (UI) & reviewer skills (impeccable/responsive/frontend-checklist) |
| **GAP-02** | ⚠️ PARTIAL | R-04/R-05 — `docs/PRD.md` F-PRD-03, `docs/PERMISSION.md`, `PRODUCT_BACKLOG_ROADMAP.md` US-PRD-001 | Hợp đồng upload thiếu: `POST /upload/image` multipart field `file`, chỉ `image/jpeg|png|webp` ≤5MB, trả `{url}`. Ngoài ra `GET /products/my` "gồm cả ẩn/bị block + `blockReason`" chưa nêu trong R-04 | Phase 2 (upload) & Phase 3 (MyProducts) dễ bỏ sót validation/màn hình |
| **GAP-03** | ⚠️ PARTIAL | R-12 / Deployment — `docs/PRD.md` §9, roadmap US-DEPLOY-03 | Health check `GET /api/v1/categories` → 200 (deploy gate) không có trong spec/deployment | Task deploy/UAT thiếu tiêu chí verify staging/prod |
| **GAP-04** | ⚠️ PARTIAL (low) | R-05 — `docs/PRD.md` F-PRD-02 | R-05 liệt kê `sortBy/order` nhưng không nêu enum (`price|createdAt|name` + `asc|desc`) | Dễ implement lệch whitelist sort |
| **GAP-05** | ⚠️ PARTIAL (low) | R-09 — PRD F-ORD-02 vs roadmap US-ORD-002 | R-09 gộp filter `status/sellerId/userId` vào Customer `/orders/my`, trong khi filter này thuộc Admin `GET /orders`; chưa tách rõ customer (self) vs admin (mọi đơn) | Phân quyền/route dễ nhầm |
| **OBS-01** | 📝 NOTE (ngoài SPEC) | `docs/API_SPEC.md` Product row | API_SPEC không đánh dấu Admin `POST /products` → 403 (SPEC đúng theo BR-AUTH-011/PERMISSION). Cập nhật API_SPEC (as-built) trong task liên quan | Không phải lỗi SPEC |

Không có [MISSING] ở cấp requirement FR. Không có ❌. Không có HIGH conflict. Tổng **5 ⚠️ PARTIAL** → vượt ngưỡng FAIL (≥3 ⚠️).

## Residual risk

- OQ-5 (Sprint 1 `[x]` trên roadmap) **không kiểm chứng được** vì repo 0 source file — giữ nguyên `[cần xác nhận]`; khi có code phải reconcile spec `planned` ↔ thực tế.
- Design tokens trong `docs/DESIGN.md` là **provisional** (chưa có `frontend/DESIGN.md`); screen specs thật lấy từ Stitch — ngoài phạm vi spec functional.

## Verdict

**❌ FAIL** — theo trigger đã định (≥3 ⚠️). Coverage FR đầy đủ (13/13) và 5 Open Question của BRD đã được chốt nhất quán, **không** có ❌/HIGH conflict; FAIL do **5 PARTIAL** (GAP-01..GAP-05), trong đó GAP-01/02/03 ảnh hưởng trực tiếp acceptance gate của Phase 2/3/Deploy.

**Hành động đề xuất (cho builder/loop):**
1. Bổ sung section NFR vào `SPECIFICATIONS.md` (Performance/A11y/Responsive/Code quality) — GAP-01.
2. Bổ sung hợp đồng `POST /upload/image` + hành vi `GET /products/my` (blockReason) vào R-04 — GAP-02.
3. Bổ sung health check + smoke criterion vào R-12/Deployment — GAP-03.
4. Làm rõ enum sort (R-05, GAP-04) và tách filter Customer vs Admin (R-09, GAP-05).
5. Tùy chọn: cập nhật `docs/API_SPEC.md` Product row (OBS-01).

> Sửa spec xong → chạy lại spec-validator **round 2** và ghi đè/ tạo `spec-ecommerce-initial-round-2-spec.md`.
