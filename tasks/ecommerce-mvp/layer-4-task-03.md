# Task 03: Order status transitions (seller fulfillment + admin refund)

## Layer
4

## Type
build (initial)

## Description
`PATCH /orders/:id/status` với state machine: seller `confirmed→shipping`, `shipping→delivered`,
`confirmed→cancelled` (reason bắt buộc, hoàn stock đúng 1 lần); Admin `cancelled→refunded` **chỉ khi `paid`**.
Chặn set tay `pending`/`confirmed`, sai chiều → 400; sai chủ → 403. Admin cập nhật được mọi đơn.

## Dependencies
- task-02 Layer 3 (Order model + state-machine validator + restockAndCancel)

## Acceptance Criteria
- [ ] Seller chỉ đổi đơn của mình (403 nếu sai chủ); Admin đổi mọi đơn.
- [ ] Chỉ transition hợp lệ được chấp nhận; sai chiều/set tay `pending|confirmed` → 400.
- [ ] `confirmed→cancelled` yêu cầu `reason` không rỗng (400 nếu thiếu) và **hoàn stock 1 lần**.
- [ ] `cancelled→refunded` chỉ Admin và chỉ khi `paid`; đơn chưa `paid` → 400.
- [ ] Không xoá Order; `delivered`/`refunded` là trạng thái cuối.
- [ ] `api_lint` + `api_typecheck` + `test` PASS.

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
- Manual/UAT evidence: `pending→shipping` → 400; `confirmed→cancelled` 2 lần → tồn chỉ hoàn 1 lần.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-4-task-03-round-1-review.md`

## Files to Create/Modify
- `backend/src/modules/orders/orders.controller.ts` (route `PATCH /:id/status`)
- `backend/src/modules/orders/order-status.service.ts`
- `backend/src/modules/orders/dto/update-order-status.dto.ts`

## Notes
- Hoàn stock dùng `restockAndCancel` từ OrderService core (idempotent).
- Review mức STRICT (state + stock hoàn).
- Nguồn: `SPECIFICATIONS.md` R-10 · `docs/USER_FLOW.md` §3.
