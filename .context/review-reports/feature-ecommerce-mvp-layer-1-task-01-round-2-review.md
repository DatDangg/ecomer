# Round 2 Review — ecommerce-mvp Layer 1 Task 01 (Auth API)

- **Review level:** STRICT
- **Reason:** Authentication and password handling are security-sensitive; this round specifically verifies a bcrypt password truncation fix.
- **Blast radius:** Public registration DTO/validation and password hashing; login password comparison; admin account bootstrap using the shared bcrypt helper; auth HTTP integration tests.
- **Scope:** Re-reviewed the changed UTF-8 byte validator, registration DTO and integration test, plus the shared password hashing helper, login DTO, admin seed path, task and configured verification profile. No source files were modified.

## Verify commands + result

The requested independent reruns were **Blocked**. A previous shell invocation in this review session was denied by the runtime. Under the Tool Loop Guard, I must not retry shell commands or route around that denial. Therefore the results below are not inferred from the builder's statement or the previous review round.

| Configured command | Round 2 result |
|---|---|
| `npm --prefix backend run lint` | **Blocked — not rerun** (shell permission denial; retry prohibited) |
| `npm --prefix backend exec -- tsc --noEmit -p backend/tsconfig.json` | **Blocked — not rerun** (shell permission denial; retry prohibited) |
| `npm --prefix backend run test` | **Blocked — not rerun** (shell permission denial; retry prohibited) |

## Finding closure and code review

- **Round-1 [MAJOR] finding:** the byte-length defect is closed in the public registration path by `@MaxUtf8Bytes(72)`. The validator checks `typeof value === 'string'` and `Buffer.byteLength(value, 'utf8') <= max` (`backend/src/common/validators/max-utf8-bytes.decorator.ts:26-29`); the register DTO applies it to the password while retaining the minimum length (`backend/src/modules/auth/dto/register.dto.ts:19-23`).
- **Regression test:** the new integration test sends `'ế'.repeat(30)` and expects 400 (`backend/src/modules/auth/auth.integration.spec.ts:212-222`). The character is three UTF-8 bytes, so the input is 90 bytes while only 30 characters; this is a suitable regression case for the reported failure mode. The configured global `ValidationPipe` runs class-validator decorators. By source inspection, this closes the reported public-registration defect. Because tests could not be executed this round, runtime success of the regression test is **not independently verified**.
- **New defects:** none identified by source inspection in the added validator or DTO change. The validator is small, direct, and uses a fixed internal limit; no new unsafe fallback or input coercion was introduced.

## Other password paths — residual assessment

- `LoginDto` still accepts any non-empty string (`backend/src/modules/auth/dto/login.dto.ts:7-9`). `bcrypt.compare` therefore retains bcrypt's usual behavior of ignoring bytes beyond its 72-byte input limit. Since public registration now rejects passwords over 72 UTF-8 bytes, this does not allow login without knowing the registered password, but a valid password with an appended suffix may compare identically. **Recommended follow-up:** apply the same byte limit to login inputs for consistent, unsurprising credential semantics. This is not a blocker for the reported registration defect.
- `AdminSeedService.seedAdmin` hashes `ADMIN_PASSWORD` through the shared `hashPassword` helper without a byte-length check (`backend/src/database/seed/admin-seed.service.ts:51-60`; helper: `backend/src/modules/users/users.service.ts:12-14`). A configured multibyte admin password over 72 bytes can therefore still be silently truncated. This path is environment-controlled bootstrap, not public account creation; it is an **acceptable out-of-scope residual for this task**, not a blocker to closing the public registration finding. Recommended hardening: enforce the invariant at the shared hashing boundary (or validate/fail fast on the seed configuration) so every account-creation path has the same limit. If that shared helper is changed, cover both public creation and admin seeding.

## Responsive Checklist Gate

**N/A** — no UI, route component, or CSS is part of this backend-only change.

## Skill gates

- **aislop:** `skip, aislop not installed` — round 1 invocation returned `command not found`; no score available. Not retried.
- **oxlint (anti-slop):** **Blocked** — round 1 shell permission denial prevented the check; configuration status and lint result remain unverified. Not retried.
- **ocr (open-code-review):** **Blocked** — round 1 shell permission denial prevented `ocr delegate preview`; installation/status and findings remain unverified. Not retried.
- **AI-readable:** **OK by source inspection** — descriptive validator/decorator names, direct validation flow, 37-line validator file, and rationale comment; no three-indicator AI-chaos threshold observed. README/architecture documentation was not part of this scoped change.
- **AI-friendly-web:** **N/A** — internal backend API change, not a public web publishing/deployment task.
- **blitzstrike:** `skip, no authorized live target/tool session available` — no live target was assumed or probed.

## Findings

- **No new source-code finding identified.** The original byte-length issue is closed for public registration by inspection. Admin-seed and login-path considerations are documented above as non-blocking residuals/follow-up hardening.
- **Verification remains blocked:** this task's acceptance criteria require lint, typecheck, and tests to pass, but none could be independently confirmed for round 2.

## Verdict

**❌ FAIL (verification blocked)** — the code-level fix and regression case appear correct by inspection, but the required round-2 lint, typecheck, and test results could not be independently verified. Do not mark the task PASS until those configured commands can be run successfully in an authorized shell environment.
