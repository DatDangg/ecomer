# Task 01: FE — Public discovery screens (home/list/category/product detail/shop)

## Layer
6

## Type
build (initial)

## Description
Dựng screen #5 `/shops/:sellerId`, #6 `/` + `/products`, #7 `/categories/:slug`, #8 `/products/:id` theo
`.context/design-spec.md` và `skills/react-nodejs/design-tokens.md`: header public, search + filter
(search/category/price/sort) gắn query params, product grid + product card (ảnh/name/price/shop/`Hết hàng`),
phân trang, gallery + add-to-cart CTA (guest → `/login`), seller shop header. Chỉ hiển thị SP public hợp lệ.

## Dependencies
- task-02 Layer 2 (Product API) + task-03 Layer 1 (Category API) + task-02 Layer 1 (Shop API) + task-05/06 Layer 0 (FE shells + data layer)

## Acceptance Criteria
- [ ] 4 route render đúng; filter/sort/pagination đồng bộ query params, browser back hoạt động.
- [ ] Trạng thái loading (skeleton giữ geometry)/empty (nút xoá filter)/error (retry) đầy đủ.
- [ ] Product card chỉ hiện SP `isActive && !isBlocked`; `stock=0` có nhãn text `Hết hàng` (không chỉ màu).
- [ ] Product detail ẩn/block → not-found; guest thấy prompt login khi add-to-cart; seller không mua SP của mình.
- [ ] Responsive 375 (2 cột, filter bottom sheet) / 768 (3 cột) / 1280 (filter rail + 4 cột); không tràn ngang.
- [ ] Copy tiếng Việt, giá VNĐ, a11y (label, alt, focus, 44px).
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
- Manual/UAT evidence: chạy FE + BE, lọc theo category/giá, xem 3 breakpoint; guest add-to-cart → login.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-6-task-01-round-1-review.md`

## Files to Create/Modify
- `frontend/src/pages/products/ProductListPage.tsx`
- `frontend/src/pages/products/ProductDetailPage.tsx`
- `frontend/src/pages/products/CategoryPage.tsx`
- `frontend/src/pages/shops/ShopPage.tsx`
- `frontend/src/components/product/*` (ProductCard, ProductGrid, Filters, Pagination, Gallery)
- `frontend/src/api/products.ts`, `categories.ts`, `shops.ts`

## Notes
- Ref screen specs #5–#8 trong `.context/design-spec.md`.
- Dùng `react-toastify` chỉ cho lỗi không thuộc form; lỗi fetch có inline + retry.
- Không tạo fake product/ảnh; dùng ảnh thật từ Cloudinary.
