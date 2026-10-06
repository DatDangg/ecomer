# Review: ecommerce-mvp / Layer 2 / Task 02 / Round 2

- **Review level:** STRICT
- **Reason:** Public product discovery routes use shared navigation, query/cache and API client paths; UI task has mandatory responsive, accessibility, image, and reduced-motion gates. Round 1 was blocked by incomplete review coverage, not a confirmed defect. This round inspected every explicitly requested component/page/test file.
- **Blast radius:** Product list/detail screens and component states, public product/category API calls, shared `/` and `/products` routes, browser query-parameter history, and route guard tests. No backend, schema, or database changes were reviewed.
- **Scope:** Read-only re-review. No source changes, app/browser run, DB access, commit, or push.

## Files reviewed

- Components: `ProductGrid.tsx`, `ProductCard.tsx`, `ProductImage.tsx`, `Pagination.tsx`, `ProductListStates.tsx`, `ProductSearch.tsx`, `ProductFilters.tsx`, `ActiveFilterChips.tsx`, `ProductGallery.tsx`.
- Screens: `ProductListPage.tsx`, `ProductDetailPage.tsx`.
- Tests/isolation: `ProductListPage.test.tsx`, `ProductDetailPage.test.tsx`, `router/guards.test.tsx`.
- Supporting implementation: `api-client.ts`, `useProducts.ts`, `product-list-params.ts`, `frontend/index.html`; git diff/status for the task's working-tree changes.

## Verify commands + result

| Command | Result |
|---|---|
| `pnpm --dir frontend run lint` | **PASS**, exit 0; 0 errors, 2 warnings in unchanged `components/ui/badge.tsx` and `components/ui/button.tsx` (`react-refresh/only-export-components`). |
| `pnpm --dir frontend exec tsc --noEmit` | **PASS**, exit 0; no diagnostics. |
| `pnpm --dir frontend run test` | **PASS**, exit 0; 14 test files / 61 tests passed, including product list (7), product detail (7), and route guards (3). React Router emitted future-flag warnings. |

No browser viewport measurement or manual app repro was run; responsive evidence below is CSS/class-level as requested.

## Acceptance / implementation evidence

- `ProductGrid.tsx:7` uses `grid-cols-2 md:grid-cols-3 xl:grid-cols-4`; skeleton geometry matches at `ProductListStates.tsx:16`. With Tailwind's default breakpoints this yields 2 columns at 375px, 3 at 768px, and 4 at 1280px.
- `ProductListPage.tsx:95-96,112-120,222` places the filter rail at `lg` and keeps a mobile filter sheet otherwise. The desktop result track is `minmax(0,1fr)`; the mobile sheet is `w-80 max-w-[85vw]`. At 375px the sheet is capped at 85vw, and at 1280px the rail and results column are active.
- Product cards link to `/products/:id`, use product name as image alt, format prices with `formatVnd`, and render the textual out-of-stock label (`ProductCard.tsx:19-37`). No cart or seller-shop link is present in the card.
- `ProductImage.tsx:23-47` renders a neutral accessible fallback and fills a square-ratio parent without changing its reserved geometry. The actual image element has only `src`; see responsive finding below.
- Empty/error/retry behaviors are present (`ProductListStates.tsx:35-69`); list screen wires retry to `refetch` and empty-clear to filter reset (`ProductListPage.tsx:183-199`). Vietnamese no-response text is supplied by `api-client.ts:198-208` and asserted by both page tests.
- `ProductDetailPage.tsx:49-67,134-153` maps unavailable detail to the shared not-found view without rendering product data. Gallery uses labeled buttons, `aria-pressed`, arrow/Home/End keyboard handling, and selected focus (`ProductGallery.tsx:7-35,59-83`).
- Search has a visible associated label (`ProductSearch.tsx:40-56`); result count is announced (`ProductListPage.tsx:140-147`); errors use `role="alert"`; loading states use `role="status"`.
- **Test isolation:** list and detail tests each construct `new MockAdapter(apiClient)` (`ProductListPage.test.tsx:1,13`; `ProductDetailPage.test.tsx:1,12`) and reset it before every case; each API request is explicitly mocked, with transport failures simulated by `.networkError()` (list lines 184-191; detail lines 106-113). Since the adapter is installed on the same `apiClient` instance the API calls use, these test requests do not go to a real network. `guards.test.tsx:12-23` mocks both product/category list API functions for the route that redirects to `/`. Isolation evidence is confirmed; no manual request was made.
- The requested UI/page/test files are all below 300 lines (largest reviewed screen is `ProductListPage.tsx`, 240 lines; largest test is 193 lines). One helper function exceeds the 50-line guideline: `PriceFilterForm` (`ProductFilters.tsx:38-101`, 64 physical lines); see MINOR finding.

## Responsive Checklist Gate

Project `ui.responsive_breakpoints` is `[375, 768, 1280]`. No browser was used; source/class analysis only. Scroll width was not measured at runtime.

| Item | Result | Evidence / residual risk |
|---|---|---|
| Layout | **OK (CSS-level)** | Grid tracks are responsive (`grid-cols-2 md:grid-cols-3 xl:grid-cols-4`, `ProductGrid.tsx:7`); desktop layout uses `lg:grid-cols-[16rem_minmax(0,1fr)]` (`ProductListPage.tsx:222`); product media stays within an `aspect-square` wrapper (`ProductCard.tsx:20-25`). No fixed-pixel page container or task-local `overflow:hidden` suppression was found. The image wrapper's `overflow-hidden` is local clipping for the square media crop. Runtime `scrollWidth ≤ clientWidth` remains unmeasured. |
| Typography / spacing | **N/A (partial source evidence)** | Reviewed utility typography uses Tailwind scale classes (`text-xs` through `text-2xl`) and spacing scale utilities; no pixel font-size utility was seen. Page headings inherit global heading styles (`ProductListPage.tsx:214`, `ProductDetailPage.tsx:75`), and the global CSS definition was not within the requested/readable review set, so `clamp()` behavior cannot be confirmed. |
| Media / images | **FAIL** | Image sizing/fallback preserves the square parent (`ProductImage.tsx:23-47`; `ProductCard.tsx:20-25`, `ProductGallery.tsx:52-57`), but the `<img>` at `ProductImage.tsx:40-47` has `src` only, with no `srcSet` or `sizes` for important product imagery. See MAJOR finding. No video/embed occurs in this scope. |
| Touch / interaction | **N/A (partial source evidence)** | Explicit targets meet 44px: filters use `min-h-11` (`ProductFilters.tsx:19-20`), filter chips use `min-h-11` (`ActiveFilterChips.tsx:24`), gallery thumbnails are 64×64px (`ProductGallery.tsx:67-78`), and detail links use `min-h-11` (`ProductDetailPage.tsx:59-64,113-119`). The mobile filter sheet exists (`ProductListPage.tsx:112-134`). Filter trigger, pagination, and clear/retry actions delegate dimensions to the shared `Button`; that component's target size was not established from the scoped review. No table exists in these screens. |
| Viewport / accessibility | **FAIL** | No task-local `100vh` use or error-hiding overflow rule was found. Skeleton/card/gallery motion has reduced-motion handling (`ProductListStates.tsx:19-21`, `ProductCard.tsx:24`, `ProductGallery.tsx:77`). However, the filter select and active-chip `transition-colors` declarations lack a reduced-motion override (`ProductFilters.tsx:19-20`, `ActiveFilterChips.tsx:24`); see MAJOR finding. Keyboard, labels, live result state, image alt/fallback, and alert/status semantics are present as cited above. |

**Responsive gate:** FAIL due to missing responsive image sources and transitions not honoring reduced motion. No browser measurement was claimed.

## Skill gates

| Gate | Result | Evidence |
|---|---|---|
| `aislop` | **skip, not installed** | `aislop scan --changes --json` returned command not found (exit 127). |
| `oxlint` (anti-slop) | **skip, oxlint not configured** | Glob search for `**/oxlint.config.*` found no configuration. Per gate, did not run `npx oxlint`. |
| `ocr` (open-code-review) | **skip, not installed** | `ocr delegate preview` returned command not found (exit 127). |
| AI-readable | **OK** | No more than 2 indicators found: `PriceFilterForm` exceeds 50 lines; route flow changes are not accompanied by a README/ARCHITECTURE change in the observed task diff. Names and call paths are otherwise direct, no three-step-plus indirection, unexplained magic value, or dynamic import was found in the requested implementation. Threshold is ≥3 indicators for FAIL. |
| AI-friendly web | **skip, static-file contents not verified** | Glob confirms `frontend/public/robots.txt`, `frontend/public/llms.txt`, and `frontend/public/sitemap.xml` exist. Their contents, crawler directives, and sitemap link were not source-verified in this round; no claim that they are valid is made. |
| `blitzstrike` | **N/A** | This task adds no auth flow, server endpoint, or permitted live test target; no live pentest was run. |
| Impeccable / frontend checklist (UI craft, semantics, SEO, images, a11y) | **FAIL / partial** | Component-level semantics, labels, keyboard interactions, errors, and reduced-motion are evidenced above. Responsive image variants and the reduced-motion omissions are confirmed findings; no browser contrast/computed-style audit was run. `frontend/index.html` has Vietnamese language, charset, viewport, title/description and shared OG tags, but route-specific metadata was not observed. |

## Findings

- **[MAJOR] `frontend/src/components/product/ProductImage.tsx:40-47` — important product images have no responsive source selection.** The shared `<img>` only receives `src`; no `srcSet`/`sizes` are provided for the product card or detail gallery. This misses the responsive media checklist for primary product content and can download unnecessarily large assets on small screens. **Suggested fix:** provide validated responsive image variants (or `srcSet`/`sizes`) from the image source contract and preserve the current aspect-ratio fallback.
- **[MAJOR] `frontend/src/components/product/ProductFilters.tsx:19-20`; `frontend/src/components/product/ActiveFilterChips.tsx:24` — color transitions ignore reduced-motion preference.** Both declarations use `transition-colors` without `motion-reduce:transition-none`, whereas the card and gallery transitions now explicitly opt out. **Suggested fix:** add the reduced-motion override to these transitions (and confirm other shared action transitions follow the same policy).
- **[MINOR] `frontend/src/components/product/ProductFilters.tsx:38-101` — `PriceFilterForm` exceeds the 50-line function guideline.** It is 64 physical lines including JSX. **Suggested fix:** extract the validation/error-message calculation or form-field section into a small focused helper/component without changing behavior.

## Residual risk

- CSS-level grid class math establishes 2/3/4 columns at 375/768/1280, but actual rendered `scrollWidth`, computed typography, shared button dimensions, and global viewport styles were not browser-verified.
- `frontend/public` AI discovery files exist but their contents were not verified; route-specific SEO metadata and JSON-LD were not audited.
- Public API filtering of inactive/blocked products relies on the API behavior described in task scope; this review did not re-review backend implementation.

## Verdict

❌ **FAIL** — two MAJOR responsive/accessibility checklist failures remain, plus one MINOR function-size issue. All three requested verification commands pass and the product test isolation is confirmed. No code was changed and no commit/push was performed.
