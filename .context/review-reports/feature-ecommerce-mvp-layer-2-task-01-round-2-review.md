# Review: Ecommerce MVP Layer 2 Task 01 (round 2)

- **Review level:** STRICT
- **Reason:** Authentication handles credentials, persisted session tokens, 401 refresh/expiry behavior, redirect targets, and profile mutations. This review rechecks those security-sensitive paths as well as the UI fixes from round 1.
- **Blast radius:** `frontend/src/pages/auth/*`, `frontend/src/pages/account/*`, `frontend/src/features/auth/*`, `frontend/src/features/profile/*`, `frontend/src/api/*`, `/login`, `/register`, `/profile`, shared `api-client` error normalization, and existing auth store/interceptor integrations. The auth store and session/refresh interceptor were not rewritten.

## Round 1 finding closure / required regressions

| Check | Result | Evidence |
|---|---|---|
| Login/Register/Profile form functions ≤50 lines | **PASS** | The formerly oversized page components are split into focused hooks/forms/field components. `LoginPage.tsx:63-102` (`useLoginForm`) is 40 lines; `RegisterPage.tsx:71-111` (`useRegisterForm`) is 41 lines; `ProfilePage.tsx:57-105` (`useProfileForm`) is 49 lines; exported `LoginPage`, `RegisterPage`, `ProfilePage` and `ProfileForm` are all below 50 lines. Reviewed changed/new code files are below the configured 300-line limit; longest auth page is `RegisterPage.tsx` at 259 lines. |
| Auth-link mobile hit areas ≥44×44px | **PASS** | All login/register/conflict navigation links use `AuthLink` (`LoginPage.tsx:188`, `RegisterPage.tsx:218,254`). `features/auth/AuthLink.tsx:13` uses `inline-flex min-h-11 px-2`; Tailwind `min-h-11` is 2.75rem (44px at the 16px root size), and text plus horizontal padding gives these labels at least 44px width. Password visibility button remains `h-11 w-11` (`PasswordInput.tsx:19-21`). |
| Profile skeleton respects reduced motion | **PASS** | Each animated placeholder in `ProfilePage.tsx:27,29-31` pairs `animate-pulse` with `motion-reduce:animate-none`. |
| Fluid heading sizing | **PASS** | Auth/profile page headings no longer use `text-3xl`. They inherit the global `h1` rule and `--font-size-heading-1: clamp(1.875rem, 1.5vw + 1.5rem, 2.75rem)` (`frontend/src/index.css:34,76-77`). |
| Vietnamese network error mapping | **PASS** | `api-client.ts:198-208` maps transport failures without a response to `Không thể kết nối máy chủ. Vui lòng thử lại.`; server response messages are preserved. Login/register/profile tests cover the no-response message (`LoginPage.test.tsx:105-114`, `RegisterPage.test.tsx:71-80`, `ProfilePage.test.tsx:83-97`). |
| Email trimmed before API calls | **PASS** | Login submits `values.email.trim()` (`LoginPage.tsx:77`); register submits a trimmed email (`RegisterPage.tsx:95`). Tests assert the actual request body (`LoginPage.test.tsx:116-131`, `RegisterPage.test.tsx:82-99`). |
| Route-flow documentation | **PASS** | `frontend/README.md:70-83` now documents login/register/profile flows, safe redirect, trim/error behavior, and ownership of the existing store/interceptor. |
| Existing session store/interceptor preserved | **PASS** | `git diff` shows no change to `frontend/src/stores/auth.store.ts`. The only `api-client.ts` diff adds localized transport-error message normalization; the request interceptor, refresh single-flight, retry, session generation, and expiry/clear/redirect code are unchanged. |
| Safe redirect | **PASS** | `resolveSafeRedirect` only accepts a single-slash local path, rejects protocol-relative/external/auth-entry targets, and defaults to `/products` (`form-utils.ts:17-25`). Tests cover safe internal paths, external/protocol-relative paths, invalid values, and auth-entry loops (`form-utils.test.ts:5-27`). |
| Error messages / account lock | **PASS** | Login maps 401 inline and preserves exact `Tài khoản đã bị khóa` for the locked-account 403 (`LoginPage.tsx:37-60`); register maps 409 and supplies a login link (`RegisterPage.tsx:31-50,216-220`). Tests cover 401, exact 403, 409, and transport failure. |
| No role selector | **PASS** | Neither auth page renders role selection; registration payload contains only name/email/password (`RegisterPage.tsx:88-99`, `api/auth.ts:17-22`). |
| `/seller/setup` removed | **PASS** | Route removed from `router/index.tsx`; seller navigation entry removed from `SellerLayout.tsx`; frontend README seller route list no longer includes it. |

## Verify commands + result

Commands independently run from the repository root for this round:

| Command | Result |
|---|---|
| `pnpm --dir frontend run lint` | **PASS**, exit 0; 0 errors and 2 warnings in existing `components/ui/badge.tsx` / `button.tsx` (outside this task diff). |
| `pnpm --dir frontend exec tsc --noEmit` | **PASS**, exit 0; no diagnostics. |
| `pnpm --dir frontend run test` | **PASS**, exit 0; 12 test files, 47 tests passed. Includes new auth/profile request and regression tests. |
| `npx oxlint` | **PASS**, exit 0; 0 warnings / 0 errors across 176 files with 96 rules. |
| `aislop scan --changes --json` | **skip — `aislop` not installed**; command not found (exit 127), no score available. |
| `ocr delegate preview` | **skip — `ocr` not installed**; command not found (exit 127). |
| `blitzstrike` live validation | **skip — no permitted STRIKE environment available**; no STRIKE-validated claim. |

## Responsive Checklist Gate (mandatory; UI changed)

Breakpoints: **375 / 768 / 1280 px** from project config. Browser rendering was not available; results below are CSS/JSX-level checks, not runtime `document.scrollWidth` measurements.

| Checklist item | Result | Evidence |
|---|---|---|
| Layout / horizontal overflow | **OK (CSS-level)** | Auth/profile page wrappers are `w-full` with `container-page` and bounded `max-w-md` / `max-w-2xl`; responsive enhancements use base styles plus `sm:`/`md:` classes. No new fixed-width page container, fixed-column grid, or `overflow:hidden` was introduced. These constraints fit the configured widths by CSS inspection; actual browser scroll width remains unverified. |
| Typography / spacing | **OK** | Global h1 sizing uses `clamp()` (`index.css:34,76-77`); no `text-3xl` remains on reviewed auth/profile headings. Layout spacing uses Tailwind scale classes; no px font-size was added. |
| Media | **N/A** | No image, video, or embedded media was introduced by this task. |
| Touch / interaction | **OK** | `AuthLink` is at least 44px tall and padded horizontally; password toggle is 44×44px. Form fields and buttons retain shared controls/min-height sizing. No nav/table UI was changed in these screens, so responsive hamburger/table-specific criteria are **N/A**. |
| Viewport / accessibility | **OK** | No `100vh` or overflow clipping was added. Skeleton pulse is disabled via `motion-reduce:animate-none`. Actual reduced-motion/browser behavior was not browser-tested. |

**Residual responsive risk:** No browser was used, so actual scroll-width behavior at 375/768/1280, computed touch dimensions, and visual contrast/rendering remain unverified. Source-level layout math and sizing are consistent with the checklist.

## Skill gates

| Gate | Result | Evidence |
|---|---|---|
| `aislop` | **skip — not installed** | Required `aislop scan --changes --json` attempted; command not found (exit 127), so no score is available. |
| `oxlint` (anti-slop) | **OK** | `npx oxlint` completed with 0 warnings/errors, 176 files / 96 rules. |
| `ocr` (open-code-review) | **skip — not installed** | `ocr delegate preview` attempted; command not found (exit 127). |
| AI-readable | **OK** | No reviewed changed function exceeds 50 lines and changed code files stay under 300 lines. Names and responsibilities are specific; the route/auth flow was added to `frontend/README.md`. No ≥3 AI-chaos indicators found. |
| AI-friendly web | **N/A** | Transactional auth/profile application screens; not public-facing marketing/discovery content. |
| `blitzstrike` | **skip — no permitted STRIKE environment** | Optional live pentest unavailable; no STRIKE-validated findings claimed. |

## Findings

No CRITICAL, MAJOR, or MINOR findings remain for this task in round 2.

## Scope / residual notes

- Task verification plan mentions a full live register → login → profile → authenticated product API journey. No browser/live app was used in this review; the automated component/API tests and source review cover the implemented behaviors, but that manual UAT evidence remains outstanding.
- `git status --short` also lists `.context/runs/*` artifacts and the prior round report, which are not application source for this task and were not included in the code assessment. Keep unrelated workflow artifacts out of the task commit unless separately required.

## Verdict

**✅ PASS** — all three round-1 MAJOR findings are closed, requested MINOR follow-ups are addressed, required frontend verification commands pass, and no remaining CRITICAL/MAJOR findings or responsive checklist failures were found. Manual browser/UAT checks remain residual risk, not an unverified bug-repro gate (this is a feature task).
