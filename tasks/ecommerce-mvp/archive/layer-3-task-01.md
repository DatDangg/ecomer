# Task 01: Cart module (login-only DB cart, grouped by seller)

## Layer
3

## Type
build (initial)

## Description
Module Cart: schema `Cart` (`userId` unique, `items[{ productId, quantity }]`, timestamps).
`GET /cart` trả `groups[]` (nhóm theo người bán) + `totalAmount`; giá **tính lại từ DB**, item hết hàng/ẩn/bị
block tự loại khi load. `POST /cart/items` (không thêm SP của chính mình → 400; Admin mua → 403),
`PATCH /cart/items/:productId`, `DELETE /cart/items/:productId`, `DELETE /cart` (clear).

## Dependencies
- task-02 Layer 2 (Product: giá/tồn/trạng thái) + task-04 Layer 0 (guards)

## Acceptance Criteria
- [ ] Chỉ user đăng nhập có cart; Admin gọi cart/checkout → 403.
- [ ] Thêm SP của chính mình → 400; thêm SP ẩn/block/hết hàng → 400 (hoặc từ chối nhất quán).
- [ ] `GET /cart` nhóm theo seller, `totalAmount` tính từ giá DB (không tin giá client).
- [ ] Item không còn hợp lệ tự bị loại khi load, kèm cờ/thông báo để FE giải thích.
- [ ] `PATCH` quantity vượt stock → 400; `DELETE` item clear đúng.
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
- Manual/UAT evidence: thêm 2 SP khác seller → groups 2; SP hết hàng tự loại khi load.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-3-task-01-round-1-review.md`

## Files to Create/Modify
- `backend/src/modules/cart/cart.schema.ts`
- `backend/src/modules/cart/cart.service.ts`
- `backend/src/modules/cart/cart.controller.ts`
- `backend/src/modules/cart/dto/*.ts`

## Notes
- Không có Guest cart/merge (BR-AUTH-012).
- Làm rõ field "item không hợp lệ" trong response (vd `invalidItems[]` hoặc item có `available:false`) — contract thống nhất với FE Layer 6.
- Nguồn: `SPECIFICATIONS.md` R-06 · `docs/USER_FLOW.md`.
