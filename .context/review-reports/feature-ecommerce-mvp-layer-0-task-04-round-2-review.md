# Review — ecommerce-mvp layer 0 task 04 — round 2

- **Review level:** STRICT
- **Reason:** The task establishes JWT authentication behavior and authorization guards; this is a security-sensitive auth/token path.
- **Blast radius:** `OptionalJwtAuthGuard` controls whether requests proceed as guest or with an authenticated identity, affecting every later route that uses optional authentication and downstream user-specific behavior.

## Requirements and scope review

- The fix now rethrows `HttpException`s (preserving banned-user 403), maps unexpected strategy errors and missing users to 401, and delegates requests with a non-empty Authorization header to Passport.
- The remaining edge case is that a present-but-empty/whitespace Authorization header is treated identically to an absent header and allowed as a guest. This does not satisfy the distinction between no credential (guest) and a supplied invalid credential (401).
- Tests cover no header, valid user, invalid/expired error, and banned user, but do not cover a present empty Authorization header.
- No UI changes; responsive checklist is not applicable.

## Verify commands + result

- `npm --prefix backend run lint` — **PASS** (exit 0).
- `npm --prefix backend exec -- tsc --noEmit -p backend/tsconfig.json` — **PASS** (exit 0).
- `npm --prefix backend run test` — **PASS**, 21 suites / 104 tests.
- Build — not independently rerun; not one of the configured verify commands for this review. Builder-reported result is not treated as independent evidence.

## Responsive Checklist Gate

- **N/A** — backend-only guard and unit-test changes; no route/component/CSS changed.

## Skill gates

- **aislop:** `skip, aislop not installed` — `aislop scan --changes --json` returned `command not found`; score unavailable.
- **oxlint / anti-slop:** `skip, oxlint not configured` — repository glob search found no oxlint config; lint and typecheck configured commands passed.
- **ocr / open-code-review:** `skip, ocr not installed` — `ocr delegate preview` returned `command not found`.
- **AI-readable:** **OK** — guard names and control flow are descriptive/direct; methods are under 50 lines; no ≥3 AI-chaos indicators found in the reviewed change.
- **AI-friendly-web:** **N/A** — this is a backend authentication task, not a public-facing web page/deployment change.
- **blitzstrike:** `skip, unavailable` — no authorized live test target or BlitzStrike MCP environment available; no live pentest was performed.
- **Security review:** **FAIL** — present empty Authorization credentials can still be silently downgraded to guest; see MAJOR finding.

## Findings

### [MAJOR] Present empty Authorization header is accepted as guest

- **Location:** `backend/src/common/guards/optional-jwt-auth.guard.ts:23-25`
- **Issue:** The guard returns `true` when the Authorization property exists but is an empty or whitespace-only string (`authorization.trim() === ''`). An HTTP request with `Authorization:` therefore bypasses Passport and is treated as an unauthenticated guest. This preserves the original invalid-credential-to-guest behavior for this malformed-token case, contrary to the task's expected distinction: no Authorization header is guest, while a supplied invalid credential returns 401.
- **Suggested fix:** Allow the guest path only when the Authorization header is genuinely absent. Treat a present empty/whitespace value as malformed credentials and reject with 401 (or delegate to Passport so its missing/malformed-token result is rejected). Add a regression test for the present-empty header alongside the no-header guest test.

## Residual risk

- The configured lint, typecheck, and complete test suite pass, but those tests currently do not exercise the present-empty header edge case identified above.
- `aislop`, OCR, and BlitzStrike were unavailable as recorded in their gates.
- No app/server or database/manual repro was performed; review was limited to source, tests, and configured verification commands.

## Verdict

**❌ FAIL** — one MAJOR authentication behavior defect remains.
