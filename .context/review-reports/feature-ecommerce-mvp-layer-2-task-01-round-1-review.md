# Review: Ecommerce MVP Layer 2 Task 01 (round 1)

- **Review level:** STRICT
- **Reason:** This task adds login/register and profile flows, handling credentials, persisted auth session, 401 refresh/redirect behavior, and profile mutations through real APIs. It also changes UI and route wiring.
- **Blast radius:** `frontend/src/pages/auth/*`, `frontend/src/pages/account/*`, `frontend/src/features/auth/*`, `frontend/src/features/profile/*`, `frontend/src/api/*`, `/login`, `/register`, `/profile`, the existing `auth.store` and `api-client` integration, and the existing backend `/auth/*` and `/users/me` contracts. The auth store and API client are reused, not rewritten.

## Verify commands + result

Commands independently run from the repository root:

| Command | Result |
|---|---|
| `pnpm --dir frontend run lint` | **PASS** (exit 0; 0 errors, 2 existing warnings in `components/ui/badge.tsx` and `button.tsx`, outside this diff) |
| `pnpm --dir frontend exec tsc --noEmit` | **PASS** (exit 0, no diagnostics) |
| `pnpm --dir frontend run test` | **PASS** (12 files, 42 tests passed) |

Additional checks:
- `npx oxlint` — **PASS**, 0 warnings / 0 errors, 174 files / 96 rules.
- `aislop scan --changes --json` — **skip, aislop not installed** (`aislop: command not found`, exit 127).
- `ocr delegate preview` — **skip, ocr not installed** (`ocr: command not found`, exit 127).
- No browser or permitted live pentest environment was available; no app/manual repro or STRIKE test was run.

## Requirements / code review

- Login/register use `apiPost` wrappers and `useAuthStore.login()`; tokens remain in the existing store and no token logging/storage code was added. Existing request/response interceptors remain the session-expiry/refresh implementation.
- `location.state.from` accepts only local absolute paths and excludes protocol-relative URLs and auth entry routes. No role selector or social-login control was introduced.
- Login handles 401 inline and 403 with the exact locked-account message. Register handles 409 inline with a login link. Profile PATCH body contains only `fullName`, `phone`, and `address`; recoverable mutation errors do not reset the form values.
- Route table replaces the login/register/profile placeholders and removes the `/seller/setup` route. `SellerLayout` also removes the corresponding navigation item.
- Backend contract comparison was limited to the available source matches for `/auth/*`, `/users/me`, profile fields, and the exact lock message. No API shape discrepancy was found in the reviewed paths.
- **Profile edit retry behavior:** API failure retains the values in Formik state; no backend-success evidence beyond automated tests was available.
- **Residual risk:** Task verification plan requests an end-to-end registration → login → profile prefill → authenticated API check. I did not run the app/manual flow, and no independent UAT evidence was present in the reviewed artifacts. Browser rendering/actual `scrollWidth` at 375/768/1280 is likewise unverified; responsive findings below are based on the added JSX/Tailwind sizing.

## Responsive Checklist Gate (mandatory; UI changed)

Breakpoints from project config: **375 / 768 / 1280 px**. No browser was available, so runtime scroll-width is not asserted.

| Checklist item | Result | Evidence |
|---|---|---|
| Layout | **OK (CSS-level)** | Auth/profile sections use `container-page`, `w-full`, centered `max-w-md` / `max-w-2xl`, and mobile-first base layout with `md:` / `sm:` enhancements. No fixed-width page container, fixed-column grid, or `overflow:hidden` added. This is compatible with 375/768/1280; actual document scroll width remains unverified. |
| Typography / spacing | **FAIL** | Login and register headings use fixed Tailwind `text-3xl` (`LoginPage.tsx:94`, `RegisterPage.tsx:88`); profile headings also use `text-3xl` (`ProfilePage.tsx:43,109`). This is a fixed `rem` size, not the required fluid `clamp()` heading. Spacing otherwise uses Tailwind scale classes. |
| Media | **N/A** | No images, video, or embedded media were added. |
| Touch / interaction | **FAIL** | Password toggle uses a 44px square target (`PasswordInput.tsx:19-21`), inputs use the shared field styles and save/submit controls are full-width or button components. However, the auth navigation links are plain inline text without 44px hit-area padding (`LoginPage.tsx:152-155`, `RegisterPage.tsx:170-174`; also conflict link `RegisterPage.tsx:107-109`), so mobile targets are under 44px. Nav/table criteria are N/A to these form screens. |
| Viewport / accessibility | **FAIL** | No `100vh` or new overflow clipping is used. The profile loading skeleton uses unqualified `animate-pulse` (`ProfilePage.tsx:26-30`) without a reduced-motion override, so it does not meet the `prefers-reduced-motion` requirement. |

## Skill gates

| Gate | Result | Evidence |
|---|---|---|
| `aislop` | **skip — not installed** | Required scan attempted; command not found, exit 127; no score available. |
| `oxlint` (anti-slop) | **OK** | `npx oxlint`: 0 warnings/errors, scanned 174 files with 96 rules. |
| `ocr` (open-code-review) | **skip — not installed** | `ocr delegate preview` attempted; command not found, exit 127. |
| AI-readable | **FAIL** | Three new page-level components exceed the ≤50-line function limit: `LoginPage` (`LoginPage.tsx:26-160`), `RegisterPage` (`RegisterPage.tsx:19-179`), and `ProfileForm` (`ProfilePage.tsx:55-211`). Each combines form setup, error handling, effects, and rendering in one long function. The main auth/profile route flow was also added without a corresponding README/architecture route-flow update in the diff. This exceeds the chaos gate threshold; split the UI/handlers into focused units and document the new route flow. |
| AI-friendly web | **N/A** | This task changes transactional auth/profile application screens, not public product discovery/marketing content or site crawler configuration. |
| `blitzstrike` | **skip — no permitted STRIKE environment** | Optional live validation was not run; no staging/dev target or BlitzStrike MCP engagement was available in this review. Static code review only; no STRIKE-validated claim. |

## Findings

### [MAJOR] New screen components exceed the required function-size limit

- `frontend/src/pages/auth/LoginPage.tsx:26-160`
- `frontend/src/pages/auth/RegisterPage.tsx:19-179`
- `frontend/src/pages/account/ProfilePage.tsx:55-211`

Each function is substantially longer than the configured 50-line maximum, and mixes form lifecycle, error mapping/focus behavior, and JSX. Split into smaller focused components/handlers/hooks while preserving the current form behavior. This also triggers the AI-readable gate.

### [MAJOR] Auth navigation links are below the mobile touch-target minimum

- `frontend/src/pages/auth/LoginPage.tsx:152-155`
- `frontend/src/pages/auth/RegisterPage.tsx:107-109,170-174`

These are unpadded inline links inside text paragraphs and therefore do not provide the required 44×44px minimum mobile target. Add adequate target padding/min-height without changing the visual hierarchy. This fails the mandatory responsive gate.

### [MAJOR] Added loading animation does not respect reduced-motion preference

- `frontend/src/pages/account/ProfilePage.tsx:26-30`

The profile skeleton applies `animate-pulse` unconditionally, with no `motion-reduce` / `prefers-reduced-motion` override. Disable/reduce this animation for users requesting reduced motion. This fails the mandatory responsive/accessibility gate.

### [MINOR] Auth headings are fixed-size instead of fluid

- `frontend/src/pages/auth/LoginPage.tsx:94`
- `frontend/src/pages/auth/RegisterPage.tsx:88`
- `frontend/src/pages/account/ProfilePage.tsx:43,109`

`text-3xl` is a fixed rem size and does not meet the required fluid `clamp()` heading sizing. Use the project's fluid heading token/class at the responsive checkpoints.

### [MINOR] Axios network errors can surface untranslated English copy

- `frontend/src/pages/auth/LoginPage.tsx:85`
- `frontend/src/pages/auth/RegisterPage.tsx:78`
- `frontend/src/pages/account/ProfilePage.tsx:89`
- Existing source: `frontend/src/lib/api-client.ts:203-207`

For transport failures, the existing API client uses the raw Axios error message (commonly `Network Error`); these pages display `apiError.message` before the Vietnamese fallback. Map no-response/network errors to the existing Vietnamese retry message, keeping server validation messages inline where applicable. This is a copy/localization issue, not a token/session defect.

### [MINOR] Email trim transform is not applied to submitted Formik values

- `frontend/src/pages/auth/LoginPage.tsx:42-46`
- `frontend/src/pages/auth/RegisterPage.tsx:39-44`
- `frontend/src/features/auth/schemas.ts:4-8,18-22`

Yup's `.trim()` validates a transformed value, but Formik does not replace `values` with Yup's cast result; the API calls receive the original `values`. Thus leading/trailing email whitespace can pass this validation and still be sent. Trim/normalize the request value explicitly before `loginRequest`/`registerRequest`, as the screen spec requires.

## Verdict

**❌ FAIL** — three MAJOR findings remain, and multiple mandatory responsive checklist items fail. Lint, typecheck, tests, and Oxlint pass, but do not cover these layout/accessibility/function-size defects.
