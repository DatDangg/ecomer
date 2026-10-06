# Independent Review — feature-ecommerce-mvp / layer-3-task-01 / round-2

## Review level
**STRICT** — the smoke test exercises registration/login, JWT token issuance and public product-list/detail response contracts. These are security- and contract-sensitive paths, even though the changed code is test/developer tooling rather than production handlers.

## Blast radius
- `backend/src/smoke/basic-flow.smoke.spec.ts`: Nest HTTP integration smoke harness for auth and public product visibility/response checks.
- `backend/scripts/smoke-basic-flow.sh`: optional live developer smoke against a running API and seeded data.
- No production handler or frontend source is changed by this task.
- Worktree also contains separate workflow/task state changes (`.context/progress.json`, `.context/runs/start-ecommerce-01.md`, task evidence) and pre-existing review/build artifacts. They are not part of the smoke implementation finding below.

## Round-1 closure check
- **Build acceptance [MAJOR]: CLOSED based on recorded evidence.** The task's `Verification Evidence` says both backend and frontend builds passed. Builder logs are present: `/tmp/opencode/l3v-api-build.log` records the Nest build invocation; `/tmp/opencode/l3v-web-build.log` explicitly records Vite `✓ built in 7.79s` and emitted frontend assets. Reviewer rerun was blocked by shell permission, so these results were not independently reproduced in this round.
- **AI-readable setup/constants [MAJOR]: CLOSED.** `beforeAll` now delegates to `seedSmokeProducts`, `createSmokeApp`, and `registerAndLogin`; the callbacks and helpers inspected are each ≤50 lines. Bcrypt/throttler values are named constants (`SMOKE_BCRYPT_ROUNDS`, `SMOKE_THROTTLE_LIMIT`, `SMOKE_THROTTLE_TTL_MS`) with test-only rationale.

## Verify commands + result
Commands come from `.context/project-config.md`. I attempted both explicitly requested build commands together; the shell tool denied execution before either command ran. Per Tool Loop Guard, no shell command was retried and no alternate execution path was used. The other checks were not rerun after that shell denial. Prior evidence below is read-only corroboration, not a reviewer rerun.

| Command | Round-2 result / evidence |
|---|---|
| `npm --prefix backend run build` | **BLOCKED — reviewer shell permission denied.** Task evidence reports PASS and `backend/dist/` emitted; `/tmp/opencode/l3v-api-build.log` contains the Nest build invocation but no explicit exit status. |
| `pnpm --dir frontend run build` | **BLOCKED — reviewer shell permission denied.** Task evidence reports PASS. `/tmp/opencode/l3v-web-build.log` explicitly shows 1,952 modules transformed, `dist/index.html` and assets emitted, and `✓ built in 7.79s`. |
| `npm --prefix backend run lint` | Not rerun (shell denial). Task evidence reports PASS; `/tmp/opencode/l3v-api-lint2.log` shows the eslint command without diagnostic output. Earlier `/tmp/opencode/l3v-api-lint.log` records four formatting errors before the recorded `--fix` step, so the earlier log is not treated as current PASS evidence by itself. |
| `npm --prefix backend exec -- tsc --noEmit -p backend/tsconfig.json` | Not rerun (shell denial). Task evidence reports PASS; no standalone typecheck log was found/read. |
| `npm --prefix backend run test` | Not rerun (shell denial). `/tmp/opencode/l3v-api-test.log` explicitly records 38 suites and 256 tests passed, including `src/smoke/basic-flow.smoke.spec.ts`. |
| `pnpm --dir frontend run lint` | Not rerun (shell denial). `/tmp/opencode/l3v-web-lint.log` records 0 errors and 2 warnings in unchanged `badge.tsx` and `button.tsx`; task evidence reports PASS. |
| `pnpm --dir frontend exec tsc --noEmit` | Not rerun standalone (shell denial). Task evidence reports PASS; the frontend build log shows `tsc --noEmit && vite build` proceeded to Vite, corroborating typecheck success in that build. |
| Live smoke (`bash backend/scripts/smoke-basic-flow.sh`) | Not run — requires a running backend and seeded database. Task evidence says validated against a mock server; real-dev execution remains residual risk. |

## Requirements / implementation review
- The HTTP Jest smoke uses real Nest auth/products controllers, app setup, JWT strategy and Supertest, with in-memory stores to avoid requiring MongoDB for the automated suite.
- Current assertions cover registration response secrecy, login user/tokens, public product list filtering, visible detail, and 404 for hidden/blocked/unknown products.
- The live script uses generated throwaway credentials by default, `curl`/`jq`, and clear per-step/final PASS/FAIL output. Real backend/database execution remains unverified here.
- The named-helper change resolves the round-1 overlong `beforeAll` and unnamed bcrypt/throttle settings.
- **File-size check:** `backend/src/smoke/basic-flow.smoke.spec.ts` is **312 lines** (read through line 312), exceeding the configured ≤300-line limit. The shell script is 138 lines. All inspected functions/callbacks are ≤50 lines.
- No README/ARCHITECTURE update is needed: the diff adds a test harness and optional smoke utility, not a changed primary application flow.

## Responsive Checklist Gate
**N/A** — project config declares UI breakpoints, but this task changes only a backend test and shell script; no route, component, or CSS is touched.

## Skill gates
- **aislop:** `skip — shell permission denied`; `aislop scan --changes --json` was not run and no score is claimed.
- **oxlint / anti-slop:** `skip, oxlint not configured` — repository glob for `.oxlintrc*` / `oxlint.config.*` returned no files; no lint command was run.
- **ocr / open-code-review:** `skip — shell permission denied`; install status and OCR results could not be checked. No OCR finding is claimed.
- **AI-readable:** **FAIL** — the formerly reported `beforeAll` >50 lines and unnamed bcrypt/throttle settings are fixed. However the implementation file is still 312 lines, over the repository's configured 300-line file limit. Keep the focused helpers and split the spec into cohesive files or otherwise reduce it to ≤300 lines. No primary-flow documentation update is needed.
- **AI-friendly web:** `N/A` — internal test/developer utility; no public-facing web surface is changed.
- **blitzstrike:** `skip — shell permission denied; no permitted live target available in this review`. No STRIKE-validated finding is claimed.

## Findings

### [MAJOR] Smoke spec exceeds the configured maximum file size
- **Location:** `backend/src/smoke/basic-flow.smoke.spec.ts:312` (file is 312 lines; configured maximum is 300).
- **Impact:** The new test harness exceeds the project readability/maintainability limit despite the round-1 helper extraction. The task's code-quality gate explicitly sets a 300-line maximum.
- **Recommended fix:** Split the in-memory auth/product doubles or fixture setup into a focused test-support module, or otherwise reduce the smoke spec to ≤300 lines while preserving the existing HTTP assertions. Keep every function ≤50 lines.

## Residual risk
- Reviewer shell execution was denied, preventing independent reruns of lint, typecheck, test, and both builds. Task verification evidence plus available test/frontend-build logs corroborate prior PASS results; the backend build log lacks an explicit exit status.
- A lookup for `backend/dist/main.js` returned no match; the expected Nest output path was not independently confirmed, and no further path variants were probed under the tool-loop guard. The task records backend `dist/` output.
- Live smoke was not run against real MongoDB/API in this environment.
- `aislop` / OCR results are unavailable because shell execution was blocked; optional pentest was not performed.

## Verdict
❌ **FAIL** — both round-1 MAJOR findings are closed based on implementation/evidence, but the changed smoke spec remains above the configured 300-line file limit ([MAJOR]). Do not close/commit this task until the file-size finding is resolved and reviewed.
