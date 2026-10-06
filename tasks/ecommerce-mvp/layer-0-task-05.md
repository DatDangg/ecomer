# Task 05: Frontend scaffold (Vite + React + TS + Tailwind + shadcn/ui + design tokens + i18n + shells)

## Layer
0

## Type
build (initial)

## Description
Scaffold project `frontend/` (React 18 + Vite + TypeScript strict, package manager **pnpm**) với Tailwind CSS
+ shadcn/ui đã customize theo design tokens; i18next (chỉ tiếng Việt); React Router v6 route skeleton;
layout shells dùng chung: Public/Customer header, Seller shell (side nav), Admin shell (side nav);
`lucide-react` cho icon; responsive breakpoints 375/768/1280. Tham chiếu
`.context/design-spec.md` (Screen Inventory + Shared Application Shell) và `skills/react-nodejs/design-tokens.md`.

## Dependencies
- (none — task nền của toàn bộ frontend)

## Acceptance Criteria
- [ ] `pnpm --dir frontend install` + `pnpm --dir frontend build` chạy được.
- [ ] Tokens áp dụng đúng: primary `#000000`, canvas trắng + surface `#f5f5f5`, pill button, 8px form/12px group radius, hairline 1px; không dark-mode.
- [ ] Typography token + `font-feature-settings: "ss03"` ở root; VNĐ format helper khung.
- [ ] Router skeleton có route group public / account / seller / admin; guard shell chỗ chờ auth store.
- [ ] Header desktop 1 dòng; mobile 56px + menu accessible; page gutters 16/24/32 ở 375/768/1280.
- [ ] Copy UI tiếng Việt; icon Lucide, không emoji.
- [ ] `web_lint` + `web_typecheck` PASS.

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass (build + smoke render)
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS
- [ ] committed

## Verification Plan
- Commands:
  - `pnpm --dir frontend run lint` (web_lint)
  - `pnpm --dir frontend exec tsc --noEmit` (web_typecheck)
  - `pnpm --dir frontend run build` (build thủ công)
- Manual/UAT evidence: chạy dev server, xem 3 layout shell ở 375/768/1280 không tràn ngang.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-0-task-05-round-1-review.md`

## Files to Create/Modify
- `frontend/package.json`, `frontend/vite.config.ts`, `frontend/tsconfig*.json`
- `frontend/tailwind.config.ts`, `frontend/postcss.config.*`
- `frontend/src/index.css` (design token CSS vars)
- `frontend/components.json` (shadcn config)
- `frontend/src/lib/i18n.ts`, `frontend/src/lib/utils.ts`
- `frontend/src/router/index.tsx`
- `frontend/src/layouts/PublicLayout.tsx`, `CustomerLayout.tsx`, `SellerLayout.tsx`, `AdminLayout.tsx`
- `frontend/src/components/ui/*` (shadcn primitives đã chỉnh token)

## Notes
- Tham chiếu Screen specs #1-#22 trong `.context/design-spec.md` cho shell/nav.
- Chỉ light theme; semantic colors chỉ cho status text/icon.
- Không tạo fake data/metrics; skeleton giữ đúng geometry.
- FE task trong Layer 6 dựa trên shells này.
