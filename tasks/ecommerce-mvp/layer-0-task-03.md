# Task 03: Repo & ops foundation (env examples, README, Mongo replica-set guide)

## Layer
0

## Type
build (initial)

## Description
Dựng nền vận hành cho monorepo: README hướng dẫn chạy BE/FE + verify commands; `.env.example` cho
`backend/` và `frontend/` khớp danh sách secret trong `.context/project-config.md`; cập nhật `.gitignore`
(env, node_modules, dist); hướng dẫn dựng **MongoDB replica set** local (single-node) để transaction chạy.

## Dependencies
- (none — chỉ tạo tài liệu/config, độc lập với task-01/02)

## Acceptance Criteria
- [ ] `README.md` (root) nêu rõ: cài BE `npm install`, FE `pnpm install`, chạy dev, verify commands.
- [ ] `backend/.env.example` liệt kê đủ env: `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PORT`, `FRONTEND_URL`, `CLOUDINARY_*`, `VNPAY_*`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
- [ ] `frontend/.env.example` có `VITE_API_URL`.
- [ ] `.gitignore` chặn `.env`, `node_modules/`, `dist/`, build artifacts.
- [ ] Có hướng dẫn replica set local (mongod `--replSet` + `rs.initiate()`), nêu rằng không có replica set thì transaction fail.
- [ ] Không commit secret thật.

## DoD (Definition of Done)
- [ ] Code/docs written (chỉ trong scope)
- [ ] Tests added + pass: `n/a (docs/config only)`
- [ ] Check commands pass: `skip, no app code changed` (không đụng app code BE/FE)
- [ ] Reviewer độc lập PASS
- [ ] committed

## Verification Plan
- Commands: `skip, no app configured for this task` (docs/config only; verify bằng review thủ công file).
- Manual/UAT evidence: đọc README + so `.env.example` với `project-config.md` § Secrets.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-0-task-03-round-1-review.md`

## Files to Create/Modify
- `README.md` (hoặc `docs/RUNBOOK.md` nếu README gốc là template)
- `backend/.env.example`
- `frontend/.env.example`
- `.gitignore`
- `docs/MONGO_LOCAL_REPLICA_SET.md`

## Notes
- Tuyệt đối không ghi secret thật vào repo (dùng giá trị mẫu/placeholder).
- Danh sách secret canonical lấy từ `.context/project-config.md` § Secrets.
- Task này không phụ thuộc task-01/02 nhưng chạy song song được.
