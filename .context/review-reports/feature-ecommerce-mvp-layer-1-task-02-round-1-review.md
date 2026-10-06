# Independent Review — Feature Ecommerce MVP / Layer 1 / Task 02 / Round 1

- **Review level:** STRICT
- **Reason:** User profile/shop API handles authenticated user data and credential-adjacent profile responses; it changes public API response behavior and accepts user-controlled update input, including mass-assignment-sensitive fields. The configured risk rules require STRICT for auth/security and API-contract changes.
- **Blast radius:** `backend/src/modules/users/{users.controller.ts,users.service.ts,shops.controller.ts,shops.service.ts,user.schema.ts,dto/*}`; `/api/v1/users/me`, `/api/v1/users/me/shop`, `/api/v1/shops/:sellerId`; downstream consumers of required user profile/shop fields (checkout prefill, seller/shop display, and later product seller flows). Tests in `backend/src/modules/users/*spec.ts` exercise the endpoints. The working tree also has `.context/runs/start-ecommerce-01.md` modified; that file is outside this task's implementation scope and must not be included in the task commit.

## Verify commands + result

Ran independently using the configured commands in `.context/project-config.md`:

| Command | Result |
|---|---|
| `npm --prefix backend run lint` | **PASS**, exit 0; ESLint reported no errors. |
| `npm --prefix backend exec -- tsc --noEmit -p backend/tsconfig.json` | **PASS**, exit 0; no diagnostics. |
| `npm --prefix backend run test` | **PASS**, exit 0; 27 suites passed, 156 tests passed. Includes the new user/shop HTTP integration tests. |

## Requirements and contract checks

- Profile responses are explicitly mapped to a public DTO (`toUserProfile`); `passwordHash` and `refreshTokenHash` are not included. The HTTP test asserts neither hash name appears.
- `role`, `isActive`, and `email` are absent from `UpdateProfileDto`; the global `ValidationPipe` has both `whitelist: true` and `forbidNonWhitelisted: true`. Integration tests verify an attempted extra key is rejected with HTTP 400 and does not update the fixture.
- `productCount` uses a MongoDB count filter with `isActive: true` and `isBlocked: false`; the unit and HTTP tests cover active/unblocked vs inactive/blocked products.
- Public shop lookup returns 404 for missing shop, inactive/banned user, unknown ID, and malformed ObjectId. It is explicitly `@Public()`.
- Route declarations do not conflict: user self routes are static (`me`, `me/shop`); public shop route is isolated under its own `shops` controller.
- Success responses are wrapped by the global `ResponseInterceptor` as `{ success, data, message }`, matching `docs/API_SPEC.md` and the detailed API contract. The tested profile/shop response shapes match the documented fields.
- **Residual risk:** No live app/DB/manual UAT was run (prohibited for this review). HTTP tests use an in-memory fixture; product-count behavior is verified against the expected filter, not a live MongoDB collection.

## Responsive Checklist Gate

- **N/A** — project has UI breakpoints configured, but this task's diff touches backend API/schema/tests only; no route component or CSS changed.

## Skill gates

- **aislop — OK:** `npx aislop@latest scan --changes --json` completed with score **100** (Healthy), 0 diagnostics, 0 errors/warnings. Direct `aislop` executable was not installed; the `npx` invocation succeeded.
- **oxlint (anti-slop) — skip, oxlint not configured:** targeted config glob found no Oxlint config, so the configured-repo-only gate does not apply.
- **ocr (open-code-review) — skip, ocr not installed:** `ocr delegate preview` returned command-not-found; no OCR findings are asserted.
- **AI-readable — OK (below fail threshold):** names and call path are clear and under three indirection steps. One AI-chaos/code-quality indicator is present: `createFixture()` spans more than 50 lines in `backend/src/modules/users/users.integration.spec.ts:69-129`. The as-built architecture map also still describes a separate `shops` module at `docs/ARCHITECTURE.md:83-84`, while this task implements the controller/service in `modules/users`; recommend reconciling that map. These observations do not reach the ≥3 AI-chaos-indicator fail threshold; the oversized test helper/file is also recorded below as MINOR.
- **ai-friendly-web — N/A:** this is a backend API task (including one public JSON endpoint), not a public website/page or web deployment task; no public web crawl surface was changed.
- **blitzstrike — skip, no approved live target/MCP environment available:** this STRICT API task has no configured running dev/staging target in the review evidence. No live pentest was performed and no STRIKE-validated findings are claimed.
- **Responsive UI craft — N/A:** no UI changed.

## Findings

### [MAJOR] Shop name validation runs before schema trimming, allowing persisted names shorter than 3 characters

- **Location:** `backend/src/modules/users/dto/update-shop.dto.ts:8-12`; normalization is configured at `backend/src/modules/users/user.schema.ts:52-53`.
- **Evidence:** `@MinLength(3)` evaluates the raw request string, while the Mongoose schema trims it during persistence. For example, `" A "` has three raw characters and passes DTO validation, then is stored as `"A"`; a whitespace-only three-character string also passes and is trimmed to an empty string. The endpoint can therefore return success while saving a shop name outside the required 3–50 character range (or an empty name that is subsequently treated as no shop). Existing tests cover only lengths 2 and 51, not whitespace/trimmed values.
- **Suggested fix:** Trim/normalize before class-validator checks (or validate the trimmed value), reject blank names, and add tests for whitespace-only and leading/trailing-space inputs whose normalized length is below 3.

### [MAJOR] `PATCH /users/me` can clear the required full name with JSON `null` or whitespace

- **Location:** `backend/src/modules/users/dto/update-profile.dto.ts:9-14`; `backend/src/modules/users/users.service.ts:145-147`; required schema field at `backend/src/modules/users/user.schema.ts:29-30`.
- **Evidence:** `@IsOptional()` skips the other validators for `null`; `@IsNotEmpty()` also accepts a whitespace-only string. `pickProfileFields` includes `null` because it checks only against `undefined`, and `findByIdAndUpdate` does not enable update validators. Since the schema trims `fullName` and marks it required, these requests can persist `null` or an empty trimmed name despite the response type promising a string, breaking the required profile/checkout-prefill invariant. No test covers these inputs.
- **Suggested fix:** Reject `null` and whitespace-only `fullName` at the DTO boundary (normalize before validation), and/or enable Mongoose update validators; add HTTP regression tests that assert invalid requests return 400 and leave the stored name unchanged.

### [MINOR] New integration test file/helper exceed the stated size limits

- **Location:** `backend/src/modules/users/users.integration.spec.ts:69-129` (`createFixture`, over 50 lines); file is 357 lines, exceeding the reviewer code-quality limit of 300 lines/file.
- **Evidence:** The fixture builder and all HTTP cases are in one oversized test file; current lint/typecheck/test passes do not enforce the stated readability limits.
- **Suggested fix:** Extract the fixture into a dedicated test-support module and split endpoint cases into focused test files, keeping functions ≤50 lines and files ≤300 lines.

### [MINOR] As-built architecture module map does not match the implementation

- **Location:** `docs/ARCHITECTURE.md:83-84`.
- **Evidence:** The current-state architecture describes `/shops/:sellerId` as a separate `shops` module using `UsersService` + `ProductsService`; the task adds `ShopsController`/`ShopsService` within `modules/users`, and counts through the raw collection as called for by the task notes. The API endpoint overview itself is already documented and matches the response contract.
- **Suggested fix:** Reconcile the as-built module map to show the shop controller/service under `modules/users` and explain the raw collection count boundary, or implement the documented separate module if that architecture is intended.

## Verdict

**❌ FAIL** — two MAJOR validation defects remain. The three configured verification commands pass, but they do not cover the invalid trimmed shop-name or nullable/whitespace full-name cases.
