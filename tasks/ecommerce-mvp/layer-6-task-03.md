# Task 03: FE — Cart, checkout & payment result screens

## Layer
6

## Type
build (initial)

## Description
Dựng screen #9 `/cart`, #10 `/checkout`, #11 `/checkout/result?checkoutCode=...` theo `.context/design-spec.md`
+ design tokens: cart nhóm theo shop, quantity/remove, tổng VNĐ; checkout prefill recipient + summary theo
shop + cảnh báo "N shop = N đơn, 1 giao dịch VNPay"; result page **fetch `/checkouts/:checkoutCode`** (không
tin `?status=`), hiển thị paid/failed/expired/pending + link đơn.

## Dependencies
- task-01 Layer 3 (Cart API) + task-01 Layer 4 (Checkout API) + task-04 Layer 4 (payment status) + task-05/06 Layer 0

## Acceptance Criteria
- [ ] Cart nhóm theo shop, tổng tính từ server; item hết hàng/ẩn bị loại kèm giải thích; empty có `Khám phá sản phẩm`.
- [ ] Checkout prefill profile; submit 1 lần; lỗi tồn kho hiển thị inline và **không** tạo checkout.
- [ ] Thành công redirect đúng `vnpayUrl`; giải thích trước khi rời site.
- [ ] Result page lấy trạng thái từ `/checkouts/:checkoutCode`; không suy ra từ query string.
- [ ] Admin không mua (không thấy cart/checkout affordance).
- [ ] Responsive 375/768/1280; a11y (nhóm heading, tổng có nhãn text, live region cho kết quả).
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
- Manual/UAT evidence: thêm 2 shop → checkout → VNPay sandbox → result paid; thử item hết tồn → lỗi inline.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-6-task-03-round-1-review.md`

## Files to Create/Modify
- `frontend/src/pages/cart/CartPage.tsx`
- `frontend/src/pages/checkout/CheckoutPage.tsx`
- `frontend/src/pages/checkout/CheckoutResultPage.tsx`
- `frontend/src/api/cart.ts`, `orders.ts`, `checkouts.ts`
- `frontend/src/features/cart/*`

## Notes
- Ref screen specs #9–#11 trong `.context/design-spec.md`.
- Không celebration animation; trạng thái bằng text + icon.
