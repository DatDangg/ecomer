# Review — ecommerce-mvp layer 0 task 01 — round 2

- **Review level:** STRICT
- **Reason:** Shared backend bootstrap configures the API response contract and security controls; response shape and rate limiting affect every route. Secrets/env handling is also explicitly requested for this review.
- **Blast radius:** `backend/src/app.module.ts` (global throttling), `backend/src/app.setup.ts` and common response filter/interceptor (all backend HTTP responses), health endpoint, and root `.gitignore` (secret-bearing env files across the repository).

## Verify commands + result

| Command | Result |
|---|---|
| `npm --prefix backend run lint` | **PASS** (exit 0) |
| `npm --prefix backend exec -- tsc --noEmit -p backend/tsconfig.json` | **PASS** (exit 0; no diagnostics) |
| `npm --prefix backend run test` | **PASS** (5 suites, 13 tests; includes live Nest/Supertest health-envelope and 101-request throttling assertions) |
| `npm --prefix backend run build` | **BLOCKED** — shell returned `permission.rejected` / `Permission denied: shell`; not retried under Tool Loop Guard. Build remains unverified. |

## Responsive Checklist Gate

**N/A** — the reviewed task changes backend bootstrap and no UI, route component, or CSS. Responsive breakpoints do not apply.

## Skill gates

- **aislop:** `skip` — attempted `aislop scan --changes --json`; CLI unavailable (`aislop: command not found`), so no score could be obtained.
- **oxlint (anti-slop):** `skip` — no Oxlint configuration/dependency was found in the inspected package/config matches; package lint uses ESLint. Per gate, Oxlint is not configured.
- **ocr (open-code-review):** `skip` — attempt to check/run `ocr delegate preview` was blocked by shell permission denial; availability and findings could not be established. Optional gate, no OCR result claimed.
- **AI-readable:** `OK` — inspected changed backend source uses descriptive names, direct flow, and functions under 50 lines; `docs/ARCHITECTURE.md` is present in the working tree. One potential magic value is the raw `ttl: 60_000` setting (`backend/src/app.module.ts:18`); this is below the ≥3-indicator fail threshold. README presence/content was not independently verified in this round.
- **AI-friendly-web:** `N/A` — backend-only task; no public-facing web page/deployment change.
- **blitzstrike:** `skip` — no authorized live target/environment supplied; no STRIKE-validated finding.

## Round 1 findings closure

1. **Global throttling — CLOSED.** `backend/src/app.module.ts:24-28` registers `ThrottlerGuard` via `APP_GUARD`. `backend/src/throttler.spec.ts:24-33` sends 100 successful requests, then asserts the next returns HTTP 429. This is behavioral coverage, not a mock-only assertion.
2. **Response contract — CLOSED.** `docs/API_SPEC.md:34-47` specifies success `{ success, data, message }` and error `{ success, message, errors? }`. `backend/src/app.setup.ts:28-29` installs the global response interceptor and exception filter; `backend/src/common/interceptors/response.interceptor.ts:20-24` wraps successful values, and `backend/src/common/filters/all-exceptions.filter.ts:46-71` emits the documented error envelope. `backend/src/app.integration.spec.ts:24-33` exercises `GET /api/v1/health` through the real AppModule and asserts the complete success envelope. `backend/src/app.setup.spec.ts:53-78` also asserts success and validation-error envelopes.

## Findings

1. **[MAJOR] `.env` is not excluded by the repository ignore rules — `.gitignore:1`.** The only env ignore entry is `.env.local`; plain `.env` (including `backend/.env`) is not covered. That permits a future secret-bearing `.env` to appear as an addable/untracked file and be committed accidentally. The env validation code has safe defaults and no hardcoded credentials were found in the inspected backend configuration, but that does not prevent committing a local secret file. **Suggested fix:** add `.env` and `**/.env` (or an equivalent repository-wide rule) to `.gitignore`, retaining a separately committed `.env.example` only if it contains placeholders. `git check-ignore` could not be run because the shell was denied; the current ignore-rule gap is directly visible in `.gitignore`.

## Residual risk

- The build command did not run because shell execution was denied; build status is unknown, not a pass.
- Whether any hidden `.env` currently exists or is tracked could not be conclusively verified: the env-file glob returned no files, and the subsequent `git check-ignore` shell command was denied. No claim is made that an actual secret file is currently committed.
- Optional `ocr` availability/findings remain unknown because shell permission was denied. `aislop` was positively unavailable.

## Verdict

**❌ FAIL** — round 1 findings are closed, but a separate MAJOR secret-handling gap remains: `.env` is not ignored. Builder should update the ignore rules, then request another review round. Build verification also remains blocked and must be reported as unverified.
