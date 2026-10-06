# Task 02: Admin product moderation API (list / block / unblock)

## Layer
5

## Type
build (initial)

## Description
Admin: `GET /admin/products` (bao gồm **cả hidden/blocked**, filter theo trạng thái/seller/category/search,
phân trang), `PATCH /admin/products/:id/block` (reason bắt buộc), `PATCH /admin/products/:id/unblock`.
Phân biệt rõ block do Admin đặt (`blockReason` tự nhập) với cascade `seller_banned`.

## Dependencies
- task-02 Layer 2 (Product schema + service)

## Acceptance Criteria
- [ ] Chỉ Admin (403 nếu không).
- [ ] `GET /admin/products` trả cả SP ẩn/bị block, kèm `blockReason`; filter + phân trang đúng.
- [ ] Block yêu cầu reason không rỗng (400 nếu thiếu), set `isBlocked=true` + `blockReason`.
- [ ] Unblock set `isBlocked=false`, xoá `blockReason` Admin; **không** mở SP nếu seller còn bị ban (`seller_banned` giữ).
- [ ] SP bị block không xuất hiện public; owner vẫn thấy trong `/products/my`.
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
- Manual/UAT evidence: block SP không reason → 400; SP blocked không hiện public, owner vẫn thấy `/products/my`.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-5-task-02-round-1-review.md`

## Files to Create/Modify
- `backend/src/modules/admin/admin-products.controller.ts`
- `backend/src/modules/admin/admin-products.service.ts`
- `backend/src/modules/admin/dto/block-product.dto.ts`, `query-admin-product.dto.ts`

## Notes
- Admin không tự ban mình; không xoá order.
- Nguồn: `SPECIFICATIONS.md` R-11 · `docs/DESIGN.md` (Kiểm duyệt SP).
