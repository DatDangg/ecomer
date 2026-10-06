# Builder Summary — feature/ecommerce-mvp · layer-0-task-03

> Subagent (builder) summary. Primary sở hữu journal chính; file này chỉ để session sau resume nhanh.

```yaml
workItem: feature/ecommerce-mvp
phaseTask: layer-0-task-03
step: builder
status: awaiting
attempt: 1
interrupted: false
updatedAt: 2026-10-06T00:00:00Z
filesNew:
  - docs/RUNBOOK.md
  - docs/MONGO_LOCAL_REPLICA_SET.md
  - frontend/.env.example
filesTouched:
  - README.md
  - backend/.env.example
  - .gitignore
evidence:
  reportPath: .context/review-reports/feature-ecommerce-mvp-layer-0-task-03-round-1-review.md
  round: 1
  verdict: null
next: "Reviewer round 1 — đối chiếu env list vs project-config Secrets + git check-ignore + nội dung RUNBOOK/replica-set guide."
```

## Đã làm

- **README (root)**: thêm section `## 🛒 Ecommerce Team Project` ngay sau badge (trước TOC) — bảng monorepo
  (`backend/` npm, `frontend/` pnpm), quickstart cài/chạy dev, verify commands từ `project-config`, link tới
  `docs/RUNBOOK.md` + `docs/MONGO_LOCAL_REPLICA_SET.md`. Thêm mục vào Table of Contents. Giữ nguyên toàn bộ
  nội dung template.
- **`docs/RUNBOOK.md`** (mới): hướng dẫn đầy đủ — cấu trúc monorepo, yêu cầu môi trường, cài/chạy BE (npm)
  và FE (pnpm), Mongo replica set bắt buộc, bảng verify commands, deploy tóm tắt (Vercel + Render + Atlas).
- **`backend/.env.example`**: cập nhật theo danh sách canonical của task + `.context/project-config.md` § Secrets.
  Đủ 13 secret required + `PORT`, `NODE_ENV`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `VNPAY_IPN_URL`; giữ
  `CHECKOUT_EXPIRE_MINUTES` (non-secret, có trong `09-environment-setup.md`). Toàn bộ là placeholder, không secret thật.
- **`frontend/.env.example`** (mới, thư mục `frontend/` chỉ có file này — không scaffold Vite): `VITE_API_URL`
  kèm ghi chú nhúng lúc build / redeploy. task-05 phải giữ file này khi scaffold.
- **`.gitignore`** (root): chặn `.env`, `.env.local`, `.env.*.local`, `node_modules/`, `dist/`, `build/`, `out/`,
  `coverage/`, `*.tsbuildinfo`, logs, OS files; có negation tường minh `!.env.example` / `!.env.*.example`.
- **`docs/MONGO_LOCAL_REPLICA_SET.md`** (mới): `mongod --replSet rs0`, `rs.initiate()`, connection string
  `?replicaSet=rs0`, kiểm tra `rs.status()` / `rs.status().myState`, xác nhận transaction chạy được; nêu rõ
  **không có replica set thì `session.withTransaction` fail** (`Transaction numbers are only allowed...`),
  bảng sự cố thường gặp + reset local.

## Verify (task docs/config only)

- Check commands: `skip, no app code changed` (không đụng `backend/src/`).
- `git check-ignore`:
  - IGNORED: `.env`, `.env.local`, `backend/.env`, `backend/.env.local`, `frontend/.env`,
    `node_modules/`, `backend/node_modules/`, `frontend/node_modules/`, `dist/` (backend+frontend),
    `coverage/`, `backend/coverage/`.
  - NOT-IGNORED (ok): `.env.example`, `.env.local.example`, `backend/.env.example`, `frontend/.env.example`.
- Env list đối chiếu: 13/13 secret trong `project-config.md` § Secrets đều có trong `backend/.env.example`.
- `frontend/.env.example` có `VITE_API_URL`.

## Round-1 fix (reviewer FAIL, STRICT — 1 MAJOR)

- **[MAJOR] Cross-reference conflict với `project-ecommerce/09-environment-setup.md`** (doc cũ nói transaction
  không bắt buộc, mâu thuẫn BR-CHK-010 + `docs/ARCHITECTURE.md` §5/§10). Đã reconcile link + đánh dấu superseded
  (KHÔNG sửa business intent):
  - `README.md`: quickstart trỏ `docs/RUNBOOK.md` §3 cho setup; blockquote cảnh báo rõ **transaction BẮT BUỘC
    replica set** theo BR-CHK-010, nguồn canonical `docs/ARCHITECTURE.md` §5/§10 + `docs/ERD.md`, và note
    `project-ecommerce/09` mục "Lưu ý về MongoDB" đã lỗi thời.
  - `docs/RUNBOOK.md`: header + bước env + §5 đều ghi rõ 09 lỗi thời; §5 thêm BR-CHK-010 + canonical refs.
  - `project-ecommerce/09-environment-setup.md` (historical): thêm **Superseded note** ở đầu file + note ngay
    tại mục "Lưu ý về MongoDB" — chỉ thêm note, không viết lại nội dung.
- Verify: docs-only → `skip, no app code changed`. `grep -n "09-environment-setup" README.md docs/RUNBOOK.md`
  → mọi occurrence đều kèm note (README:30/53, RUNBOOK:4/49/97).

## Lưu ý / residual risk

- **Tên biến JWT**: task-03 yêu cầu `JWT_SECRET` / `JWT_REFRESH_SECRET` / `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL`
  (khớp `project-config.md` Secrets), trong khi `project-ecommerce/09-environment-setup.md` và bản `.env.example`
  cũ (task-01/02) dùng `JWT_ACCESS_SECRET` / `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN`. Đã theo
  **task + project-config** (canonical). Layer auth phải đọc đúng tên mới này; nếu không sẽ cần đồng bộ.
- `backend/src/config/configuration.ts` đọc thêm `MONGODB_SERVER_SELECTION_TIMEOUT_MS` (task-02) nhưng biến này
  **không** nằm trong danh sách task-03 → không thêm vào `.env.example`; có default 5000 nên không chặn.
- `env.validation.ts` hiện chỉ **require `MONGODB_URI`**; các secret khác (JWT/Cloudinary/VNPay) sẽ được enforce
  ở layer tương ứng — `.env.example` đã liệt kê sẵn.
- Chưa verify bằng app runtime (không scaffold/không đụng code) → UAT replica set/transaction thuộc task vận hành sau.
