# Run Journal — feature/ecommerce-mvp · layer-1-task-04 (builder)

> Artifact trạng thái để resume cross-session. Write-ahead summary do builder ghi cho task-04.
> Không sửa `start-ecommerce-01.md` (journal cha) trong file này.

```yaml
workItem: feature/ecommerce-mvp
phaseTask: layer-1-task-04
step: builder
status: awaiting
attempt: 1
interrupted: false
updatedAt: 2026-10-06T15:15:00+07:00
filesTouched:
  - backend/package.json          # thêm script seed:sample
  - backend/src/app.module.ts     # đăng ký ProductsModule
filesNew:
  - backend/src/modules/products/product.schema.ts
  - backend/src/modules/products/products.service.ts
  - backend/src/modules/products/products.controller.ts
  - backend/src/modules/products/products.module.ts
  - backend/src/modules/products/dto/query-product.dto.ts
  - backend/src/modules/products/product.schema.spec.ts
  - backend/src/modules/products/products.service.spec.ts
  - backend/src/modules/products/products.integration.spec.ts
  - backend/src/modules/products/test-support/products-service.harness.ts
  - backend/src/modules/products/test-support/product-api.harness.ts
  - backend/src/modules/products/test-support/product-fixture.ts
  - backend/src/database/seed/sample-seed.service.ts
  - backend/src/database/seed/sample-seed.runner.ts
  - backend/src/database/seed/sample-seed.module.ts
  - backend/src/database/seed/sample-seed.service.spec.ts
  - backend/src/database/seed/test-support/sample-seed.harness.ts
evidence:
  reportPath: .context/review-reports/feature-ecommerce-mvp-layer-1-task-04-round-1-review.md
  round: 1
  verdict: FAIL → fixed (MAJOR orphan sellerId)
  builder: "Round-1 fix (reviewer MAJOR): seed KHÔNG còn bịa PLACEHOLDER_SELLER_ID. resolveSellerId trả Types.ObjectId|null; nếu không có customer thật → bỏ qua seed product (chỉ seed category + warning), trả productsCreated=0. Test cập nhật: bỏ test placeholder, thêm test 'skips product seeding when no customer exists, creating no orphan seller reference' (assert products rỗng); các test cần product được seed customer thật trước. Task file ghi rõ điều kiện có ≥1 customer."
  verify:
    - "npm --prefix backend run lint = PASS (exit 0)"
    - "npm --prefix backend exec -- tsc --noEmit -p backend/tsconfig.json = PASS (exit 0)"
    - "npm --prefix backend run test = PASS 37 suites / 246 tests"
    - "npx oxlint = 0 warnings / 0 errors (round-1 fix)"
    - "npm --prefix backend run test = PASS 37 suites / 246 tests (round-1 fix re-run)"
  seedCommand: "npm --prefix backend run seed:sample (ts-node, NestFactory.createApplicationContext; từ chối NODE_ENV=production). Yêu cầu: DB phải có ≥1 user customer active trước khi product được seed."
  scope: "Đúng scope task-04: public browse GET /products + GET /products/:id, schema/index, seed idempotent. KHÔNG seller CRUD/upload/admin moderation/cart."
next: "Reviewer độc lập round-2 verify fix MAJOR (report round-2). Chưa commit/push."
loopSignal: none
approvals: []
batchQueue: []
```

## Notes / WIP reasoning

- Task-04 đã có code từ builder trước nhưng đứt trước khi thêm test seed; phần code
  (schema/service/controller/DTO/seed) giữ nguyên, không sửa ngoài scope.
- `product-api.harness.ts` + `product-fixture.ts` đã có sẵn nhưng chưa được spec nào dùng
  → `products.integration.spec.ts` mới tận dụng đúng chúng (không thêm harness mới cho products).
- Seed harness mới (`sample-seed.harness.ts`) dùng in-memory model doubles có ràng buộc unique
  name/slug + ném lỗi 11000, cho phép chứng minh idempotency thật trên collection lưu trữ, không cần MongoDB.
- Kiểm tra acceptance: schema (price>0, stock≥0, name≤120) đã cover sẵn ở `product.schema.spec.ts`;
  filter service đã cover; thiếu sort matrix + limit cap/404 ở tầng HTTP + test seed → đã bổ sung.
- Không sửa `.context/runs/start-ecommerce-01.md` theo yêu cầu.

## History

- 2026-10-06 journal created (builder hoàn tất task-04: seed spec + integration spec + sort matrix + verify PASS)
- 2026-10-06 round-1 fix (builder): bỏ sellerId bịa; seed product chỉ khi có customer thật, ngược lại skip + warning; cập nhật test + task note; 3 verify PASS (246 tests), oxlint clean. Chưa commit.
