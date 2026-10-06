# Review — feature-ecommerce-mvp / layer 0 / task 05 / round 1

- **Review level:** STRICT
- **Reason:** The task introduces shared navigation and route guards across public, customer, seller, and admin surfaces. Navigation and role-shell boundaries have cross-route impact; responsive UI is also in scope.
- **Blast radius:** `frontend/src/components/shared/SiteHeader.tsx` (shared public/customer header), `frontend/src/layouts/*` and `frontend/src/components/shared/SidebarLayout.tsx` (shared shells), `frontend/src/router/*` and `frontend/src/stores/auth.store.ts` (role/shell routing), global tokens in `frontend/src/index.css`, and public deployment metadata/assets under `frontend/`.

## Verify commands + results

| Command | Result |
|---|---|
| `pnpm --dir frontend run lint` | **PASS** — 0 errors, 2 `react-refresh/only-export-components` warnings (`badge.tsx`, `button.tsx`); treated as acceptable shadcn-style warnings per task instructions. |
| `pnpm --dir frontend exec tsc --noEmit` | **PASS** — exit 0, no diagnostics. |
| `pnpm --dir frontend run build` | **Blocked** — shell execution was denied by the environment. Per Tool Loop Guard, no retry was attempted. |
| `pnpm --dir frontend test` | **PASS** — 3 test files, 4 tests passed. Tests cover formatter cases, button shape/name, and a basic public-layout render. |
| `aislop scan --changes --json` | **Skipped** — `aislop: command not found`; no score available. |
| Oxlint check | **Skipped / partially blocked** — the enumerated `frontend/` tree contains no Oxlint config; checking for a root-level config was denied by the shell permission gate. |
| Open Code Review (`ocr`) | **Skipped / availability unverified** — command availability check was denied by the shell permission gate. |
| Browser/responsive visual verification | **Not run** — no browser run was permitted/available in this review. Responsive findings below are from source/CSS inspection and breakpoint math only. |

## Responsive Checklist Gate

Project UI breakpoints are 375 / 768 / 1280px (`.context/project-config.md:100-104`). Browser measurements (`scrollWidth` vs `clientWidth`) were not available; statuses below use CSS inspection and explicitly retain that limitation.

| Item | Result | Evidence |
|---|---|---|
| Layout | **OK (CSS math only)** | `frontend/src/index.css:73-76` applies fluid `w-full` with page gutters `px-4` / `md:px-6` / `xl:px-8` (16 / 24 / 32px); it caps rather than fixes the page width. `SiteHeader.tsx:39` uses a 56px base row and switches to desktop navigation at `lg`; `CustomerLayout.tsx:21` confines horizontal scrolling to the account-nav strip rather than intentionally scrolling the document. At 1280px, `lg` desktop navigation is active. Actual browser overflow remains unverified. |
| Typography / spacing | **FAIL** | Body size is `1rem`, and page gutters follow the required scale (`index.css:45-52,73-76`), but the global heading rules only set font family and `ss03` (`index.css:56-64`); no fluid heading `clamp()` size is established by the reviewed token stylesheet. Add a fluid heading-size token and apply it to headings. |
| Media | **N/A** | No image/video/embed is introduced in the reviewed shell/token surfaces. |
| Touch / interaction | **OK for rendered controls; navigation gap reported separately** | Shared `Button` uses 44px minimum height and icon size (`button.tsx:7-8,19-24`); the header menu/search/cart/account controls use that button primitive. Sidebar/account links use `min-h-11` (`SidebarLayout.tsx:33-39`, `CustomerLayout.tsx:23-30`). The header exposes a mobile sheet menu. Guest login availability is defective as noted below. |
| Viewport / a11y | **OK by source inspection** | Shells use `min-h-dvh` (`PublicLayout.tsx:8`, `SidebarLayout.tsx:49`); `index.css:79-87` honors `prefers-reduced-motion`; the inspected global styles do not hide overflow. Radix Dialog primitives provide sheet dialog focus behavior; no browser/keyboard interaction run was performed. |

## Skill gates

| Gate | Result | Evidence |
|---|---|---|
| Frontend checklist | **FAIL** | The public entry document has only basic title/description metadata (`frontend/index.html:3-8`); the enumerated frontend tree contains no deployment-root `llms.txt`, `robots.txt`, or `sitemap.xml`. Public-web discoverability requirements are not met. The mobile guest login omission below also blocks a complete public entry flow. |
| Impeccable | **Skip — rendered craft floor not verifiable** | CSS confirms the specified monochrome tokens, focus outline, and reduced-motion rule (`index.css:8-24,66-69,79-87`), but build execution was blocked and no rendered browser inspection was available. Layout/typography gaps are separately recorded in the responsive gate and findings. |
| `aislop` | **Skip — not installed** | `aislop scan --changes --json` returned `aislop: command not found`; score is unavailable. |
| `oxlint` / anti-slop | **Skip — no config found in frontend; root check blocked** | The enumerated frontend files show no Oxlint config. A root-level config check was denied; no Oxlint result is claimed. |
| `ocr` / open-code-review | **Skip — availability check blocked** | Shell permission denial prevented checking/running `ocr`; no findings are claimed. |
| AI-readable | **OK (<3 chaos indicators)** | Names and route/layout indirection are straightforward. `SiteHeader` (`SiteHeader.tsx:17-160`) and `SidebarLayout` (`SidebarLayout.tsx:44-99`) exceed the 50-line function heuristic; this is one indicator category and is noted as a maintainability concern, not a gate failure. A frontend README exists in the enumerated tree. |
| AI-friendly web | **FAIL** | This is a public marketplace web surface. The recursive `frontend/` file listing contains no `frontend/public/` deployment assets and no `llms.txt`, `robots.txt`, or `sitemap.xml`. Add these at the frontend deployment root (with a sitemap directive in `robots.txt`) before approving the public web surface. |
| Blitzstrike | **N/A** | This scaffold adds client-side route-shell checks but no auth endpoint, token issuance/session implementation, or public API/input handler to pentest. |

## Findings

### [MAJOR] Guest users have no mobile login entry point

- **Location:** `frontend/src/components/shared/SiteHeader.tsx:137-139` (mobile menu items at `:53-69`)
- **Issue:** The guest `Đăng nhập` button is hidden below the `sm` breakpoint, while the mobile sheet only contains Home and Products. At 375px, a guest cannot reach the login route through the public/customer shell. This conflicts with the shell requirement that guest actions lead to login when required and leaves a core account entry action undiscoverable on mobile.
- **Suggested fix:** Add a labeled `Đăng nhập` destination to the mobile sheet (with the same close/focus behavior as other entries), or provide an accessible 44px login action in the mobile header.

### [MAJOR] Seller shell is not role-gated

- **Location:** `frontend/src/router/index.tsx:23-43`; `frontend/src/router/guards.tsx:5-14`; `frontend/src/stores/auth.store.ts:3-10`
- **Issue:** Seller routes are nested under `PrivateRoute`, which checks only whether any user and access token exist. `UserRole` only models `customer | admin`, and no seller-specific guard exists. Therefore any authenticated customer or admin can enter `/seller/*` and receive the seller shell, contrary to the role-aware shell/navigation requirement. This is a UI boundary finding; it does not assert that backend authorization is absent.
- **Suggested fix:** Model the seller-capable role/state and add a seller-shell guard that admits only the intended seller state; retain server-side authorization as the actual security boundary.

### [MAJOR] Global heading tokens are not fluid

- **Location:** `frontend/src/index.css:56-64`
- **Issue:** The global heading rule sets only font family and `ss03`; the scaffold does not establish a fluid heading size with `clamp()`. This fails the mandatory responsive typography checklist and leaves headings without the documented responsive type token.
- **Suggested fix:** Define a heading-size token using `clamp()` (with rem-based bounds) and apply it to the relevant heading levels; verify at 375 / 768 / 1280px.

### [MAJOR] Public deployment discovery metadata/assets are absent

- **Location:** `frontend/index.html:3-8`; missing `frontend/public/llms.txt`, `frontend/public/robots.txt`, and `frontend/public/sitemap.xml`
- **Issue:** The public entry page has a title and description but no canonical/social metadata, and the enumerated frontend deployment tree has no AI-crawler file, robots file, or sitemap. This fails the AI-friendly web gate and leaves public SEO/discovery incomplete.
- **Suggested fix:** Add `llms.txt`, a valid `robots.txt` with a sitemap directive, and an XML sitemap to the Vite deployment root; add canonical and appropriate Open Graph metadata for the public entry page (and route-aware metadata when public pages are implemented).

### [MINOR] Shared header component exceeds the function-size guideline

- **Location:** `frontend/src/components/shared/SiteHeader.tsx:17-160`; `frontend/src/components/shared/SidebarLayout.tsx:44-99`
- **Issue:** Both shell components are over the 50-line function guideline, concentrating mobile sheet, desktop navigation, search, and account behavior in long JSX components. This is not a runtime defect but raises change/review cost for shared navigation.
- **Suggested fix:** Extract narrowly scoped header actions/mobile search/menu subcomponents while keeping behavior and focus handling easy to trace.

## Residual risk

- Build output and the rendered shell were not verified because `pnpm --dir frontend run build` was rejected by the shell permission gate. No retry was made. Browser-based overflow, computed contrast/spacing, keyboard operation, and sheet focus restoration therefore remain unverified.
- `aislop` score is unavailable; Oxlint/OCR availability and root-level Oxlint configuration could not be checked after shell access was denied.

## Verdict

❌ **FAIL** — multiple MAJOR findings remain, including mobile login discoverability, missing seller role-shell isolation, non-fluid heading typography, and missing public discovery assets. Build verification is also blocked.
