# Spec Validator — Phase Review — ecommerce-mvp / Layer 1 — Round 1

**Review mode:** Phase review (requirement ↔ task ↔ implementation ↔ tests)  
**Work item:** `feature/ecommerce-mvp`  
**Layer reviewed:** 1 — Auth, User & Shop, Category, Product public browse + sample seed  
**Evidence boundary:** Source and task artifacts read; configured test/lint/typecheck results are taken from the completed task review reports and were not rerun here.

## Verdict: ⚠️ GAPS FOUND — ❌ FAIL (Layer 1 not complete)

Core MVP authentication, user/shop, category, and public product-browse behavior is implemented and has passing task reviews. Seller product CRUD, upload, moderation, cart/order/checkout/payment, and deployment are explicitly outside this layer and are **not** counted as Layer 1 gaps. However, the public product-detail response does not satisfy the canonical API contract's field shape and visibility rule. This is an API-contract partial/conflict that should be reconciled before Layer 1 is marked PASS and Layer 2 (which consumes product detail) is unlocked.

## Scope disposition

| Scope | Disposition | Evidence |
|---|---|---|
| Basic MVP flow: auth + public product browsing | In scope and implemented. | `tasks/ecommerce-mvp/layer-1-task-01.md:9-27`; `layer-1-task-04.md:9-27,37-47`; `SPECIFICATIONS.md:44-73`. |
| Seller product create/update/delete and `/products/my` | Deliberately deferred; not a Layer 1 gap. | `layer-1-task-04.md:29-31`; `SPECIFICATIONS.md:62-66,71-73`. |
| Upload, admin product moderation/preview | Deliberately deferred; not a Layer 1 gap. | `layer-1-task-04.md:29-31`; `SPECIFICATIONS.md:99-102,110-114`. |
| Cart, order/checkout, payment, seller fulfillment | Outside Layer 1; not a Layer 1 gap. | `SPECIFICATIONS.md:75-118`; `docs/USER_FLOW.md:65-188`; tasks 01–04 scope. |
| Full canonical product-detail response contract | Not explicitly exempted from the canonical contract; implementation is reduced and the response conflicts with it. | `project-ecommerce/06-api-contract.md:269-288`; task 04 only accepts a public product response at `layer-1-task-04.md:43`, while implementation shape is documented in code at `backend/src/modules/products/products.service.ts:18-23`. |

## Coverage matrix

| Requirement | Source | Status | Note |
|---|---|---|---|
| R-01 registration/login/refresh/logout; bcrypt, customer-only public role, access/refresh TTL and hashed refresh persistence; banned-account behavior and throttling | `SPECIFICATIONS.md:44-49`; `project-ecommerce/06-api-contract.md:76-138`; Task 01 `:9-27`; `backend/src/modules/auth/auth.service.ts:54-63,94-120,124-180,183-207`; `auth.controller.ts:15-49` | ✅ Covered | Task-01 reviewer round 4 is STRICT PASS and reports configured lint/typecheck/test PASS: `.context/review-reports/feature-ecommerce-mvp-layer-1-task-01-round-4-review.md:7-22,41-53`. Its noted live Mongo concurrency and password byte-limit caveats are residuals, not unmet Layer 1 AC. |
| R-02 authenticated profile read/update; editable-field restriction; shop setup and public shop info/count; hidden/banned shop 404 | `SPECIFICATIONS.md:51-55`; `06-api-contract.md:142-194`; Task 02 `:9-24`; `users.controller.ts:21-57`; `users.service.ts:52-81,97-103,141-168`; `shops.service.ts:27-56` | ✅ Covered | Task-02 reviewer round 2 validates DTO/service field allowlist, hash exclusion, shop productCount visibility predicate, 404 behavior, and envelope: `.context/review-reports/feature-ecommerce-mvp-layer-1-task-02-round-2-review.md:17-26,45-51`. |
| R-03 admin category CRUD; public active category reads; generated unique slug; duplicate-name 409; reject deletion while any products reference category | `SPECIFICATIONS.md:57-60`; `06-api-contract.md:198-236`; Task 03 `:9-23`; `categories.controller.ts:26-78`; `categories.service.ts:94-127,142-186,195-230` | ✅ Covered | Round-2 review verifies admin restrictions, `imageUrl` field name, duplicate create/rename, active-only reads, no-delete-while-referenced, and mass-assignment protections: `.context/review-reports/feature-ecommerce-mvp-layer-1-task-03-round-2-review.md:20-27,41-50`. |
| R-04 product ownership/schema constraints and seller CRUD | `SPECIFICATIONS.md:62-66`; Task 04 `:12-15,29-31`; `product.schema.ts:7-18,20-98` | ⚠️ Partial by approved scope | The Product schema includes required seller/category refs, immutable sellerId, generated-unique slug field, name/price/stock/images and visibility flags/indexes. Seller CRUD and `/products/my` are explicitly deferred (`layer-1-task-04.md:29-31`) and are not a Layer 1 gap. The full R-04 write behavior remains unimplemented and must be picked up by a later approved Change Request/phase. |
| R-05 public product list filters/search/sort/pagination; only active/unblocked products; hidden detail is 404 | `SPECIFICATIONS.md:68-73`; `06-api-contract.md:238-288`; Task 04 `:21-27,37-47`; `products.service.ts:15-16,64-98,107-143`; `products.controller.ts:17-40` | ⚠️ Partial — canonical detail contract conflict | Core browse behavior and pagination are implemented. Query DTO constrains filter/sort inputs (`query-product.dto.ts:17-62`). But `toProductView()` emits a flat shape and always exposes `isBlocked` (`products.service.ts:24-38,40-57`); canonical detail specifies nested `category` and `seller`, and says `isBlocked`/`blockReason` are owner/admin-only (`06-api-contract.md:269-288`). No optional-auth owner/admin preview is implemented, which task 04 explicitly defers (`:29-31`); that preview itself is not counted as a Layer 1 gap. The public response-field mismatch is not expressly waived and is a real contract gap (details below). |
| R-13 upload and Cloudinary ownership/validation | `SPECIFICATIONS.md:99-102`; `06-api-contract.md:528-542`; Task 04 `:29-31` | ⏭ Deferred | Explicitly deferred by task; not a Layer 1 gap. |
| Canonical success/error envelope and paginated data fields | `SPECIFICATIONS.md:136-142`; `docs/API_SPEC.md:34-49`; `06-api-contract.md:11-39`; product integration test `backend/src/modules/products/products.integration.spec.ts:37-60,156-178`; category test `categories.integration.spec.ts:33-42,120-134` | ✅ Covered | Successful responses are asserted with `success` and `data`; product pagination uses `{items,total,page,limit,totalPages}`. Review reports additionally confirm the user/shop and category envelope. |
| Cross-doc permission rule: public register creates customer; no seller role; customer can sell only after shop setup | `SPECIFICATIONS.md:44-55,177-183`; `docs/PERMISSION.md:8-29`; Task 01 `:10-14`; Task 02 `:9-13`; `users.service.ts:123-134` | ✅ Covered for Layer 1 | Role assignment is server-controlled; shop setup is implemented. Product-create shop gate is intentionally deferred with seller CRUD. |
| Tests and verification for Layer 1 API behavior | `.context/project-config.md:25-30,61-78`; task files; the four cited task-review reports | ✅ Covered with one noted test omission | Latest reports for tasks 01–04 show reviewer PASS and configured backend checks PASS. Product browse tests cover filters, sorting, pagination and hidden/detail 404; however, no explicit test asserts the public list retains a `stock=0` product, although the service does not filter stock (`products.integration.spec.ts:37-178`, `products.service.ts:67-70,117-127`). Add/retain a regression assertion for the explicit R-05 stock-zero behavior when updating tests. This is a LOW test-coverage gap, not evidence of a current implementation failure. |

## Gap / conflict findings

### [PARTIAL] Medium — Public product detail conflicts with canonical response fields and visibility rule

- **Requirement:** Canonical `GET /products/:id` shape contains nested `category: { id, name }` and `seller: { id, shopName }`; `isBlocked` and `blockReason` are only returned to Owner/Admin.
- **Sources:** `project-ecommerce/06-api-contract.md:269-288`; `SPECIFICATIONS.md:68-73` points product browse contract to `docs/API_SPEC.md`, `docs/ERD.md`, and `docs/PRD.md`; Task 04's acceptance only checks public visibility/404 (`tasks/ecommerce-mvp/layer-1-task-04.md:37-47`).
- **Implementation:** `backend/src/modules/products/products.service.ts:24-38,40-57` returns flat `sellerId` and `categoryId` fields, no nested seller/category, and includes `isBlocked` on public responses. The `findPublicById()` query correctly filters to `isActive=true,isBlocked=false` (`:135-142`) but does not make the response shape conform.
- **Test evidence:** `backend/src/modules/products/products.integration.spec.ts:181-199` explicitly asserts that an unauthenticated detail response contains `isBlocked: false`; there is no assertion that `isBlocked` is omitted or that canonical nested fields are present. The service comment calls nested fields deferred (`products.service.ts:18-23`), but no explicit contract exception was found in the reviewed canonical sources.
- **Impact / action:** This is not a failure of the basic public-browse filtering flow, but it is an API contract mismatch for Layer 2 clients and future consumers. Before Layer 1 PASS, either align the product response (and tests) with `06-api-contract.md`, or obtain/record an approved contract exception/change through the prescribed Change Request path. Do not silently treat a code comment or the broad “basic browse” scope as a canonical-contract change.

### [PARTIAL] Low — Explicit `stock=0` list behavior lacks a focused regression assertion

- **Requirement:** Zero-stock items remain browseable with stock value so the frontend can display “Hết hàng” (`SPECIFICATIONS.md:70`; `tasks/ecommerce-mvp/layer-1-task-04.md:78`).
- **Implementation:** Browse predicate filters only `isActive` / `isBlocked` (`products.service.ts:64-90`), so zero-stock records are not filtered out.
- **Tests:** Existing integration tests cover visibility, filters, sort, pagination and 404 (`products.integration.spec.ts:37-178,181-214`) but do not assert a stock-zero item appears in results. Add a focused assertion with the next related test update. The implementation appears correct by inspection; this finding alone would not block Layer 1.

## Known cross-document conflict not attributable to Layer 1

`project-ecommerce/06-api-contract.md:307-319,362-395` still describes Guest cart/merge and optional Guest checkout, while the newer intent rules reject those flows (`SPECIFICATIONS.md:75-79`; `docs/PERMISSION.md:82-83`; `docs/USER_FLOW.md:3-5,222-230`). This is an existing canonical-doc conflict for future cart/checkout work. Those routes are not implemented in Layer 1, so it is recorded as a downstream reconciliation risk, not a Layer 1 implementation gap. Resolve it before implementing those APIs; this validator does not choose which intent to change.

## Test / review evidence

| Task | Review evidence | Result |
|---|---|---|
| Layer 1 Task 01 — Auth | `.context/review-reports/feature-ecommerce-mvp-layer-1-task-01-round-4-review.md:7-22,41-53` | STRICT PASS; lint, typecheck, 24 suites / 131 tests PASS. |
| Layer 1 Task 02 — User & Shop | `.context/review-reports/feature-ecommerce-mvp-layer-1-task-02-round-2-review.md:7-26,45-51` | STRICT PASS; lint, typecheck, 29 suites / 163 tests PASS. |
| Layer 1 Task 03 — Category | `.context/review-reports/feature-ecommerce-mvp-layer-1-task-03-round-2-review.md:14-27,41-50` | STRICT PASS; lint, typecheck, 33 suites / 209 tests PASS. |
| Layer 1 Task 04 — Product browse + seed | `.context/review-reports/feature-ecommerce-mvp-layer-1-task-04-round-2-review.md:7-17,24-31,53-64` | STRICT PASS; lint, typecheck, 37 suites / 246 tests PASS. Seed not run against live MongoDB; reported residual risk. |

The source checkout's task files 02–04 still show unchecked DoD/acceptance boxes (`layer-1-task-02.md:18-31`, `layer-1-task-03.md:17-30`, `layer-1-task-04.md:37-54`) despite the completed PASS review reports and progress entry. This is close-out traceability drift, not evidence that implementation failed; reconcile task artifacts in close-out rather than relying only on `progress.json`.

## Layer 2 unlock decision

**Do not unlock Layer 2 yet.** `.context/progress.json:8-14` records Layer 1's four tasks complete and `currentLayer: 1`, but the phase gate also requires a PASS phase review. Resolve the product-detail contract partial (or record an explicitly approved canonical contract exception) and then rerun this phase review as round 2. The LOW stock-zero test assertion and stale task checkboxes should be reconciled, but neither alone blocks unlock. After a PASS re-review and the normal human checkpoint, Layer 2 may proceed.

## Sources reviewed

`SPECIFICATIONS.md`; `docs/API_SPEC.md`; `docs/ERD.md`; `docs/PERMISSION.md`; `docs/ARCHITECTURE.md`; `docs/USER_FLOW.md`; `project-ecommerce/06-api-contract.md`; Layer 1 task files 01–04; backend auth/users/categories/products modules and sample seed; four latest Layer 1 reviewer reports; `.context/progress.json`; `.context/project-config.md`; `.agent/FEATURE_WORKFLOW.md`; `.agent/spec-validator.md`.
