# Builder Run Summary — feature/ecommerce-mvp · layer-1-task-03

> Subagent builder summary (primary writes the canonical Run Journal). Resume hint only.

```yaml
workItem: feature/ecommerce-mvp
phaseTask: layer-1-task-03
step: builder
status: running
updatedAt: 2026-10-06T15:30:00Z
```

## Đã làm gì

- (đang thực hiện) Module Category: schema + admin CRUD + public list.

## Vì sao

- Tái dùng pattern users module; `@InjectConnection()` collection `products` để đếm SP (không phụ thuộc Product module Layer 2).

## Files

- New: `backend/src/modules/categories/**`.
- Modified: `backend/src/app.module.ts`.

## Kết quả verify

- (pending)

## Còn dở / handoff

- Chưa commit.

---

## Fix round 1 (reviewer FAIL) — 2026-10-06

```yaml
step: builder-fix-round-1
status: awaiting
```

### Đã làm gì

- **[MAJOR]** Đổi đồng bộ `image` → `imageUrl` end-to-end: DTO create/update, schema Mongoose (`Category.imageUrl`),
  service input/view/`toCategoryView`/`pickUpdateFields`/create, tests (schema/service/integration/harness).
  Đổi hằng `CATEGORY_IMAGE_MAX_LENGTH` → `CATEGORY_IMAGE_URL_MAX_LENGTH`. Không dùng alias `image`.
- **[MINOR]** Tách file >300 dòng:
  - `categories.service.spec.ts` (336) → `categories.service.spec.ts` (157) + `categories.service.mutations.spec.ts` (107)
    + `test-support/categories-service.harness.ts` (91, mock chung).
  - `test-support/category-api.harness.ts` (338) → `category-api.harness.ts` (147) + `category-fixture.ts` (198).
- Tất cả file ≤300 dòng, function ≤50 dòng.

### Kết quả verify

- `npm --prefix backend run lint` → PASS (exit 0).
- `npm --prefix backend exec -- tsc --noEmit -p backend/tsconfig.json` → PASS (exit 0).
- `npm --prefix backend run test` → PASS, 33 suites / 209 tests.

### Còn dở / handoff

- Chưa commit; chờ reviewer round 2.
