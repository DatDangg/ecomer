# Review: ecommerce-mvp / layer-0-task-06 / round-3

## Review level
**STRICT**

## Reason
The task changes the shared Axios API client and persisted authentication/session state, including token refresh and retry handling. Auth/token/session and shared API-client changes require STRICT review.

## Blast radius
- `frontend/src/lib/api-client.ts`: all requests through the shared client, including authenticated mutations, refresh, and retry behavior.
- `frontend/src/stores/auth.store.ts`: account identity and access/refresh credentials.
- `frontend/src/test/api-client.test.ts`: deterministic concurrency coverage for auth/session races.
- Any API consumer whose request is retried while the active account changes.

## Verify commands + result
- `pnpm --dir frontend run lint` — **PASS**, exit 0; 0 errors and 2 Fast Refresh warnings in `src/components/ui/badge.tsx` and `button.tsx`.
- `pnpm --dir frontend exec tsc --noEmit` — **PASS**, exit 0.
- `pnpm --dir frontend test` — **PASS**, 7 files / 22 tests, including both new deterministic account-switch tests.
- `pnpm --dir frontend run build` — **PASS (builder-verified; not independently rerun)**.
- Bug repro verification — **N/A**, initial-build feature task, not a bug task.

## Responsive Checklist Gate
**N/A** — this round's reviewed changes are in the shared API client and its tests; they do not change a route, component, or CSS. Responsive checks at 375 / 768 / 1280 are therefore not applicable to this diff.

| Area | Result | Evidence |
|---|---|---|
| Layout | N/A | No layout, grid, container, or overflow styles changed. |
| Typography / spacing | N/A | No UI typography or spacing changed. |
| Media / images | N/A | No image, video, or embed changed. |
| Touch / interaction | N/A | No UI controls or navigation changed. |
| Viewport / accessibility | N/A | No viewport, motion, or UI accessibility behavior changed. |

## Skill gates
- **aislop — skip, unavailable:** `aislop scan --changes --json` returned `aislop: command not found` (exit 127); no score available.
- **oxlint / anti-slop — N/A, oxlint not configured:** repository glob for `**/*oxlint*` returned no files; command not run.
- **ocr / open-code-review — skip, not installed:** `ocr delegate preview` returned `ocr: command not found` (exit 127); no OCR findings claimed.
- **AI-readable — OK:** names and flow are traceable in `api-client.ts`; changed functions are under 50 lines, and `frontend/README.md` describes the shared client/refresh flow. Fewer than 3 AI-chaos indicators found.
- **AI-friendly web — N/A:** this is an internal authenticated data/auth layer change, not a public-facing page or crawler-discovery change.
- **blitzstrike — skip, no authorized live target:** no authorized staging/dev target was supplied; no live pentest result claimed.
- **Surgical diff — OK:** reviewed changes are scoped to session-generation guards and concurrency regression tests for task 06.

## Findings

### [MAJOR] A session switch between the post-refresh guard and retry dispatch can send the old operation with the new account's bearer token
- **File:** `frontend/src/lib/api-client.ts:46-53, 151-158`.
- The generation guard at lines 151-153 runs before `apiClient.request(config)`, but the request interceptor is asynchronous (registered without Axios's `synchronous` option) and always replaces `Authorization` with the *currently active* `accessToken` at lines 52-53. If account B becomes active after the post-refresh generation check but before that retry interceptor executes, the retry retains account A's `__sessionGeneration` while being dispatched with B's bearer token. A stale mutation from A can consequently execute in B's context; a successful response also passes through without a generation check. The two new deterministic tests cover switching before the initial 401 is handled and switching after the retry is already in flight, but not this interval before the retry is actually dispatched.
- **Suggested fix:** before attaching a bearer token / dispatching a retry, ensure the captured generation still matches the active generation (reject stale retries rather than sending them with current credentials); alternatively bind the retry's credential to its originating session and ensure it cannot be replaced by another session's token. Add a deterministic test that changes accounts after the refresh guard but before the retry request interceptor/adapter runs, and assert the old operation is never sent using B's token.

## Verdict
❌ **FAIL** — the initial-401 and in-flight-retry races are covered and handled, but the retry dispatch window can still cross account boundaries and execute an old operation with a newer account's credentials.
