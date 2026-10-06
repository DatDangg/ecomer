# Task 05: FE — Seller screens (products, product form, selling orders)

## Layer
6

## Type
build (initial)

## Description
Dựng screen #14 `/seller/products`, #15 `/seller/products/new` + `/seller/products/:id/edit`,
#16 `/orders/selling`, #17 `/orders/selling/:id` theo `.context/design-spec.md` + design tokens:
list SP (filter active/hidden/blocked + block reason), form SP (name/category/description/price/stock +
upload ≤5 ảnh Cloudinary, preview thật, không lộ field mass-assignment), danh sách đơn bán + chi tiết với
action hợp lệ (`Giao hàng`, `Đã giao`, `Hủy đơn` + reason bắt buộc).

## Dependencies
- task-02 Layer 2 (Product API) + task-01 Layer 2 (Upload API) + task-03 Layer 4 (status transitions) + task-05/06 Layer 0

## Acceptance Criteria
- [ ] List SP hiển thị visibility + block reason; filter/pagination; toggle ẩn/hiện không ghi đè block Admin.
- [ ] Form SP: upload ảnh jpeg/png/webp ≤5MB, tối đa 5, first = cover, reorder/remove; validate giá > 0, stock ≥ 0, name ≤120.
- [ ] Form không cho sửa `sellerId/slug/isBlocked/blockReason`.
- [ ] Selling orders chỉ đơn của seller; action chỉ hiện khi transition hợp lệ; cancel yêu cầu reason + confirm.
- [ ] Double-submit bị chặn; lỗi inline; không có action `pending/confirmed/refunded` cho seller.
- [ ] Responsive 375/768/1280; a11y dialog focus trap + label; copy tiếng Việt.
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
- Manual/UAT evidence: tạo SP có ảnh → xuất hiện public; đổi trạng thái đơn selling; huỷ đơn thiếu reason → chặn.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-6-task-05-round-1-review.md`

## Files to Create/Modify
- `frontend/src/pages/seller/SellerProductsPage.tsx`
- `frontend/src/pages/seller/ProductFormPage.tsx`
- `frontend/src/pages/seller/SellingOrdersPage.tsx`
- `frontend/src/pages/seller/SellingOrderDetailPage.tsx`
- `frontend/src/components/upload/ImageUploader.tsx`
- `frontend/src/api/upload.ts`, `orders.ts`

## Notes
- Ref screen specs #14–#17 trong `.context/design-spec.md`.
- Ảnh thật do seller upload; không ảnh giả.
