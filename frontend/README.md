# Frontend — Chợ Việt

React 18 + Vite + TypeScript (strict) + Tailwind CSS v3 + shadcn/ui, dùng **pnpm**.

## Lệnh

```bash
pnpm install      # cài dependency
pnpm dev          # dev server (http://localhost:5173)
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
pnpm test         # Vitest (run một lần)
pnpm build        # tsc --noEmit + vite build
pnpm preview      # xem bản build
```

## Cấu trúc chính

```
src/
├── main.tsx            # bootstrap + i18n + CSS tokens
├── App.tsx             # RouterProvider
├── index.css           # design tokens (CSS vars) + Tailwind layers
├── router/
│   ├── index.tsx       # route groups: public / account / seller / admin / 404
│   └── guards.tsx      # PrivateRoute, AdminRoute
├── layouts/            # PublicLayout, CustomerLayout, SellerLayout, AdminLayout
├── components/
│   ├── ui/             # shadcn primitives đã token hóa (button, input, card, badge, dialog, sheet)
│   └── shared/         # SiteHeader, SiteFooter, SidebarLayout
├── stores/auth.store.ts  # placeholder session store (task-06 hoàn thiện)
├── lib/                # cn helper, i18n
├── locales/vi.json     # copy tiếng Việt
├── pages/              # PlaceholderPage + NotFoundPage (skeleton)
├── utils/format.ts     # formatVnd / formatNumber (vi-VN)
└── test/setup.ts       # Vitest + Testing Library
```

## Design tokens

Nguồn token: `../skills/react-nodejs/design-tokens.md`.

- Primary `#000000`, canvas `#ffffff`, surface `#f5f5f5`, border `#e5e5e5`.
- Button pill, input radius 8px, group/media radius 12px, hairline 1px.
- Light-only (không dark mode). Semantic color (`success`/`warning`/`error`) chỉ dùng cho status text/icon.
- `font-feature-settings: "ss03"` áp ở `body`; heading dùng `--font-family-heading`.
- Page gutters `.container-page`: 16px (375) / 24px (768) / 32px (1280), max-width 1280px.

## Route skeleton

- Public: `/`, `/products`, `/products/:id`, `/login`, `/register`.
- Account (cần đăng nhập): `/cart`, `/checkout`, `/orders`, `/profile`.
- Seller (cần đăng nhập): `/seller`, `/seller/products`, `/seller/orders`, `/seller/setup`.
- Admin (cần role admin): `/admin`, `/admin/users`, `/admin/products`, `/admin/categories`, `/admin/orders`.
- 404: mọi path không khớp.

Các page hiện là skeleton; màn hình thật nằm ở layer sau. `auth.store.ts` là placeholder để guard
chạy được trong layer 0, sẽ được thay ở task-06 (axios + refresh + persist session).
