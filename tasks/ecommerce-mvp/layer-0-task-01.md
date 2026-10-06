# Task 01: Backend bootstrap & configuration (NestJS)

## Layer
0

## Type
build (initial)

## Description
Scaffold project `backend/` (NestJS + TypeScript strict, package manager **npm**) và dựng bootstrap
toàn cục: `ConfigModule` (đọc env), global prefix `api/v1`, helmet, CORS chỉ `FRONTEND_URL`,
`ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`, `ThrottlerModule`,
lắng nghe `0.0.0.0:$PORT`. Thêm health endpoint `GET /api/v1/health`.

## Dependencies
- (none — task nền của toàn bộ backend)

## Acceptance Criteria
- [ ] `backend/package.json` chạy được `npm install`; script `lint`, `test`, `start`, `start:prod`, `build`.
- [ ] TypeScript strict bật; path alias nội bộ (nếu có) hoạt động.
- [ ] App khởi động, log port; `GET /api/v1/health` trả 200.
- [ ] Request có field lạ trong body bị từ chối 400 (whitelist + forbidNonWhitelisted).
- [ ] CORS chỉ cho phép origin `FRONTEND_URL`; helmet header hiện diện.
- [ ] `api_lint` + `api_typecheck` PASS.

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass (unit smoke cho health/bootstrap)
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS
- [ ] committed

## Verification Plan
- Commands:
  - `npm --prefix backend run lint` (api_lint)
  - `npx tsc --noEmit -p backend/tsconfig.json` (api_typecheck)
  - `npm --prefix backend run test` (test)
- Manual/UAT evidence: `npm --prefix backend run start:dev` → `curl -i localhost:3000/api/v1/health` = 200.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-0-task-01-round-1-review.md`

## Files to Create/Modify
- `backend/package.json`
- `backend/tsconfig.json`, `backend/tsconfig.build.json`, `backend/nest-cli.json`
- `backend/.eslintrc.*`, `backend/.prettierrc`
- `backend/src/main.ts`, `backend/src/app.module.ts`
- `backend/src/config/configuration.ts`, `backend/src/config/env.validation.ts`
- `backend/src/health/health.controller.ts`, `backend/src/health/health.module.ts`

## Notes
- Target `npx tsc --noEmit -p backend/tsconfig.json` theo project-config; đảm bảo `tsconfig.json` phù hợp.
- `PORT` mặc định 3000 dev; deploy Render phải bind `0.0.0.0`.
- Không hardcode secret — chỉ đọc env.
- Đây là task nền; các task backend sau build trên cấu trúc này.
