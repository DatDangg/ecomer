# Task 02: Order/Checkout/Payment schemas + OrderService core

## Layer
3

## Type
build (initial)

## Description
Dựng model & lõi nghiệp vụ đơn hàng (chưa expose HTTP):
- `Checkout` schema: `userId`, `checkoutCode` unique, `totalAmount`, `status: pending|paid|failed|expired`,
  `expiresAt`, timestamps.
- `Order` schema: `orderCode` unique, `checkoutId`, `userId` (buyer), `sellerId`, `sellerShopName`,
  `items[]` embedded **snapshot** (`productId`, `name`, `image`, `price`, `quantity`), `totalAmount`,
  `status: pending|confirmed|shipping|delivered|cancelled|refunded`, `paid`, `recipient` snapshot
  (`fullName`, `phone`, `address`), `cancelReason?`, `note?`, timestamps.
- `Payment` schema: raw callback VNPay (mọi field `vnp_*`), `checkoutId?`, `signatureValid`, timestamps.
- Index: `checkoutCode`/`orderCode` unique; `checkout {status,expiresAt}`; order `checkoutId/userId/sellerId/status/createdAt` + compound `{sellerId,createdAt}`, `{userId,createdAt}`.
- `OrderService` core: `buildSnapshot()`; `reserveStock(items, session)` (atomic `$gte` + `$inc -qty`); `restockAndCancel(order, session)` (hoàn kho **đúng 1 lần**); state-machine validator (transition hợp lệ, chặn set tay `pending/confirmed`).

## Dependencies
- task-02 Layer 2 (Product schema + atomic stock pattern) + task-02 Layer 0 (base schema/enums)

## Acceptance Criteria
- [ ] 3 schema + index tạo đúng trên DB replica set.
- [ ] `reserveStock` fail nếu bất kỳ item thiếu tồn/ẩn/block (all-or-nothing), không trừ một phần.
- [ ] `restockAndCancel` chỉ hoàn kho 1 lần dù gọi lặp (idempotent guard).
- [ ] State machine cho phép `confirmed→shipping`, `shipping→delivered`, `confirmed→cancelled`; `cancelled→refunded` (chỉ Admin) — và **từ chối** set tay `pending/confirmed`, sai chiều.
- [ ] Snapshot lưu đúng giá/tên/ảnh/recipient/`sellerShopName` tại thời điểm tạo.
- [ ] `api_lint` + `api_typecheck` + `test` PASS (unit cho reserve/restock/state-machine).

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS
- [ ] committed

## Verification Plan
- Commands:
  - `npm --prefix backend run lint`
  - `npx tsc --noEmit -p backend/tsconfig.json`
  - `npm --prefix backend run test`
- Manual/UAT evidence: unit test mô phỏng thiếu tồn → không trừ; restock gọi 2 lần → tồn chỉ về 1 lần.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-3-task-02-round-1-review.md`

## Files to Create/Modify
- `backend/src/modules/orders/schemas/checkout.schema.ts`
- `backend/src/modules/orders/schemas/order.schema.ts`
- `backend/src/modules/orders/schemas/payment.schema.ts`
- `backend/src/modules/orders/order.service.ts` (core methods)
- `backend/src/modules/orders/order-state.util.ts`
- `backend/src/modules/orders/orders.module.ts`

## Notes
- Tách model/core khỏi HTTP để Layer 4 (API) không tạo phụ thuộc trong cùng layer.
- Mọi transaction dùng `session.withTransaction`; yêu cầu MongoDB replica set.
- Nguồn: `SPECIFICATIONS.md` R-07, R-08, R-10 · `docs/ERD.md`.
