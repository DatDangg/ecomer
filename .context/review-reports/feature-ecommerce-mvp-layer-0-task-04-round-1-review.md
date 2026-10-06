# Review — ecommerce-mvp layer 0 task 04 — round 1

- **Review level:** STRICT
- **Reason:** This task changes identity schema, password/token handling, JWT validation, authorization guards and ownership checks. Authentication/security paths have mandatory strict review.
- **Blast radius:** `backend/src/modules/users/**`, `backend/src/modules/auth/**`, common auth/role guards and ownership helpers, plus bootstrap admin seeding. These establish identity and authorization behavior for all later backend routes and clients.

## Requirements and scope review

- User schema includes unique/lowercase email, hidden `passwordHash` and `refreshTokenHash`, customer default role, active default, and trimmed `shopName` bounds of 3–50. The source also applies the shared serialization options; schema/service tests pass.
- `UsersService` bcrypt-hashes credentials and explicitly opts into `passwordHash` only for email lookup; creation fixes role/active status server-side.
- JWT strategy reloads the user from storage per request, rejects missing users/invalid subject as 401, and rejects inactive accounts with the specified 403 message.
- Required/public guard, role guard, write/read ownership helpers and bootstrap admin seed are implemented. The notable defect is in optional JWT error handling below.
- No UI or migration/schema deployment artifact is in this task's scope; the User schema is a Mongoose model and configured migration gate is disabled (`migration_required: false`).

## Verify commands + result

- `npm --prefix backend run lint` — **PASS** (exit 0).
- `npm --prefix backend exec -- tsc --noEmit -p backend/tsconfig.json` — **PASS** (exit 0).
- `npm --prefix backend run test` — **PASS**, 21 suites / 104 tests.
- `npm --prefix backend run build` — **Blocked**: shell permission denied. No retry per tool-loop guard. Builder-reported verification is not substituted for this independent check.

## Responsive Checklist Gate

- **N/A** — no UI changes; project profile has UI, but this backend-only task does not touch UI files.

## Skill gates

- **aislop:** `skip, aislop not installed` — `aislop scan --changes --json` returned `command not found`; score unavailable.
- **oxlint / anti-slop:** **OK** — `npx oxlint` completed with 0 warnings and 0 errors. `npx` fetched oxlint because it was not locally installed; this run found no reported lint issues.
- **ocr / open-code-review:** `skip, ocr not installed` — `ocr delegate preview` returned `command not found`.
- **AI-readable:** **OK** — reviewed changed identity code for the required indicators: names are descriptive, functions are below 50 lines, flow is direct, the bcrypt rounds value is named, comments explain constraints/intent, and no ≥3 chaos indicators were found. Architecture documentation already describes this backend lifecycle; no main flow/documentation gap found in the reviewed scope.
- **AI-friendly-web:** **N/A** — this is backend identity foundation, not a public-facing web page/deployment task.
- **blitzstrike:** `skip, unavailable` — no authorized live test target or BlitzStrike MCP environment available; no live pentest was performed.
- **Security review:** **FAIL** — optional guard treats authentication failures and other strategy errors as guest requests; see MAJOR finding. JWT secret handling has no hardcoded fallback, and password/hash values are not logged in reviewed implementation.

## Findings

### [MAJOR] Optional JWT guard silently accepts invalid credentials and swallows strategy errors

- **Location:** `backend/src/common/guards/optional-jwt-auth.guard.ts:19-20`
- **Issue:** Every non-`ForbiddenException` error and absent user is converted to `null`. Consequently, a supplied malformed/expired/otherwise invalid bearer token is treated like no credential, and unexpected strategy failures (including a database failure during `JwtStrategy.validate`) are also swallowed. This conflicts with `docs/PERMISSION.md` §Guard order, which specifies invalid tokens as 401 while optional auth allows requests with no token, and hides authentication/backend failures as guest traffic.
- **Suggested fix:** Distinguish a genuinely absent bearer token from a supplied invalid token and allow only the former as guest. Preserve the inactive-user 403 and propagate unexpected strategy/database errors rather than returning `null`; add tests for no token, valid token, invalid/expired token, banned user and an unexpected validation error.

## Residual risk

- Build could not be independently run because shell permission was denied; lint, typecheck and the complete configured Jest suite passed. No manual app/DB repro was performed (reviewer does not run app/DB).
- `aislop`, `ocr` and BlitzStrike results are unavailable for the reasons recorded above.

## Verdict

**❌ FAIL** — one MAJOR authentication behavior defect remains.
