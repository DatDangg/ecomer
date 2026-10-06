# Task 01: Deploy backend (Render) + frontend (Vercel) + MongoDB Atlas

## Layer
7

## Type
build (initial)

## Description
Đưa hệ thống lên môi trường production free-tier: MongoDB Atlas M0 (replica set), backend NestJS lên Render
Web Service (`npm install --include=dev && npm run build`, `npm run start:prod`, bind `0.0.0.0:$PORT`),
frontend Vite lên Vercel (`VITE_API_URL` nhúng lúc build + `vercel.json` SPA rewrite), cấu hình env/secrets
và CORS `FRONTEND_URL`, đăng ký Return/IPN URL public cho VNPay.

## Dependencies
- Toàn bộ layer build L0–L6 (cần code hoàn chỉnh để deploy)

## Acceptance Criteria
- [ ] BE deploy Render chạy; `GET /api/v1/categories` trên domain production → 200 (health gate).
- [ ] FE deploy Vercel load được, gọi API production thành công; SPA route deep-link không 404.
- [ ] Atlas M0 là replica set; transaction checkout/payment chạy được trên prod.
- [ ] Env/secrets cấu hình đủ (không commit secret); CORS chỉ cho `FRONTEND_URL`.
- [ ] VNPay Return/IPN URL trỏ domain Render; `VITE_API_URL` đúng.
- [ ] Không CI/CD, không Docker (theo `ci_cd: skip`).

## DoD (Definition of Done)
- [ ] Cấu hình deploy written (chỉ trong scope)
- [ ] Tests added + pass: smoke thủ công trên prod (xem task-02)
- [ ] Check commands pass: `skip, no app configured` (deploy config; verify bằng health check prod)
- [ ] Reviewer độc lập PASS
- [ ] committed

## Verification Plan
- Commands:
  - `skip, no app configured for deploy config` (verify thủ công)
  - Build thủ công: `npm --prefix backend run build`, `pnpm --dir frontend run build`
- Manual/UAT evidence: mở URL FE production, đăng nhập, gọi API; `curl <prod>/api/v1/categories` = 200.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-7-task-01-round-1-review.md`

## Files to Create/Modify
- `frontend/vercel.json`
- `backend/render.yaml` (hoặc hướng dẫn cấu hình Render)
- `docs/DEPLOYMENT.md`
- `.env.example` (bổ sung biến production)

## Notes
- Render free ngủ ~15 phút — chấp nhận; cron bắt kịp khi thức.
- Không promote production khi có `HIGH_RISK_MIGRATION` (N/A: Mongoose, `migration_required=false`).
- Nguồn: `SPECIFICATIONS.md` R-12 · `docs/ARCHITECTURE.md` §9.
