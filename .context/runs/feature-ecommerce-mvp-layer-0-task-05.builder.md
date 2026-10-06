# Builder Summary — feature/ecommerce-mvp · layer-0-task-05

> Subagent (builder) summary. Primary sở hữu journal chính; file này chỉ để session sau resume nhanh.

```yaml
workItem: feature/ecommerce-mvp
phaseTask: layer-0-task-05
step: builder
status: awaiting
attempt: 1
interrupted: false
updatedAt: 2026-10-06T00:00:00Z
filesNew:
  - frontend/package.json
  - frontend/tsconfig.json
  - frontend/tsconfig.node.json
  - frontend/vite.config.ts
  - frontend/postcss.config.cjs
  - frontend/tailwind.config.ts
  - frontend/eslint.config.js
  - frontend/components.json
  - frontend/index.html
  - frontend/.gitignore
  - frontend/README.md
  - frontend/src/main.tsx
  - frontend/src/App.tsx
  - frontend/src/vite-env.d.ts
  - frontend/src/index.css
  - frontend/src/lib/utils.ts
  - frontend/src/lib/i18n.ts
  - frontend/src/locales/vi.json
  - frontend/src/utils/format.ts
  - frontend/src/stores/auth.store.ts
  - frontend/src/router/index.tsx
  - frontend/src/router/guards.tsx
  - frontend/src/pages/PlaceholderPage.tsx
  - frontend/src/components/shared/SiteHeader.tsx
  - frontend/src/components/shared/SiteFooter.tsx
  - frontend/src/components/shared/SidebarLayout.tsx
  - frontend/src/components/ui/button.tsx
  - frontend/src/components/ui/input.tsx
  - frontend/src/components/ui/card.tsx
  - frontend/src/components/ui/badge.tsx
  - frontend/src/components/ui/dialog.tsx
  - frontend/src/components/ui/sheet.tsx
  - frontend/src/layouts/PublicLayout.tsx
  - frontend/src/layouts/CustomerLayout.tsx
  - frontend/src/layouts/SellerLayout.tsx
  - frontend/src/layouts/AdminLayout.tsx
  - frontend/src/test/setup.ts
  - frontend/src/components/ui/button.test.tsx
  - frontend/src/layouts/PublicLayout.test.tsx
  - frontend/src/utils/format.test.ts
  - frontend/pnpm-lock.yaml (generated)
filesTouched: []
evidence:
  reportPath: .context/review-reports/feature-ecommerce-mvp-layer-0-task-05-round-1-review.md
  round: 1
  verdict: null
next: "Reviewer round 2 — verify 4 MAJOR fixes (mobile login, SellerRoute, fluid headings, public assets) + build/lint/typecheck/test; manual browser render vẫn chưa chạy (browser session disconnected)."
```

## Đã làm

- Scaffold `frontend/` bằng pnpm: Vite 5 + React 18.3 + TS 5.6 strict (`strict`, `noUnusedLocals/Parameters`,
  `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`), scripts `dev/build/lint/preview/test/typecheck`.
  `build = tsc --noEmit && vite build`. Alias `@/*` → `src/*` (tsconfig + vite + vitest).
- Tailwind **v3.4** + `postcss.config.cjs`; `tailwind.config.ts` token-hóa màu/radius/font/shadow + `tailwindcss-animate`.
  `src/index.css`: CSS vars cho toàn bộ design tokens (`--color-primary #000000`, background `#ffffff`,
  surface `#f5f5f5`, border `#e5e5e5`, semantic success/warning/error, focus ring), alias shadcn;
  `font-feature-settings: "ss03"` ở `body`, heading dùng `--font-family-heading`; reduced-motion;
  `.container-page` = gutters 16/24/32px (`px-4 md:px-6 xl:px-8`), max-width 1280. Light-only, không dark mode.
- shadcn config `components.json` + primitives token hóa: `Button` (pill `rounded-full`, min-h-11, variants
  default/outline/ghost/destructive/link), `Input` (min-h-11, radius 8, hairline, focus ring), `Card`/`Badge`
  (radius 12/pill; semantic variants giữ nguyên canvas), `Dialog` + `Sheet` trên `@radix-ui/react-dialog`.
- i18n: `src/lib/i18n.ts` (i18next + react-i18next, chỉ `vi`) + `src/locales/vi.json` (nav/seller/admin/footer).
  Money formatter khung `src/utils/format.ts` (`formatVnd` → `1.234.567 ₫`, `formatNumber`).
- Router skeleton `src/router/index.tsx` (React Router v6) đủ 4 nhóm route + 404; guard shell
  `src/router/guards.tsx` (`PrivateRoute`, `AdminRoute`) đọc placeholder store `src/stores/auth.store.ts`
  (zustand, API `login/logout/setUser` + selector `selectIsAuthenticated/selectIsAdmin`) — task-06 thay bằng
  persist + axios refresh. Page skeleton `PlaceholderPage`/`NotFoundPage`, không fake data/metrics.
- Layout shells: `PublicLayout` (skip-link, header, main `id="main-content"`, footer), `CustomerLayout`
  (thêm account nav), `SellerLayout`/`AdminLayout` qua `SidebarLayout` dùng chung (side nav desktop,
  Sheet menu mobile). Header `SiteHeader`: desktop 1 dòng `h-16`, mobile `h-14` (56px), search mobile mở
  rộng có label, cart/account actions, skip-link. Icon `lucide-react`, không emoji; copy tiếng Việt.

## Verify

- `pnpm --dir frontend install` → PASS (Already up to date).
- `pnpm --dir frontend run lint` → PASS: **0 errors**, 2 warnings `react-refresh/only-export-components`
  (do export `buttonVariants`/`badgeVariants` — chuẩn shadcn, chỉ là warning).
- `pnpm --dir frontend exec tsc --noEmit` → PASS.
- `pnpm --dir frontend run build` → PASS (`dist/index.html` 0.55 kB, CSS 16.38 kB, JS 346.74 kB / gzip 111.71 kB).
- `pnpm --dir frontend test` → PASS: 3 files / 4 tests (Button pill, PublicLayout smoke, formatVnd/formatNumber).
- Dev server smoke: `vite` ready, `GET /` → HTTP 200.

## Round-1 review fix (STRICT, 4 MAJOR)

- **[MAJOR-1] Mobile guest login** — `SiteHeader.tsx` refactor: mobile `Sheet` giờ có thêm mục `Đăng nhập`
  (icon `LogIn`) + `Đăng ký` (icon `UserPlus`) khi guest (authenticated: `Hồ sơ`), `min-h-11`, dùng cùng
  `HeaderNavLink` + đóng sheet khi điều hướng (onNavigate). Desktop giữ nguyên nút `Đăng nhập` ≥sm.
- **[MAJOR-2] Seller role-gate** — thêm `selectCanSell` (seller = **customer** đã đăng nhập, không phải role
  riêng; admin bị chặn) vào `auth.store.ts`; thêm `SellerRoute` trong `router/guards.tsx` (guest→`/login`,
  admin→`/`); `router/index.tsx` tách `/seller/*` sang block `SellerRoute` (không còn nằm chung `PrivateRoute`).
  Backend vẫn là security boundary. Test mới `src/router/guards.test.tsx` (3 case: guest/customer/admin).
- **[MAJOR-3] Fluid headings** — `index.css`: 6 token `--font-size-heading-1..6` dùng `clamp()` (bounds rem,
  middle `vw + rem`), áp riêng cho `h1..h6` với line-height. Bỏ utility `text-3xl md:text-4xl` ở
  `PlaceholderPage`/`NotFoundPage` để token điều khiển. Giá trị: h1 30/35.5/43.2px, h2 24/27.7/32.8,
  h3 20/21.8/24.4, h4 18/18.7/20, h5 16/17.8/18, h6 13/13.9/14 tại 375/768/1280.
- **[MAJOR-4] Public discovery assets** — thêm `frontend/public/{robots.txt,llms.txt,sitemap.xml}` (base URL
  placeholder `REPLACE_AT_DEPLOY`, robots có directive `Sitemap:`); `index.html` thêm canonical + Open Graph
  + Twitter + robots meta. Vite copy sang `dist/` (đã verify). Không bịa metrics/ảnh.
- **[MINOR] Function size** — tách `SiteHeader` thành `SkipLink`/`MobileMenuSheet`/`DesktopPrimaryNav`/
  `SearchForm`/`HeaderActions` + `SiteHeader`; tách `SidebarLayout` thành `SidebarNav`/`SidebarLink`/
  `SidebarMenuSheet`/`SidebarLayout`; thêm shared `components/shared/SkipLink.tsx`. Mọi function ≤50 dòng.
- Fix test isolation: `src/test/setup.ts` thêm `afterEach(cleanup)` (vitest không bật globals nên
  Testing Library auto-cleanup không chạy → DOM tích lũy gây false "multiple elements").

## Round-1 fix verify

- `pnpm --dir frontend run lint` → PASS (0 errors, 2 warning shadcn react-refresh).
- `pnpm --dir frontend exec tsc --noEmit` → PASS.
- `pnpm --dir frontend test` → PASS: **4 files / 7 tests** (thêm 3 test SellerRoute).
- `pnpm --dir frontend run build` → PASS; `dist/` có `robots.txt`, `llms.txt`, `sitemap.xml`; metadata trong
  `dist/index.html`.

## Lưu ý / residual risk

- **Manual browser render 375/768/1280 chưa chạy được**: browser desktop session không kết nối
  (`browser.disconnected`). Đã verify ở mức code (gutter 16/24/32, `min-h-dvh`, `min-w-0` main,
  `overflow-x-auto` chỉ trong account nav, `w-72 max-w-[85vw]` sheet). Reviewer/UAT cần render thật.
- `src/stores/auth.store.ts` là **placeholder** — mọi guard hiện redirect khi chưa có session.
  task-06 sẽ thay (persist + refresh); tránh sửa song song gây conflict.
- `src/utils/format.ts` do task-05 tạo; task-06 nên **import lại**, không tạo formatter trùng.
- Route account dùng `/orders` theo task file (design spec ghi `/orders/my`); layer-6 sẽ chốt route chi tiết.
- `frontend/.env.example` giữ nguyên (`VITE_API_URL`).
- Chưa setup oxlint/anti-slop (repo chưa có `oxlint.config.ts`); lint dùng ESLint 9 flat config.
