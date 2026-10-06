# Task 02: Order read APIs (customer / seller / admin + checkout status)

## Layer
4

## Type
build (initial)

## Description
API đọc đơn: `GET /orders/my` (login, phân trang, filter `status`, nhóm hiển thị theo `checkoutCode`),
`GET /orders/my/:id` (đơn người khác → 404, không lộ tồn tại), `GET /orders/selling` (chỉ đơn của seller
đang đăng nhập) + `GET /orders/selling/:id`, `GET /orders` (Admin, filter `status/sellerId/userId`),
`GET /orders/:id` (Admin), `GET /checkouts/:checkoutCode` (owner/admin — trả trạng thái checkout đã
**xác thực từ server** để trang kết quả thanh toán không tin query string).

## Dependencies
- task-02 Layer 3 (Order/Checkout models + OrderService core)

## Acceptance Criteria
- [ ] `GET /orders/my` chỉ trả đơn của chính mình; phân trang; filter status hợp lệ.
- [ ] Truy cập đơn của người khác (my/selling) → 404.
- [ ] `GET /orders/selling` không lộ đơn seller khác.
- [ ] `GET /orders` + `/:id` chỉ Admin (403 nếu không); filter đúng.
- [ ] `GET /checkouts/:checkoutCode` trả trạng thái thực; 404 nếu không tồn tại/không phải owner-admin.
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
- Manual/UAT evidence: user B xem đơn user A → 404; admin xem được mọi đơn.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-4-task-02-round-1-review.md`

## Files to Create/Modify
- `backend/src/modules/orders/orders.controller.ts` (read routes; `/my`, `/selling` trước `/:id`)
- `backend/src/modules/orders/order-query.service.ts`
- `backend/src/modules/orders/dto/query-order.dto.ts`

## Notes
- Không lộ sự tồn tại của đơn người khác (404, không 403).
- `GET /orders/my` nhóm theo `checkoutCode` — shape response thống nhất với FE Layer 6.
- Nguồn: `SPECIFICATIONS.md` R-09 · `docs/PERMISSION.md`.
