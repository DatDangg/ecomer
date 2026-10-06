# Independent Review — feature-ecommerce-mvp / layer-3-task-01 / round-1

## Review level
**STRICT** — the smoke test exercises registration/login, token handling, and the public products API response contract. Those are security- and contract-sensitive paths, even though the task adds tests/scripts rather than changing production handlers.

## Blast radius
- `backend/src/smoke/basic-flow.smoke.spec.ts`: HTTP integration harness for auth and public product listing/detail.
- `backend/scripts/smoke-basic-flow.sh`: optional developer smoke against a running backend and seeded MongoDB.
- No production API implementation or frontend source is changed in this task diff.
- The worktree also has separate workflow-state changes (`.context/progress.json`, `.context/runs/start-ecommerce-01.md`) and an existing phase review report; those are not part of the smoke/build implementation review.

## Verification commands + result
Commands were taken from `.context/project-config.md` for configured checks.

| Command | Result |
|---|---|
| `npm --prefix backend run lint` | **PASS** (exit 0) |
| `npm --prefix backend exec -- tsc --noEmit -p backend/tsconfig.json` | **PASS** (exit 0) |
| `npm --prefix backend run test` | **PASS** — 38 suites, 256 tests passed, including `src/smoke/basic-flow.smoke.spec.ts` (exit 0) |
| `pnpm --dir frontend run lint` | **PASS** (exit 0; 0 errors, 2 warnings in unchanged `src/components/ui/badge.tsx` and `button.tsx`) |
| `pnpm --dir frontend exec tsc --noEmit` | **PASS** (exit 0) |
| `npm --prefix backend run build` | **BLOCKED** — attempted; shell permission denied. Per tool-loop guard, no shell command was attempted after this denial. |
| `pnpm --dir frontend run build` | **BLOCKED / NOT RUN** — shell was already denied for the backend build; no retry/workaround attempted. Build output / `dist/` creation therefore remains unverified. |
| Live smoke (`bash backend/scripts/smoke-basic-flow.sh`) | **Not run** — requires a real running backend and seeded MongoDB, unavailable in this review environment and explicitly treated as residual risk rather than a defect. |

The build commands are required by this task's acceptance criteria, so their unverified result prevents approval even though the configured lint/typecheck/test commands pass.

## Requirements / implementation review
- HTTP smoke uses actual Nest controllers/services, `configureApp`, JWT configuration/strategy, and `supertest`; it is not a controller-only mock. In-memory user/product stores support the requested Mongo-free automated path.
- Register checks status 201 and excludes the substring `password` from response JSON; login checks status 200, user fields, access token, refresh token, and absence of `passwordHash`.
- Public product list checks a successful paginated-style `data` envelope (`total` and `items`), one visible fixture, and excludes hidden/inactive and blocked fixtures. Product detail checks visible product and 404 for hidden, blocked, and unknown IDs.
- Shell script inspection confirms it uses `curl` and `jq`, generates a throwaway default email/password per run instead of embedding credentials, prints per-step PASS/FAIL/SKIP plus a final `SMOKE RESULT`, and exits 0 for success / nonzero for failures. Live behavior was not executed.
- Both changed implementation files are below 300 lines: smoke spec 273 lines; shell script 138 lines.
- `beforeAll` callback in `basic-flow.smoke.spec.ts` spans lines 136–195 (>50 lines). Other extracted functions are within the limit.

## Responsive Checklist Gate
**N/A** — project has UI, but this task changes only a backend test and shell script; no route, component, or CSS is touched.

## Skill gates
- **aislop:** `skip — shell permission denied` before `aislop scan --changes --json` could be run; score unavailable.
- **oxlint / anti-slop:** `skip — oxlint not configured`; repository config glob found no `.oxlintrc*` or `oxlint.config.*` file. No oxlint execution attempted.
- **ocr / open-code-review:** `skip — shell permission denied`; install status and review output unavailable.
- **AI-readable:** **FAIL** — at least three in-scope indicators: the 60-line `beforeAll` callback (lines 136–195); unexplained bcrypt cost literal `4` (line 76); and unexplained throttler test settings `60_000` / `1000` (line 161). Extract the setup into focused helpers and name/document the test-only cost/throttle settings. No other ambiguous naming, excessive indirection, or changed primary flow needing README/ARCHITECTURE documentation was found.
- **AI-friendly web:** `N/A` — internal test/developer utility; no public web surface is changed.
- **blitzstrike:** `skip — shell permission denied`; no live environment was available for a permitted pentest. No STRIKE-validated finding.

## Findings

### [MAJOR] Task build acceptance criteria remain unverified
- **Evidence:** required backend build command was denied by shell permissions; frontend build was not run after the denial. No evidence that either build produced `dist/`.
- **Recommendation:** rerun `npm --prefix backend run build` and `pnpm --dir frontend run build` in an authorized verification session and record both successful outputs before closing the task.

### [MAJOR] AI-readable/code-size gate fails on the new smoke spec
- **Location:** `backend/src/smoke/basic-flow.smoke.spec.ts:76,136-195,161`
- **Evidence:** one setup callback exceeds the 50-line function limit; test configuration uses unexplained numeric literals for bcrypt rounds and throttler settings. Together these meet the configured ≥3 AI-chaos-indicator refusal threshold.
- **Recommendation:** split the setup into descriptive helpers each ≤50 lines, and use named test constants (or a short rationale comment) for the bcrypt cost and throttler settings.

## Residual risk
- Live smoke against real MongoDB/API was not run as instructed; the script is assessed by source inspection only.
- Backend and frontend production build success, and `dist/` output, are unverified due reviewer shell permission restrictions.
- `aislop` and `ocr` were not executable after the shell denial; their gate results are unknown.

## Verdict
❌ **FAIL** — required build verification is blocked/unverified, and the AI-readable gate exceeds its configured failure threshold. Lint, typecheck, and Jest test commands passed.
