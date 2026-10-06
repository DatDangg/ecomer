# Builder journal — feature/ecommerce-mvp / layer-3-task-01 (smoke luồng cơ bản + build)

- **Step:** implement automated smoke spec + live smoke script; run backend/frontend build + verify
- **Status:** done (awaiting reviewer)
- **Not committed** (không commit/push theo yêu cầu task; primary commit sau Reviewer PASS).

## Đã làm

1. **`backend/src/smoke/basic-flow.smoke.spec.ts`** (mới, 257 dòng): một `TestingModule` duy nhất boot
   `AuthController` + `ProductsController` với in-memory store cho User và product fixture (tái dùng
   `createProductFixture`), chạy toàn bộ luồng register → login → GET /products → GET /products/:id qua
   supertest:
   - register 201, body không chứa `password`/`passwordHash`.
   - login 200, có `{ user, accessToken, refreshToken }`.
   - GET /products (không token) 200 envelope paginated, chỉ 1 SP visible; assert hidden + blocked vắng mặt.
   - GET /products/:id visible 200 (có nested category/seller); hidden/blocked/unknown id → 404.
2. **`backend/scripts/smoke-basic-flow.sh`** (mới, executable): curl + jq, base URL từ `API_BASE_URL`
   (mặc định `http://localhost:3000/api/v1`), sinh email/password throwaway mỗi lần chạy (không hardcode
   secret). In PASS/FAIL từng bước, dừng sớm khi bước phụ thuộc fail, exit 1 nếu có FAIL. Có
   `--connect-timeout/--max-time` để không treo.

## Vì sao

- Smoke spec dùng in-memory (không cần Mongo) để chạy được trong `npm test`; ghép chung auth + products
  trong 1 app mô phỏng đúng luồng end-to-end thay vì 2 harness tách rời.
- Script live tách riêng vì cần Mongo + seed thật; logic parse/PASS-FAIL được validate bằng mock server.

## Verify (tất cả PASS)

- `npm --prefix backend run lint` → exit 0.
- `npm --prefix backend exec -- tsc --noEmit -p backend/tsconfig.json` → exit 0.
- `npm --prefix backend run test` → 38 suites / 256 tests passed (gồm `src/smoke/basic-flow.smoke.spec.ts` 8 tests).
- `npm --prefix backend run build` → exit 0, `backend/dist/` sinh (spec không vào dist — tsconfig.build loại spec).
- `pnpm --dir frontend run lint` → exit 0 (2 warning react-refresh có sẵn ở `ui/badge`, `ui/button`).
- `pnpm --dir frontend exec tsc --noEmit` → exit 0.
- `pnpm --dir frontend run build` → exit 0, `frontend/dist/` sinh.

## Live smoke evidence

- Không có Mongo (27017 closed) / API (3000 closed) / `.env` trong môi trường builder → **không chạy được
  live smoke thật**. Đã validate script bằng mock HTTP server tạm ở `/tmp/opencode/mock-smoke-server.js`:
  success path in đủ 4 PASS + `SMOKE RESULT: PASS` exit 0; failure path (không server) in FAIL + SKIP +
  `SMOKE RESULT: FAIL (1 step(s) failed)` exit 1.

## Còn dở / residual risk

- Live smoke trên dev thật + seed chưa chạy (thiếu Mongo) — reviewer/user cần chạy khi có dev server:
  `npm --prefix backend run seed:sample` → start BE → `bash backend/scripts/smoke-basic-flow.sh`.
- Không phát hiện bug thuộc scope; không sửa source tính năng; không đụng `.context/runs/start-ecommerce-01.md`.
- Repo không có oxlint config → oxlint gate N/A.
- Không commit/push.
