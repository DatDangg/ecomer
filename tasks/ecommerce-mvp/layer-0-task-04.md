# Task 04: Backend identity foundation (User schema, JWT strategy, guards, admin seed)

## Layer
0

## Type
build (initial)

## Description
Dựng nền danh tính cho toàn bộ backend: schema `User` (email unique, `passwordHash`, `fullName`, `phone`,
`address`, `role: customer|admin`, `isActive`, `refreshTokenHash`, `shopName`, `pickupAddress`, timestamps)
+ `UsersService` (`findById`, `findByEmail` có password, `create`); `JwtModule` cấu hình access 15m /
refresh 7d; `JwtStrategy.validate` đọc `isActive` mỗi request (ban hiệu lực ngay, 403 `Tài khoản đã bị khóa`);
guards `JwtAuthGuard` / `OptionalJwtAuthGuard` / `RolesGuard`; decorators `@CurrentUser()`, `@Public()`,
`@Roles()`; helper `assertOwnerOrAdmin()` (ghi sai chủ 403, đọc "của tôi" sai chủ 404); seed admin idempotent
từ `ADMIN_EMAIL`/`ADMIN_PASSWORD` (bcrypt) khi bootstrap — **không có API gán role**.

## Dependencies
- task-02 (cần Mongoose connection + base schema + response/error foundation)

## Acceptance Criteria
- [ ] Request thiếu/sai access token → 401; user `isActive=false` dù token còn hạn → 403 đúng message.
- [ ] `@Public()` bỏ qua auth; `OptionalJwtAuthGuard` cho phép guest nhưng gắn user khi có token.
- [ ] `RolesGuard` chặn non-admin ở route admin (403).
- [ ] `assertOwnerOrAdmin` dùng được: ghi sai chủ 403, đọc "của tôi" của người khác 404.
- [ ] Admin seed tạo đúng 1 lần, chạy lại không lỗi (idempotent); password không bao giờ serialize ra response.
- [ ] `api_lint` + `api_typecheck` + `test` PASS.

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass (guard + seed + hash)
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS
- [ ] committed

## Verification Plan
- Commands:
  - `npm --prefix backend run lint`
  - `npx tsc --noEmit -p backend/tsconfig.json`
  - `npm --prefix backend run test`
- Manual/UAT evidence: gọi route được bảo vệ không token = 401; user bị ban = 403.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-0-task-04-round-1-review.md`

## Files to Create/Modify
- `backend/src/modules/users/user.schema.ts`
- `backend/src/modules/users/users.service.ts`, `backend/src/modules/users/users.module.ts`
- `backend/src/modules/auth/jwt.config.ts`, `backend/src/modules/auth/jwt.strategy.ts`
- `backend/src/common/guards/jwt-auth.guard.ts`, `optional-jwt-auth.guard.ts`, `roles.guard.ts`
- `backend/src/common/decorators/current-user.decorator.ts`, `public.decorator.ts`, `roles.decorator.ts`
- `backend/src/common/utils/ownership.util.ts`
- `backend/src/database/seed/admin-seed.service.ts`

## Notes
- Refresh token lưu **hash SHA-256** (1 token/user) — logic phát token cụ thể ở Layer 1 task Auth.
- `role` mặc định `customer`; không nhận `role`/`isActive` từ body (mass assignment).
- Đây là **skeleton** guards/strategy; Auth endpoints (register/login/...) hoàn thiện ở Layer 1.
- Admin seed chạy trong `OnApplicationBootstrap`, bỏ qua nếu env thiếu.
