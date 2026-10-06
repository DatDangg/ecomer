# Review — ecommerce-mvp layer 0 task 01

- **Review level:** STRICT
- **Reason:** This is the shared backend bootstrap for all future API routes and configures security controls (CORS, validation, helmet, throttling). A missing control can affect the entire backend.
- **Blast radius:** `backend/src/main.ts`, `backend/src/app.module.ts`, `backend/src/app.setup.ts`, health endpoint, and all backend routes/modules built on this application bootstrap.

## Verify commands + result

| Command | Result |
|---|---|
| `npm --prefix backend run lint` | PASS (exit 0) |
| `npm --prefix backend exec -- tsc --noEmit -p backend/tsconfig.json` | PASS (exit 0; no diagnostics) |
| `npm --prefix backend run test` | PASS (3 suites, 10 tests passed: health controller, env validation, app setup) |
| `npm --prefix backend run build` | BLOCKED — tool returned `permission.rejected` / `Permission denied: shell`; not retried per Tool Loop Guard. |
| `aislop scan --changes --json` | Could not run: `aislop: command not found`; gate skipped as tool unavailable. |

## Responsive Checklist Gate

**N/A** — this task changes backend bootstrap only; no UI, route component, or CSS is in scope.

## Skill gates

- **aislop:** `skip` — CLI unavailable (`aislop: command not found`); no score obtained.
- **oxlint (anti-slop):** `skip` — the inspected backend package uses ESLint and shows no Oxlint configuration/dependency; Oxlint was not run.
- **ocr (open-code-review):** `skip` — optional OCR tool was not run; no OCR output/evidence available.
- **AI-readable:** `OK` for inspected source — names and bootstrap flow are direct; inspected functions are short, no ambiguous naming, magic values, or unnecessary indirection observed. `docs/ARCHITECTURE.md` is part of the changeset. Residual: full documentation and backend file inventory were not inspectable within the read-tool cap.
- **AI-friendly-web:** `N/A` — this is a backend bootstrap task, not a public-facing web UI/deployment task.
- **blitzstrike:** `skip` — optional live pentest not run; no authorized deployed target/environment supplied.

## Findings

1. **[MAJOR] Throttler is configured but never enforced — `backend/src/app.module.ts:15-20`.**
   `ThrottlerModule.forRoot()` registers throttle settings, but the module has no `APP_GUARD` provider for `ThrottlerGuard`, and the bootstrap does not install a global throttler guard. Nest throttling requires a guard to execute; as written, requests are not rate-limited. This leaves the shared backend without the requested effective throttling/security control. Register `ThrottlerGuard` as a global `APP_GUARD` (or explicitly attach it to the intended controllers/routes) and add a behavioral test that proves requests over the configured limit receive 429.

2. **[MAJOR] Health response violates the documented shared API response contract — `backend/src/health/health.controller.ts:10-12`.**
   The endpoint returns `{ status: 'ok' }` directly. `docs/API_SPEC.md:36` says every response goes through the shared `ok()` / `fail()` response contract; the health route therefore has a different response shape. Return the documented success envelope (or explicitly define and document health as an exception) and test the response shape. The task's 200-status criterion alone does not resolve this contract mismatch.

## Residual risk

- The initial `Glob("backend/**/*")` included over 50 results (mostly generated/dependency files) and was truncated; per the tool-loop rule, no narrower repeat was made. The read-tool cap was then reached before inspecting test source, env example/ignore files, and every generated/config artifact. The Jest run confirms test execution and counts, but test assertions were not independently reviewed.
- `.env` exclusion/non-commit status and presence/content of `.env.example` could not be established from the inspected files. Builder/user should verify these before close-out.
- Build status is unknown because execution was blocked; do not interpret this as a successful build.

## Verdict

**❌ FAIL** — at least one MAJOR defect remains (functional throttling is not enabled); the health response also conflicts with the documented API response contract. Build verification is blocked.
