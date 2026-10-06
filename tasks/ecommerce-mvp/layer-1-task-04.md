# Task 04: Product module rút gọn (public browse) + seed dữ liệu mẫu

## Layer
1

## Type
build (initial)

## Description
Dựng **một phần** module Product đủ cho luồng duyệt sản phẩm (browse) của MVP cơ bản:

1. **Schema `Product`** (rút gọn, dùng `withBaseSchemaOptions()`): `sellerId` (**bất biến**), `slug` (unique, tự sinh),
   `name` (≤120, có text index), `price` (> 0, nguyên VNĐ), `stock` (≥ 0), `images[]`, `categoryId`,
   `description`, `isActive` (default true), `isBlocked` (default false). Index cần thiết:
   `slug` unique; `sellerId`; `categoryId`; `name` text; `price`; compound `{ isActive, isBlocked }`.
2. **Seed dữ liệu mẫu** (idempotent, chạy tay — KHÔNG tự chạy khi server khởi động production):
   tạo vài `Category` (nếu collection rỗng) + vài `Product` mẫu (≥ 6 SP, trải 2–3 category, có sản phẩm
   `stock=0`, có sản phẩm `isActive=false` hoặc `isBlocked=true` để kiểm tra lọc) dùng **URL ảnh public hợp lệ**
   (`https://picsum.photos/seed/<slug>/600/600` hoặc Unsplash công khai). Seed **không** tạo user/seller thật:
   gán `sellerId` từ một user `customer` có sẵn nếu có, ngược lại bỏ qua field bắt buộc và ghi chú.
3. **API public (guest, không cần login):**
   - `GET /products` — filter `search` (text trên `name`), `categoryId`, `sellerId`, `minPrice`, `maxPrice`,
     `sortBy ∈ {price, createdAt, name}` + `order ∈ {asc, desc}` (mặc định `createdAt`/`desc`);
     phân trang `page`/`limit` (`limit` tối đa **100**, mặc định 20); response paginated chuẩn
     `{ items, total, page, limit, totalPages }`; **chỉ trả** `isActive=true && isBlocked=false`.
   - `GET /products/:id` — chỉ trả SP public; SP `isActive=false` hoặc `isBlocked=true` (hoặc không tồn tại)
     → **404**.

**KHÔNG** làm trong task này (deferred, xử lý lại qua `/change`): seller CRUD
(`POST/PATCH/DELETE /products`, `GET /products/my`), upload ảnh (R-13), admin moderation, owner/admin preview
SP ẩn, cart/order.

## Dependencies
- task-02 Layer 0 (base schema/options + response contract `ok()`/`fail()`) + task-04 Layer 0 (guards)
- task-03 Layer 1 (Category schema — dùng để seed category; task-03 vẫn đếm SP qua collection `products` nên không bị chặn)

## Acceptance Criteria
- [ ] `GET /products` public (không token) trả 200, đúng envelope `{ success, data: { items, total, page, limit, totalPages } }`.
- [ ] Chỉ trả `isActive && !isBlocked`; SP `isActive=false`/`isBlocked=true` KHÔNG xuất hiện trong list.
- [ ] Filter `search` khớp `name`; `categoryId`/`sellerId` lọc đúng; `minPrice`/`maxPrice` bao biên đúng.
- [ ] `sortBy` + `order` hoạt động cho `{price|createdAt|name}` × `{asc|desc}`; mặc định `createdAt desc`.
- [ ] `limit` > 100 bị chặn về 100 (hoặc 400 nhất quán); `page` ngoài phạm vi trả `items: []` + `total` đúng.
- [ ] `GET /products/:id` trả SP public; SP ẩn/blocked/không tồn tại → 404.
- [ ] `sellerId`/`slug`/`isBlocked` không nhận từ body ở bất kỳ input nào (chưa có route ghi nên không có bề mặt mass-assignment).
- [ ] Seed idempotent: chạy 2 lần không nhân đôi dữ liệu; chạy được bằng lệnh tài liệu hoá trong task.
- [ ] Test đi kèm (schema + service filter/sort/pagination + controller 404/filter) PASS.
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
  - Seed: `npm --prefix backend run seed:sample` (runner `ts-node`, dùng `NestFactory.createApplicationContext`)
- Manual/UAT evidence: seed xong → `GET /api/v1/products` trả ≥ 6 SP; `?categoryId=<id>` lọc đúng;
  `?sortBy=price&order=asc` đúng thứ tự; SP ẩn/blocked không lộ; `GET /products/:id` của SP ẩn → 404.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-1-task-04-round-1-review.md`

## Files to Create/Modify
- `backend/src/modules/products/product.schema.ts`
- `backend/src/modules/products/products.service.ts`
- `backend/src/modules/products/products.controller.ts`
- `backend/src/modules/products/products.module.ts`
- `backend/src/modules/products/dto/query-product.dto.ts`
- `backend/src/database/seed/sample-seed.service.ts` + `sample-seed.runner.ts`
- `backend/package.json` (script `seed:sample`) + `backend/src/app.module.ts` (đăng ký `ProductsModule`)
- Tests: `backend/src/modules/products/*.spec.ts`, `backend/src/database/seed/sample-seed.service.spec.ts`

## Notes
- Field `slug` tự sinh từ `name` (slugify + đảm bảo unique); `sellerId`/`slug` là server-owned.
- Giá là số nguyên VNĐ (không thập phân). `stock=0` vẫn trả trong list nhưng FE hiển thị "Hết hàng" (R-05).
- Seed **không** dùng `MONGODB_URI_PROD`; chỉ chạy trên DB dev/local. Không seed user/seller giả có mật khẩu.
- Ảnh mẫu là URL public hợp lệ (không phải Cloudinary của app) — chấp nhận trong scope rút gọn vì chưa có upload/validate ảnh (R-13 deferred).
- Task lớn hơn 1–3 file vì schema/service/controller/DTO/seed gắn chặt một domain; chấp nhận.
- Nguồn: `SPECIFICATIONS.md` R-05 (public browse) + R-04 (schema fields/index) · `docs/API_SPEC.md` · `docs/ERD.md`.
