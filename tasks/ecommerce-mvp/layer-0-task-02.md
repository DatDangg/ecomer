# Task 02: Backend database + API contract foundation (Mongoose, response wrapper, errors)

## Layer
0

## Type
build (initial)

## Description
Kết nối MongoDB qua `MongooseModule.forRootAsync` (env `MONGODB_URI`, **replica set bắt buộc** để dùng
transaction). Dựng nền contract chung: helper `ok()` / `fail()`; global exception filter map đúng error
codes (400/401/403/404/409/429/500); pagination helper + DTO (`page`, `limit` tối đa 100, mặc định 20);
base schema options dùng chung (timestamps, `toJSON` ẩn field nội bộ); shared enums/constants.

## Dependencies
- task-01 (cần bootstrap + ConfigModule trước)

## Acceptance Criteria
- [ ] App kết nối MongoDB replica set thành công; lỗi kết nối fail-fast với thông báo rõ.
- [ ] Response thành công: `{ success: true, data, message }`.
- [ ] Response phân trang: `data = { items, total, page, limit, totalPages }`.
- [ ] Response lỗi: `{ success: false, message, errors? }`, đúng HTTP status theo loại lỗi.
- [ ] `limit` > 100 bị clamp về 100; `page`/`limit` invalid → 400.
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
- Manual/UAT evidence: gọi 1 endpoint lỗi bất kỳ → đúng shape `{ success:false, message }`.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-0-task-02-round-1-review.md`

## Files to Create/Modify
- `backend/src/database/database.module.ts`
- `backend/src/common/response/api-response.ts` (`ok`, `fail`)
- `backend/src/common/filters/http-exception.filter.ts`
- `backend/src/common/dto/pagination-query.dto.ts`
- `backend/src/common/constants/*.ts`, `backend/src/common/enums/*.ts`
- `backend/src/common/schemas/base.schema.ts`

## Notes
- Transaction chỉ hoạt động trên replica set — tài liệu hướng dẫn local single-node replica set sẽ ở task-03 (repo/ops) Layer 0.
- Enum dùng chung: `UserRole`, `OrderStatus`, `CheckoutStatus` (khai ở đây, model dùng lại ở layer sau).
- Không dựng business logic ở task này.
