# Task 03: Category API (admin CRUD + public list)

## Layer
1

## Type
build (initial)

## Description
Module Category: schema `Category` (name unique, `slug` tự sinh unique, `isActive`, `image?`, timestamps).
Admin CRUD: `POST /categories`, `PATCH /categories/:id`, `DELETE /categories/:id`; public `GET /categories`
(chỉ active), `GET /categories/:id`. Tên trùng → 409; xoá category còn sản phẩm (mọi shop) → 400.

## Dependencies
- task-02 Layer 0 (base schema/contract) + task-04 Layer 0 (guards/roles)

## Acceptance Criteria
- [ ] `POST /categories` (admin) tạo category, `slug` tự sinh từ tên; trùng tên → 409.
- [ ] `PATCH/DELETE` yêu cầu admin (403 nếu không).
- [ ] `DELETE` category còn SP → 400 kèm message rõ; không còn SP thì xoá được.
- [ ] `GET /categories` public chỉ trả `isActive=true`; hỗ trợ sắp xếp/tìm kiếm cơ bản.
- [ ] `slug` không nhận/không sửa từ body (mass assignment).
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
- Manual/UAT evidence: tạo 2 category trùng tên → 409; gán SP rồi xoá category → 400.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-1-task-03-round-1-review.md`

## Files to Create/Modify
- `backend/src/modules/categories/category.schema.ts`
- `backend/src/modules/categories/categories.service.ts`
- `backend/src/modules/categories/categories.controller.ts`
- `backend/src/modules/categories/dto/*.ts`

## Notes
- Kiểm tra "còn SP" đếm qua `@InjectConnection()` collection `products` để **không phụ thuộc Product module (Layer 2)**.
- Category là collection dùng chung; hiển thị public chỉ active.
- Nguồn: `SPECIFICATIONS.md` R-03 · `docs/API_SPEC.md`.

## Close-out Status (primary reconcile)
- Reviewer: PASS (STRICT round 2, after fix round 1) · Commit: `fa42d5e` · Date: 2026-10-06
