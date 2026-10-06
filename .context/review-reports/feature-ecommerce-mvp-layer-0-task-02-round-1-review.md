# Review: ecommerce-mvp layer 0 task 02 — round 1

## Review level
**STRICT**

## Reason
This task changes the MongoDB/Mongoose database foundation and shared API response/error/pagination contracts. Database/transaction prerequisites and reusable serialization/error handling have broad downstream impact, so STRICT is required.

## Blast radius
- `backend/src/database/database.module.ts` and environment configuration affect API startup and all future database-backed modules, especially transaction-dependent checkout/order flows.
- `backend/src/common/dto/pagination-query.dto.ts` affects every future paginated list endpoint.
- `backend/src/common/filters/all-exceptions.filter.ts` and `backend/src/common/response.ts` define shared responses for all endpoints and clients.
- `backend/src/common/schemas/base.schema.ts` is a shared serialization boundary for all future Mongoose schemas, including credential/token-bearing user documents.
- Shared enums/constants affect future model and API values.

## Verify commands + result
- `npm --prefix backend run lint` — PASS (exit 0).
- `npm --prefix backend exec -- tsc --noEmit -p backend/tsconfig.json` — PASS (exit 0).
- `npm --prefix backend run test` — PASS: 11 suites, 51 tests.
- `npm --prefix backend run build` — reviewer invocation permission-denied; **builder-verified, not re-run**.
- MongoDB-backed integration/startup check — not run; tests intentionally use lazy connection in `NODE_ENV=test` and do not require a live MongoDB. Production replica-set topology is not demonstrated by the unit tests.

## Responsive Checklist Gate
**N/A** — project has UI configuration, but this diff is backend-only and does not change routes, components, or CSS.

## Skill gates
- **aislop:** `skip, aislop not installed` — `aislop scan --changes --json` returned `aislop: command not found`; no score available.
- **oxlint (anti-slop):** `skip, oxlint not configured` — repository glob `**/*oxlint*` returned no files/config; configured ESLint lint command passed.
- **ocr (open-code-review):** `skip, ocr not installed` — `ocr delegate preview` returned `ocr: command not found`.
- **AI-readable:** OK — changed code has descriptive names, helper functions are short, significant limits/status codes are named constants, and the database/API flows align with existing `docs/ARCHITECTURE.md` module/lifecycle descriptions. No three-indicator AI-chaos threshold reached.
- **AI-friendly-web:** N/A — no public website/page/crawler-facing changes in this backend foundation task.
- **blitzstrike:** `skip, no permitted live test environment` — no API endpoint/live target is introduced by this task; no STRIKE-validated test was run.

## Findings

### [MAJOR] A standalone MongoDB can be accepted even though transactions require a replica set
**File:** `backend/src/database/database.module.ts:30-34`

The options only pass the configured URI and timeout to Mongoose. `lazyConnection` is correctly restricted to `NODE_ENV === 'test'`, but the non-test path does not verify that the connected MongoDB topology is a replica set. A valid URI to a standalone MongoDB therefore allows startup to complete while later calls to `session.withTransaction` fail at runtime. This violates the documented mandatory replica-set invariant in the task, `docs/ERD.md`, and `docs/ARCHITECTURE.md` §5/§10, and leaves a production database misconfiguration undetected until transactional business operations execute. The current tests only assert option values and do not cover rejection of a standalone topology.

**Suggested fix:** after a non-test connection is established, validate the actual driver topology is a replica set (or otherwise enforce an equivalent reliable replica-set-only connection invariant) and fail application startup with an actionable configuration error. Add a test around the topology check; keep the test-only lazy path isolated.

### [MAJOR] Non-finite `limit` values are accepted and silently clamped instead of returning 400
**File:** `backend/src/common/dto/pagination-query.dto.ts:42-45`

`parseNumber('Infinity')` returns `Infinity`, after which `Math.min(Infinity, MAX_LIMIT)` returns `100`. Thus `?limit=Infinity` (and numeric overflow such as `?limit=1e999`) passes `@IsInt()` after transformation and is accepted as a valid maximum page size. The task/API contract requires invalid `page`/`limit` values to produce HTTP 400; clamping should apply to valid numeric limits above 100, not non-finite input.

**Suggested fix:** reject non-finite parsed values before clamping (so class-validator receives an invalid value), and add integration coverage asserting non-finite/overflow query values return the standard 400 error envelope while finite values over 100 clamp to 100.

### [MAJOR] Per-schema serialization transform overrides can bypass the shared secret-field sanitizer
**File:** `backend/src/common/schemas/base.schema.ts:38-45`

`withBaseSchemaOptions()` claims to keep the base serialization transforms, but spreading `options.toJSON` / `options.toObject` after the base options replaces `hideInternalFields` whenever a schema supplies its own `transform`. A schema using this supported helper with a custom transform can consequently serialize `passwordHash`, `refreshTokenHash`, or `__v`, defeating the central security guarantee and the task requirement that internal fields be hidden.

**Suggested fix:** compose custom transforms with the base sanitizer, ensuring the base removal runs on the final serialized object regardless of per-schema transforms. Add tests using both custom `toJSON.transform` and `toObject.transform` and assert internal fields remain absent.

## Verdict
❌ **FAIL** — three MAJOR findings remain; task must return to Builder before approval.
