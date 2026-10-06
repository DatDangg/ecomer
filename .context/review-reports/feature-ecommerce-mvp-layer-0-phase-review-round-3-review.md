# Phase Review — ecommerce-mvp / Layer 0 / round 3

## Verdict

⚠️ **GAPS FOUND** — `SPECIFICATIONS.md:42` now accurately describes the Layer 0 backend/frontend foundation and later-layer business modules. The guard sequence at `SPECIFICATIONS.md:182` is in the intended order, but it still labels the whole chain as “thực tế trong code” although the current runtime only registers `ThrottlerGuard` globally; authentication/role guards are not yet wired. This JWT wiring is correctly deferred to Layer 1 task 01 and is **not counted as a missing Layer 0 implementation requirement**. However, the cross-document/current-state claim remains inaccurate, and `.context/project-config.md:66` still says the backend/frontend have not been scaffolded. I cannot certify Layer 0 COMPLETE or recommend unlocking L1 until these documentation-state inconsistencies are reconciled (without implementing the deferred L1 JWT wiring in L0).

## Scope and evidence

- Read `.agent/FEATURE_WORKFLOW.md` (phase review rules), `.context/project-config.md`, `SPECIFICATIONS.md`, Layer 0 task files 01–06, Layer 1 task 01, `.context/progress.json`, current backend/frontend source, and relevant current-state docs.
- Reviewed the existing Layer 0 task review reports: task 01 round 3, task 02 round 2, task 03 round 2, task 04 round 3, task 05 round 2, task 06 round 4. All six report PASS and `.context/progress.json:13-14` lists all six tasks complete with no in-progress task.
- This phase review did not rerun configured checks or live DB/browser verification; task-level verification results are attributed to those task reports. Relevant runtime wiring was inspected directly in source.

## Coverage matrix

| Requirement | Source | Status | Note |
|---|---|---|---|
| Backend bootstrap, config, API prefix/health, Helmet/CORS/validation and global throttle | `tasks/ecommerce-mvp/layer-0-task-01.md:9-24`; `backend/src/main.ts:7-15`; `backend/src/app.setup.ts:12-30`; `backend/src/app.module.ts:12-35`; task-01 round-3 report | ✅ PASS | Bootstrap and global `ThrottlerGuard` are implemented. Task-level lint/typecheck/tests PASS per report. |
| Database + response/error/pagination foundations | `tasks/ecommerce-mvp/layer-0-task-02.md:9-24`; `backend/src/database/database.module.ts:12-35`; task-02 round-2 report | ✅ PASS | Implementation and tests are present; live MongoDB replica-set startup was not independently verified (task report records this limitation). |
| Repo onboarding, environment examples and replica-set setup | `tasks/ecommerce-mvp/layer-0-task-03.md:9-23`; task-03 round-2 report | ✅ PASS | Docs/config task report PASS; no app-code verification applies to this docs-only task. |
| Identity foundation: User schema/service, JWT config/strategy, guard primitives, ownership helper and admin seed | `tasks/ecommerce-mvp/layer-0-task-04.md:9-27,53-57`; `backend/src/modules/auth/jwt.config.ts:4-47`; `backend/src/modules/auth/jwt.strategy.ts:21-53`; `backend/src/common/guards/jwt-auth.guard.ts:16-31`; `backend/src/common/guards/roles.guard.ts:19-38`; `backend/src/common/utils/ownership.util.ts:17-45`; task-04 round-3 report | ✅ PASS (runtime wiring deferred) | Required L0 foundations exist and task report PASS. Deferred runtime registration is owned by L1 task 01; not an L0 gap. |
| Frontend scaffold, tokens, shells and route structure | `tasks/ecommerce-mvp/layer-0-task-05.md:9-26`; `frontend/src/router/index.tsx`; `frontend/src/layouts/`; task-05 round-2 report | ✅ PASS | Task-level configured lint/typecheck/tests PASS per report. Browser-rendered responsive behavior remains unverified as noted in that report. |
| Frontend data layer, token refresh, query client, state/types and formatting | `tasks/ecommerce-mvp/layer-0-task-06.md:9-25`; `frontend/src/lib/api-client.ts:16-20,43-80,119-177`; task-06 round-4 report | ✅ PASS | Task-level configured lint/typecheck/tests PASS per report. |
| L1 protected-auth runtime prerequisite is explicitly planned and checked | `tasks/ecommerce-mvp/layer-1-task-01.md:14,16-27`; `backend/src/app.module.ts:25-35` | ✅ PASS as planned deferral | L1 task explicitly requires JwtModule/Passport/strategy wiring, global `JwtAuthGuard`, and a protected-route test before Auth API acceptance. No such runtime wiring is currently present, but this is not treated as missing L0 work. |
| `SPECIFICATIONS.md` repo status no longer says repository has no code | `SPECIFICATIONS.md:39-43`; `docs/API_SPEC.md:6-12`; `docs/ERD.md:6-13`; `backend/src/app.module.ts`; `frontend/src/main.tsx` | ✅ PASS in the spec | Line 42 accurately records completed L0 foundations and defers business modules to L1+. API/ERD overview also acknowledges the scaffold. **Residual cross-doc inconsistency:** `.context/project-config.md:66` still says backend/frontend “chưa scaffold” and says verification will happen in L0. |
| Guard-order documentation accurately distinguishes wired runtime from later route guards | `SPECIFICATIONS.md:177-183`; `backend/src/app.module.ts:19-35`; `backend/src/common/guards/jwt-auth.guard.ts:16-31`; `backend/src/common/guards/roles.guard.ts:19-38`; `tasks/ecommerce-mvp/layer-1-task-01.md:14,26` | ⚠️ PARTIAL | The order in SPEC line 182 now starts with global throttling, fixing the previous ordering error. But its “thực tế trong code” assertion overstates current runtime: `AppModule` registers only `ThrottlerGuard` as `APP_GUARD`; it does not register `JwtAuthGuard`, and neither `RolesGuard` nor ownership helper is wired into current routes. Treat as intended/future chain or state current runtime separately. JWT wiring remains valid L1 deferral, not an L0 implementation gap. |
| Layer 0 completion state is consistent across project configuration | `.context/progress.json:7-15`; `SPECIFICATIONS.md:42`; `.context/project-config.md:61-67` | ⚠️ PARTIAL | Progress records all six L0 tasks completed and spec reflects the scaffold, but project-config line 66 still claims no backend/frontend scaffold exists. This stale note conflicts with the completed phase and configured commands. |

## Gaps

1. **[PARTIAL] Guard-order text still overclaims current runtime wiring.** Requirement/source: current-state/security description at `SPECIFICATIONS.md:182`; implementation evidence: `backend/src/app.module.ts:25-35` registers only the global `ThrottlerGuard`, while the JWT/roles guards exist only as primitives (`backend/src/common/guards/jwt-auth.guard.ts:16-31`, `roles.guard.ts:19-38`). Related task: `tasks/ecommerce-mvp/layer-0-task-04.md:53-57` (foundation/skeleton); deferred runtime wiring: `tasks/ecommerce-mvp/layer-1-task-01.md:14,26`. The stated order is now conceptually ordered correctly, but “thực tế trong code” is not yet true. Do not pull the valid L1 prerequisite into L0; reconcile the wording to distinguish current runtime from the intended route-guard sequence.
2. **[PARTIAL] Stale “not scaffolded” statement remains in project configuration.** Requirement/source: current Layer 0 state in `SPECIFICATIONS.md:42` and completed task state in `.context/progress.json:13-14`; conflicting source: `.context/project-config.md:66` (“Backend/frontend chưa scaffold” and verification planned at L0). Related task: `tasks/ecommerce-mvp/layer-0-task-01.md:9-24` and `layer-0-task-05.md:9-26`; current code evidence includes `backend/src/main.ts:7-15` and `frontend/src/main.tsx`. Reconcile the stale config note before declaring the documentation set consistent.

## Confirmed resolved from round 2

- `SPECIFICATIONS.md:42` no longer claims the repository is code-empty; it records the L0 foundation and defers business modules to L1+.
- `SPECIFICATIONS.md:182` no longer places throttling after auth/roles/ownership; it now puts the global throttler first. Remaining issue is the unqualified claim that the complete sequence is already actual runtime behavior, as detailed above.
- JWT runtime wiring remains properly assigned to `tasks/ecommerce-mvp/layer-1-task-01.md:14,26` and is not counted as an L0 implementation gap.

## Deferred scope (not counted as L0 gaps)

Auth endpoints and runtime JWT wiring, user/shop APIs, categories, products/upload, cart, checkout/orders, VNPay, admin business APIs and go-live remain assigned to later layers. L0 is not expected to implement these business behaviors.

## Report path

`.context/review-reports/feature-ecommerce-mvp-layer-0-phase-review-round-3-review.md`
