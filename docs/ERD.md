# ERD — Overview & Pointers

> ⚠️ **Không nhúng schema tay ở đây** — sẽ lệch với migration/schema thật.
> File này là **overview + pointer** tới source of truth.

## Source of truth

1. **Schema files** — NestJS Mongoose schemas trong `src/modules/**/schemas/` (`*.schema.ts`) — xem `source_roots` / `.context/project-config.md`.
   _Layer 0 có nền `backend/` (Mongoose connection) + `User` schema; các schema nghiệp vụ (product, cart, checkout, order, payment) build ở Layer 2+._
2. **Contract chi tiết** — `project-ecommerce/05-database-erd.md` (schema đầy đủ, index, quy ước cập nhật stock).
3. **Generated inventory** — `docs/generated/` (chạy lại, không sửa tay).

> Nếu overview này khác schema/migration → **schema thắng**.

## Database

**Type:** MongoDB (>= 7.x, **replica set bắt buộc** để dùng transaction — Atlas M0 hoặc single-node local)
**ORM:** Mongoose ODM
**Migration:** không dùng migration versioned (schema-less); thay đổi schema qua seed/index trong code.

## Entity overview

| Entity (collection) | Mục đích | Quan hệ chính |
|---------------------|----------|---------------|
| `users` | Tài khoản — đóng **hai vai** mua & bán (có `shopName`/`pickupAddress`) | 1–1 `carts`; 1–n `products` (sellerId); 1–n `orders` (userId); 1–n `orders` (sellerId); 1–n `checkouts` |
| `categories` | Danh mục SP dùng chung toàn sàn | 1–n `products` |
| `products` | SP vật lý thuộc 1 người bán (`sellerId` bất biến) | belongs to `users` (seller); belongs to `categories`; được snapshot vào `orders.items` |
| `carts` | Giỏ hàng của user đăng nhập (1 user 1 cart) | belongs to `users`; items ref `products` |
| `checkouts` | 1 lần bấm "Đặt hàng" = 1 giao dịch VNPay; gom N order | belongs to `users`; 1–n `orders`; 1–n `payments` |
| `orders` | Mỗi `orders` thuộc **đúng 1 người bán**; `items` embedded (snapshot) | belongs to `checkouts`, `users` (buyer), `users` (seller) |
| `payments` | Raw log callback VNPay (kể cả sai chữ ký / thanh toán muộn) | belongs to `checkouts` (nullable nếu không tìm thấy TxnRef) |

## Relationships

```
users ───── 1–1 ───── carts
  │
  ├── 1–n ── products         (products.sellerId)     ← người bán sở hữu SP
  ├── 1–n ── checkouts        (checkouts.userId)      ← người mua
  ├── 1–n ── orders           (orders.userId)         ← người mua
  └── 1–n ── orders           (orders.sellerId)       ← người bán

checkouts ── 1–n ── orders        (orders.checkoutId)
checkouts ── 1–n ── payments      (payments.checkoutId)
categories ── 1–n ── products     (products.categoryId)
products ·····> orders.items      (snapshot giá/tên/ảnh, không ref thuần)
```

## Notes (business rules dữ liệu)

- **Soft delete / ẩn SP** dùng cặp cờ `isActive` (Seller ẩn/hiện) và `isBlocked` (Admin/seller-banned). SP hiển thị công khai **khi và chỉ khi** `isActive = true` **và** `isBlocked = false`. Không xóa document thật.
- **Không xóa Order** — chỉ đổi trạng thái (BR-ORD-005). `delivered`/`refunded` là trạng thái cuối.
- **Snapshot**: `orders.items` (tên/giá/ảnh), `orders.recipient`, `checkouts.recipient`, `orders.sellerShopName` — để seller sửa SP/đổi tên shop không ảnh hưởng đơn cũ (BR-SELL-006, BR-CHK-006).
- **`orders` tách theo người bán**: 1 `checkout` ↔ N `orders`; trạng thái giao hàng mỗi order độc lập (BR-ORD-009). Thanh toán gắn ở cấp `checkout`; `paymentStatus` lặp lại ở cấp order.
- **Không có Guest cart**: `carts` chỉ tồn tại cho user đăng nhập; `checkouts.userId` / `orders.userId` không còn `null` (bỏ Guest checkout — BR-AUTH-012). _Một số doc cũ trong `project-ecommerce/` vẫn ghi `userId = null` cho Guest._
- **`sellerId` bất biến** trên product (BR-PRD-010).
- **Atomic stock**: trừ stock bằng `updateOne({ _id, stock: { $gte: qty }, isActive: true, isBlocked: false }, { $inc: { stock: -qty } })`; hoàn stock chỉ khi order vừa chuyển `cancelled` thành công (BR-ORD-010). `createCheckout` + `restockAndCancel` chạy trong `session.withTransaction` (BR-CHK-010).
- **Idempotent checkout status**: `findOneAndUpdate({ _id, status: 'pending' }, ...)` dùng chung cho IPN / Return / cron (BR-PAY-011).
- **Ban seller**: `updateMany({ sellerId, isBlocked: false }, { isBlocked: true, blockReason: 'seller_banned' })` — **không ghi đè** lý do block có sẵn của Admin (BR-SELL-004).
- **Index** (lý do; định nghĩa nằm ở schema files):
  - `users.email` unique; `users.role`.
  - `categories.slug` unique; `products.slug` unique.
  - `products.sellerId`, `products.categoryId`, `products.name` (text), `products.price`, compound `{ isActive, isBlocked }` (lọc SP hiển thị).
  - `checkouts.checkoutCode` unique; `checkouts.userId`; compound `{ status, expiresAt }` (job expire).
  - `orders.orderCode` unique; `orders.checkoutId`; `orders.userId`; `orders.sellerId`; `orders.status`; `orders.createdAt`; compound `{ sellerId, createdAt }` và `{ userId, createdAt }` (sort mới nhất).

## Pointer chi tiết

| Nội dung | File |
|----------|------|
| Schema đầy đủ (mọi field, enum) | `project-ecommerce/05-database-erd.md` |
| Business rules dữ liệu (BR-XXX) | `project-ecommerce/03-requirements.md` |
| Enum trạng thái | `project-ecommerce/07-tech-conventions.md` |
| Quy ước MongoDB/transaction & env | `project-ecommerce/09-environment-setup.md`, `10-deployment.md` |
