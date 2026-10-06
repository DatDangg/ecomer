# Independent Review — ecommerce-mvp Layer 1 Task 01 — Round 4

- **Review level:** STRICT
- **Reason:** Authentication and public registration endpoint; the change handles database uniqueness races and determines an externally visible API status code. STRICT is required for auth/security-sensitive API work.
- **Blast radius:** `backend/src/modules/auth/auth.service.ts` registration conflict mapping, its HTTP integration test, the existing unique-email constraint in the user model, and clients relying on `/auth/register` returning 409 for duplicate email. No UI, schema, or migration changes were reviewed in this round.

## Verify commands + result

All three configured backend verification commands were run independently in this review (not relying on primary-provided fallback evidence):

| Command | Result |
|---|---|
| `npm --prefix backend run lint` | PASS, exit 0; no errors |
| `npm --prefix backend exec -- tsc --noEmit -p backend/tsconfig.json` | PASS, exit 0 |
| `npm --prefix backend run test` | PASS, 24 suites / 131 tests |

## Review checks

- **R1 UTF-8 byte-length fix:** Closed. `backend/src/modules/auth/dto/register.dto.ts:21-23` uses `@MaxUtf8Bytes(72)` rather than a character-count check. The validator measures `Buffer.byteLength(value, 'utf8')` (`backend/src/common/validators/max-utf8-bytes.decorator.ts:26-29`). The HTTP regression test sends `'ế'.repeat(30)` (30 characters / 90 UTF-8 bytes) and expects 400 (`backend/src/modules/auth/auth.integration.spec.ts:231-241`).
- **R3 duplicate-key race fix:** Closed. `AuthService.register()` catches failures from `usersService.create()` and maps only an object whose `code` is exactly numeric MongoDB duplicate-key code `11000` to `ConflictException`/409 (`backend/src/modules/auth/auth.service.ts:101-115`). All other caught values are rethrown unchanged at line 114, so unrelated database/application failures are not converted into a conflict. The existing unique email constraint is present at `backend/src/modules/users/user.schema.ts:18-24`.
- **R3 regression test:** The integration test overrides `fixture.usersService.create` to throw an `Error` carrying `code: 11000`, sends a real HTTP request through the Nest test app, and expects 409 (`backend/src/modules/auth/auth.integration.spec.ts:200-213`). This reaches the `register()` catch path: the fixture's `exists()` reports no account for `race@example.com`, then the overridden create operation rejects. The original `create` function is restored in a `finally` block (`auth.integration.spec.ts:201-216`), so restoration occurs on both assertion success and failure.
- **New CRITICAL/MAJOR defects:** None found in the reviewed fix.
- **Surgical diff / code shape:** The registration catch and predicate are narrowly scoped to the duplicate-index race; names are descriptive and the new service/helper/test functions are within the 50-line guideline. No unrelated production-code refactor was identified in the reviewed files.

## Responsive Checklist Gate

**N/A** — this round's change is backend-only; no route component, CSS, or other UI code is in scope. No responsive/browser measurements apply.

## Skill gates

| Gate | Result + evidence |
|---|---|
| `aislop` | **skip — command restriction.** The requested exact-command allowlist permitted only the three verification commands above; `aislop scan --changes --json` was therefore not run. No score is claimed. |
| `oxlint` (anti-slop) | **skip — oxlint not configured.** A targeted Glob search for `**/*oxlint*` returned no files; configured ESLint lint passed. |
| `ocr` (open-code-review) | **skip — command restriction.** No OCR command was allowed in this review; installation/status was not independently verified. |
| AI-readable | **OK.** New code uses descriptive names, has shallow control flow, and introduces no new indirection or undocumented main-flow change. The pre-existing `createUserStore()` fixture helper spans over 50 lines (auth.integration.spec.ts:67-129); this is the previously noted/deferred MINOR and was not enlarged by the current fix. |
| AI-friendly web | **N/A.** Backend auth API-only change; no public-facing webpage, crawler configuration, or web metadata changed. |
| BlitzStrike | **skip — command/environment restriction.** Optional pentest was not run because only the three exact verification commands were authorized and no permitted live target was provided. |
| Security / OWASP review | **OK for the reviewed delta.** The write remains through the server-controlled `UsersService.create()` fields, the unique-index error is translated without exposing driver details, and non-duplicate errors are rethrown for normal exception handling. No new JWT/token handling was introduced by this delta. Optional scanner execution was not authorized by the command restriction. |

## Findings

- **[MINOR, known/deferred]** `backend/src/modules/auth/auth.integration.spec.ts:67-129` — existing in-memory `createUserStore()` helper exceeds the 50-line guideline. This predates the duplicate-key fix, was intentionally deferred in R3, and does not block this review. Suggested follow-up: split the fixture construction into small named helpers without changing behavior.
- No CRITICAL or MAJOR findings remain. R1 and R3 findings from prior rounds are closed as evidenced above.

## Residual risk

- The integration fixture simulates the database race by making `create()` reject with MongoDB's numeric `11000` code; it does not start MongoDB and produce a real simultaneous insert. The production path is protected by the schema's unique email index, and the mapping matches the driver error code, but live database concurrency was not exercised in this review.
- Optional scanners (`aislop`, OCR, BlitzStrike) were not run under the explicit restriction to the three listed shell commands.

## Verdict

✅ **PASS** — R1 byte-limit behavior remains covered, the R3 duplicate-key catch path is exercised through HTTP with fixture restoration, unrelated errors are rethrown by inspection, and all configured lint/typecheck/test commands passed. No CRITICAL/MAJOR defects remain.
