# Task 02: Product module (seller CRUD + public browse)

## Layer
2

## Type
build (initial)

## Description
Module Product đầy đủ: schema `Product` (`sellerId` **bất biến**, `slug` unique tự sinh, `name` ≤ 120,
`price` > 0 (VNĐ), `stock` ≥ 0, `images[]` ≤ 5 URL Cloudinary của app, `categoryId`, `description`,
`isActive`, `isBlocked`, `blockReason`, text index; index `sellerId/categoryId/name/price` + compound
`{isActive,isBlocked}`). Seller: `POST /products` (cần shop, nếu chưa có → 403), `GET /products/my`
(gồm cả ẩn/bị block + `blockReason`), `PATCH /products/:id`, `DELETE /products/:id` (soft delete
`isActive=false`). Public: `GET /products` (filters `search/categoryId/sellerId/minPrice/maxPrice/sortBy/order`,
phân trang ≤ 100, chỉ `isActive && !isBlocked`), `GET /products/:id` (ẩn/block → 404 trừ owner/admin).

## Dependencies
- task-02 Layer 1 (Shop: cần `shopName` để bán) · task-03 Layer 1 (category hợp lệ) · task-04 Layer 0 (guards)

## Acceptance Criteria
- [ ] `POST /products` gán `sellerId` từ token (không nhận từ body); user chưa có shop → 403.
- [ ] Giá ≤ 0 → 400; stock < 0 → 400; name > 120 → 400; > 5 ảnh → 400; ảnh không thuộc Cloudinary app → 400.
- [ ] `PATCH`/`DELETE` sai chủ → 403; Admin thao tác được mọi SP; `sellerId`/`slug`/`isBlocked`/`blockReason` không nhận từ body.
- [ ] `DELETE` = soft delete (`isActive=false`), SP biến mất khỏi public list.
- [ ] `GET /products` chỉ trả public hợp lệ; filter + sort `{price|createdAt|name}` × `{asc|desc}` (mặc định `createdAt desc`); `limit` tối đa 100.
- [ ] Route `/products/my` khai báo **trước** `/products/:id`.
- [ ] SP `stock=0` hiển thị trạng thái hết hàng ở response metadata/field ổn định cho FE.
- [ ] `api_lint` + `api_typecheck` + `test` PASS.

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass (CRUD + filter/sort + quyền)
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS
- [ ] committed

## Verification Plan
- Commands:
  - `npm --prefix backend run lint`
  - `npx tsc --noEmit -p backend/tsconfig.json`
  - `npm --prefix backend run test`
- Manual/UAT evidence: seller A tạo SP → seller B PATCH SP của A = 403; filter giá trả đúng; SP ẩn không lộ public.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-2-task-02-round-1-review.md`

## Files to Create/Modify
- `backend/src/modules/products/product.schema.ts`
- `backend/src/modules/products/products.service.ts`
- `backend/src/modules/products/products.controller.ts` (seller + public, `/my` trước `/:id`)
- `backend/src/modules/products/dto/create-product.dto.ts`, `update-product.dto.ts`, `query-product.dto.ts`

## Notes
- Task lớn hơn mức 1–3 file vì schema/service/controller/DTO gắn chặt một domain; chấp nhận (ưu tiên đúng dependency hơn chia nhỏ giả tạo).
- Atomic stock `updateOne({ _id, stock: {$gte: qty}, isActive: true, isBlocked: false }, { $inc: { stock: -qty } })` sẽ dùng ở Layer 3/4 nhưng nên cung cấp ở service này.
- Nguồn: `SPECIFICATIONS.md` R-04, R-05 · `docs/API_SPEC.md` · `docs/ERD.md`.
