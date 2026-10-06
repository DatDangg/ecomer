# Task 01: FE — Auth (login/register) + API client auth + token/redirect

## Layer
2

## Type
build (initial)

## Description
Dựng màn đăng nhập/đăng ký và nối vào auth API thật (rút gọn từ task FE auth cũ — **bỏ seller setup**):
screen #1 `/login`, #2 `/register` theo `.context/design-spec.md` + design tokens, cùng một **hồ sơ cá nhân cơ bản**
`/profile` để kiểm chứng token end-to-end (prefill/sửa `fullName`, `phone`, `address`).

- Gọi `POST /auth/login` / `POST /auth/register` qua `apiPost` (`frontend/src/lib/api-client.ts` đã có sẵn
  interceptor gắn bearer + refresh single-flight). Lưu session bằng `useAuthStore.login()` (đã có ở Layer 0).
- Form dùng Formik + Yup (`features/auth/*`): email + password (show/hide), register thêm `fullName` +
  password min 8, lỗi inline gắn field; không có role selector.
- Xử lý lỗi API: sai password → 401 inline; email trùng → 409 + link về `/login`; tài khoản bị khóa →
  đúng message `Tài khoản đã bị khóa`; lỗi mạng → retry an toàn.
- Sau login: redirect tới đích an toàn (từ `location.state.from` nếu hợp lệ) hoặc `/products`.
- Auth store + route guards (`PrivateRoute`) đã có ở Layer 0; task này wire API + form + redirect, không viết lại store.
- `/profile`: `GET /users/me` prefill, `PATCH /users/me` chỉ field cho phép (fullName/phone/address), lỗi giữ giá trị đã nhập.

## Dependencies
- task-01 Layer 1 (Auth API: register/login/refresh) + task-02 Layer 1 (User profile API `GET/PATCH /users/me`)
- task-05/06 Layer 0 (FE shells + data layer: `api-client`, `auth.store`, `query-client`, tokens)

## Acceptance Criteria
- [ ] `/login` và `/register` render đúng design spec; validate + submit 1 lần khi pending.
- [ ] Login thành công → lưu `{ user, accessToken, refreshToken }` vào `auth.store`, redirect đích an toàn hoặc `/products`.
- [ ] Sai password → lỗi inline; email trùng → thông báo + link login; khóa tài khoản → đúng `Tài khoản đã bị khóa`.
- [ ] Password show/hide có accessible name + pressed state; không social login.
- [ ] `/profile` prefill đúng từ `GET /users/me`; PATCH chỉ gửi field cho phép; lỗi giữ giá trị đã nhập.
- [ ] Session hết hạn (401) xử lý qua interceptor sẵn có → clear session + quay `/login` (không tự viết lại).
- [ ] A11y: label bền vững, `autocomplete` email/password, focus vào field lỗi đầu tiên, target ≥ 44px.
- [ ] Responsive 375/768/1280 theo design spec; copy tiếng Việt, không có role selector.
- [ ] `web_lint` + `web_typecheck` PASS.

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass (form validation + redirect + lỗi API quan trọng)
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS
- [ ] committed

## Verification Plan
- Commands:
  - `pnpm --dir frontend run lint` (web_lint)
  - `pnpm --dir frontend exec tsc --noEmit` (web_typecheck)
  - `pnpm --dir frontend run test` (nếu có test script; nếu không ghi rõ)
- Manual/UAT evidence: register → login → thấy `/profile` prefill → gọi `/products` kèm token không lỗi 401.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-2-task-01-round-1-review.md`

## Files to Create/Modify
- `frontend/src/pages/auth/LoginPage.tsx`, `RegisterPage.tsx`
- `frontend/src/pages/account/ProfilePage.tsx`
- `frontend/src/api/auth.ts`, `frontend/src/api/users.ts`
- `frontend/src/features/auth/*` (Yup schema, hooks, redirect helper)
- `frontend/src/router/index.tsx` (thay `PlaceholderPage` cho `/login`, `/register`, `/profile`)

## Notes
- Adapt rút gọn từ task FE auth cũ (đã archive tại `tasks/ecommerce-mvp/archive/layer-6-task-02.md`):
  giữ login/register + profile; **bỏ** `/seller/setup`.
- Không lưu token ngoài `auth.store` (đã persist có kiểm soát); không log token.
- Dùng `react-toastify` chỉ cho lỗi không thuộc form; lỗi form hiển thị inline.
- Ref screen specs #1–#3 trong `.context/design-spec.md`.
- Nguồn: `SPECIFICATIONS.md` R-01, R-02 · `docs/USER_FLOW.md` · `docs/PERMISSION.md`.
