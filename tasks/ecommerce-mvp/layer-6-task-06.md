# Task 06: FE — Admin screens (dashboard, users, products, categories, orders)

## Layer
6

## Type
build (initial)

## Description
Dựng screen #18 `/admin`, #19 `/admin/users`, #20 `/admin/products`, #21 `/admin/orders`,
#22 `/admin/categories` theo `.context/design-spec.md` + design tokens: admin side nav, user list +
ban/unban (confirm, self-ban disabled, giải thích cascade), product moderation (block reason bắt buộc),
category CRUD (dialog, slug server-side), order list/detail + `refunded` chỉ khi `paid`. Không fake metrics.

## Dependencies
- task-01 Layer 5 (Admin users API) + task-02 Layer 5 (Admin products API) + task-03 Layer 1 (Category CRUD) + task-02 Layer 4 (Admin order read) + task-05/06 Layer 0

## Acceptance Criteria
- [ ] Admin route guard: non-admin → 403/redirect; nav `aria-current`.
- [ ] Users: search/filter/pagination; ban self disabled; ban confirm giải thích block SP; unban confirm.
- [ ] Products: list gồm hidden/blocked + reason; block yêu cầu reason; unblock rõ ràng.
- [ ] Categories: create/edit/delete + confirm; lỗi "còn sản phẩm" hiển thị đúng; slug không sửa được.
- [ ] Orders: filter status/seller/buyer; detail cho phép transition hợp lệ; `refunded` chỉ khi `paid`.
- [ ] Không hiển thị fake stats; responsive 375 (row card) / 768 / 1280 (table); a11y table/dialog.
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
- Manual/UAT evidence: ban seller → SP bị block cascade; block SP không reason → chặn; xoá category còn SP → lỗi.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-6-task-06-round-1-review.md`

## Files to Create/Modify
- `frontend/src/pages/admin/AdminDashboardPage.tsx`
- `frontend/src/pages/admin/AdminUsersPage.tsx`
- `frontend/src/pages/admin/AdminProductsPage.tsx`
- `frontend/src/pages/admin/AdminCategoriesPage.tsx`
- `frontend/src/pages/admin/AdminOrdersPage.tsx`
- `frontend/src/api/admin.ts`, `categories.ts` (admin hooks)

## Notes
- Ref screen specs #18–#22 trong `.context/design-spec.md`.
- PRD loại bỏ analytics/reporting → dashboard chỉ là index + link, không bịa số liệu.
