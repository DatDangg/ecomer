# project-config.md — Cấu hình dự án (canonical)

> **File này do brainstorm quản lý** (`.agent/brainstorm.md` / lệnh `/brainstorm`) — không điền tay,
> không có lệnh setup riêng. Mọi workflow/subagent **đọc giá trị ở đây**, KHÔNG hardcode trong generic docs.
> Nếu field còn placeholder (`<...>`) hoặc `null` → coi như chưa cấu hình, phải **hỏi user**, không bịa.
>
> 💡 Chạy `/brainstorm` để điền/cập nhật. `/brainstorm <nhóm>` chỉ sửa 1 nhóm (vd `git`, `models`).

## Config

```yaml
project: Ecommerce Team Project
output_language: vi            # vi | en — ngôn ngữ cho docs/summary

# ── Git ──
target_branch: staging         # current branch phải là branch này khi commit/push PASS
forbidden_branch: main         # cấm push trực tiếp (opencode.jsonc hard-deny main/ref main)
branch_pattern: "staging"      # default staging-direct
auto_push_after_pass: false    # chỉ commit local sau PASS, chờ user yêu cầu push

# ── Package / source ──
package_manager: pnpm          # frontend dùng pnpm; backend dùng npm (xem api_* commands)
source_roots: [backend, frontend]   # monorepo 2 project độc lập (backend NestJS/npm, frontend React+Vite/pnpm)

# ── Verify commands (null/placeholder = skip, no app configured) ──
web_typecheck_command: "pnpm --dir frontend exec tsc --noEmit"
web_lint_command: "pnpm --dir frontend run lint"
api_typecheck_command: "npm --prefix backend exec -- tsc --noEmit -p backend/tsconfig.json"
api_lint_command: "npm --prefix backend run lint"
test_command: "npm --prefix backend run test"
install_command: null
lint_command: null          # generic alias if web/api split does not apply
typecheck_command: null     # generic alias if web/api split does not apply
build_command: null         # frontend + backend build riêng; chạy thủ công khi cần
migration_command: null     # only used when db_tool != none and migration_required: true

# ── Database ──
db_tool: other                 # MongoDB + Mongoose ODM (schema-less, không migration versioned)
migration_required: false      # không có migration versioned
staging_db: MONGODB_URI_STAGING   # TÊN ENV VAR (dev/local mặc định dùng MONGODB_URI)
prod_db: MONGODB_URI_PROD         # TÊN ENV VAR; phải khác staging_db
destructive_migration_policy: HIGH_RISK_MIGRATION

# ── Deploy / CI-CD (từ brainstorm; secret nằm ở .env.local) ──
deploy_platform: other         # Vercel (FE) + Render (BE) + MongoDB Atlas M0
ci_cd: skip                    # bài test free tier — không CI/CD

# ── Monitoring ──
monitor_enabled: false         # true | false
otel_service_name: ecommerce-api
otel_env: production
```

### DB / migration

- **`db_tool: other`** (MongoDB + Mongoose) **&** `migration_required: false` → **bỏ qua migration gate** (schema-less).
- Không hardcode Prisma/Drizzle: dùng đúng `db_tool` đã khai (Mongoose).
- `staging_db` phải khác `prod_db`; data độc lập; không sync data staging→prod.
- Cấm `db push`, `migrate reset`, seed/reset, clone data giữa staging/prod.

## Check commands (chạy trước khi báo xong)

> Mọi người (builder/reviewer) PHẢI dùng đúng lệnh đã cấu hình ở đây, filter theo package bị đụng nếu monorepo.
> Nếu command là `null`/placeholder hoặc repo chưa có app code (`source_roots: []`) → ghi `skip, no app configured`.
> KHÔNG tự suy ra `npm test`, `pnpm lint`, Prisma, package name, hay path `apps/` khi chưa cấu hình.
> ✅ Backend/frontend **đã scaffold ở Layer 0** (`backend/` NestJS, `frontend/` Vite/React) — các lệnh verify ở trên đã chạy thực tế từ task layer-0-task-01/05 trở đi.

```yaml
check_commands:
  install: null             # backend npm install / frontend pnpm install (chạy riêng)
  web_typecheck: "pnpm --dir frontend exec tsc --noEmit"
  web_lint: "pnpm --dir frontend run lint"
  api_typecheck: "npm --prefix backend exec -- tsc --noEmit -p backend/tsconfig.json"
  api_lint: "npm --prefix backend run lint"
  test: "npm --prefix backend run test"
  build: null               # npm --prefix backend run build; pnpm --dir frontend build (chạy riêng)
  migration: null           # migration_required=false
  docs_inventory: null
```

## Models per role

> Model KHÔNG đọc từ `.env.local`. Đã copy sang frontmatter của từng file
> `.opencode/agent/*.md` — cần **restart opencode** (config không hot-reload).
> ⚠️ builder (DeepSeek) & reviewer (GPT-6 Luna) cùng provider `opencode-go` nhưng khác model family;
> spec_validator trùng reviewer (theo lựa chọn user).

```yaml
models:
  builder:        opencode-go/deepseek-v4.1-flash
  builder_strong: opencode-go/deepseek-v4.1-flash   # chỉ dùng khi user yêu cầu rõ (§7 gate)
  reviewer:       opencode-go/gpt-6-luna
  spec_validator: opencode-go/gpt-6-luna
  change_request: opencode-go/deepseek-v4.1-flash
```

## UI rules (nếu project có UI)

```yaml
ui:
  responsive_breakpoints: [375, 768, 1280]
  max_file_lines: 300
  max_function_lines: 50
```

## Secrets

```yaml
secrets:
  source: env                    # chỉ đọc từ env; KHÔNG hardcode/commit
  required: [MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, VNPAY_TMN_CODE, VNPAY_HASH_SECRET, VNPAY_URL, VNPAY_RETURN_URL, FRONTEND_URL, ADMIN_EMAIL, ADMIN_PASSWORD]
```
