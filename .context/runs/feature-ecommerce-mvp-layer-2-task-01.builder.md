# Builder journal — feature/ecommerce-mvp / layer-2-task-01 (FE auth) — defect-fix round

- **Step:** fix reviewer defects from `.context/review-reports/feature-ecommerce-mvp-layer-2-task-01-round-1-review.md`
- **Status:** done (awaiting reviewer round 2)
- **Not committed** (per task instruction; primary commits after Reviewer PASS).

## What was done and why

### MAJOR 1 — functions >50 lines (AI-readable gate)
Split long page functions into focused units (every function now ≤49 lines; files ≤300; verified by brace-scan):
- `LoginPage.tsx`: `mapLoginApiError` (24), `useLoginForm` (40), `LoginForm` presentational (45), `LoginPage` (36).
- `RegisterPage.tsx`: `mapRegisterApiError` (21), `applyRegisterApiError` (16), `useRegisterForm` (41),
  `RegisterIdentityFields` (40), `RegisterPasswordField` (25), `RegisterForm` (30), `RegisterPage` (28).
- `ProfilePage.tsx`: `useProfileForm` (49), `ProfileEmailField`, `ProfileFields`, `ProfileAddressField`,
  `ProfileForm`, `ProfileSkeleton`, `ProfileErrorState`, `ProfilePage`.
- New shared pieces: `components/ui/form-alert.tsx` (FormAlert), `features/auth/AuthLink.tsx`.
Form behavior/ids/labels preserved; all added tests still pass.

### MAJOR 2 — touch target <44px
`AuthLink` uses `inline-flex min-h-11 items-center px-2 -mx-2` → 44px hit area, text alignment preserved.
Applied to Login register link and both Register login links.

### MAJOR 3 — reduced motion
`ProfileSkeleton` pulse divs now carry `motion-reduce:animate-none`.

### MINOR 4 — fixed-size headings
Removed `text-3xl` (fixed rem) from the 4 auth/profile `<h1>`s; base `h1` CSS already applies the fluid
`clamp()` `--font-size-heading-1` token.

### MINOR 5 — raw English network error
`lib/api-client.ts`: added `readApiErrorMessage` + exported `NETWORK_ERROR_MESSAGE`; no-response transport
errors now map to the Vietnamese retry copy, server envelope messages stay unchanged (inline validation intact).

### MINOR 6 — email trim
Login/Register `onSubmit` now send `values.email.trim()` (Yup `.trim()` does not cast Formik values).

### MINOR 7 — route-flow docs
Added "Auth & profile flow" section to `frontend/README.md` (and removed stale `/seller/setup` bullet).

## Tests added (5)
- Login: Vietnamese retry message on no-response; email-trim from navigation state.
- Register: Vietnamese retry message on no-response; email-trim on submit.
- Profile: Vietnamese retry message on no-response PATCH.

## Verify (all PASS)
- `pnpm --dir frontend run lint` → exit 0 (2 pre-existing warnings in badge/button, unrelated).
- `pnpm --dir frontend exec tsc --noEmit` → exit 0.
- `pnpm --dir frontend run test` → 12 files, 47 tests passed (was 42; +5).

## Remaining / notes
- Scope kept to auth/profile + api-client error copy; no seller setup / social login.
- `.context/runs/start-ecommerce-01.md` untouched.
- No commit/push performed.
