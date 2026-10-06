# Run Journal — start/ecommerce · initial-build

> Artifact trạng thái để **resume cross-session**. **Primary ghi file này; subagent KHÔNG ghi.**

```yaml
workItem: feature/ecommerce-mvp
phaseTask: layer-2-task-01
step: builder
status: running
interrupted: false
updatedAt: 2026-10-06T21:15:00+07:00
attempt: 0
batch: "run-through to basic flow (user approved): L1-03 ✅ → L1-04 ✅ → L1-05 ✅ → phase-review PASS ✅ → L2-01 → L2-02 → L3-01"
filesTouched:
  - backend/src/app.module.ts
  - backend/src/health/health.controller.ts
  - backend/test/setup-test-env.ts
filesNew:
  - backend/src/modules/auth/auth.controller.ts
  - backend/src/modules/auth/auth.service.ts
  - backend/src/modules/auth/auth.module.ts
  - backend/src/modules/auth/auth.service.spec.ts
  - backend/src/modules/auth/auth.integration.spec.ts
  - backend/src/modules/auth/auth-throttle.spec.ts
  - backend/src/modules/auth/dto/register.dto.ts
  - backend/src/modules/auth/dto/login.dto.ts
  - backend/src/modules/auth/dto/refresh.dto.ts
evidence:
  replan: "Plan gọn 3 layer materialized: L1-04 (Product schema+seed+public browse) MỚI; L2-01/02 (FE auth, FE product) MỚI; L3-01 (smoke test) MỚI; 19 task cũ deferred → tasks/ecommerce-mvp/archive/; progress.json totalLayers=3/currentLayer=1/completedTasks + layer-1/task-01; layer-plan.html cập nhật (archify unavailable → best-effort)."
  lastTask: "layer-1-task-01 Auth PASS STRICT round 4, commit b985bbf"
  builder: "layer-1-task-02 builder done (uncommitted): users/shops controllers+service+DTO+3 test files; tsc PASS, lint PASS, test 27 suites/156 tests PASS."
  reviewerR1: "FAIL STRICT — [MAJOR] shopName validate trước khi trim (update-shop.dto.ts:8-12) → tên <3 ký tự/blank lọt; [MAJOR] PATCH /users/me cho phép fullName null/whitespace (update-profile.dto.ts:9-14, users.service.ts:145-147) → phá invariant required. [MINOR] test file >300 dòng/helper >50 dòng; docs/ARCHITECTURE.md:83-84 map lệch. Report: .context/review-reports/feature-ecommerce-mvp-layer-1-task-02-round-1-review.md"
  reviewerR2: "PASS STRICT — 2 MAJOR + 2 MINOR đã đóng (trim-before-validate DTO; tách test-support; ARCHITECTURE map). lint/tsc/test PASS 29 suites/163 tests. Report: .context/review-reports/feature-ecommerce-mvp-layer-1-task-02-round-2-review.md"
  residualRisk: "pickupAddress whitespace-only vẫn qua @IsNotEmpty rồi trim còn '' — ngoài findings, cần fix riêng nếu muốn."
  l1t03: "PASS STRICT r2 (fix image→imageUrl + tách test) commit fa42d5e; 33 suites/209 tests."
  l1t04: "PASS STRICT r2 (fix seed bịa sellerId → skip+warn) commit 6f2e530; 37 suites/246 tests."
  l1t05: "PASS STRICT r1 — align GET /products/:id (nested category/seller, bỏ isBlocked public) + test stock=0; 37 suites/248 tests; chưa commit."
  phaseReviewR1: "FAIL — gap contract product detail (unlock Layer 2 blocked). Report: .context/review-reports/feature-ecommerce-mvp-phase-1-round-1-review.md"
  phaseReviewR2: "PASS — Layer 1 complete, Layer 2 unlock. Report: .context/review-reports/feature-ecommerce-mvp-phase-1-round-2-review.md"
next: "Layer 1 DONE (commit 3c25ca9). Bắt đầu Layer 2: L2-01 FE Auth (builder→reviewer→commit) → L2-02 FE product list/detail → Layer 2 phase review → L3-01 smoke test."
approvals: [{gate: design_tokens, at: "2026-10-06", ok: true}, {gate: layer_plan, at: "2026-10-06", ok: true}, {gate: layer_0_done, at: "2026-10-06", ok: true}]
loopSignal: repeated:spec-validator-doc-guard-order
batchQueue: []
```

## Notes / WIP reasoning

- Repo là **docs-first**: chưa có app code (`docs/generated/inventory.md` = 0 file). Spec nằm trong
  `docs/BRD.md`, `PRD.md`, `ARCHITECTURE.md`, `API_SPEC.md`, `ERD.md`, `PERMISSION.md`, `USER_FLOW.md`,
  `DESIGN.md` + nguồn `project-ecommerce/`.
- `SPECIFICATIONS.md` là stub rỗng → dựng lại từ docs canonical (spec-init-equivalent cho docs-first).
- `project-config.md` toàn placeholder → brainstorm bước 2 sẽ chốt.
- Mâu thuẫn doc đã biết: xem `docs/BRD.md` § Open Questions (Guest cart/checkout, Admin đăng bán, transaction, response wrapper, status sprint).

## History

- 2026-10-06 journal created (bước 1 spec)
- 2026-10-06 bước 1 spec ✅ (SPECIFICATIONS.md R-01..R-13, validator PASS round 2)
- 2026-10-06 bước 2 brainstorm ✅ (config + design doc + nhánh staging + sync verify permissions)
- 2026-10-06 bước 3 design ✅ (tokens + 22 screen specs; archify diagram blocked/bỏ qua)
- 2026-10-06 bước 4 graph ✅ (8 layer / 28 task + layer-plan.html + progress.json)
