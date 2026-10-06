# Builder Summary — feature/ecommerce-mvp · layer-0-task-06

> Subagent (builder) summary. Primary sở hữu journal chính; file này chỉ để session sau resume nhanh.

```yaml
workItem: feature/ecommerce-mvp
phaseTask: layer-0-task-06
step: builder
status: awaiting
attempt: 1
interrupted: false
updatedAt: 2026-10-06T00:00:00Z
filesNew:
  - frontend/src/types/api.ts
  - frontend/src/types/axios.d.ts
  - frontend/src/lib/api-client.ts
  - frontend/src/lib/query-client.ts
  - frontend/src/lib/toast.ts
  - frontend/src/lib/validation.ts
  - frontend/src/test/api-client.test.ts
  - frontend/src/test/query-client.test.ts
  - frontend/src/test/validation.test.ts
filesTouched:
  - frontend/package.json
  - frontend/pnpm-lock.yaml
  - frontend/src/stores/auth.store.ts
  - frontend/src/App.tsx
  - frontend/README.md
evidence:
  reportPath: .context/review-reports/feature-ecommerce-mvp-layer-0-task-06-round-1-review.md
  round: 1
  verdict: null
next: "Reviewer round 1 — verify refresh single-flight, no-loop on refresh failure, no `any`, SellerRoute regression; run 4 verify commands."
```

## Đã làm

- **Types** (`src/types/api.ts`): `ApiResponse<T>` (`success:true`), `ApiError` (`success:false`,
  `errors?: ApiFieldError[]` với `{field,message}` theo contract), `Paginated<T>`
  (`items/total/page/limit/totalPages`), `ApiEnvelope<T>` union. Không `any`.
- **Axios client** (`src/lib/api-client.ts`): instance `baseURL = import.meta.env.VITE_API_URL`,
  timeout 20s. Request interceptor gắn `Authorization: Bearer <accessToken>` (bỏ qua với
  `skipAuthRefresh`). Response interceptor: chỉ xử lý 401, refresh **single-flight** (biến
  `refreshPromise` dùng chung → nhiều 401 chỉ gọi `/auth/refresh` 1 lần), retry request gốc bằng
  `_retry=true`; refresh fail / mất refresh token → `logout()` + điều hướng `/login` (chỉ redirect
  khi thực sự có session → không loop; `_retry` lần 2 không refresh tiếp). Request `/auth/refresh`
  gắn `skipAuthRefresh` nên không đệ quy.
- **Unwrap**: chọn **cách expose helper** (`apiGet/apiPost/apiPatch/apiDelete`) trả thẳng `data` đã bỏ
  envelope; interceptor giữ `AxiosResponse` để type axios trung thực. Lỗi ném `ApiRequestError`
  (`status`, `errors`) + `getApiErrorStatus` cho retry policy.
- **QueryClient** (`src/lib/query-client.ts`): `staleTime` 60s, `refetchOnWindowFocus:false`,
  `shouldRetryQuery` không retry 4xx, retry 5xx/mạng tối đa 2 lần; mutations không retry.
- **Auth store** (`src/stores/auth.store.ts`): Zustand + `persist` (`localStorage`, key `ecommerce.auth`,
  `partialize` chỉ user/accessToken/refreshToken). State `user/accessToken/refreshToken`; actions
  `login(AuthSession)/tokenRefreshed/logout/setUser`; giữ selector `selectIsAuthenticated` (suy ra từ
  `user && accessToken`), `selectIsAdmin`, `selectCanSell` (customer, admin bị chặn).
- **Toast** (`src/lib/toast.ts`): import CSS, `toastContainerProps`, `notifySuccess/notifyError`, re-export `toast`.
- **Validation** (`src/lib/validation.ts`): `toFieldErrors` (Yup `ValidationError` → map field),
  `toFieldErrorsFromApi` (envelope `errors` → map field) cho Formik.
- **App.tsx**: mount `QueryClientProvider` + `<ToastContainer />` (bắt buộc để tầng dữ liệu hoạt động).
- **README.md**: thêm mục Data layer + cập nhật cây cấu trúc.
- **Deps (pnpm)**: thêm runtime `axios`, `@tanstack/react-query`, `react-toastify`, `formik`, `yup`;
  dev `axios-mock-adapter`.

## Tests (src/test/*)

- `api-client.test.ts` (5): gắn Bearer; 401→refresh→retry trả data unwrap; nhiều 401 đồng thời → 1 refresh;
  refresh fail → clear session + redirect 1 lần; không có refresh token → không gọi refresh, chỉ clear.
- `query-client.test.ts` (2): không retry 4xx; retry 5xx tối đa 2 lần.
- `validation.test.ts` (3): map lỗi Yup + envelope API + input không hợp lệ.
- `format.test.ts` (task-05, giữ nguyên): `1.234.567 ₫`.
- `guards.test.tsx` (task-05) vẫn PASS → `SellerRoute`/`selectCanSell` semantics không đổi.
- Mock network bằng `axios-mock-adapter` gắn trên instance; redirect inject qua `setUnauthorizedRedirect`.

## Verify

- `pnpm --dir frontend run lint` → PASS (0 errors, 2 warning shadcn `react-refresh` có sẵn từ task-05).
- `pnpm --dir frontend exec tsc --noEmit` → PASS.
- `pnpm --dir frontend test` → PASS: **7 files / 17 tests**.
- `pnpm --dir frontend run build` → PASS (tsc + vite build, JS 469.13 kB / gzip 151.36 kB).

## Lưu ý / residual risk

- **Không có oxlint/anti-slop config** trong frontend → không chạy `npx oxlint`; chỉ ESLint 9 flat config.
- `ApiError.errors` type theo shape validation `{field,message}`. Lỗi 400 khác shape (vd cart conflict
  `{productId,name,available,requested}`) sẽ bị `readFieldErrors` bỏ qua — feature-layer sau cần type riêng.
- `expireSession()` chỉ redirect khi có session (accessToken/refreshToken) → request public bị 401 khi guest
  không tự redirect; guard component đã lo phần guest.
- Bonus file ngoài list task file: `src/types/axios.d.ts` (module augmentation cho `_retry`/`skipAuthRefresh`),
  `App.tsx` (provider wiring), `README.md`. Không sửa `utils/format.ts` (giữ nguyên task-05).
- Chưa chạy manual browser/UAT (401→refresh→retry thật); đã phủ bằng test deterministic.

## Round-1 review fixes (STRICT — 1 MAJOR + 2 MINOR)

- **[MAJOR] Race refresh vs logout/account-switch** — thêm `sessionGeneration` (epoch, không persist)
  vào `auth.store.ts`, tăng trong `login`/`logout`. `tokenRefreshed(accessToken, generation)` chỉ ghi
  token khi generation khớp và trả `boolean`. `api-client.ts`: single-flight `activeRefresh` keyed theo
  generation; sau await chỉ retry nếu generation còn khớp, ngược lại reject request gốc (không mutate,
  không retry); `.catch` chỉ `expireSession()` khi generation khớp (refresh fail thật cho session hiện tại),
  không clear session mới khi logout/login chen ngang.
- **[MINOR] AuthUser khớp contract** — đổi `name` → `fullName`, thêm `shopName: string | null`,
  `phone?`, `address?`; cập nhật fixture `guards.test.tsx` + `api-client.test.ts`.
  Giữ `selectCanSell = role === "customer"` (customer vào seller shell kể cả `/seller/setup`; admin chặn).
- **[MINOR] `ApiResponse.message` required** — `src/types/api.ts` đặt `message: string`.
- **Test mới (deterministic)**: logout trong lúc refresh in-flight → token cũ không hồi sinh (state null);
  account-switch trong lúc refresh in-flight → token tài khoản mới không bị ghi đè, request cũ reject,
  không retry trong session mới.

### Verify round-1 fix
- `pnpm --dir frontend run lint` → PASS (0 errors, 2 warning shadcn có sẵn).
- `pnpm --dir frontend exec tsc --noEmit` → PASS.
- `pnpm --dir frontend test` → PASS: **7 files / 20 tests** (api-client 8, guards 3 vẫn PASS).
- `pnpm --dir frontend run build` → PASS (JS 469.58 kB / gzip 151.53 kB).

## Round-2 review fix (STRICT — 1 MAJOR: bind request vào session lúc dispatch)

- Thêm `__sessionGeneration?: number` vào `AxiosRequestConfig` (module augmentation `types/axios.d.ts`).
- **Request interceptor** gắn `config.__sessionGeneration = sessionGeneration` tại thời điểm dispatch cho
  MỌI request (chỉ set khi `undefined` → retry giữ nguyên generation gốc, không bị ghi đè).
- **Response 401 handler**: so `config.__sessionGeneration` với generation hiện tại; **khác → reject ngay**
  (không refresh/retry/expire — request thuộc session cũ). Chỉ khi khớp mới refresh (single-flight, capture
  generation) rồi persist/retry nếu generation vẫn khớp.
- **Retry `_retry` branch**: đã qua early-check nên chỉ còn session hiện tại → `expireSession()` an toàn;
  401 muộn của retry A (session cũ) bị early-reject, KHÔNG clear session B.
- Giữ nguyên single-flight + các fix round 1.

### Test mới (deterministic, dùng deferred response)
1. **Account switch trước khi 401 ban đầu được xử lý** — GET A bị giữ (deferred); login B; resolve 401.
   Request A reject, `productCalls === 1`, không gọi `/auth/refresh` (`history.post` rỗng), session B nguyên vẹn.
2. **Account switch khi retry A in-flight, retry A trả 401** — retry A (Bearer fresh-access) bị giữ (deferred);
   login B; resolve retry 401. `productCalls === 2`, session B nguyên vẹn, không redirect.

### Verify round-2 fix
- `pnpm --dir frontend run lint` → PASS (0 errors, 2 warning shadcn có sẵn).
- `pnpm --dir frontend exec tsc --noEmit` → PASS.
- `pnpm --dir frontend test` → PASS: **7 files / 22 tests** (api-client 10, guards 3 vẫn PASS).
- `pnpm --dir frontend run build` → PASS (JS 469.71 kB / gzip 151.56 kB).


