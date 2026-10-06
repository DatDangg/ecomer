# Review: ecommerce-mvp / Layer 2 / Task 02 / Round 3 (closure)

- **Review level:** STRICT
- **Reason:** Public product routes touch shared navigation/query behavior and prominent product imagery; the mandatory responsive media gate applies. This is a closure review after round 2's two MAJOR findings and one MINOR function-size finding.
- **Blast radius:** Product list cards and detail gallery image delivery (`ProductImage`, `ProductGallery`), product filters/chips reduced-motion behavior, and the public `/` / `/products` / `/products/:id` UI. No backend, schema, or DB changes in the reviewed task.
- **Scope:** Read-only. No source edits, commit, or push. Changed implementation files are currently untracked as part of the task working tree; `git diff --check` returned exit 0.

## Closure verification (round 2 findings)

| Round 2 finding | Result | Evidence |
|---|---|---|
| **[MAJOR] Responsive image sources missing** | **Closed in part; responsive source sets exist, but sizing remains incorrect for detail hero (see current MAJOR below).** | `ProductImage.tsx:26-43,69-78` builds Cloudinary/picsum candidate sets and emits `srcSet` plus `sizes`; `ProductImageProps.sizes` supports caller override. `ProductGallery.tsx:53-57` sets `priority` but does not pass a detail-specific `sizes`, so it inherits card-oriented `DEFAULT_SIZES` (`ProductImage.tsx:17-19`). |
| **[MAJOR] Reduced-motion overrides missing on filter transitions** | **Closed.** | `ProductFilters.tsx:19-20` and `ActiveFilterChips.tsx:24` both add `motion-reduce:transition-none`. |
| **[MINOR] PriceFilterForm over 50 lines** | **Closed.** | `usePriceFilter` is 41 lines (`ProductFilters.tsx:38-79`) and `PriceFilterForm` is 37 lines (`:81-118`); neither exceeds 50 lines. |

## Verify commands + result

| Configured/task verification command | Result |
|---|---|
| `pnpm --dir frontend run lint` | **PASS**, exit 0; 0 errors. Three warnings: two pre-existing shared UI warnings (`badge.tsx`, `button.tsx`) and one newly introduced warning at `ProductImage.tsx:26` (`react-refresh/only-export-components`; see MINOR finding). |
| `pnpm --dir frontend exec tsc --noEmit` | **PASS**, exit 0; no diagnostics. |
| `pnpm --dir frontend run test` | **PASS**, exit 0; 14 test files / 61 tests passed, including product list (7), product detail (7), and route guards (3). React Router future-flag warnings only. |
| `git diff --check` | **PASS**, exit 0. |

No browser, app server, or DB was run. The requested responsive validation is source/CSS-level; runtime `scrollWidth` is not measured.

## Acceptance and test-isolation evidence

- **Image fix and remaining sizing issue:** `ProductImage.tsx:26-43` creates `srcSet` candidates for the documented Cloudinary and picsum URL forms; unknown hosts safely fall back to `src`. `sizes` is emitted at `:72-73`. The shared default is explicitly described as card sizing (`:17-19`), but the detail gallery at `ProductGallery.tsx:53-57` consumes that default without override.
- **Reduced motion:** the two previously missing filter/chip transitions now opt out under `prefers-reduced-motion` (`ProductFilters.tsx:19-20`, `ActiveFilterChips.tsx:24`).
- **Function size:** extraction leaves both the price state hook and presentational form under the configured 50-line limit.
- **Test isolation:** `ProductListPage.test.tsx:1,13,81-84` and `ProductDetailPage.test.tsx:1,12,37-40` attach `axios-mock-adapter` to the same imported `apiClient` instance used by the API layer and reset it before tests; requests and transport failures are explicitly mocked (`ProductListPage.test.tsx:55-64,170-191`, `ProductDetailPage.test.tsx:42-44,80-113`). `guards.test.tsx:12-23` mocks product/category API functions before the route that renders the public product page. These tests are isolated from real network requests.

## Responsive Checklist Gate

Project breakpoints are `[375, 768, 1280]`. No browser viewport measurement was performed; CSS/class analysis only.

| Checklist item | Result | Evidence / residual risk |
|---|---|---|
| Layout | **OK (CSS-level)** | `ProductGrid.tsx:7` uses `grid-cols-2 md:grid-cols-3 xl:grid-cols-4`: 2 columns at 375px, 3 at 768px, 4 at 1280px under the configured Tailwind breakpoints. The desktop list layout uses a flexible result track and a filter rail per round-2 evidence (`ProductListPage.tsx:222`); detail switches to two columns at `md` (`ProductDetailPage.tsx:120`). No browser `scrollWidth ≤ clientWidth` measurement was run; actual overflow remains a residual risk. |
| Typography / spacing | **N/A (partial source evidence)** | Reviewed task utilities use Tailwind text/spacing scales; global heading CSS and computed values were not browser-verified. No new pixel font-size or fixed-pixel page container is introduced by the three closure edits. Fluid heading behavior remains unverified. |
| Media / images | **FAIL** | The missing `srcSet`/`sizes` problem is improved, but `ProductImage.tsx:18` defaults to `(min-width: 1024px) 25vw` for desktop cards and `ProductGallery.tsx:53-57` does not override it. The detail screen is a two-column layout (`ProductDetailPage.tsx:120-122`), so its prominent gallery image can occupy roughly half the content width while advertising only 25vw; the browser can select an undersized candidate. See MAJOR finding. Media wrappers retain square aspect ratio per round-2 evidence. No video/embed exists in this scope. |
| Touch / interaction | **OK (source-level, partial)** | Filter selects and chips use `min-h-11` (`ProductFilters.tsx:19-20`, `ActiveFilterChips.tsx:24`); gallery thumbnails are 64×64px (`ProductGallery.tsx:67-78`). The mobile filter sheet and card/detail controls were evidenced in round 2. Shared Button target dimensions and runtime hit-area measurements were not rechecked here. |
| Viewport / accessibility | **OK (source-level)** | Previously reviewed task code has no task-local bare `100vh` or error-hiding overflow rule; gallery/card motion has reduced-motion handling. The two filter/chip transition gaps are now closed at the cited lines. No browser contrast/computed-style audit was run. |

## Skill gates

| Gate | Result | Evidence |
|---|---|---|
| `aislop` | **skip, not installed** | `aislop scan --changes --json` returned `/bin/bash: aislop: command not found` (exit 127). |
| `oxlint` (anti-slop) | **skip, oxlint not configured** | Round-2 config discovery found no Oxlint config; no Oxlint config is among the current task working-tree changes. Per gate, did not run `npx oxlint`. Frontend ESLint completed as shown above. |
| `ocr` (open-code-review) | **skip, not installed** | `ocr delegate preview` returned `/bin/bash: ocr: command not found` (exit 127). |
| AI-readable | **OK** | The fixed PriceFilter functions are now under 50 lines. One indicator remains: public route-flow additions were not accompanied by a README/ARCHITECTURE map update (also noted in round 2); names and local call paths are otherwise descriptive, no other confirmed chaos indicators were found. Total remains below the ≥3 FAIL threshold. |
| AI-friendly web | **N/A (pre-deployment scaffold)** | `frontend/public/llms.txt`, `robots.txt`, and `sitemap.xml` exist. `robots.txt:3-6` allows all crawlers and references a sitemap, but the files contain the explicit `REPLACE_AT_DEPLOY` hostname placeholder (`llms.txt:7-8`, `robots.txt:2,6`, `sitemap.xml:2,5,10`). No deployed domain/authorized public target is configured for this review, so URL reachability/content after deployment is not verifiable here. |
| `blitzstrike` | **N/A** | This UI task adds no server endpoint/auth surface and no authorized live target was supplied; no pentest was run. |
| Impeccable / frontend craft | **Partial; responsive media gate FAIL** | Focus/keyboard/error states and reduced-motion details are evidenced by round 2 plus closure source. No browser contrast/computed-style audit was run. The incorrect detail-gallery `sizes` hint is captured as the MAJOR responsive media finding. |

## Findings

- **[MAJOR] `frontend/src/components/product/ProductImage.tsx:17-19,72-73`; `frontend/src/components/product/ProductGallery.tsx:53-57`; `frontend/src/pages/products/ProductDetailPage.tsx:120-122` — detail gallery inherits card-oriented `sizes`.** The default advertises only `25vw` on desktop, although the detail screen uses a two-column layout and the gallery occupies approximately half the content width. The browser may select a lower-resolution candidate than the prominent rendered image needs. **Suggested fix:** pass an explicit, container-appropriate `sizes` hint from `ProductGallery` (and keep card sizing separate), then verify source selection at the three configured widths/DPRs. This means the round-2 responsive-image finding is not fully closed and the mandatory media checklist still fails.
- **[MINOR] `frontend/src/components/product/ProductImage.tsx:26` — newly introduced lint warning.** Exporting `buildImageSrcSet` from the same module as the React component triggers `react-refresh/only-export-components`; the lint command exits 0, but adds a new warning beyond the two existing warnings. **Suggested fix:** move the pure srcSet helper to a small image utility module and import it into the component, or otherwise resolve the Fast Refresh warning without changing behavior.

## Residual risk

- Responsive findings are based on class/source analysis only. Browser-measured horizontal overflow, computed font/spacing/contrast, and actual network candidate selection were not verified.
- The public AI discovery files still contain pre-deployment hostname placeholders; deployment must replace them and verify the published URLs. This is outside the changed task files and no deployed host was available.
- Product test isolation is source-verified and all tests pass; no manual request was made.

## Verdict

❌ **FAIL** — all three explicitly reported round-2 code issues (two MAJOR transition/source presence and the MINOR function size) were addressed, but the responsive image correction is incomplete for the product detail gallery: its card-oriented `sizes` hint underestimates the rendered width, so the mandatory responsive media gate remains FAIL. There is also one new non-blocking ESLint warning. The three verification commands and test isolation pass. No source was changed; no commit/push was performed.
