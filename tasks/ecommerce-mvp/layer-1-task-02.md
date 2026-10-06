# Task 02: User profile & Shop API (`/users/me`, `/users/me/shop`, `/shops/:sellerId`)

## Layer
1

## Type
build (initial)

## Description
API hồ sơ & gian hàng: `GET /users/me`, `PATCH /users/me` (prefill checkout: fullName, phone, address),
`PATCH /users/me/shop` (`shopName` 3–50 ký tự — không bắt buộc unique — + `pickupAddress`),
`GET /shops/:sellerId` public trả `shopName`, `joinedAt`, `productCount`; 404 nếu chưa có shop hoặc seller bị ban.
Chưa có shop → không đăng bán được (403 được enforce ở Product layer).

## Dependencies
- task-04 Layer 0 (User schema + guards + ownership util)

## Acceptance Criteria
- [ ] `GET /users/me` trả profile đã đăng nhập, không có password/refresh hash.
- [ ] `PATCH /users/me` chỉ cập nhật field cho phép; `role`, `isActive`, `email` từ body bị chặn (mass assignment).
- [ ] `PATCH /users/me/shop` validate `shopName` 3–50; lưu `pickupAddress`; trả shop đã cập nhật.
- [ ] `GET /shops/:sellerId` trả `shopName`, `joinedAt`, `productCount`; 404 nếu chưa có shop hoặc user bị ban.
- [ ] `productCount` đếm SP thoả `isActive && !isBlocked` (chưa có Product module → đếm qua collection, xem Notes).
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
- Manual/UAT evidence: PATCH shop 2 ký tự → 400; shop mới → GET public trả đúng `productCount`.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-1-task-02-round-1-review.md`

## Files to Create/Modify
- `backend/src/modules/users/users.controller.ts`
- `backend/src/modules/users/dto/update-profile.dto.ts`, `update-shop.dto.ts`
- `backend/src/modules/users/shops.controller.ts` (hoặc route `/shops` trong module users)

## Notes
- `productCount` ở layer này đếm qua `@InjectConnection()` collection `products` để **không phụ thuộc Product module (Layer 2)**; khi Product module có, có thể refactor.
- Snapshot `sellerShopName` vào order sẽ lấy từ đây ở Layer 3/4.
- Nguồn: `SPECIFICATIONS.md` R-02 · `docs/USER_FLOW.md`.

## Close-out Status (primary reconcile)
- Reviewer: PASS (STRICT round 2, after fix round 1) · Commit: `193c668` · Date: 2026-10-06
