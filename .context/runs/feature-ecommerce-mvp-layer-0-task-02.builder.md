# Builder Summary — feature/ecommerce-mvp · layer-0-task-02

> Subagent (builder) summary. Primary sở hữu journal chính; file này chỉ để session sau resume nhanh.

```yaml
workItem: feature/ecommerce-mvp
phaseTask: layer-0-task-02
step: builder
status: awaiting
attempt: 1
interrupted: false
updatedAt: 2026-10-06T00:00:00Z
filesNew:
  - backend/src/common/enums/user-role.enum.ts
  - backend/src/common/enums/order-status.enum.ts
  - backend/src/common/enums/payment-status.enum.ts
  - backend/src/common/enums/checkout-status.enum.ts
  - backend/src/common/enums/cancelled-by.enum.ts
  - backend/src/common/enums/index.ts
  - backend/src/common/enums/enums.spec.ts
  - backend/src/common/constants/block-reason.constant.ts
  - backend/src/common/constants/index.ts
  - backend/src/common/dto/pagination-query.dto.ts
  - backend/src/common/dto/pagination-query.dto.spec.ts
  - backend/src/common/dto/pagination.integration.spec.ts
  - backend/src/common/schemas/base.schema.ts
  - backend/src/common/schemas/base.schema.spec.ts
  - backend/src/common/filters/all-exceptions.filter.spec.ts
  - backend/src/database/database.module.ts
  - backend/src/database/database.module.spec.ts
  - backend/test/setup-test-env.ts
filesTouched:
  - backend/package.json
  - backend/package-lock.json
  - backend/src/app.module.ts
  - backend/src/common/filters/all-exceptions.filter.ts
  - backend/src/config/configuration.ts
  - backend/src/config/env.validation.ts
  - backend/src/config/env.validation.spec.ts
evidence:
  reportPath: .context/review-reports/feature-ecommerce-mvp-layer-0-task-02-round-1-review.md
  round: 1
  verdict: null
next: "Reviewer round 1 — verify DB module/env/pagination/filter/contract tests."
```

## Round-1 fix (reviewer FAIL, STRICT)

- **[MAJOR-1] Replica-set topology verified:** thêm `backend/src/database/database-topology.service.ts` —
  `assertReplicaSetTopology(connection)` chạy `db.admin().command({ hello: 1 })`, yêu cầu `setName`;
  không có → throw lỗi rõ. `DatabaseTopologyService` (`OnApplicationBootstrap`) gọi guard lúc khởi động,
  **skip khi `NODE_ENV==='test'`** (giữ lazy path test-only). Đăng ký trong `DatabaseModule.providers`.
  Test `database-topology.service.spec.ts` với mock connection: replica set OK, standalone → throw,
  connection chưa ready → throw, service skip ở test, service check ở production.
- **[MAJOR-2] Non-finite limit → 400:** `pagination-query.dto.ts` transform dùng `Number.isFinite`
  trước khi clamp; `Infinity`/`1e999` giữ nguyên giá trị invalid → `@IsInt` fail → 400. Finite >100
  vẫn clamp 100. Thêm unit test (`Infinity`, `1e999`) + integration test (`?limit=Infinity`, `?limit=1e999` → 400 envelope).
- **[MAJOR-3] Sanitizer không bị override:** `withBaseSchemaOptions()` **compose** transform per-schema
  với `hideInternalFields` (custom chạy trước, base xoá `passwordHash`/`refreshTokenHash`/`__v` trên object
  cuối). Thêm `CustomTransformModel` test: custom `toJSON.transform`/`toObject.transform` cố re-add secret
  → vẫn bị ẩn.

### Verify (round-1 fix)

- `npm --prefix backend run lint` → PASS
- `npm --prefix backend exec -- tsc --noEmit -p backend/tsconfig.json` → PASS
- `npm --prefix backend run test` → PASS (12 suites, 65 tests)
- `npm --prefix backend run build` → PASS

## Đã làm

- **MongoDB**: `backend/src/database/database.module.ts` dùng `MongooseModule.forRootAsync`
  đọc `mongodbUri` từ ConfigService. `createMongooseOptions()` fail-fast nếu thiếu URI.
  Production/staging connect eager (fail nhanh), `NODE_ENV=test` dùng `lazyConnection` để test
  không cần Mongo thật. Transaction dùng URI replica set sẵn có (không business logic).
- **Env**: `env.validation.ts` thêm `MONGODB_URI` **required** (`@IsString @IsNotEmpty`) → thiếu là
  throw `Invalid environment variables` (fail-fast). `configuration.ts` thêm `mongodbUri` +
  `mongoServerSelectionTimeoutMs` (env `MONGODB_SERVER_SELECTION_TIMEOUT_MS`, default 5000).
  Verify commands không hardcode URI/secret.
- **Pagination**: `common/dto/pagination-query.dto.ts` — `page` default 1 / `limit` default 20;
  `limit` clamp > 100 về 100; non-numeric / < 1 → validation fail → 400. Helper `buildPaginated()`
  trả `{ items, total, page, limit, totalPages }`.
- **Base schema**: `common/schemas/base.schema.ts` — `timestamps`, `versionKey:false`,
  `toJSON`/`toObject` transform ẩn `__v`, `passwordHash`, `refreshTokenHash`; `withBaseSchemaOptions()`
  để model sau merge option riêng.
- **Shared enums/constants**: `UserRole`, `OrderStatus`, `PaymentStatus`, `CheckoutStatus`,
  `CancelledBy`, `BLOCK_REASON_SELLER_BANNED` (khớp `07-tech-conventions.md`), có barrel `index.ts`.
- **Exception filter**: `all-exceptions.filter.ts` refactor export `normalizeException()` map đúng
  400/401/403/404/409/429/500 → `{ success:false, message, errors? }`; validation array →
  `errors[]`; Mongo duplicate key (code 11000) → 409; `CastError` → 400. Filter nền từ task-01
  được **mở rộng, không viết trùng**.
- **Wiring**: `app.module.ts` import `DatabaseModule`.

## Cách test pass không cần Mongo

- `backend/test/setup-test-env.ts` (jest `setupFiles`) set `NODE_ENV=test` + dummy `MONGODB_URI`.
- `DatabaseModule` trả `lazyConnection: true` khi `nodeEnv === 'test'` → Mongoose tạo connection
  object nhưng không `await asPromise()`, nên `app.init()` không kết nối. Các integration spec
  (`app.integration.spec`, `throttler.spec`) chạy bình thường, không cần Mongo.
- Không dùng `mongodb-memory-server` (tránh tải binary/network).
- DB integration thật (nếu cần) phải tự set `MONGODB_URI` và bỏ lazy → optional, chưa cần ở task này.

## Verify (final)

- `npm --prefix backend run lint` → PASS
- `npm --prefix backend exec -- tsc --noEmit -p backend/tsconfig.json` → PASS
- `npm --prefix backend run test` → PASS (11 suites, 51 tests)
- `npm --prefix backend run build` → PASS
- Cài thêm deps: `@nestjs/mongoose@^10.1.0`, `mongoose@^8.9.5` (package.json + lock).

## Lưu ý / residual risk

- `MONGODB_URI` giờ là env **bắt buộc** ở mọi môi trường (kể cả test, đã có default trong jest setup).
  Deploy phải có biến này, nếu không app fail ngay lúc env validation (đúng fail-fast).
- Filter map `CastError` → 400 nhưng chưa map `mongoose.Error.ValidationError` (DTO class-validator
  phủ phần lớn); nếu layer sau cần có thể bổ sung.
- `lazyConnection` ở test nghĩa là test không xác minh kết nối Mongo thật — cần UAT/staging để
  xác nhận replica set + transaction (task-03 ops).
- File task ghi `http-exception.filter.ts` nhưng code thật là `all-exceptions.filter.ts` (task-01);
  đã mở rộng file hiện có theo yêu cầu "không viết trùng".
