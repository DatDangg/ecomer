# Task 02: Security hardening + Playwright smoke test + docs reconcile

## Layer
7

## Type
build (initial)

## Description
Chốt go-live: rà soát security hardening (helmet, throttle `/auth/*`, ValidationPipe whitelist chống mass
assignment, không lộ secret, VNPay verify bắt buộc, CORS), viết **Playwright smoke test** chạy trên URL
production (login → browse → add-to-cart → checkout → VNPay sandbox → xem đơn), và reconcile tài liệu
(`docs/API_SPEC.md`, `docs/ERD.md`, `docs/DESIGN.md`, README) với as-built. Cân nhắc checklist `ai-friendly-web`
(robots/sitemap) nếu phù hợp.

## Dependencies
- task-01 Layer 7 (đã deploy production)

## Acceptance Criteria
- [ ] Playwright smoke PASS trên URL production cho luồng chính (login, browse, cart, checkout→VNPay, order view).
- [ ] Security checklist: không secret trong repo; helmet/throttle/CORS/whitelist hoạt động trên prod.
- [ ] Không còn finding `CRITICAL` từ reviewer/security scan.
- [ ] Docs as-built (`API_SPEC.md`, `ERD.md`, `DESIGN.md`) reconcile hoặc ghi `no doc impact`.
- [ ] `spec/test-scope/current.json` được cập nhật (handoff bước Go-Live/initial-build) nếu workflow yêu cầu.

## DoD (Definition of Done)
- [ ] Code/test written (chỉ trong scope)
- [ ] Tests added + pass (Playwright smoke)
- [ ] Check commands pass: `test` (BE) + smoke E2E; ghi rõ kết quả prod
- [ ] Reviewer độc lập PASS
- [ ] committed

## Verification Plan
- Commands:
  - `npm --prefix backend run test` (test)
  - `npx playwright test` (E2E smoke — cấu hình trong repo)
- Manual/UAT evidence: chạy smoke trên URL production, lưu log/ảnh; xác nhận đơn `paid` xuất hiện ở `/orders/my`.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-7-task-02-round-1-review.md`

## Files to Create/Modify
- `e2e/smoke.spec.ts`, `playwright.config.ts`
- `docs/SECURITY_CHECKLIST.md`
- `docs/API_SPEC.md`, `docs/ERD.md`, `docs/DESIGN.md` (reconcile)
- `README.md` (bổ sung link prod + hướng dẫn smoke)

## Notes
- VNPay sandbox: trên prod cần Return/IPN public; localhost dùng ngrok.
- Review mức STRICT (security + payment + public).
- Nguồn: `SPECIFICATIONS.md` R-12 · `docs/ARCHITECTURE.md` §9.
