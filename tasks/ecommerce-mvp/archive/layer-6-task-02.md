# Task 02: FE — Auth, profile & seller setup screens

## Layer
6

## Type
build (initial)

## Description
Dựng screen #1 `/login`, #2 `/register`, #3 `/profile`, #4 `/seller/setup` theo `.context/design-spec.md` +
`skills/react-nodejs/design-tokens.md`: form đăng nhập/đăng ký (Formik + Yup, show/hide password, lỗi inline),
profile form prefill `/users/me`, seller setup form (`shopName` 3–50 + `pickupAddress`). Sau login redirect
đến đích an toàn hoặc product list; xử lý `Tài khoản đã bị khóa`.

## Dependencies
- task-01 Layer 1 (Auth API) + task-02 Layer 1 (User/Shop API) + task-05/06 Layer 0 (shells + data layer)

## Acceptance Criteria
- [ ] Login/Register validate + submit 1 lần khi pending; email trùng hiện lỗi rõ + link login.
- [ ] Sai password/khóa tài khoản hiển thị đúng message (`Tài khoản đã bị khóa`).
- [ ] Profile prefill đúng; PATCH chỉ field cho phép; lỗi giữ nguyên giá trị đã nhập.
- [ ] Seller setup enforce 3–50 ký tự; lưu xong điều hướng seller products.
- [ ] Không có role selector; a11y label/autocomplete/focus first-invalid.
- [ ] Responsive 375/768/1280; copy tiếng Việt.
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
- Manual/UAT evidence: đăng ký → login → sửa profile → setup shop; test email trùng.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-6-task-02-round-1-review.md`

## Files to Create/Modify
- `frontend/src/pages/auth/LoginPage.tsx`, `RegisterPage.tsx`
- `frontend/src/pages/account/ProfilePage.tsx`
- `frontend/src/pages/seller/ShopSetupPage.tsx`
- `frontend/src/api/auth.ts`, `users.ts`
- `frontend/src/features/auth/*` (schema Yup, hooks)

## Notes
- Ref screen specs #1–#4 trong `.context/design-spec.md`.
- Không social login. Không lưu token không an toàn.
