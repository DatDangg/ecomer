# Task 01: Auth API (register / login / refresh / logout)

## Layer
1

## Type
build (initial)

## Description
Hoàn thiện `AuthModule`: `POST /auth/register` (email + password bcrypt, email unique, public luôn
`role=customer`, không trả password), `POST /auth/login` (access 15m + refresh 7d + user), `POST /auth/refresh`
(xác thực refresh token + hash SHA-256 trong DB, 1 token/user), `POST /auth/logout` (xoá refresh hash).
Áp throttle 10 req/phút/IP cho `/auth/*`.
**Prerequisite (từ phase review L0):** đăng ký runtime JWT — `AuthModule` import `JwtModule.registerAsync(buildJwtModuleOptions)`, `PassportModule`, provider `JwtStrategy` (đã có ở L0 task-04 nhưng chưa wire). Đăng ký `JwtAuthGuard` là `APP_GUARD` toàn cục (tôn trọng `@Public()`); `OptionalJwtAuthGuard` dùng cho route public-optional.

## Dependencies
- task-04 Layer 0 (User schema + UsersService + JwtStrategy + guards + admin seed)

## Acceptance Criteria
- [x] Register 201, response không chứa `password`/`passwordHash`.
- [x] Email trùng → 409; sai password login → 401.
- [x] Login trả đúng `{ user, accessToken, refreshToken }`; access 15m, refresh 7d.
- [x] Refresh token sai/hết hạn → 401; login thiết bị mới vô hiệu hoá token cũ (1 token/user).
- [x] Logout xoá refresh hash; refresh sau logout → 401.
- [x] `isActive=false` → login 403 `Tài khoản đã bị khóa`; `/auth/*` bị throttle (429 khi vượt).
- [x] `JwtModule` + `PassportModule` + `JwtStrategy` được đăng ký runtime; `JwtAuthGuard` là `APP_GUARD` toàn cục (`@Public()` bypass); route bảo vệ không token → 401.
- [x] `api_lint` + `api_typecheck` + `test` PASS.

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass (register/login/refresh/logout + 409/401/403)
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (round 4)
- [x] committed

## Close-out (2026-10-06)
- **Reviewer:** PASS round 4 (STRICT). R1 [MAJOR] bcrypt 72-byte vs char-length → `@MaxUtf8Bytes(72)`; R3 [MAJOR] race đăng ký trùng email → 500 → map Mongo `code 11000` → 409.
- **Verify:** `npm --prefix backend run lint` PASS · `tsc --noEmit` PASS · `npm --prefix backend run test` PASS (24 suites / 131 tests).
- **Doc impact:** reconciled `docs/PERMISSION.md` + `docs/ARCHITECTURE.md` (global `JwtAuthGuard` now wired, `@Public()` bypass).
- **Residual:** R3 [MINOR] `createUserStore()` helper >50 dòng (deferred); login path/admin seed chưa áp byte-limit; live Mongo concurrency chưa exercise.

## Verification Plan
- Commands:
  - `npm --prefix backend run lint`
  - `npx tsc --noEmit -p backend/tsconfig.json`
  - `npm --prefix backend run test`
- Manual/UAT evidence: curl register→login→refresh→logout; kiểm tra 409/401/403.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-1-task-01-round-1-review.md`

## Files to Create/Modify
- `backend/src/modules/auth/auth.controller.ts`
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/auth.module.ts`
- `backend/src/modules/auth/dto/register.dto.ts`, `login.dto.ts`, `refresh.dto.ts`

## Notes
- Refresh token = hash SHA-256, không lưu plaintext.
- `role` không nhận từ body (public register luôn customer).
- Nguồn: `SPECIFICATIONS.md` R-01 · `docs/PERMISSION.md`.

## Close-out Status (primary reconcile)
- Reviewer: PASS (STRICT round 4) · Commit: `b985bbf` · Date: 2026-10-06
