# Builder Summary — feature/ecommerce-mvp · layer-0-task-01

> Subagent (builder) summary. Primary sở hữu journal chính; file này chỉ để session sau resume nhanh.

```yaml
workItem: feature/ecommerce-mvp
phaseTask: layer-0-task-01
step: builder
status: awaiting
attempt: 1
interrupted: false
updatedAt: 2026-10-06T05:40:00Z
filesNew:
  - backend/package.json
  - backend/tsconfig.json
  - backend/tsconfig.build.json
  - backend/nest-cli.json
  - backend/.eslintrc.js
  - backend/.prettierrc
  - backend/.gitignore
  - backend/.env.example
  - backend/src/main.ts
  - backend/src/app.setup.ts
  - backend/src/app.module.ts
  - backend/src/config/configuration.ts
  - backend/src/config/env.validation.ts
  - backend/src/common/response.ts
  - backend/src/common/interceptors/response.interceptor.ts
  - backend/src/common/filters/all-exceptions.filter.ts
  - backend/src/health/health.controller.ts
  - backend/src/health/health.module.ts
  - backend/src/health/health.controller.spec.ts
  - backend/src/config/env.validation.spec.ts
  - backend/src/app.setup.spec.ts
  - backend/src/app.integration.spec.ts
  - backend/src/throttler.spec.ts
filesTouched: []
evidence:
  reportPath: .context/review-reports/feature-ecommerce-mvp-layer-0-task-01-round-1-review.md
  round: 1
  verdict: FAIL
next: "Reviewer round 2 — fix MAJOR-1 (throttler APP_GUARD + 429 test) và MAJOR-2 (response envelope + filter)."
```

## Round-1 fix (2026-10-06)

- **[MAJOR-1] Throttler enforced:** `app.module.ts` thêm `providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }]`.
  Test `src/throttler.spec.ts` (AppModule thật + supertest): 100 request → 200, request 101 → **429**.
- **[MAJOR-2] Response contract:** thêm `common/response.ts` (`ok()`/`fail()`, envelope types),
  `common/interceptors/response.interceptor.ts`, `common/filters/all-exceptions.filter.ts`.
  Đăng ký global trong `app.setup.ts` (`useGlobalInterceptors`/`useGlobalFilters`).
  Health data vẫn `{status:'ok'}`; HTTP body = `{success:true,data:{status:'ok'},message:'Success'}`.
  Validation 400 → `{success:false,message:'Bad Request',errors:[...]}`.

## Verify (round-1 fix)

- `npm --prefix backend run lint` → PASS
- `npm --prefix backend exec -- tsc --noEmit -p backend/tsconfig.json` → PASS
- `npm --prefix backend run test` → PASS (5 suites, 13 tests)
- `npm --prefix backend run build` → PASS
- UAT: health envelope OK; 404 error envelope OK; burst 106 health → 100×200 + 6×429.

## Đã làm (round 0)

- Scaffold `backend/` NestJS 10 + TS strict (npm). Scripts đủ: lint/test/start/start:dev/start:prod/build.
- `src/app.setup.ts`: tách cấu hình HTTP toàn cục (global prefix `api/v1`, `helmet()`, CORS chỉ `FRONTEND_URL`,
  `ValidationPipe({ whitelist, forbidNonWhitelisted, transform })`, response interceptor + exception filter) để test được;
  `main.ts` chỉ bootstrap + listen `0.0.0.0:$PORT`.
- `app.module.ts`: `ConfigModule` global (load + validate) + `ThrottlerModule.forRoot([{ttl:60000,limit:100}])`
  + `APP_GUARD ThrottlerGuard` + `HealthModule`.
- `config/env.validation.ts`: class-validator validate `NODE_ENV`/`PORT`/`FRONTEND_URL` (defaults an toàn, không hardcode secret).
- Health: controller trả data `{ status: 'ok' }` → envelope `{success:true,data,message}`.

## Còn dở / lưu ý

- Path alias nội bộ: KHÔNG thêm (AC ghi "nếu có").
- `dist/` sinh ra khi build, đã gitignore.
- `src/common/guards/` chưa có guard thật (JwtAuthGuard... thuộc task auth sau).
- Lưu ý tương lai: VNPay IPN cần trả `{RspCode,Message}` không qua envelope → task payments phải thêm cơ chế opt-out
  (decorator skip wrap) cho route đó. Hiện interceptor wrap toàn cục, chưa có ngoại lệ.
- Header CORS `Access-Control-Allow-Origin` luôn = `FRONTEND_URL` (cors package string origin); browser tự chặn origin khác.

