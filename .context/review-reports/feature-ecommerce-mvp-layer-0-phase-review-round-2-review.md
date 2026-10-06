# Phase Review — ecommerce-mvp / Layer 0 / round 2

## Verdict

⚠️ **GAPS FOUND** — Layer 0 implementation tasks are complete and the three round-1 findings are addressed (the JWT runtime registration is explicitly planned as a Layer 1 prerequisite; guard-order and as-built architecture/API/ERD docs were reconciled). However, `SPECIFICATIONS.md` still contains stale repository-state and guard-order statements that conflict with the updated current-state docs/runtime. Reconcile those non-business annotations/architecture references before declaring the phase fully complete. L1 work may be prepared, but the workflow's PASS gate to unlock the next layer is not yet met.

## Review scope and evidence

- Read `.agent/FEATURE_WORKFLOW.md`, `.context/project-config.md`, `SPECIFICATIONS.md`, `spec/updates/2026-10-06-docs-first-bootstrap.md`, Layer 0 task files 01–06, `tasks/ecommerce-mvp/layer-1-task-01.md`, `docs/ARCHITECTURE.md`, `docs/API_SPEC.md`, `docs/ERD.md`, `docs/PERMISSION.md`, `.context/progress.json`, and relevant backend/frontend source.
- Reviewed the round-1 phase report plus latest task reports: task-01 round 3, task-02 round 2, task-03 round 2, task-04 round 3, task-05 round 2, task-06 round 4. All six task reports verdict PASS.
- The configured lint/typecheck/test PASS results are attributed to the task reports; no verification command, live MongoDB startup, or browser-rendered UI check was rerun in this phase review.

## Coverage matrix

| Requirement | Source | Status | Note |
|---|---|---|---|
| Backend bootstrap, env/config, `/api/v1`, health, Helmet/CORS/validation, global throttling | `tasks/ecommerce-mvp/layer-0-task-01.md:9-24`; `backend/src/main.ts:7-15`; `backend/src/app.setup.ts:12-30`; `backend/src/app.module.ts:12-35`; task-01 round-3 report | ✅ PASS | Task report records configured backend lint/typecheck/tests PASS. `AppModule` registers `ThrottlerGuard` globally; runtime does not yet register a JWT guard. |
| Shared response/error contract, pagination, MongoDB replica-set readiness, base schema/enums | `tasks/ecommerce-mvp/layer-0-task-02.md:9-24`; `backend/src/database/database.module.ts`; `backend/src/database/database-topology.service.ts`; `backend/src/common/dto/pagination-query.dto.ts`; `backend/src/common/response.ts`; task-02 round-2 report | ✅ PASS | Latest task report confirms tests and checks PASS; live DB startup was not independently verified. |
| Repo onboarding, env examples, secrets exclusion and local replica-set guide | `tasks/ecommerce-mvp/layer-0-task-03.md:9-23`; `backend/.env.example`; `frontend/.env.example`; `docs/MONGO_LOCAL_REPLICA_SET.md`; task-03 round-2 report | ✅ PASS | Docs-only task review confirms setup instructions and replica-set requirement are aligned. |
| User identity foundation, password hashing/serialization, JWT config/strategy and guard primitives, admin seed | `tasks/ecommerce-mvp/layer-0-task-04.md:9-27,53-57`; `backend/src/modules/users/user.schema.ts:16-57`; `backend/src/modules/users/users.service.ts:8-67`; `backend/src/modules/auth/jwt.config.ts:4-47`; `backend/src/modules/auth/jwt.strategy.ts:21-53`; `backend/src/database/seed/admin-seed.service.ts:19-76`; task-04 round-3 report | ✅ PASS (runtime wiring deferred) | Foundation primitives and tests are present. The app has no runtime `JwtModule`/`PassportModule`/`JwtStrategy`/global `JwtAuthGuard` registration yet. This is an accepted L1 prerequisite, not an L0 blocker, because `tasks/ecommerce-mvp/layer-1-task-01.md:14,26` explicitly requires registration and runtime protection before the Auth API is accepted. |
| Frontend scaffold, tokens, route shells and responsive structure | `tasks/ecommerce-mvp/layer-0-task-05.md:9-26`; `frontend/src/router/index.tsx`; `frontend/src/layouts/`; `frontend/src/index.css`; task-05 round-2 report | ✅ PASS | Task report records lint/typecheck/tests PASS; actual rendered behavior remains source-inspected rather than browser-verified. |
| Frontend API client, auth state/refresh, query policy, types and formatting | `tasks/ecommerce-mvp/layer-0-task-06.md:9-25`; `frontend/src/lib/api-client.ts:16-20,43-80,119-177`; `frontend/src/stores/auth.store.ts:24-86`; task-06 round-4 report | ✅ PASS | Latest report records lint/typecheck/tests PASS and review of stale-session retry handling. |
| JWT registration needed by protected L1 routes | `tasks/ecommerce-mvp/layer-1-task-01.md:14,16-27`; `backend/src/app.module.ts:12-35` | ✅ PASS as planned prerequisite | L0 intentionally supplies the reusable JWT strategy/config/guards; L1 task-01 explicitly owns runtime module/provider/APP_GUARD wiring and adds route-protection acceptance. Deferred business Auth endpoints are not being counted as L0 gaps. |
| Guard-order documentation matches current runtime order | `docs/ARCHITECTURE.md:124-135`; `docs/PERMISSION.md:19-29`; `backend/src/app.module.ts:19-34` | ✅ PASS in the requested docs | The docs now put global `ThrottlerGuard` before auth/role/ownership processing. Current L0 runtime has only the throttle guard wired; auth/role/ownership steps are later route/service processing once L1 routes are introduced. |
| As-built docs acknowledge the Layer 0 app scaffold and correctly bound future business modules | `docs/ARCHITECTURE.md:212-218`; `docs/API_SPEC.md:6-15`; `docs/ERD.md:6-13` | ✅ PASS | Architecture says backend/frontend foundation exists and business modules are L1+. API_SPEC and ERD no longer claim the repository is code-empty; they distinguish current foundation from schemas/endpoints still to be built. |
| Current-state/spec consistency for repo status and guard order | `SPECIFICATIONS.md:39-43,177-183`; compared with `backend/src/app.module.ts:19-34`, `docs/ARCHITECTURE.md:124-132`, `docs/PERMISSION.md:19-29` | ⚠️ PARTIAL | The spec still says the repo has no app code (`SPECIFICATIONS.md:42`) and describes throttle after auth/roles/ownership (`:182`), contradicting the current code and updated docs. These are stale state/architecture annotations; the requested docs were fixed, but the cross-document mismatch remains. |
| Layer 0 task state | `.context/progress.json:7-15`; six latest task reports | ✅ PASS (awaiting phase close) | All six tasks are listed completed and `inProgressTask` is null. `currentLayer: 0` with feature `status: in_progress` is consistent with the phase review/checkpoint still pending; it is not itself a build defect. |

## Gaps

1. **[PARTIAL] Stale repo-status and guard-order statements remain in `SPECIFICATIONS.md`.** Source: `SPECIFICATIONS.md:42,182`; compared to the actual app wiring in `backend/src/app.module.ts:19-34` and reconciled current-state docs in `docs/ARCHITECTURE.md:124-132` / `docs/PERMISSION.md:19-29`. Related L0 task: `tasks/ecommerce-mvp/layer-0-task-03.md` (repo documentation foundation); affected prerequisite: `tasks/ecommerce-mvp/layer-1-task-01.md`. Reconcile these generated status/architecture annotations through the authorized spec/doc workflow (do not weaken business intent to match code). Until resolved, the docs set is not fully cross-consistent, so this report does not certify Layer 0 COMPLETE.

## Round-1 finding closure

1. **JWT runtime wiring:** Confirmed still absent from current runtime (`backend/src/app.module.ts:7-35`), but properly assigned as a prerequisite and acceptance criterion in `tasks/ecommerce-mvp/layer-1-task-01.md:14,26`. Given Layer 0 task-04 explicitly describes these as skeleton/foundation primitives and Auth endpoints are Layer 1, this is accepted as valid deferral and is **not counted as a Layer 0 gap**. L1 protected endpoints must not be considered complete until this prerequisite passes.
2. **Guard-order docs:** `docs/ARCHITECTURE.md:124-132` and `docs/PERMISSION.md:19-29` now place global throttling first, consistent with current `AppModule` wiring. Closed in the requested as-built docs; stale `SPECIFICATIONS.md:182` is separately recorded above.
3. **As-built docs:** `docs/ARCHITECTURE.md:217`, `docs/API_SPEC.md:8-12`, and `docs/ERD.md:8-13` now describe the existing L0 backend/frontend scaffold and distinguish modules/schemas deferred to later layers. Closed in the requested as-built docs; the stale repo-status annotation in `SPECIFICATIONS.md:42` remains recorded above.

## Deferred scope (not counted as L0 gaps)

Auth endpoints/token lifecycle, User/Shop APIs, Category APIs, product/upload, cart, orders/checkout, VNPay, admin business APIs, and go-live remain later-layer work. No requirement for those business behaviors has been pulled into Layer 0.

## Report path

`.context/review-reports/feature-ecommerce-mvp-layer-0-phase-review-round-2-review.md`
