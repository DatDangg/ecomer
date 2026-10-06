# Architecture

> **Nguồn:** `project-ecommerce/01-project-overview.md`, `05-database-erd.md`, `07-tech-conventions.md`, `10-deployment.md` + `PRODUCT_BACKLOG_ROADMAP.md`.
> **Loại tài liệu:** as-built (current-state). Khi code khác file này → **code thắng**, cập nhật lại.
> Liên quan: `docs/API_SPEC.md`, `docs/ERD.md`, `docs/PERMISSION.md`, `docs/USER_FLOW.md`.

---

## 1. System Context

```
┌──────────────────────────────┐
│   Browser (Vercel, static)   │
│   React 18 + Vite + TS       │
│   Guest / Customer / Seller  │
│   Admin UI                   │
└──────────────┬───────────────┘
               │ REST JSON /api/v1  (Bearer JWT)
┌──────────────▼───────────────┐
│   Backend (Render, NestJS)   │
│   Auth · Users/Shops         │
│   Categories · Products      │
│   Cart · Orders/Checkout     │
│   Payments · Upload · Admin  │
└──────┬───────────────┬───────┘
       │ Mongoose      │ SDK / HTTP
┌──────▼──────┐  ┌─────▼────────┐  ┌──────────────┐
│  MongoDB    │  │  Cloudinary  │  │ VNPay sandbox │
│ (Atlas M0,  │  │  (image CDN) │  │ Return + IPN  │
│  replica set)│ └──────────────┘  └──────────────┘
└─────────────┘
```

- **Một chiều phụ thuộc:** FE → BE → (Mongo, Cloudinary, VNPay). VNPay gọi ngược BE qua **Return** (browser redirect) và **IPN** (server-to-server, GET).
- **Không có** WebSocket/realtime, message queue, cache layer, hay service ngoài khác (đúng scope MVP).

---

## 2. Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Frontend | React 18 + Vite, TypeScript strict, Tailwind CSS + shadcn/ui, React Router v6, Zustand (auth/cart), TanStack Query, Axios, Formik + Yup, i18next (vi), Lucide, react-toastify |
| Backend | NestJS, Mongoose ODM, Passport JWT, class-validator/transformer, `@nestjs/schedule` (cron), Cloudinary SDK, multer, helmet, `@nestjs/throttler` |
| Database | MongoDB >= 7.x — **replica set bắt buộc** để dùng transaction |
| Auth | JWT access (15m) + refresh (7d) |
| Payment | VNPay sandbox (HMAC-SHA512) |
| Storage | Cloudinary (ảnh SP/category) |
| Deploy | Vercel (FE) + Render (BE) + MongoDB Atlas (M0) |
| Test | Jest (unit) + Playwright (E2E) |

---

## 3. Repository Structure (monorepo)

```
ecommerce-team/
├── backend/          # NestJS API (npm)
├── frontend/         # React 18 + Vite (pnpm)
├── docs/             # tài liệu canonical
├── .specify/         # đặc tả feature (baseline.md)
└── SPECIFICATIONS.md
```

> Hai project **độc lập**, không dùng pnpm workspace / `apps/`.

### 3.1 Backend — module layout

```
backend/src/
├── main.ts                 # bootstrap, CORS, global pipe/filter/interceptor
├── app.module.ts
├── common/
│   ├── decorators/         # @CurrentUser, @Roles
│   ├── guards/             # JwtAuthGuard, OptionalJwtAuthGuard, RolesGuard
│   ├── filters/            # GlobalExceptionFilter
│   ├── interceptors/       # ResponseInterceptor (wrap {success,data,message})
│   ├── pipes/              # ValidationPipe
│   └── utils/              # slug generator, assertOwnerOrAdmin, code generator
├── config/                 # database / jwt / cloudinary config
└── modules/
    ├── auth/               # register/login/refresh/logout + strategies
    ├── users/              # /users/me, /users/me/shop + user schema
    ├── shops/              # GET /shops/:sellerId (dùng UsersService + ProductsService)
    ├── categories/         # CRUD + validate no-delete
    ├── products/           # CRUD, search/filter, ownership
    ├── cart/               # cart CRUD, group by seller
    ├── orders/             # checkout, order, state machine, checkout-expiry.task (@Cron)
    ├── payments/           # VNPay service, IPN/Return, payment schema
    ├── upload/             # Cloudinary
    └── admin/              # user ban/unban, product block/unblock
```

**Nguyên tắc:** service không import trực tiếp schema của module khác — dùng qua service của module đó.

### 3.2 Frontend — route/feature layout

```
frontend/src/
├── App.tsx / main.tsx
├── components/ui + shared
├── hooks/ lib/ stores/ (auth.store, cart.store)
├── services/ (auth, product, cart, order, user, shop).service.ts
├── pages/
│   ├── auth/ (Login, Register)
│   ├── products/ (List, Detail)
│   ├── cart/ · checkout/ (Checkout, result pages)
│   ├── orders/ (history) · shop/ · profile/
│   ├── seller/ (ShopSetup, MyProducts, ProductForm, SellerOrders)
│   └── admin/ (Dashboard, Products, Categories, Orders, Users)
├── routes/ (PrivateRoute, AdminRoute, index)
├── types/ · locales/
└── .env.example
```

---

## 4. Request Lifecycle (backend)

```
HTTP request
  → CORS (chỉ FRONTEND_URL)
  → Global ValidationPipe { whitelist, forbidNonWhitelisted, transform }   # chống mass assignment
  → Guard chain (định nghĩa từ L0; wire route-level dần ở L1+):
        ThrottlerGuard (APP_GUARD toàn cục — đã wire; 100 req/phút mặc định, /auth/* siết qua @Throttle)
        OptionalJwtAuthGuard | JwtAuthGuard (áp dụng per-route khi route thêm)
          └─ JwtStrategy.validate: verify token + đọc isActive từ DB (ban hiệu lực ngay)
        RolesGuard (@Roles(admin))
        ownership check ở service: assertOwnerOrAdmin()
  → Controller → Service (business logic, transaction) → Mongoose
  → ResponseInterceptor: bọc { success, data, message }
  → GlobalExceptionFilter: bọc { success: false, message, errors }
```

Guard order + ma trận quyền: `docs/PERMISSION.md`.

---

## 5. Data Architecture

- **Collections:** `users`, `categories`, `products`, `carts`, `checkouts`, `orders` (embedded `items`), `payments`. Chi tiết `docs/ERD.md`.
- **Một user hai vai:** `orders.userId` (mua) và `products.sellerId` / `orders.sellerId` (bán).
- **Snapshot** giá/tên/ảnh/recipient/`sellerShopName` trong Order để SP thay đổi không ảnh hưởng đơn cũ.
- **Hiển thị SP công khai:** `isActive = true && isBlocked = false` (2 cờ tách biệt).
- **Transaction:** `createCheckout` (trừ stock + Checkout + N Order) và `restockAndCancel` (hủy + hoàn stock) chạy trong `session.withTransaction` — all-or-nothing. Không gọi dịch vụ ngoài bên trong transaction (tạo URL VNPay sau commit).
- **Atomic stock:** `findOneAndUpdate({ _id, stock: { $gte: qty }, isActive: true, isBlocked: false }, { $inc: { stock: -qty } })`.
- **Idempotency:** chuyển trạng thái Checkout bằng `findOneAndUpdate({ _id, status: 'pending' }, ...)` dùng chung IPN/Return/cron.

---

## 6. External Integrations

### 6.1 Cloudinary
- `POST /upload/image` (login) → trả URL; SP gửi mảng `images[]` (≤5).
- Chỉ nhận URL thuộc `https://res.cloudinary.com/<CLOUDINARY_CLOUD_NAME>/` (BR-PRD-012).
- Tách rời khỏi transaction checkout.

### 6.2 VNPay
- Tạo URL thanh toán **sau** khi checkout commit: `vnp_TxnRef = checkoutCode`, `vnp_Amount = totalAmount × 100`, `vnp_ExpireDate = expiresAt` (GMT+7).
- `GET /payments/vnpay/return` (browser redirect) và `GET /payments/vnpay/ipn` (server-to-server) → verify HMAC-SHA512 + số tiền → **cùng một hàm xử lý idempotent**.
- Return redirect FE `/checkout/result?checkoutCode=...&status=...`; FE không tin query, gọi `GET /checkouts/:checkoutCode`.
- Mọi callback (kể cả sai chữ ký) lưu `payments` để audit.

---

## 7. Cross-cutting Concerns

| Concern | Cách làm |
|---------|----------|
| Response contract | `ok()`/`fail()` + `ResponseInterceptor` + `GlobalExceptionFilter` — không viết tay `res.json()` |
| Validation | DTO `class-validator` + `ValidationPipe` whitelist/forbidNonWhitelisted toàn cục |
| Auth | JWT access/refresh; refresh lưu SHA-256; ban kiểm tra mỗi request |
| Ownership/BOLA | `assertOwnerOrAdmin()`; ghi sai chủ → 403, đọc "của tôi" của người khác → 404 |
| Rate limit | `@nestjs/throttler` cho `/auth/*` (10 req/phút/IP) |
| Security headers | `helmet()` |
| Pagination | `limit` tối đa 100 |
| Config/secrets | `.env` (không commit); `.env.example` commit |
| Scheduled job | `checkout-expiry.task.ts` — `@Cron` mỗi phút |

---

## 8. Key Design Decisions

| # | Quyết định | Lý do |
|---|-----------|-------|
| D1 | **Không có role `seller`** — bán xác định bằng quyền sở hữu `sellerId` | Đơn giản hoá; một tài khoản hai vai (BR-AUTH-006) |
| D2 | **1 Checkout + N Order** (mỗi seller 1 Order), 1 giao dịch VNPay | Tách xử lý giao hàng theo shop nhưng thanh toán 1 lần (BR-CHK-001/004) |
| D3 | **Trừ stock ngay khi tạo Order** (reserve) + rollback khi fail/expire | Chống bán lố; trạng thái rõ ràng (BR-ORD-003/004) |
| D4 | **MongoDB transaction** cho checkout/rollback | Toàn vẹn dữ liệu all-or-nothing (BR-CHK-010) |
| D5 | **Idempotent callback** dùng chung IPN/Return/cron | Xử lý trùng/cùng lúc an toàn (BR-PAY-006/011) |
| D6 | **Snapshot trong Order** | SP/shop đổi không ảnh hưởng đơn cũ (BR-SELL-006) |
| D7 | **Không Guest cart/checkout** | Giảm phức tạp merge; chỉ user đăng nhập mua (BR-AUTH-012) |
| D8 | **Deploy đơn giản** (Vercel + Render + Atlas, không CI/CD/Docker) | Deadline 1 tuần, bài test |

---

## 9. Deployment Topology

```
Browser → Vercel (FE static, vercel.json SPA rewrite)
        → Render Web Service (BE NestJS, nghe process.env.PORT trên 0.0.0.0)
        → MongoDB Atlas M0 (replica set)
VNPay → Return/IPN URL public của Render
```

- BE build: `npm install --include=dev && npm run build`; start: `npm run start:prod`.
- FE: `VITE_API_URL` nhúng lúc build → đổi phải redeploy.
- Giới hạn: Render free ngủ ~15 phút; cron bắt kịp khi thức. Chi tiết: `project-ecommerce/10-deployment.md`.

---

## 10. Known Constraints & Risks

- MongoDB phải là replica set (Atlas M0 hoặc single-node local) cho transaction.
- `09-environment-setup.md` có đoạn nói "không bắt buộc transaction" — **trái** với BR-CHK-010/05/10; đang áp dụng transaction.
- VNPay chạy localhost không nhận IPN → dựa vào Return hoặc ngrok.
- Repo **đã có app code nền (Layer 0)**: `backend/` (NestJS bootstrap, Mongoose connection + replica-set guard, response contract, user/JWT foundation, admin seed) và `frontend/` (Vite + React + Tailwind + shadcn/ui, tokens, layout shells, axios data layer). Các module nghiệp vụ (auth endpoints, product, cart, order, payment, admin) đang được build ở Layer 1+. `docs/generated/inventory.md` vẫn có thể hiển thị 0 file vì `docs_inventory` command chưa cấu hình — chạy lại khi cần.

---

## 11. Pointers

| Nội dung | File |
|----------|------|
| API contract | `docs/API_SPEC.md` · `project-ecommerce/06-api-contract.md` |
| Data model | `docs/ERD.md` · `project-ecommerce/05-database-erd.md` |
| Quyền/guard | `docs/PERMISSION.md` |
| Luồng người dùng | `docs/USER_FLOW.md` |
| Cấu trúc folder/naming | `project-ecommerce/07-tech-conventions.md` |
| Env & credentials | `project-ecommerce/09-environment-setup.md` |
| Deploy | `project-ecommerce/10-deployment.md` |
