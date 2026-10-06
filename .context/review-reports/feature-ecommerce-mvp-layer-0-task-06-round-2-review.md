# Review: ecommerce-mvp / layer-0-task-06 / round-2

## Review level
**STRICT**

## Reason
This task changes persisted authentication/session state and the shared Axios API client, including access-token refresh and logout behavior. Auth/token/session and shared API-client changes require STRICT review.

## Blast radius
- `frontend/src/lib/api-client.ts`: every API request using the shared client; 401 refresh/retry and session-expiry handling.
- `frontend/src/stores/auth.store.ts`: persisted identity and access/refresh token state used by route guards and authenticated flows.
- `frontend/src/types/api.ts`: shared frontend API response contract.
- Related frontend API-client tests and consumers of the API client/auth store.

## Verify commands + result
- `pnpm --dir frontend run lint` — **PASS**, exit 0; 0 errors, 2 existing Fast Refresh warnings in `src/components/ui/badge.tsx` and `src/components/ui/button.tsx`.
- `pnpm --dir frontend exec tsc --noEmit` — **PASS**, exit 0.
- `pnpm --dir frontend test` — **PASS**, 7 test files / 20 tests, including the deterministic refresh/logout and refresh/account-switch-in-flight tests.
- `pnpm --dir frontend run build` — **PASS (builder-verified; not independently rerun)**.
- Bug repro verification — **N/A**, this is an initial-build feature task, not a bug task.

## Responsive Checklist Gate
The project has UI and `App.tsx` mounts the shared `ToastContainer`; the changed implementation adds no page layout or authored responsive CSS. No browser was used. 375/768/1280 CSS math is not applicable to the changed provider composition; library-provided toast rendering was not independently inspected.

| Area | Result | Evidence |
|---|---|---|
| Layout | N/A | Changed `App.tsx` only composes providers/router/toast container; no authored dimensions, grids, overflow, or breakpoint rules changed. |
| Typography / spacing | N/A | No typography or spacing styles changed in the reviewed implementation. |
| Media / images | N/A | No images, video, or embeds were added or changed. |
| Touch / interaction | N/A | No custom controls or navigation were added. Toast interaction uses React-Toastify defaults (`closeOnClick`, `draggable`); touch-target sizing was not browser-verified. |
| Viewport / accessibility | N/A | No viewport-height, motion, overflow, or custom accessibility behavior changed. |

Residual risk: no browser validation of React-Toastify's dependency-provided responsive presentation or touch targets at 375/768/1280.

## Skill gates
- **aislop — skip, unavailable:** `aislop scan --changes --json` returned `aislop: command not found` (exit 127); no score available. Not retried.
- **oxlint / anti-slop — skip, oxlint not configured:** repository glob for `**/oxlint.config.*` returned no files; command not run.
- **ocr / open-code-review — skip, blocked:** shell permission denied while checking tool availability; no OCR run/findings claimed. Optional gate does not block PASS by itself.
- **AI-readable — OK:** identifiers and functions are descriptive and small; session flow is documented in `frontend/README.md`; fewer than 3 AI-chaos indicators found.
- **AI-friendly web — N/A:** this is an internal authenticated storefront data/auth layer change, not a public-facing page or crawler-discovery change.
- **blitzstrike — skip, unavailable/blocked:** no authorized live target was supplied and shell permission denied during tool availability check; no pentest result claimed.
- **Surgical diff — OK:** round-2 changes are scoped to the requested auth/session race handling and corresponding tests; no unrelated source refactor found.

## Findings

### [MAJOR] A request is not bound to the session generation under which it was sent
- **File:** `frontend/src/lib/api-client.ts:43-50, 114-144` (especially lines 120 and 137-144); also `115-117`.
- The generation is captured only after the original request has already received a 401 (`120`), rather than when the request is dispatched. Therefore, if a request sent under account A returns 401 after the user has logged in as account B, the handler treats it as a B-session request: it can refresh B's token and retry the old request config with B's bearer token (`142-144`). This can replay an old operation in the wrong account context. There is a related stale-response case after retry: if the user switches to B while an A retry is in flight and that retry returns 401, the `_retry` branch calls `expireSession()` without checking the originating generation, which clears B's current session (`115-117`). The new tests cover a switch while the refresh request is in flight, but not a switch before the initial 401 is handled or while the retried request is in flight.
- **Suggested fix:** capture and attach the session generation (and, as needed, the originating token/session identity) to each request at dispatch. Before starting refresh/retrying, reject requests whose captured generation no longer matches the current session. Also only expire/logout when a retried 401 belongs to the still-current generation. Add deterministic deferred-response tests for both switch timings; assert no stale request is retried under B and B is not logged out by A's late 401.

## Verdict
❌ **FAIL** — the round-1 refresh-result race is fixed for logout/account-switch occurring during refresh, but stale original/retried requests can still cross session boundaries and mutate or clear a newer account's session.
