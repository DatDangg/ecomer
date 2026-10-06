# RUNBOOK — Ecommerce Team Project

> Hướng dẫn cài đặt & chạy dự án. Kiến trúc/stack chi tiết: `docs/ARCHITECTURE.md`.
> Env & credentials: `project-ecommerce/09-environment-setup.md` — ⚠️ doc này **đã lỗi thời** ở mục
> "Lưu ý về MongoDB" (xem mục 5 bên dưới); chỉ dùng nó cho danh sách biến/cách lấy credentials.
> Deploy: `project-ecommerce/10-deployment.md`.

---

## 1. Cấu trúc monorepo

Hai project **độc lập**, không dùng pnpm workspace / `apps/`:

| Thư mục | Stack | Package manager | Ghi chú |
|---------|-------|-----------------|---------|
| `backend/` | NestJS + Mongoose + MongoDB | `npm` | API `/api/v1`, port mặc định `3000` |
| `frontend/` | React 18 + Vite + TypeScript | `pnpm` | Dev server mặc định `5173` (scaffold ở layer 0) |

```
ecom/
├── backend/        # NestJS API (npm)
├── frontend/       # React + Vite (pnpm)
├── docs/           # tài liệu canonical
└── project-ecommerce/  # spec nghiệp vụ chi tiết
```

---

## 2. Yêu cầu môi trường

| Công cụ | Version tối thiểu | Ghi chú |
|---------|-------------------|---------|
| Node.js | >= 20.x (LTS) | |
| npm | >= 10.x | Đi kèm Node |
| pnpm | >= 8.x | Chỉ cho `frontend/` (`corepack enable`) |
| MongoDB | >= 7.x (replica set) | **Bắt buộc replica set** để transaction chạy — xem mục 5 |
| Git | >= 2.x | |

---

## 3. Backend (`backend/`, npm)

```bash
# 1. Cài dependencies
npm --prefix backend install

# 2. Tạo file env từ mẫu rồi điền giá trị thật
cp backend/.env.example backend/.env
#    (danh sách biến + cách lấy credentials: project-ecommerce/09-environment-setup.md — bỏ qua mục "Lưu ý về MongoDB")

# 3. Chạy dev (hot reload)
npm --prefix backend run start:dev
# → API: http://localhost:3000/api/v1

# Chạy production build
npm --prefix backend run build
npm --prefix backend run start:prod
```

Kiểm tra nhanh API:

```bash
curl http://localhost:3000/api/v1/categories
# Kỳ vọng: {"success":true,"data":[]}
```

---

## 4. Frontend (`frontend/`, pnpm)

```bash
# 1. Cài dependencies
pnpm --dir frontend install

# 2. Tạo file env từ mẫu (VITE_API_URL → backend)
cp frontend/.env.example frontend/.env

# 3. Chạy dev
pnpm --dir frontend run dev
# → http://localhost:5173

# Build production
pnpm --dir frontend build
```

> ⚠️ `VITE_API_URL` được nhúng **lúc build** → đổi giá trị phải build/redeploy lại.
> Scaffold frontend nằm ở layer 0 (task-05); trước đó thư mục chỉ có `.env.example`.

---

## 5. MongoDB — replica set bắt buộc

Transaction checkout (`session.withTransaction`) **chỉ chạy khi MongoDB là replica set**.
Standalone sẽ fail với `Transaction numbers are only allowed on a replica set member or mongos`.

> 🔴 **BẮT BUỘC** theo **BR-CHK-010** — nguồn canonical: `docs/ARCHITECTURE.md` §5 (Data Architecture) và
> §10 (Known Constraints), `docs/ERD.md`. ⚠️ `project-ecommerce/09-environment-setup.md` mục "Lưu ý về
> MongoDB" (nói transaction không bắt buộc) **đã lỗi thời** và bị supersede bởi BR-CHK-010.

- **Atlas M0 (khuyến nghị):** cluster free đã là replica set → điền connection string vào `MONGODB_URI`.
- **Local:** dựng single-node replica set theo [`docs/MONGO_LOCAL_REPLICA_SET.md`](MONGO_LOCAL_REPLICA_SET.md).

Connection string local đúng chuẩn:

```env
MONGODB_URI=mongodb://localhost:27017/ecommerce?replicaSet=rs0
```

---

## 6. Verify commands

> Nguồn canonical: `.context/project-config.md` § Check commands. Chạy đúng lệnh, không tự suy diễn.
> Khi chỉ sửa docs/config (không đụng app code) → ghi `skip, no app code changed`.

```bash
# Backend
npm --prefix backend run lint
npm --prefix backend exec -- tsc --noEmit -p backend/tsconfig.json
npm --prefix backend run test

# Frontend
pnpm --dir frontend run lint
pnpm --dir frontend exec tsc --noEmit
```

| Mục | Command |
|-----|---------|
| API lint | `npm --prefix backend run lint` |
| API typecheck | `npm --prefix backend exec -- tsc --noEmit -p backend/tsconfig.json` |
| API test | `npm --prefix backend run test` |
| Web lint | `pnpm --dir frontend run lint` |
| Web typecheck | `pnpm --dir frontend exec tsc --noEmit` |
| Build | `npm --prefix backend run build` · `pnpm --dir frontend build` (chạy thủ công) |

---

## 7. Deploy (tóm tắt)

Vercel (FE) + Render (BE) + MongoDB Atlas M0 — không CI/CD, không Docker.
Chi tiết từng bước: `project-ecommerce/10-deployment.md`.

- Render build: `npm install --include=dev && npm run build`; start: `npm run start:prod`; root `backend`.
- Vercel: root `frontend`, build `pnpm build`, output `dist`; cần `frontend/vercel.json` rewrites cho SPA routing.
- Cập nhật URL chéo: `FRONTEND_URL` (Render) ↔ `VITE_API_URL` (Vercel) ↔ `VNPAY_RETURN_URL`/`VNPAY_IPN_URL`.
