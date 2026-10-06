# Review — feature-ecommerce-mvp / phase 1 / task 01 / round 3

## Review level

**STRICT**

**Reason:** This task changes authentication, password handling, refresh-token lifecycle, global authentication guards, and public auth endpoints. These are explicitly STRICT-risk areas (auth/session/password/API contract).

## Blast radius

- `POST /api/v1/auth/register`, `/login`, `/refresh`, and `/logout` behavior and response/error contracts.
- User account creation and the persisted `refreshTokenHash` field / one-refresh-token-per-user behavior.
- Global `JwtAuthGuard` and `ThrottlerGuard`, including public-route bypass and health endpoint accessibility.
- Password validation and bcrypt hashing behavior for UTF-8 passwords.
- Relevant backend auth integration/service tests and test environment bootstrap.

## Requirements / prior finding

- R-01 and `docs/PERMISSION.md` expectations were checked against the task and implementation: public registration does not accept `role`, returns no credentials, login uses the expected token lifetimes, refresh hashes are stored, logout clears the hash, and inactive accounts are rejected.
- **Round-1 [MAJOR] is closed:** `register.dto.ts:21-23` now applies `@MaxUtf8Bytes(72)` rather than a character-only maximum. The validator uses `Buffer.byteLength(value, 'utf8')` (`backend/src/common/validators/max-utf8-bytes.decorator.ts:26-29`). The HTTP regression test sends 30 copies of `ế` (30 characters / 90 UTF-8 bytes) and expects 400 (`backend/src/modules/auth/auth.integration.spec.ts:212-222`). This directly exercises the prior bcrypt 72-byte truncation case.

## Verify commands + result

Project profile configures all three commands and the backend app is present. **They could not be executed in this review session:** the shell tool returned `Permission denied: shell` on the initial shell invocation. Per the tool-loop guard, I stopped immediately and did not retry with variants or invoke further shell commands. Thus these are blocked, not PASS:

| Configured command | Result |
|---|---|
| `npm --prefix backend run lint` | **BLOCKED — shell permission denied; not run** |
| `npm --prefix backend exec -- tsc --noEmit -p backend/tsconfig.json` | **BLOCKED — shell permission denied; not run** |
| `npm --prefix backend run test` | **BLOCKED — shell permission denied; not run** |

The command output/results therefore cannot be asserted. A permitted reviewer environment must rerun these exact commands before the task can pass verification.

## Responsive Checklist Gate

**N/A** — this diff/task scope is backend-only; no route UI, component, or CSS is under review. The project has UI, but the responsive gate's applicability condition (UI changed) is not met.

## Skill gates

- **aislop:** `skip, not available` — not invoked as instructed.
- **oxlint (anti-slop):** `skip, not available` — not invoked as instructed; no oxlint result is claimed.
- **ocr (open-code-review):** `skip, not available` — not invoked as instructed.
- **AI-readable:** **OK** — reviewed visible auth source and tests. Names are descriptive and comments explain non-obvious security behavior; one test fixture function (`createUserStore`, `auth.integration.spec.ts:67-129`) exceeds the 50-line guideline, but the inspected code does not establish three AI-chaos indicators. See minor finding below.
- **AI-friendly web:** **N/A** — this task is an auth API/backend change, not a public website/web-page change.
- **blitzstrike:** `skip, not available` — not invoked as instructed; no pentest claim is made.
- **Responsive web:** **N/A** — no UI changes (also recorded above).
- **Migration safety:** **N/A** — profile has `migration_required: false`; no migration is in this task scope.

## Findings

### [MAJOR] Concurrent duplicate registrations can return 500 instead of the specified 409

- **Location:** `backend/src/modules/auth/auth.service.ts:85-96`
- **Evidence:** registration first checks `userModel.exists({ email })`, then separately calls `usersService.create(...)`. Two concurrent requests for the same normalized email can both pass the existence check. The unique database index prevents a duplicate persisted user, but the losing create raises MongoDB duplicate-key error; this method does not translate that error to `ConflictException`. The stated duplicate-email API contract (task AC and R-01) requires 409, so the losing request can instead reach the generic exception path and return 500. The existing sequential duplicate test does not exercise the check/insert race.
- **Suggested fix:** catch the duplicate-key error from the create operation (`code === 11000`) and map it to `ConflictException`; add a regression test that simulates the unique-index collision / concurrent registration and asserts 409.

### [MINOR] HTTP test fixture helper exceeds the 50-line function guideline

- **Location:** `backend/src/modules/auth/auth.integration.spec.ts:67-129`
- **Evidence:** `createUserStore` spans more than 50 lines and combines the in-memory store, user-service adapter, and model-operation adapter.
- **Suggested fix:** split the fixture construction into focused helpers if this test fixture is changed again; this is not independently blocking.

## Residual risk

- The three configured lint/typecheck/test commands remain unverified because shell access was denied. No PASS result is inferred from earlier rounds or builder-provided expectations.
- Tests use an in-memory user store for HTTP behavior and do not model a real MongoDB unique-index collision; the concurrent duplicate-registration path is therefore not covered by the visible regression suite.
- No browser/responsive checks apply to this backend-only scope.

## Verdict

**❌ FAIL** — the round-1 UTF-8-byte-length defect is fixed and its 90-byte regression case is present. However, the duplicate-registration concurrency path violates the specified 409 contract, and the configured verification commands could not be run in this environment. Do not close the task as PASS until the MAJOR is fixed and all three exact verify commands pass.
