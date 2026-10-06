# Task 05: Product detail response align canonical contract (Layer 1 phase-review fix)

## Layer
1

## Type
build (initial) — phase-review gap fix

## Description
Fix gap do spec-validator phase review Layer 1 round 1 (`.context/review-reports/feature-ecommerce-mvp-phase-1-round-1-review.md`):
`GET /products/:id` public chưa khớp contract canonical `project-ecommerce/06-api-contract.md:269-288`.

1. Response detail đúng shape canonical:
   - `category: { id, name }` (lồng nhau, từ categoryId) — null nếu không có/không tồn tại.
   - `seller: { id, shopName }` (lồng nhau, lấy `shopName` từ user seller) — `shopName` null nếu seller chưa setup shop.
   - **Không** trả `isBlocked` / `blockReason` cho public (owner/admin preview deferred — `layer-1-task-04.md:29-31`).
   - Vẫn giữ `id, name, price, stock, images, description?, isActive`... theo `toProductView`.
2. Thêm assertion test cho list `GET /products`: SP `stock=0` **vẫn xuất hiện** (R-05, để FE hiển thị "Hết hàng").
3. Cập nhật test integration detail: bỏ assertion `isBlocked: false` cho public; thêm assertion có `category.id/name` + `seller.id/shopName` và **không** có key `isBlocked`/`blockReason`.

## Dependencies
- task-04 Layer 1 (Product module) + task-03 (Category) + task-02 (User/Shop)

## Acceptance Criteria
- [ ] `GET /products/:id` (public) trả `data.category = {id,name}` và `data.seller = {id,shopName}`.
- [ ] Public response **không** chứa `isBlocked`/`blockReason`.
- [ ] SP ẩn/blocked/không tồn tại → 404 (giữ nguyên).
- [ ] Test: list chứa SP `stock=0`; detail có nested category/seller + không có isBlocked.
- [ ] Không seller CRUD/upload/owner-preview (deferred).
- [ ] `api_lint` + `api_typecheck` + `test` PASS.

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS
- [ ] committed

## Verification Plan
- Commands: `npm --prefix backend run lint` · `npm --prefix backend exec -- tsc --noEmit -p backend/tsconfig.json` · `npm --prefix backend run test`
- Manual/UAT evidence: `GET /products/:id` JSON có `category`/`seller` lồng nhau, không có `isBlocked`.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-1-task-05-round-1-review.md`

## Files to Create/Modify
- `backend/src/modules/products/products.service.ts` (build nested category/seller, bỏ isBlocked khỏi public view)
- `backend/src/modules/products/products.integration.spec.ts` (nested + không isBlocked + stock=0 list)
- (có thể) `backend/src/modules/products/test-support/*` nếu cần fixture category/user

## Notes
- Dùng `@InjectConnection()` collection `categories` + `users` (như task-02/03 đếm qua collection) để tránh phụ thuộc module; hoặc inject service nếu sạch hơn.
- Nguồn: spec-validator phase review round 1 + `project-ecommerce/06-api-contract.md:269-288`.

## Close-out Status (primary reconcile)
- Reviewer: PASS (STRICT round 1) · Commit: `3c25ca9` · Date: 2026-10-06
- Layer 1 phase review: PASS (spec-validator round 2)
