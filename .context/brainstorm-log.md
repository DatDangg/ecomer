# Brainstorm Log — Ecommerce Team Project

> Full Q&A log từ `/brainstorm` (Phase 0 scan → Phase 0.5 config → Phase 1–3). Ngày: 2026-10-06.

## Phase 0 — Scan (không hỏi)

- `node scripts/detect-profile.mjs` → `has_app: false`, không có `package.json`, `source_roots: []`, `db_tool: none`.
- Docs canonical đã có: `docs/BRD.md`, `PRD.md`, `ARCHITECTURE.md`, `API_SPEC.md`, `ERD.md`, `PERMISSION.md`, `USER_FLOW.md`, `DESIGN.md`; nguồn `project-ecommerce/01..10`; `PRODUCT_BACKLOG_ROADMAP.md`; `BRIEF.md`.
- `SPECIFICATIONS.md` là stub rỗng → đã dựng docs-first ở bước 1 (R-01..R-13) + spec-validator PASS round 2.
- `docs/generated/inventory.md` = 0 file → repo **chưa có app code**.

## Phase 0.5 — Project Config (Q&A với user)

| Nhóm | User chốt |
|------|-----------|
| 1. Git & branch | `target_branch=staging` (tạo mới), `forbidden_branch=main`, `auto_push_after_pass=false` |
| 2. Stack & source | backend npm + frontend pnpm; `source_roots=[backend, frontend]` |
| 3. Verify commands | api: npm (lint/test/tsc), web: pnpm (lint/tsc) — xem `project-config.md` |
| 4. Database | `db_tool=other` (MongoDB + Mongoose), `migration_required=false` |
| 5. Models | builder/builder_strong/change_request=`opencode-go/deepseek-v4.1-flash`; reviewer/spec_validator=`opencode-go/gpt-6-luna` (user tự chọn) |
| 6. Deploy & CI-CD | Vercel (FE) + Render (BE) + Atlas M0; `ci_cd=skip` |
| 7. Monitoring & UI | monitoring off; UI breakpoints 375/768/1280; max 300 dòng/file, 50 dòng/function |

**Cảnh báo models:** builder (DeepSeek) và reviewer (GPT-6 Luna) cùng provider `opencode-go` nhưng khác model family; `spec_validator` trùng reviewer. User đã xác nhận giữ nguyên.

## Phase 1 — Clear yêu cầu (từ docs, KHÔNG hỏi lại)

- Stack: Web (React + NestJS). DB: MongoDB. Auth: JWT (access+refresh). Realtime: **None**.
- File Upload: Cloudinary. Payment: VNPay sandbox. Timeline: MVP 1 tuần. UI: shadcn/ui.
- Scalability Option: **off** (bài test, không cần).

## Phase 2 — Clarification (scope/conflict/ambiguity)

- Scope assessment: nhiều subsystem nhưng đã có roadmap chia Sprint 0→3 → **không tách thành nhiều project**.
- Conflicts đã biết (BRD § Open Questions) → user chốt theo spec hiện tại:
  1. Không Guest cart/checkout/merge (BR-AUTH-012).
  2. Admin `POST /products` → 403 (BR-AUTH-011).
  3. Transaction/replica set **bắt buộc** (BR-CHK-010).
  4. Response wrapper `{success,data,message}` / `{success,message,errors}`.
  5. Status Sprint 1 roadmap `[x]` chưa verify được vì chưa có source → sẽ xác nhận khi scaffold.

## Phase 3 — Summary + Design Doc

- Summary: xem `docs/specs/2026-10-06-ecommerce-mvp-design.md`.
- Trạng thái: chờ user approve design (HARD-GATE) trước khi chia layer/code.

## Ghi chú verify commands

- Backend/frontend **chưa scaffold**; các command verify là đích đến → sẽ chạy thật ở layer 0 (scaffold).
- `install_command`/`build_command` để `null` vì 2 project cài/build riêng (có `&&` → không auto-allow).
