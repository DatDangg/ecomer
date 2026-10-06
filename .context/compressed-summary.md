# Compressed Summary — Ecommerce MVP initial build

> Cập nhật: 2026-10-06 · Work item: `feature/ecommerce-mvp` (initial build) · Branch: `staging`

## Trạng thái
- **Spec:** `SPECIFICATIONS.md` v1.0.0 (R-01..R-13), validator PASS (round 2).
- **Config:** `.context/project-config.md` — backend npm + frontend pnpm, `db_tool=other` (Mongoose), `target_branch=staging`, `forbidden_branch=main`, models: builder=deepseek-v4.1-flash / reviewer=gpt-6-luna.
- **Design:** `skills/react-nodejs/design-tokens.md` + `.context/design-spec.md` (22 screens).
- **Plan:** 8 layer / 28 task → `tasks/ecommerce-mvp/`, `docs/diagrams/layer-plan.html`, `.context/progress.json`.

## Đã build (Layer 0 — 6/6 PASS, committed)
| Task | Nội dung | Commit |
|---|---|---|
| 01 | BE bootstrap NestJS (config, health, helmet, CORS, ValidationPipe, throttler, response envelope+filter) | af4a84a |
| 02 | BE DB + API contract (Mongoose, replica-set guard, pagination, base schema, enums, error mapping) | f6de00f |
| 03 | Repo/ops (README, RUNBOOK, env examples, gitignore, Mongo replica-set guide) | febc899 |
| 04 | BE identity (User schema, JWT strategy, guards, decorators, ownership util, admin seed) | ba8a458 |
| 05 | FE scaffold (Vite+React+TS+Tailwind+shadcn+tokens+i18n+shells+guards) | fe7a1b9 |
| 06 | FE data layer (axios race-safe refresh, query client, zustand persist, types, formatter) | 906fe38 |
| — | Layer 0 close-out (doc reconcile) | 3117916 |

Verify: backend 105 tests, frontend 23 tests, lint/typecheck/build PASS.

## Đang ở đâu
- **Layer 0 DONE**, đang chờ **user approve** để unlock **Layer 1** (Auth/User/Shop/Category API).
- Loop signal: spec-validator phase review lặp finding doc-wording guard-order (đã reconcile; không chặn).
- **L1 task-01 prerequisite:** wire `JwtModule`/`PassportModule`/`JwtStrategy` + `JwtAuthGuard` APP_GUARD global.

## Bước kế tiếp
1. User `ok` → `currentLayer=1`, chạy L1: task-01 Auth API → task-02 User/Shop API → task-03 Category API (mỗi task builder→reviewer→commit).
2. Hết L1 → spec-validator phase review → checkpoint.
