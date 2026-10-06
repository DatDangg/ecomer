# Review — ecommerce-mvp Layer 1 Task 01 (Auth API)

- **Review level:** STRICT
- **Reason:** Authentication, password handling, JWT access/refresh tokens, session invalidation, and global authorization guard are security-sensitive.
- **Blast radius:** `AuthController`/`AuthService` endpoints under `/api/v1/auth/*`; registration and login password hashing/verification through `UsersService`; user refresh-token hash persistence; all protected routes via global `JwtAuthGuard`; public health route; test bootstrap secrets.
- **Scope reviewed:** Task `tasks/ecommerce-mvp/layer-1-task-01.md`, R-01 and `docs/PERMISSION.md`, and the specified backend Auth DTO/service/controller/module/tests, app wiring, health controller and test environment setup. No source files were modified.

## Verify commands + result

| Command | Result |
|---|---|
| `npm --prefix backend run lint` | **PASS** (exit 0) |
| `npm --prefix backend exec -- tsc --noEmit -p backend/tsconfig.json` | **PASS** (exit 0) |
| `npm --prefix backend run test` | **PASS** — 24 suites, 129 tests (exit 0) |

## Acceptance/security review

- Register returns 201 with an explicit non-credential result; role is assigned by `UsersService.create` as `customer`; caller-supplied role is rejected by the configured whitelist pipe. Sequential duplicate registration returns 409.
- Login returns `{ user, accessToken, refreshToken }`; public user serialization selects only safe fields. Wrong password returns 401; inactive user returns 403 with `Tài khoản đã bị khóa`.
- Access/refresh token lifetimes are configured as 15m/7d. Refresh verification uses the refresh secret, checks ObjectId subject and stored SHA-256 hash using `timingSafeEqual`; only the hash is written. Logout unsets the hash and the integration test verifies subsequent refresh returns 401.
- Auth controller throttling is 10 requests per minute; the HTTP throttling test observes 429 on request 11.
- Auth module registers `JwtModule.registerAsync(buildJwtModuleOptions)`, `PassportModule`, and `JwtStrategy`. `JwtAuthGuard` is registered as global `APP_GUARD`; `@Public()` bypass is honored. HTTP integration covers unauthenticated logout returning 401 and health is explicitly public.
- The test-fixture correction to 24-character hexadecimal IDs is appropriate: it satisfies the same ObjectId validation applied to real Mongo IDs. Adding a random `jti` to refresh JWTs is also appropriate: independently issued JWTs now differ even when created within the same second, so newer-login invalidation is actually exercised rather than relying on timestamp differences. These are not source defects.

## Responsive Checklist Gate

**N/A** — backend-only change; no route component, UI, or CSS was changed.

## Skill gates

- **aislop:** `skip, aislop not installed` — `aislop scan --changes --json` was attempted and the shell returned `aislop: command not found` (exit 127); no score is available.
- **oxlint (anti-slop):** **Blocked** — attempting the configured-gate check was denied by shell permission. Whether an oxlint config is present could not be confirmed; no lint result is claimed.
- **ocr (open-code-review):** **Blocked** — shell permission denied while attempting `ocr delegate preview`; installation/status and findings could not be verified. No OCR result is claimed.
- **AI-readable:** **OK** — inspected new auth code uses descriptive module/type/function names, short methods, direct call flow, named throttle constants, and comments that explain security/business rationale; no three-indicator AI-chaos threshold observed. Documentation impact for the new auth flow remains a residual item (README/architecture docs were outside the supplied changed-file scope).
- **AI-friendly-web:** **N/A** — this is an internal backend/API task, not a public-facing web publishing/deployment change.
- **blitzstrike:** `skip, no authorized live target/tool session available` — no STRIKE-validated pentest was performed; no live environment was assumed or probed.

## Findings

### [MAJOR] bcrypt accepts passwords whose UTF-8 representation exceeds bcrypt's 72-byte input limit

- **File:** `backend/src/modules/auth/dto/register.dto.ts:18-20`
- **Issue:** `@MaxLength(72)` limits the string's character count, not its UTF-8 byte length. Registration passes this value to bcrypt via `UsersService.create` (`backend/src/modules/auth/auth.service.ts:92-96`; hashing is in `backend/src/modules/users/users.service.ts:12-14`). A valid multibyte password of at most 72 characters can exceed bcrypt's 72-byte input limit; bcrypt ignores bytes after that limit. Consequently, distinct passwords with the same first 72 bytes can verify as the same password, and a user may not receive the credential semantics implied by the accepted input.
- **Suggested fix:** enforce a UTF-8 byte limit of 72 before bcrypt hashing (including all password creation/update paths), or adopt a documented pre-hash strategy that safely handles long inputs. Add a regression test with multibyte passwords that exceed 72 UTF-8 bytes and verify the API rejects them or distinguishes the complete password. Do not silently rely on `MaxLength` for byte safety.

## Residual risk

- The HTTP integration suite uses an in-memory store, not MongoDB. It verifies sequential duplicate-email handling, but does not demonstrate that a concurrent duplicate insert surfaces as 409 when the unique index rejects the losing insert. Confirm duplicate-key errors are translated to 409 and add a concurrency/duplicate-index test when database-backed integration is available.
- Tool gates `oxlint` and `ocr` could not be verified due shell permission denial; `aislop` was unavailable. These results are recorded as blocked/skipped, not as clean scans.
- No live pentest or browser/UI verification was performed; neither was applicable/authorized for this backend-only task.

## Verdict

**❌ FAIL** — the password byte-length issue is a confirmed authentication security defect ([MAJOR]). Return to Builder for a focused correction and regression test; rerun review in round 2 after fix.
