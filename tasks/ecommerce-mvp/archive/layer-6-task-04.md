# Task 04: FE — Customer order screens (`/orders/my`, `/orders/my/:id`)

## Layer
6

## Type
build (initial)

## Description
Dựng screen #12 `/orders/my` và #13 `/orders/my/:id` theo `.context/design-spec.md` + design tokens:
danh sách đơn nhóm theo `checkoutCode`, filter status (URL query), phân trang; chi tiết đơn hiển thị
snapshot item/recipient/payment state + trạng thái đơn; đơn người khác → not-found.

## Dependencies
- task-02 Layer 4 (Order read APIs) + task-05/06 Layer 0 (shells + data layer)

## Acceptance Criteria
- [ ] `/orders/my` nhóm theo checkout, mỗi order seller độc lập; filter + pagination đồng bộ URL.
- [ ] `/orders/my/:id` hiển thị snapshot bất biến, trạng thái + payment text (không chỉ màu).
- [ ] Đơn của người khác → not-found state (không lộ tồn tại).
- [ ] Trạng thái loading/empty/error/pagination-loading đầy đủ; empty có hành động khám phá.
- [ ] Responsive 375 (card stacked) / 768 / 1280; a11y list/heading + filter label.
- [ ] `web_lint` + `web_typecheck` PASS.

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS
- [ ] committed

## Verification Plan
- Commands:
  - `pnpm --dir frontend run lint` (web_lint)
  - `pnpm --dir frontend exec tsc --noEmit` (web_typecheck)
- Manual/UAT evidence: tạo 2 checkout → list nhóm đúng; mở chi tiết; thử id người khác → not-found.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-6-task-04-round-1-review.md`

## Files to Create/Modify
- `frontend/src/pages/orders/MyOrdersPage.tsx`
- `frontend/src/pages/orders/MyOrderDetailPage.tsx`
- `frontend/src/components/order/OrderGroup.tsx`, `OrderStatusBadge.tsx`
- `frontend/src/api/orders.ts` (read hooks)

## Notes
- Ref screen specs #12–#13 trong `.context/design-spec.md`.
- Không hiển thị điều khiển huỷ/hoàn tiền cho customer.
