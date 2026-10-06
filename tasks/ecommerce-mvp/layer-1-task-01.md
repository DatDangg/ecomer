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

## Dependencies
- task-04 Layer 0 (User schema + UsersService + JwtStrategy + guards + admin seed)

## Acceptance Criteria
- [ ] Register 201, response không chứa `password`/`passwordHash`.
- [ ] Email trùng → 409; sai password login → 401.
- [ ] Login trả đúng `{ user, accessToken, refreshToken }`; access 15m, refresh 7d.
- [ ] Refresh token sai/hết hạn → 401; login thiết bị mới vô hiệu hoá token cũ (1 token/user).
- [ ] Logout xoá refresh hash; refresh sau logout → 401.
- [ ] `isActive=false` → login 403 `Tài khoản đã bị khóa`; `/auth/*` bị throttle (429 khi vượt).
- [ ] `api_lint` + `api_typecheck` + `test` PASS.

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass (register/login/refresh/logout + 409/401/403)
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS
- [ ] committed

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
