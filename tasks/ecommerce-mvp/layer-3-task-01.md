# Task 01: Smoke test luồng cơ bản + build backend/frontend

## Layer
3

## Type
build (initial)

## Description
Kiểm chứng luồng cơ bản end-to-end (auth + duyệt sản phẩm) và đảm bảo cả hai project build được:

**Luồng smoke:** `register → login → GET /products → GET /products/:id`.

1. **Automated smoke (chạy trong Jest, không cần Mongo thật):** spec `basic-flow.smoke.spec.ts` dựng testing
   module tối thiểu (auth + products) với in-memory store (cùng pattern `auth.integration.spec.ts`), dùng
   `supertest` assert:
   - `POST /auth/register` → 201, response không chứa `password`/`passwordHash`.
   - `POST /auth/login` → 200, có `{ user, accessToken, refreshToken }`.
   - `GET /products` (không token) → 200, envelope paginated, chỉ SP `isActive && !isBlocked`.
   - `GET /products/:id` (SP public) → 200; id SP ẩn/blocked/không tồn tại → 404.
2. **Live smoke (chạy tay trên dev):** script `backend/scripts/smoke-basic-flow.sh` dùng `curl` + `jq`:
   đăng ký user test → login lấy token → `GET /products` lấy SP đầu → `GET /products/:id`; in PASS/FAIL từng bước.
   Yêu cầu chạy trước `npm --prefix backend run seed:sample` và BE đang nghe `http://localhost:3000/api/v1`.
3. **Build:**
   - Backend: `npm --prefix backend run build` (nest build) → PASS.
   - Frontend: `pnpm --dir frontend run build` (tsc + vite build) → PASS.

Không thêm tính năng mới ngoài smoke/build; nếu smoke phát hiện bug thì mở task bug riêng (không fix lẫn trong task này).

## Dependencies
- task-01/02/03/04 Layer 1 (Auth + User + Category + Product API)
- task-01/02 Layer 2 (FE Auth + FE Product list/detail)

## Acceptance Criteria
- [ ] `basic-flow.smoke.spec.ts` PASS: register 201 (không lộ password) → login 200 (đủ token) → GET /products 200 (có items) → GET /products/:id 200.
- [ ] Smoke assert SP ẩn/blocked không xuất hiện ở `GET /products` và `GET /products/:id` trả 404.
- [ ] `backend/scripts/smoke-basic-flow.sh` chạy được trên dev đã seed, in kết quả PASS/FAIL rõ ràng (không hardcode secret).
- [ ] `npm --prefix backend run build` PASS.
- [ ] `pnpm --dir frontend run build` PASS.
- [ ] Toàn bộ check commands của phần bị đụng PASS: `api_lint`, `api_typecheck`, `test`, `web_lint`, `web_typecheck`.
- [ ] Evidence (log/curl output hoặc test output) ghi vào mục Verification của task.

## DoD (Definition of Done)
- [ ] Code/script written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS
- [ ] committed

## Verification Plan
- Commands:
  - `npm --prefix backend run lint` (api_lint)
  - `npx tsc --noEmit -p backend/tsconfig.json` (api_typecheck)
  - `npm --prefix backend run test` (test — gồm smoke spec)
  - `npm --prefix backend run build`
  - `pnpm --dir frontend run lint` (web_lint)
  - `pnpm --dir frontend exec tsc --noEmit` (web_typecheck)
  - `pnpm --dir frontend run build`
  - Live smoke: `npm --prefix backend run seed:sample` → chạy BE → `bash backend/scripts/smoke-basic-flow.sh`
- Manual/UAT evidence: output script live smoke + build logs (backend `dist/`, frontend `dist/`).
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-3-task-01-round-1-review.md`

## Files to Create/Modify
- `backend/src/smoke/basic-flow.smoke.spec.ts`
- `backend/scripts/smoke-basic-flow.sh`
- (không sửa source tính năng; chỉ thêm test/script + fix nếu build/typecheck phát hiện lỗi thuộc scope)

## Notes
- Jest `rootDir` là `backend/src` nên spec đặt trong `src/` (dùng pattern fake in-memory store như `auth.integration.spec.ts`), không cần Mongo live.
- Live smoke script **không** commit secret; đọc `VITE_API_URL`/base URL qua biến môi trường hoặc mặc định `http://localhost:3000/api/v1`.
- Đây là task kiểm thử cuối của MVP cơ bản; sau khi PASS + user duyệt sẽ chạy bước bàn giao test-scope (spec-publisher) khi kết thúc initial build.
- Nguồn: `SPECIFICATIONS.md` R-01, R-05 · `.agent/FEATURE_WORKFLOW.md` (verification) · `.context/project-config.md`.
