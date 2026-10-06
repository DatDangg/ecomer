# Builder Run Summary — feature/ecommerce-mvp · layer-1-task-02

> Subagent builder summary (primary writes the canonical Run Journal). Resume hint only.

```yaml
workItem: feature/ecommerce-mvp
phaseTask: layer-1-task-02
step: builder
status: awaiting_review
updatedAt: 2026-10-06T15:00:00Z
```

## Đã làm gì

- `GET /users/me`, `PATCH /users/me`, `PATCH /users/me/shop` (self, token-scoped).
- `GET /shops/:sellerId` public (`@Public()`), 404 khi id sai / user không tồn tại / chưa có `shopName` / bị ban.
- `productCount` đếm qua `@InjectConnection().collection('products')` filter `{ sellerId, isActive: true, isBlocked: false }` (không phụ thuộc Product module Layer 2).
- Mass assignment: DTO chỉ khai báo field cho phép; global `ValidationPipe({whitelist, forbidNonWhitelisted})` chặn `role/isActive/email` → 400. Service còn lọc defense-in-depth (`pickProfileFields`).
- `shopName` validate 3–50 (`@MinLength/@MaxLength`); `pickupAddress` bắt buộc (BR-USR-002).
- Thêm typed `createdAt/updatedAt` vào `user.schema.ts` (type-only, không `@Prop`) để dùng `joinedAt`.

## Vì sao

- Tách `ShopsService` (model users + connection) khỏi `UsersService` để không phải đổi constructor `UsersService` → không phá `users.service.spec.ts` cũ (surgical).
- `updateProfile` trả document hiện tại khi PATCH rỗng, tránh lỗi Mongo empty `$set`.

## Files

New: `dto/update-profile.dto.ts`, `dto/update-shop.dto.ts`, `shops.service.ts`, `users.controller.ts`,
`shops.controller.ts`, `users.service.profile.spec.ts`, `shops.service.spec.ts`, `users.integration.spec.ts`.
Modified: `users.service.ts`, `users.module.ts`, `user.schema.ts`.

## Kết quả verify

- `npm --prefix backend exec -- tsc --noEmit -p backend/tsconfig.json` → PASS
- `npm --prefix backend run lint` → PASS
- `npm --prefix backend run test` → 27 suites / 156 tests PASS

## Còn dở / handoff

- Chưa commit (primary commit sau reviewer PASS).
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-1-task-02-round-1-review.md`.
- Không đụng module auth, không làm task khác.
