# Task 06: Frontend data layer (axios client, token refresh, TanStack Query, Zustand, shared types)

## Layer
0

## Type
build (initial)

## Description
Dựng tầng dữ liệu dùng chung cho frontend: axios instance (`baseURL = VITE_API_URL + /api/v1`) với
interceptors gắn access token; xử lý 401 → gọi `/auth/refresh` **một lần** rồi retry, thất bại thì clear
session và về `/login`; `QueryClientProvider` (TanStack Query); Zustand auth store (persist user + token);
shared TS types phản chiếu contract `{ success, data, message }` + paginated
`{ items, total, page, limit, totalPages }`; formatter tiền VNĐ; setup `react-toastify`; helper Formik + Yup.

## Dependencies
- task-05 (cần project + tsconfig + tokens trước)

## Acceptance Criteria
- [ ] axios tự gắn `Authorization: Bearer <access_token>` khi đã đăng nhập.
- [ ] 401 → refresh 1 lần → retry; refresh fail → logout + redirect `/login` (không loop vô hạn).
- [ ] `QueryClient` cấu hình retry hợp lý, không retry lỗi 4xx.
- [ ] Auth store persist qua reload; có `login/logout/setUser` và selector role.
- [ ] Type `ApiResponse<T>` / `Paginated<T>` dùng chung, không `any`.
- [ ] Formatter VNĐ: `1.234.567 ₫` (locale vi-VN).
- [ ] `web_lint` + `web_typecheck` PASS.

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass (interceptor refresh + formatter)
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS
- [ ] committed

## Verification Plan
- Commands:
  - `pnpm --dir frontend run lint` (web_lint)
  - `pnpm --dir frontend exec tsc --noEmit` (web_typecheck)
- Manual/UAT evidence: giả lập 401 → refresh → retry thành công; refresh fail → về login.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-0-task-06-round-1-review.md`

## Files to Create/Modify
- `frontend/src/lib/api-client.ts` (axios + interceptors + refresh queue)
- `frontend/src/lib/query-client.ts`
- `frontend/src/stores/auth-store.ts`
- `frontend/src/types/api.ts`
- `frontend/src/utils/format.ts`
- `frontend/src/lib/toast.ts`

## Notes
- Contract bất biến: `{ success, data, message }` / lỗi `{ success: false, message, errors? }`.
- Tránh nhiều request refresh song song (dùng mutex/queue) để không vô hiệu refresh token lẫn nhau.
- Task này không phụ thuộc backend; chạy song song task-01/02/03/04.
