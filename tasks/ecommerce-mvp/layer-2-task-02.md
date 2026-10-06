# Task 02: FE — Danh sách + chi tiết sản phẩm (filter/sort/pagination)

## Layer
2

## Type
build (initial)

## Description
Dựng màn duyệt sản phẩm công khai (rút gọn từ task FE public discovery cũ — **bỏ shop page và add-to-cart**):
- `/products` (và `/` trỏ cùng màn hoặc render `ProductListPage`): grid sản phẩm, search + filter
  (category, price range, sort) **đồng bộ query params** để chia sẻ link và browser back hoạt động.
- `/products/:id`: chi tiết SP (gallery ảnh, tên, giá VNĐ, tình trạng tồn, mô tả, link category).
  SP ẩn/blocked/không tồn tại → not-found state (không lộ chi tiết).
- API client: `frontend/src/api/products.ts`, `categories.ts` gọi `GET /products`, `GET /products/:id`,
  `GET /categories`; dùng TanStack Query (đã có `query-client` ở Layer 0).
- Chỉ hiển thị SP public (`isActive && !isBlocked` do BE lọc sẵn); `stock=0` hiển thị nhãn text `Hết hàng`
  (không chỉ màu). **Không** có nút add-to-cart / link `/shops/:sellerId` (deferred qua `/change`).

## Dependencies
- task-04 Layer 1 (Product public API) + task-03 Layer 1 (Category list API)
- task-05/06 Layer 0 (FE shells + data layer: api-client, query-client, format utils, routes)

## Acceptance Criteria
- [ ] `/products` render grid từ `GET /products`; loading dùng skeleton giữ geometry; empty có nút xoá filter; error có retry.
- [ ] Search + category + price + sort cập nhật query params (`search|categoryId|minPrice|maxPrice|sortBy|order|page`); back/forward giữ đúng state.
- [ ] Pagination gọi đúng `page`/`limit` (limit ≤ 100) và hiển thị theo `totalPages`.
- [ ] Product card: ảnh (alt = tên), tên, giá VNĐ, `Hết hàng` bằng text khi `stock=0`; click mở `/products/:id`.
- [ ] `/products/:id`: gallery keyboard-operable, selected thumbnail state; SP ẩn/blocked/không tồn tại → not-found.
- [ ] Không có add-to-cart / shop link / cart affordance trong scope này.
- [ ] Responsive 375 (2 cột, filter sheet) / 768 (3 cột) / 1280 (filter rail + 4 cột); không tràn ngang.
- [ ] Copy tiếng Việt, giá VNĐ; a11y (label search, alt, focus, 44px, result count announced).
- [ ] `web_lint` + `web_typecheck` PASS.

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass (query-param sync + empty/error state + not-found)
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS
- [ ] committed

## Verification Plan
- Commands:
  - `pnpm --dir frontend run lint` (web_lint)
  - `pnpm --dir frontend exec tsc --noEmit` (web_typecheck)
  - `pnpm --dir frontend run test` (nếu có test script; nếu không ghi rõ)
- Manual/UAT evidence: seed BE → `/products` hiện SP; lọc category + sort price asc; SP `stock=0` có nhãn `Hết hàng`;
  SP ẩn không lộ; mở chi tiết; đổi filter rồi back giữ state; xem 3 breakpoint.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-2-task-02-round-1-review.md`

## Files to Create/Modify
- `frontend/src/pages/products/ProductListPage.tsx`
- `frontend/src/pages/products/ProductDetailPage.tsx`
- `frontend/src/components/product/*` (ProductCard, ProductGrid, ProductFilters, Pagination, ProductGallery)
- `frontend/src/api/products.ts`, `frontend/src/api/categories.ts`
- `frontend/src/router/index.tsx` (thay `PlaceholderPage` cho `/`, `/products`, `/products/:id`)

## Notes
- Adapt rút gọn từ task FE public discovery cũ (đã archive tại `tasks/ecommerce-mvp/archive/layer-6-task-01.md`):
  giữ list/detail + filter/sort/pagination; **bỏ** `/categories/:slug` (dùng filter `categoryId`), `/shops/:sellerId`, add-to-cart.
- Ảnh: dùng ảnh public từ seed; nếu URL lỗi hiển thị placeholder trung tính (không tạo ảnh giả).
- Ref screen specs #6 và #8 trong `.context/design-spec.md`.
- Nguồn: `SPECIFICATIONS.md` R-05 · `docs/API_SPEC.md` · `docs/USER_FLOW.md`.
