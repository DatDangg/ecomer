# Builder journal — feature/ecommerce-mvp / layer-2-task-02 (FE product list/detail) — test-repair round

- **Step:** repair malformed/racing tests left by previous builder so verify commands PASS
- **Status:** done (awaiting reviewer)
- **Not committed** (per task instruction; primary commits after Reviewer PASS).

## Root causes + fixes

1. **`ProductListPage.test.tsx` esbuild parse error** — test "hydrates filters from the URL…"
   was missing its closing `});` before the next `it(...)`. Added it.
2. **Category select race (2 tests: "writes category changes…", "restores the previous filter state…")** —
   `selectOptions(select, "c1")` ran before `useCategories` resolved, so the `<option value="c1">` did not
   exist yet. Added `await screen.findByRole("option", { name: "Áo" })` before `selectOptions`.
3. **`ProductDetailPage.test.tsx` price assertion** — DOM price text (`Intl` vi-VN currency) contains a
   non-breaking space; testing-library normalizes the DOM node but compares a string matcher unnormalized,
   so `getByText(formatVnd(199000))` never matched. Switched to `/199\.000/` regex; dropped now-unused
   `formatVnd` import.
4. **Gallery fallback race** — `waitFor(queryAllByRole("button", {name:/Xem ảnh/}).length === 0)` already
   passed during the detail skeleton (skeleton has zero thumbnails), so the subsequent `getByRole("img")`
   ran mid-load. Now `await screen.findByRole("heading", { name: "Áo thun" })` first; dropped unused `waitFor`.
5. **`guards.test.tsx` admin redirect** — admin now redirects from `/seller` to `/`, which renders
   `ProductListPage` (h1 = `products.title` = "Sản phẩm") instead of the old placeholder "Trang chủ".
   Updated the expected heading (intentional route change, L2-02).

## Files modified (tests only)
- `frontend/src/pages/products/ProductListPage.test.tsx`
- `frontend/src/pages/products/ProductDetailPage.test.tsx`
- `frontend/src/router/guards.test.tsx`

## Verify (all PASS)
- `pnpm --dir frontend run lint` → exit 0 (0 errors, 2 pre-existing react-refresh warnings in ui/badge + ui/button).
- `pnpm --dir frontend exec tsc --noEmit` → exit 0.
- `pnpm --dir frontend run test` → 14 files, 61 tests passed (was 14/54 with 1 file failing to parse).

## Remaining / notes
- Scope kept to test repair; no feature/code change; no backend/`.context/runs/start-ecommerce-01.md` touched.
- `guards.test.tsx` now triggers a real jsdom XHR to `127.0.0.1:3000` (no MockAdapter attached) because `/`
  renders `ProductListPage`. It is non-fatal (query rejects, heading still asserted) and deterministic, but
  logs ECONNREFUSED noise. Left as-is to stay in scope; candidate for a future cleanup.
- No oxlint config in repo → oxlint gate N/A.
- No commit/push performed.
