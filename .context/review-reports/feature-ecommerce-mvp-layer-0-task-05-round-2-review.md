# Review — feature-ecommerce-mvp / layer 0 / task 05 / round 2

- **Review level:** STRICT
- **Reason:** The task touches shared navigation and route guards/role-shell boundaries, which can affect multiple entry points and role surfaces. It also changes public-facing metadata/assets and global responsive typography.
- **Blast radius:** `frontend/src/components/shared/SiteHeader.tsx` (public/customer navigation), `frontend/src/router/*` and `frontend/src/stores/auth.store.ts` (guest/customer/admin routing), shared layouts and CSS tokens, plus deployment metadata under `frontend/public/` and `frontend/index.html`.

## Verify commands + results

| Command | Result |
|---|---|
| `pnpm --dir frontend run lint` | **PASS** — exit 0; 0 errors, 2 `react-refresh/only-export-components` warnings in shadcn-style `badge.tsx` and `button.tsx`. |
| `pnpm --dir frontend exec tsc --noEmit` | **PASS** — exit 0, no diagnostics. |
| `pnpm --dir frontend test` | **PASS** — 4 test files, 7 tests passed, including guest/customer/admin seller-route cases. |
| `pnpm --dir frontend run build` | **Reviewer rerun BLOCKED** — shell permission rejected; did not retry. Builder-reported PASS; the existing `frontend/dist/` listing contains `robots.txt`, `llms.txt`, and `sitemap.xml`. |

## Responsive Checklist Gate

Project breakpoints: 375 / 768 / 1280px (`.context/project-config.md:100-104`). No browser session was used; findings below are based on source/CSS inspection and breakpoint math only.

| Item | Result | Evidence |
|---|---|---|
| Layout | **OK (source/CSS inspection)** | `SiteHeader.tsx:194-210` uses a 56px mobile row, mobile menu/search and responsive page container; desktop navigation switches at Tailwind `lg` (`:100`). `.container-page` has 16/24/32px gutters and a max-width rather than a fixed page width (`index.css:112-116`). Customer account navigation confines horizontal overflow to its own strip (`CustomerLayout.tsx:20-36`); sidebar content uses `min-w-0` (`SidebarLayout.tsx:102-108`). No new fixed-column grid or document-level overflow suppression was found. Actual document `scrollWidth` remains unmeasured. |
| Typography / spacing | **OK** | All h1–h6 font-size tokens use `clamp()` with rem bounds (`index.css:31-39`) and are applied by heading rules (`:76-103`). Body uses `1rem`; spacing uses Tailwind scale and the responsive page-gutter scale. |
| Media | **N/A** | No image, video, or embed is introduced in this scaffold change. |
| Touch / interaction | **OK (source inspection)** | Mobile sheet is available below `lg` and contains both guest login/register links (`SiteHeader.tsx:65-89`); nav links use `min-h-11` (`:47-48`), and icon buttons use the 44px `size=icon` primitive (`button.tsx:19-24`). The search field adds `h-9`, but the shared Input retains `min-h-11` (`input.tsx:11-14`), so its used height remains at least 44px. No table is introduced. |
| Viewport / a11y | **OK by source inspection** | Shells use `min-h-dvh` (`PublicLayout.tsx:8`, `SidebarLayout.tsx:90`) rather than bare `100vh`; reduced motion is handled in `index.css:119-128`; no new `overflow:hidden` concealment was found. Radix Sheet supplies dialog behavior. Keyboard focus restoration and rendered behavior were not browser-verified. |

## Skill gates

| Gate | Result | Evidence |
|---|---|---|
| `aislop` | **skip — not installed** | `aislop scan --changes --json` returned `aislop: command not found`; no score available. |
| `oxlint` / anti-slop | **skip — oxlint not configured** | Recursive Glob search for `*oxlint*` returned no files; no Oxlint config exists in the searched repo tree. |
| `ocr` / open-code-review | **skip — not installed** | `ocr review --format json` returned `ocr: command not found`. |
| AI-readable | **OK** | Reviewed names and route flow are self-descriptive; changed components/functions remain within the size heuristics; no ≥3 AI-chaos indicators found. `frontend/README.md` and `docs/ARCHITECTURE.md` are present and document the frontend route/layout map. |
| AI-friendly web | **OK for this scaffold gate** | `frontend/public/robots.txt`, `llms.txt`, and `sitemap.xml` exist. Robots allows all crawlers and includes a Sitemap directive. `index.html` has canonical and Open Graph metadata. `REPLACE_AT_DEPLOY` is explicitly documented in the HTML and public assets as a deployment-time placeholder, not presented as a real domain. Build output listing also contains all three assets. |
| Blitzstrike | **skip — no permitted live target/tool environment** | This task adds client-side shell guards only; no auth endpoint or public input handler was added, and no permitted staging/live target or Blitzstrike MCP environment is available. No STRIKE-validated finding is claimed. |
| Impeccable / craft-floor | **skip — rendered inspection unavailable** | Build rerun was blocked by shell permission and no browser-rendered view was inspected. Source confirms tokens, visible focus styling, and reduced-motion handling; computed contrast, spacing, and real-copy overflow remain residual risks. |
| Frontend checklist | **OK by source inspection; rendered/performance checks unverified** | HTML has HTML5 doctype, `lang="vi"`, charset, viewport, semantic navigation/main, labels for search, and a custom 404 route; focus styles and reduced-motion rules exist. Public metadata/assets are present. Browser keyboard/contrast, deployed HTTP responses, performance, and image behavior are not applicable or not verifiable at this scaffold stage. |

## Findings

No CRITICAL, MAJOR, or MINOR defects found in the reviewed task scope. The four round-1 MAJOR findings are closed:

- Mobile guest login and registration are present in the mobile sheet (`SiteHeader.tsx:78-89`).
- `SellerRoute` redirects guests to login, admits customer accounts, and redirects admins to `/` (`guards.tsx:36-48`; covered by `guards.test.tsx:27-53`). This is a client-side shell boundary only; backend authorization remains the security boundary.
- Fluid heading tokens are defined and applied for h1–h6 (`index.css:31-39,76-103`).
- Public robots/LLMs/sitemap assets and canonical/OG metadata are present; deployment placeholders are explicitly identified (`frontend/public/*`, `frontend/index.html:11-17`).

## Residual risk

- Browser-based checks at 375 / 768 / 1280px (actual document overflow, keyboard operation, and sheet focus restoration) were not performed; responsive conclusions are source/CSS-based.
- Reviewer build rerun was denied by the shell permission gate. Builder reports build PASS, and the generated public files are visible in `frontend/dist/`; this report does not claim an independent build execution.

## Verdict

✅ **PASS** — no remaining correctness, accessibility, security, or contract defect was found; lint, typecheck, and all 7 tests pass. The remaining verification limitations are recorded above and do not block approval for this scaffold task.
