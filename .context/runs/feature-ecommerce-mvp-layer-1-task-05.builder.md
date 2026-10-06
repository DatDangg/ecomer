# Run Journal — feature/ecommerce-mvp · layer-1-task-05 (builder)

> Write-ahead summary do builder ghi cho task-05 (phase-review gap fix Layer 1 round 1).
> Không sửa `start-ecommerce-01.md` (journal cha).

```yaml
workItem: feature/ecommerce-mvp
phaseTask: layer-1-task-05
step: builder
status: awaiting
attempt: 1
interrupted: false
updatedAt: 2026-10-06T15:35:00+07:00
filesTouched:
  - backend/src/modules/products/products.service.ts
  - backend/src/modules/products/products.controller.ts
  - backend/src/modules/products/products.integration.spec.ts
  - backend/src/modules/products/test-support/product-api.harness.ts
  - backend/src/modules/products/test-support/product-fixture.ts
  - backend/src/modules/products/test-support/products-service.harness.ts
filesNew:
  - .context/runs/feature-ecommerce-mvp-layer-1-task-05.builder.md
evidence:
  reportPath: null
  round: 0
  verdict: null
  builder: "Align GET /products/:id public với contract canonical 06-api-contract.md:269-288. Thêm ProductDetailView (nested category {id,name} + seller {id,shopName}), bỏ isBlocked/blockReason khỏi public ProductView + toProductView. Ref đọc qua @InjectConnection() collection categories/users, degrade an toàn (category null, shopName null) khi thiếu. Giữ 404 cho ẩn/blocked/không tồn tại."
  verify:
    - "npm --prefix backend run lint = PASS (exit 0, eslint clean)"
    - "npm --prefix backend exec -- tsc --noEmit -p backend/tsconfig.json = PASS (exit 0)"
    - "npm --prefix backend run test = PASS 37 suites / 248 tests (trước fix 246: +2 test)"
    - "npx oxlint = skip (không có oxlint config trong repo)"
  scope: "Đúng scope task-05: public product detail shape + stock=0 list assertion. KHÔNG seller CRUD/upload/owner-admin preview. Không sửa file ngoài products module + test-support + run journal."
next: "Reviewer độc lập (report path .context/review-reports/feature-ecommerce-mvp-layer-1-task-05-round-1-review.md). Chưa commit/push."
loopSignal: none
approvals: []
batchQueue: []
```

## Notes / WIP reasoning

- `ProductDetailView extends ProductView` → giữ các field cũ của `toProductView` (id/sellerId/slug/name/description/price/stock/images/categoryId/isActive/createdAt/updatedAt) theo đúng yêu cầu task ("Vẫn giữ ... theo toProductView") và chỉ thêm nested. `isBlocked` bị bỏ khỏi base `ProductView` nên cả list lẫn detail đều không leak (đúng note canonical `isBlocked`/`blockReason` owner/admin-only).
- Nguồn doc reconcile: `docs/API_SPEC.md` là overview + pointer, ghi rõ "không nhúng code/schema tay"; shape canonical đã có sẵn trong `06-api-contract.md` → **no doc impact**, không sửa docs.
- Test-support phải cập nhật vì `ProductsService` thêm `@InjectConnection()`: cả `products-service.harness.ts` (unit) và `product-api.harness.ts` + `product-fixture.ts` (HTTP) nay cấp `getConnectionToken()` với collection `categories`/`users`.
- Thêm 2 test integration: list giữ SP `stock=0`; detail nested + `not.toHaveProperty('isBlocked'/'blockReason')`; +1 test degrade an toàn khi thiếu ref.

## History

- 2026-10-06 journal created (builder hoàn tất task-05; 3 verify PASS 248 tests; chưa commit).
