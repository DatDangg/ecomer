# Spec Validator — Phase Review — ecommerce-mvp / Layer 1 — Round 2

**Review mode:** Phase review (requirement ↔ task ↔ implementation ↔ tests)  
**Work item:** `feature/ecommerce-mvp`  
**Layer reviewed:** 1 — Auth, User & Shop, Category, Product public browse + sample seed  
**Round:** 2 (re-review of the Layer 1 gap recorded in round 1)  
**Evidence boundary:** Read current requirements, task artifacts, code/tests, progress, and prior independent task-review reports. Verification commands were not rerun in this validation; command results below are cited from the relevant task-review reports.

## Verdict: ✅ COMPLETE — Layer 1 PASS

The round-1 public product-detail contract gap is closed. Current `GET /products/:id` returns the canonical nested `category` and `seller` fields and does not expose `isBlocked` or `blockReason` on the public response. Tests now assert this response behavior and the `stock=0` list behavior. The product visibility/404 behavior remains intact.

R-04 seller CRUD, upload, and owner/admin preview remain deliberately deferred by the Layer 1 task scope. They are not treated as Layer 1 gaps. No remaining Layer 1 implementation gap blocks completion.

## Coverage matrix

| Requirement | Source | Status | Note |
|---|---|---|---|
| **R-01 Auth & User** — registration/login/refresh/logout, customer-only public registration, JWT TTLs, hashed refresh persistence, banned-account behavior and throttling | `SPECIFICATIONS.md:44-49`; `project-ecommerce/06-api-contract.md:76-138`; `tasks/ecommerce-mvp/layer-1-task-01.md:10-27`; task reviewer report `.context/review-reports/feature-ecommerce-mvp-layer-1-task-01-round-4-review.md:7-22,51-53` | ✅ Covered | Task 01 acceptance is checked; independent STRICT review reports configured backend lint, typecheck and tests PASS (24 suites / 131 tests). Its stated live-Mongo concurrency and password byte-limit residuals do not leave an unmet Layer 1 acceptance criterion. |
| **R-02 User & Shop** — profile read/update allowlist, shop setup, public shop info/count, hidden/banned shop 404 | `SPECIFICATIONS.md:51-55`; `tasks/ecommerce-mvp/layer-1-task-02.md:10-24`; `.context/review-reports/feature-ecommerce-mvp-layer-1-task-02-round-2-review.md:17-26,49-51` | ✅ Covered | Independent STRICT review confirms profile field restrictions, credential exclusion, productCount visibility predicate, shop 404 cases and response envelope. Configured backend lint/typecheck/tests PASS (29 suites / 163 tests). Seller product-create gate belongs to the deferred seller CRUD scope. |
| **R-03 Category** — admin CRUD, active-only public reads, generated unique slug, duplicate-name 409, reject deletion while referenced | `SPECIFICATIONS.md:57-60`; `tasks/ecommerce-mvp/layer-1-task-03.md:10-23`; `.context/review-reports/feature-ecommerce-mvp-layer-1-task-03-round-2-review.md:20-27,49-50` | ✅ Covered | Independent STRICT review verifies authorization, `imageUrl` contract, mass-assignment rejection, duplicate create/rename conflicts, active-only reads, delete-reference guard and 404 cases. Configured backend lint/typecheck/tests PASS (33 suites / 209 tests). |
| **R-04 Product — Seller** — product ownership/schema constraints and seller create/update/delete behavior | `SPECIFICATIONS.md:62-66`; `tasks/ecommerce-mvp/layer-1-task-04.md:12-15,29-31,76-84`; `backend/src/modules/products/product.schema.ts:19-84,91-98`; `.context/review-reports/feature-ecommerce-mvp-layer-1-task-04-round-2-review.md:30-31,62-64` | ⚠️ Partial by explicit Layer 1 scope; not a Layer 1 gap | Product schema/domain fields include immutable `sellerId`, unique slug, product fields, stock constraints and indexes. Seller CRUD, `/products/my`, upload and moderation are expressly deferred in task 04; the independent review confirms those routes/behaviors were not introduced. The remaining R-04 write behavior must be handled in its later approved scope. |
| **R-05 Product — Public** — list/search/filter/sort/pagination, visible-only records, zero-stock availability, product detail fields and hidden/blocked 404 | `SPECIFICATIONS.md:68-73`; `project-ecommerce/06-api-contract.md:238-288`; `tasks/ecommerce-mvp/layer-1-task-04.md:21-27,37-47,76-79`; `tasks/ecommerce-mvp/layer-1-task-05.md:10-19,24-30`; implementation `backend/src/modules/products/products.service.ts:34-51,74-90,97-123,146-162,171-188,190-212`; controller `backend/src/modules/products/products.controller.ts:27-40`; tests `backend/src/modules/products/products.integration.spec.ts:37-72,193-247`; `.context/review-reports/feature-ecommerce-mvp-layer-1-task-05-round-1-review.md:9-16,61-63` | ✅ Covered; round-1 gap closed | Public mapper omits moderation-only fields; detail enriches with nested `{id,name}` category and `{id,shopName}` seller; missing refs degrade safely; query remains constrained to active/unblocked records and controller maps inaccessible details to 404. Tests assert nested refs and absence of both moderation keys, inactive/blocked/unknown/malformed 404s, plus a listed `stock=0` product. Task 05 reviewer STRICT PASS: configured lint/typecheck and tests PASS (37 suites / 248 tests). |
| **Canonical response envelope / product pagination** | `SPECIFICATIONS.md:136-142`; `project-ecommerce/06-api-contract.md:253-288`; product integration tests `backend/src/modules/products/products.integration.spec.ts:46-60,168-189`; task-04 review `.context/review-reports/feature-ecommerce-mvp-layer-1-task-04-round-2-review.md:28-29` | ✅ Covered | List tests assert success/data and `{items,total,page,limit,totalPages}`; task review validates the shared pagination envelope and configured checks. Detail assertions inspect the nested fields inside `data`. |
| **Layer 1 task/review state** | `.context/progress.json:7-15`; task-05 reviewer report `.context/review-reports/feature-ecommerce-mvp-layer-1-task-05-round-1-review.md:28-38,61-63` | ✅ Review evidence complete; close-out artifact caution | Progress lists Layer 1 tasks 01–05 complete and no task in progress. The task files for tasks 02–05 retain unchecked acceptance/DoD boxes despite their PASS reports; this is traceability drift, not evidence of missing behavior and not a blocker to this phase verdict. Primary close-out should reconcile the task artifacts as appropriate. |

## Round-1 gap closure

### [CLOSED] Public product detail response contract

- **Round-1 finding:** Public product detail had a flat response without nested `category` / `seller` and exposed `isBlocked`; see `.context/review-reports/feature-ecommerce-mvp-phase-1-round-1-review.md:38-44`.
- **Canonical requirement:** `project-ecommerce/06-api-contract.md:269-288` specifies `category: {id,name}`, `seller: {id,shopName}`, and limits `isBlocked` / `blockReason` to Owner/Admin.
- **Current implementation:** `toProductView()` omits both moderation fields (`products.service.ts:74-90`); `findPublicById()` resolves nested refs (`:171-188`) and safely handles absent refs (`:190-212`). Detail query still filters on `isActive=true,isBlocked=false` (`:31-32,175-179`); controller returns 404 on no visible result (`products.controller.ts:33-40`).
- **Regression evidence:** `products.integration.spec.ts:193-218` asserts nested category and seller plus absence of both moderation keys; `:220-233` covers dangling refs; `:235-247` covers inactive, blocked, unknown and malformed IDs returning 404. `:62-72` now explicitly verifies zero-stock list inclusion.
- **Independent review:** Task 05 STRICT PASS report verifies these behaviors and configured backend lint/typecheck/test PASS (`.context/review-reports/feature-ecommerce-mvp-layer-1-task-05-round-1-review.md:9-16,28-38,61-63`).

### Deferred scope disposition

Seller product CRUD and `/products/my`, upload, moderation, and owner/admin preview remain expressly out of Task 04 scope (`tasks/ecommerce-mvp/layer-1-task-04.md:29-31`) and are reaffirmed by Task 05 (`tasks/ecommerce-mvp/layer-1-task-05.md:16,29`). They are not counted as Layer 1 gaps. In particular, this PASS does not claim R-04 seller write paths or optional-auth preview are implemented.

## Residual / downstream notes

- R-04 is intentionally partial at the layer boundary as described above; carry the deferred seller write/upload/preview behavior into its approved future scope before declaring those requirements complete overall.
- The known cart/checkout guest-flow discrepancy recorded in round 1 remains outside Layer 1 (`.context/review-reports/feature-ecommerce-mvp-phase-1-round-1-review.md:52-54`). Reconcile before implementing those downstream APIs; it does not block this layer.
- Historical configured command results are cited from task review reports; this spec-validator pass did not rerun the commands.

## Layer 2 unlock decision

**Layer 1 meets the spec-validator phase gate and is eligible for Layer 2.** This report does not itself advance `.context/progress.json` or bypass the human checkpoint. Per the workflow, the primary session may unlock/start Layer 2 only after the normal Layer 1 PASS checkpoint/approval and the corresponding progress close-out.

## Sources reviewed

`.agent/FEATURE_WORKFLOW.md`; `.context/project-config.md`; `SPECIFICATIONS.md`; `project-ecommerce/06-api-contract.md`; `.context/progress.json`; Layer 1 tasks 01–05; Layer 1 round-1 phase report; task reviewer reports for tasks 01–05; `backend/src/modules/products/product.schema.ts`; `backend/src/modules/products/products.service.ts`; `backend/src/modules/products/products.controller.ts`; `backend/src/modules/products/products.integration.spec.ts`; `.agent/spec-validator.md`; relevant product rules in `docs/BRD.md`, `docs/PRD.md`, `docs/API_SPEC.md`, `docs/ERD.md`, `docs/USER_FLOW.md`, and `docs/PERMISSION.md`.
