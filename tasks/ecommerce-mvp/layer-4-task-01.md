# Task 01: Checkout / create order transaction (`POST /orders`)

## Layer
4

## Type
build (initial)

## Description
`POST /orders` (login, Admin 403): đọc cart của user → validate toàn bộ item (tồn kho, `isActive`,
`!isBlocked`, không phải SP của chính mình) → nhóm theo `sellerId` → trừ stock nguyên tử → tạo
**1 Checkout + N Order** (mỗi seller 1 Order, đều `pending`) trong **một MongoDB transaction**
(`session.withTransaction`). All-or-nothing: 1 item lỗi → 400, không tạo gì, stock không đổi.
`expiresAt = now + 30 phút`. Response: `checkoutId`, `checkoutCode`, `totalAmount`, `expiresAt`, `orders[]`,
`vnpayUrl` (từ `VnpayService`, Layer 3).

## Dependencies
- task-01 Layer 3 (Cart) + task-02 Layer 3 (Order/Checkout models + OrderService core) + task-03 Layer 3 (VnpayService) + task-04 Layer 0 (guards)

## Acceptance Criteria
- [ ] Admin gọi → 403; guest → 401; cart rỗng → 400.
- [ ] 1 SP thiếu tồn/hết/ẩn/block hoặc mua SP của mình → 400 và **không** tạo Checkout/Order, stock không đổi.
- [ ] Thành công: 1 Checkout + N Order (`pending`), mỗi Order đúng 1 `sellerId`, snapshot đầy đủ.
- [ ] Stock trừ đúng số lượng, không âm; thao tác nằm trong transaction.
- [ ] `expiresAt` = +30 phút; response có `vnpayUrl` hợp lệ.
- [ ] `api_lint` + `api_typecheck` + `test` PASS (integration test transaction rollback).

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
- Manual/UAT evidence: cart 2 seller → 1 checkout + 2 order; ép 1 item hết tồn → 400, tồn không đổi.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-4-task-01-round-1-review.md`

## Files to Create/Modify
- `backend/src/modules/orders/orders.controller.ts` (route `POST /orders`)
- `backend/src/modules/orders/checkout.service.ts`
- `backend/src/modules/orders/dto/create-order.dto.ts`

## Notes
- Xoá item đã mua khỏi cart xảy ra khi **thanh toán thành công** (task VNPay), không phải lúc tạo order.
- Review mức STRICT (DB transaction + data integrity).
- Nguồn: `SPECIFICATIONS.md` R-07 · `docs/USER_FLOW.md` §4.
