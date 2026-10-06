# Review: ecommerce-mvp / layer-0-task-06 / round-1

## Review level
**STRICT**

## Reason
Task changes the shared Axios/API client and persisted authentication/session state, including access-token refresh and redirect behavior. This is auth/token/session and shared API-client scope, so STRICT is required.

## Blast radius
- `frontend/src/lib/api-client.ts`: bearer attachment, shared 401 refresh handling and every API request using this client.
- `frontend/src/stores/auth.store.ts`: persisted identity and token state used by route guards and future authenticated flows.
- `frontend/src/types/api.ts`, `frontend/src/lib/query-client.ts`, `frontend/src/lib/validation.ts`, `frontend/src/utils/format.ts`: shared frontend data contracts and helpers.
- `frontend/src/App.tsx`: provider and toast mounting for all routes.
- Frontend tests, package dependencies, and the README data-layer guide.

## Verify commands + result
- `pnpm --dir frontend run lint` — **PASS**, exit 0; 0 errors, 2 warnings in existing `src/components/ui/badge.tsx` and `button.tsx` (`react-refresh/only-export-components`).
- `pnpm --dir frontend exec tsc --noEmit` — **PASS**, exit 0.
- `pnpm --dir frontend test` — **PASS**, 7 test files / 18 tests, including API refresh and SellerRoute regression tests.
- `pnpm --dir frontend run build` — **PASS (builder-verified; not independently rerun in this review)**.
- Bug repro verification — **N/A**, this is an initial-build feature task, not a bug task.

## Responsive Checklist Gate
Diff adds the `QueryClientProvider` and `ToastContainer` around the existing router in `App.tsx`; it adds no page layout, responsive styles, images, media, navigation, or custom interactive controls. Browser rendering was not independently inspected; the changed provider composition is viewport-independent.

| Area | Result | Evidence |
|---|---|---|
| Layout | N/A | `App.tsx` only wraps the existing router with providers; no dimensions, layout rules, grids, or overflow styles changed. 375/768/1280 CSS math is not applicable to this provider-only diff. |
| Typography / spacing | N/A | No typography or spacing styles/copy were changed. |
| Media / images | N/A | No images, video, or embeds were added or changed. |
| Touch / interaction | N/A | No custom controls or navigation were added. `ToastContainer` uses library defaults; its rendered touch behavior was not browser-verified. |
| Viewport / accessibility | N/A | No viewport-height, motion, overflow, or custom accessibility behavior changed in the diff. |

Residual risk: no browser was used to inspect the dependency-provided toast presentation at the configured widths; no custom responsive UI was introduced by this task.

## Skill gates
- **aislop — skip, unavailable:** `aislop scan --changes --json` returned `aislop: command not found` (exit 127); no score available. Per tool-loop guard, not retried.
- **oxlint / anti-slop — skip, oxlint not configured:** glob search for `**/oxlint.config.*` returned no files; command not run.
- **ocr / open-code-review — skip, blocked:** attempting `ocr delegate preview` was denied by shell permission before execution. No OCR findings are claimed; optional gate does not block PASS by itself.
- **AI-readable — OK:** changed identifiers are descriptive, examined functions remain under 50 lines, retry values/stale time are named constants, and `frontend/README.md` documents the new data-layer flow. Fewer than 3 AI-chaos indicators found.
- **AI-friendly web — N/A:** this task is a frontend auth/data-layer change, not a public page/content/crawler-discovery change.
- **blitzstrike — skip, blocked/unavailable:** no authorized live target was supplied, and the shell invocation was denied by permission. No pentest result is claimed.
- **UI craft floor — N/A:** no screen styling or custom visual component implementation changed; Toastify remains dependency-default and was not rendered in a browser.

## Findings

### [MAJOR] In-flight refresh can restore/replace credentials after logout or account switch
- **File:** `frontend/src/lib/api-client.ts:66-80, 110-123`
- `requestNewAccessToken()` writes the refreshed token unconditionally after awaiting the network (`tokenRefreshed`), and each waiting 401 handler unconditionally retries its original request with that token. If logout or a login as another account occurs while refresh is pending, the old refresh result can repopulate access-token state after logout or overwrite the new account's access token; the old request is also retried in the changed session context. The existing tests cover successful refresh/failure/single-flight but not this interleaving.
- **Suggested fix:** capture the session identity (at minimum the refresh token, preferably a session generation) before starting refresh; after await, only persist and retry if the active session still matches. Otherwise reject the original request without mutating or retrying against the newer/cleared session. Add a deterministic test for logout/account-switch during an in-flight refresh.

### [MINOR] Auth user type does not match the documented login response shape
- **File:** `frontend/src/stores/auth.store.ts:6-10`
- The API contract's login response uses `fullName` and includes `shopName` (`project-ecommerce/06-api-contract.md:118-123`), while persisted `AuthUser` requires `name` and omits `shopName`. No adapter is implemented in this task, so passing the documented response user directly into `login` is not type-compatible and the shop identity is not representable in persisted state.
- **Suggested fix:** either model the API user fields in the shared auth type or define/document an explicit API-to-domain mapper and ensure all user fields required by the frontend are preserved.

### [MINOR] Success-envelope type weakens the required contract
- **File:** `frontend/src/types/api.ts:7-11`
- `ApiResponse<T>.message` is optional although `docs/API_SPEC.md:38-43` specifies a message on success. Consumers can therefore compile against responses that violate the documented contract.
- **Suggested fix:** make `message` required, or document and align the API contract if omission is intentionally supported.

## Verdict
❌ **FAIL** — the refresh/logout/account-switch race is a major authentication-session defect. The lint, typecheck, and tests pass, but they do not cover this concurrency case.
