# Independent Review — Category API (Layer 1, Task 03)

## Review level
`STRICT`

## Reason
This task adds a public API and admin-only CRUD, uses MongoDB unique indexes and collection queries, and changes a shared API contract. RBAC, database integrity, and response compatibility are strict-risk areas.

## Blast radius
- `backend/src/modules/categories/**`: category schema, DTO validation, public list/detail, admin create/update/delete, and category-to-product reference checks.
- `backend/src/app.module.ts`: exposes the Categories module in the Nest application.
- Public API consumers of `/api/v1/categories` and admin clients; MongoDB `categories` and the `products.categoryId` relationship.

## Verify commands + result
Commands taken from `.context/project-config.md` and run independently:
- `npm --prefix backend run lint` — **PASS**, exit code 0.
- `npm --prefix backend exec -- tsc --noEmit -p backend/tsconfig.json` — **PASS**, exit code 0.
- `npm --prefix backend run test` — **PASS**, 32 suites / 209 tests passed.

## Scope checks
- Admin authorization: **OK**. `POST` / `PATCH` / `DELETE` have `@Roles(UserRole.ADMIN)` and the controller applies `RolesGuard`; integration tests cover missing-auth 401 and customer 403 (POST, PATCH, DELETE).
- Mass assignment: **OK**. Create DTO excludes both `slug` and `isActive`; global `ValidationPipe` uses whitelist + forbidNonWhitelisted. Patch deliberately accepts `isActive` as an admin-editable field (needed to deactivate categories), but excludes `slug`; an integration test verifies a supplied slug is rejected. Service update also picks only allowed fields.
- Duplicate-name handling / unique constraint: **OK**. Name and slug have unique schema indexes. The service pre-checks duplicate names; the common exception filter maps Mongo duplicate-key error 11000 to 409, covering the check/insert race. (No live concurrent DB repro run; this conclusion is based on code and test-suite evidence.)
- Product-reference deletion guard: **OK**. Delete counts documents in the raw `products` collection by `categoryId` and rejects with 400 plus a clear Vietnamese message when count > 0; integration tests cover referenced and unreferenced categories.
- Public visibility and invalid IDs: **OK**. List filters `isActive: true`; public detail queries active records only and validates ObjectId before querying, returning 404 for malformed/missing/inactive IDs. Integration tests cover these paths.
- Routing: **OK**. There are no static GET paths shadowed by `GET /:id` in this controller.
- Slug generation: **OK** for creation: Vietnamese diacritics are normalized and slug collisions get numeric suffixes; unique schema index is the final constraint. Patch ignores/rejects body-supplied slug. Existing slug remains stable on rename.
- Response wrapper: **OK**. The app applies the shared response interceptor and global exception filter; integration tests verify success envelopes and error status behavior.
- `image` vs `imageUrl`: **Contract mismatch; see MAJOR finding below.** The task explicitly requests `image?`, which the implementation follows, but the detailed API contract named by `docs/API_SPEC.md` as the request/response source specifies `imageUrl`. A task-local field name does not remove the unresolved client-contract discrepancy.

## Responsive Checklist Gate
`N/A` — backend API/controller/schema/DTO/test changes only; no UI, route screen, or CSS changed.

## Skill gates
- **aislop:** `skip` — `aislop scan --changes --json` could not run: executable not installed (`command not found`, exit 127).
- **oxlint (anti-slop):** `skip, oxlint not configured` — repository glob for oxlint config/files returned no matches.
- **ocr (open-code-review):** `skip, ocr not installed` — `ocr review --format json` returned `command not found` (exit 127).
- **AI-readable:** `OK` — names and responsibilities are specific; no function over 50 lines or three-or-more AI-chaos indicators found in the reviewed implementation. Minor size note: two added test/support files exceed the configured 300-line file guideline (`categories.service.spec.ts` 336 lines; `test-support/category-api.harness.ts` 338 lines); see Minor finding.
- **AI-friendly web:** `N/A` — public JSON API only; this change does not add a public web page or web crawl surface.
- **blitzstrike:** `skip` — optional pentest not run; no authorized live target or STRIKE-validated test environment was supplied. Static source review and the configured tests were used.

## Findings

### [MAJOR] Category image field conflicts with the documented API contract
- **Location:** `backend/src/modules/categories/dto/create-category.dto.ts:20-24`; `backend/src/modules/categories/dto/update-category.dto.ts:27-31`; `backend/src/modules/categories/categories.service.ts:40-42,72-73`; `project-ecommerce/06-api-contract.md:219,232`.
- **Issue:** The API implementation accepts and returns `image`, while the detailed API contract documents request `imageUrl` and response `imageUrl`. With the global `forbidNonWhitelisted` validation, a client sending the documented `imageUrl` is rejected with 400; clients reading the documented response key will not find it.
- **Suggested fix:** Resolve the contract in the task/spec source, then use one field name end-to-end (DTO, schema/view mapping, tests, and detailed API contract). If `image` is the intended new contract, publish the API-contract change; otherwise accept/return `imageUrl` consistently (an explicit compatibility alias is an alternative only if intended).

### [MINOR] Added test files exceed the configured file-size guideline
- **Location:** `backend/src/modules/categories/categories.service.spec.ts:1-336`; `backend/src/modules/categories/test-support/category-api.harness.ts:1-338`.
- **Issue:** Both new files exceed `.context/project-config.md`'s 300-line limit. This does not affect runtime behavior, but makes the task's tests/support harder to navigate.
- **Suggested fix:** Split the service tests by behavior group and extract the harness's in-memory model/fixture helpers into focused files, keeping each file within the configured limit.

## Residual risk
- No live MongoDB concurrency repro was run. The duplicate-name race outcome is inferred from the unique indexes and shared exception mapping, and unit/integration suites pass.
- No browser/responsive validation applies to this backend-only change.
- The image field conflict should be settled before API clients integrate, as the currently documented request cannot be used successfully against this implementation.

## Verdict
❌ **FAIL** — unresolved MAJOR API contract mismatch (`image` vs `imageUrl`).
