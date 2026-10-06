# Task 01: Admin user management API (list / ban / unban + cascade block)

## Layer
5

## Type
build (initial)

## Description
Admin: `GET /admin/users` (search/filter role/active, phân trang, không trả password),
`PATCH /admin/users/:id/ban` → `isActive=false` + cascade block toàn bộ SP của seller
(`blockReason = seller_banned`, **không ghi đè** lý do Admin đã có sẵn),
`PATCH /admin/users/:id/unban` → `isActive=true` + chỉ mở lại SP có `blockReason = seller_banned`.
Admin không tự ban mình → 400.

## Dependencies
- task-04 Layer 0 (User schema) + task-02 Layer 2 (Product model/schema để cascade)

## Acceptance Criteria
- [ ] Chỉ Admin truy cập (403 nếu không).
- [ ] Ban self → 400; ban user khác → `isActive=false`.
- [ ] Ban cascade block mọi SP của seller với `seller_banned`; SP đã bị block vì lý do khác **giữ nguyên** reason.
- [ ] Unban chỉ mở lại SP có `blockReason = seller_banned`; SP bị Admin block giữ nguyên.
- [ ] `GET /admin/users` filter/tìm kiếm/phân trang đúng, không lộ password.
- [ ] `api_lint` + `api_typecheck` + `test` PASS.

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS
- [ ] committed

## Verification Plan
- Commands:
  - `npm --prefix backend run lint`
  - `npx tsc --noEmit -p backend/tsconfig.json`
  - `npm --prefix backend run test`
- Manual/UAT evidence: ban seller có 1 SP bị block lý do khác → reason không bị ghi đè; unban chỉ mở SP seller_banned.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-5-task-01-round-1-review.md`

## Files to Create/Modify
- `backend/src/modules/admin/admin-users.controller.ts`
- `backend/src/modules/admin/admin-users.service.ts`
- `backend/src/modules/admin/dto/query-user.dto.ts`

## Notes
- Không có API gán role; admin seed-only.
- Review mức STRICT (data integrity + cascade).
- Nguồn: `SPECIFICATIONS.md` R-11 · `docs/PERMISSION.md`.
