# Phase Review — ecommerce-mvp / Layer 0 / round 4

## Verdict

⚠️ **GAPS FOUND** — Hai nitpick từ round 3 đã được xử lý đúng: `SPECIFICATIONS.md` phân biệt global `ThrottlerGuard` đang chạy với route-level JWT/role/ownership guards sẽ được wire ở Layer 1+; `.context/project-config.md` xác nhận app đã scaffold và verify commands đã chạy. JWT runtime wiring là prerequisite hợp lệ của Layer 1 task-01, không phải thiếu implementation Layer 0. Tuy nhiên, hai current-state docs vẫn khẳng định chuỗi JWT/role/ownership đang có hiệu lực trong runtime hiện tại, trái với `AppModule` hiện chỉ đăng ký `ThrottlerGuard` làm `APP_GUARD`. Đây là mâu thuẫn tài liệu với state hiện tại; chưa thể chốt COMPLETE cho tới khi docs không còn trình bày route guards tương lai như runtime đã wire.

## Scope and evidence

- Đọc `.agent/FEATURE_WORKFLOW.md`, `.context/project-config.md`, `SPECIFICATIONS.md`, Layer 0 tasks 01–06, Layer 1 task-01, `.context/progress.json`, các current-state docs liên quan và code backend hiện tại.
- `.context/progress.json:7-15` liệt kê đủ sáu task Layer 0 là completed, không có task đang chạy. Sáu task-level review reports tương ứng đều verdict PASS: round 3 (task-01, task-04), round 2 (task-02, task-03, task-05), round 4 (task-06).
- Không chạy lại test/build/browser/live DB ở vòng phase review này; kết quả task-level được trích từ các review reports nêu trên.

## Coverage matrix

| Requirement | Source | Status | Note |
|---|---|---|---|
| Backend bootstrap, API foundation, database/response contract | `tasks/ecommerce-mvp/layer-0-task-01.md:9-24`; `layer-0-task-02.md:9-24`; task review reports 01 round 3 / 02 round 2 | ✅ PASS | Task reviews xác nhận lint/typecheck/tests PASS; live DB replica-set startup còn là residual risk được ghi trong task-02 report. |
| Repo onboarding, env examples, replica-set guide | `tasks/ecommerce-mvp/layer-0-task-03.md:9-23`; task-03 round-2 report | ✅ PASS | Docs-only task review PASS. |
| Identity/JWT foundation, guards, ownership helper, seed | `tasks/ecommerce-mvp/layer-0-task-04.md:9-27,53-57`; `backend/src/modules/auth/jwt.strategy.ts:21-53`; `backend/src/common/guards/jwt-auth.guard.ts:16-40`; task-04 round-3 report | ✅ PASS (runtime wiring deferred) | Required primitives exist and task review PASS. L0 does not require registering these guards into runtime. |
| Frontend scaffold and shared data layer | `tasks/ecommerce-mvp/layer-0-task-05.md:9-26`; `layer-0-task-06.md:9-25`; task-05 round-2 / task-06 round-4 reports | ✅ PASS | Configured lint/typecheck/tests PASS in the reports; browser responsive rendering remains unverified as documented there. |
| Specification accurately distinguishes current global throttle from future route guards | `SPECIFICATIONS.md:42,177-183`; `backend/src/app.module.ts:19-35`; `tasks/ecommerce-mvp/layer-1-task-01.md:14-27` | ✅ PASS | Spec says `ThrottlerGuard` is the wired global `APP_GUARD` and route-level JWT/roles/ownership wiring happens in Layer 1+. Code and L1 task agree. |
| Project config reflects scaffold and actual verification status | `.context/project-config.md:21-30,61-79`; `backend/package.json`; `frontend/package.json`; task reports 01–06 | ✅ PASS | Updated line 66 accurately says both apps were scaffolded at L0 and configured verification commands have been run. |
| Current-state docs do not claim deferred JWT/role/ownership runtime wiring is already active | `docs/PERMISSION.md:19-29`; `docs/ARCHITECTURE.md:118-135`; `backend/src/app.module.ts:19-35`; grep of `backend/src` guard registrations | ⚠️ PARTIAL | `PERMISSION.md:21` explicitly calls the full chain “Thực tế trong code”; `ARCHITECTURE.md:124-130` labels the chain as effective order “trong code”. Current `AppModule` only registers `ThrottlerGuard` under `APP_GUARD`; grep finds no runtime registration/use of `JwtAuthGuard` or `RolesGuard`. These docs need to label the latter stages as intended/deferred, consistent with the corrected spec and L1 prerequisite. |

## Gaps

1. **[PARTIAL — documentation/state contradiction; not a Layer 0 implementation gap]** Current-state guard-order claims remain overstated in `docs/PERMISSION.md:19-29` (especially line 21: “Thực tế trong code”) and `docs/ARCHITECTURE.md:118-135` (line 124: “thứ tự hiệu lực trong code”). Runtime evidence: `backend/src/app.module.ts:19-35` only registers `ThrottlerGuard` as `APP_GUARD`; `grep` across `backend/src/**/*.ts` finds guard class declarations/specs but no runtime registration or `UseGuards` wiring for JWT/roles. Related completed Layer 0 task: `tasks/ecommerce-mvp/layer-0-task-04.md:53-57` (guards are foundations/skeleton). Correct owner for runtime wiring remains `tasks/ecommerce-mvp/layer-1-task-01.md:14,26`. This does **not** require pulling JWT wiring into Layer 0, but the explicitly current-runtime wording in those docs conflicts with code/state and must be reconciled before COMPLETE.

## Confirmed fixed from round 3

- `SPECIFICATIONS.md:182` now accurately describes the global throttler as wired and explicitly defers route-level JWT/role/ownership wiring to Layer 1+.
- `.context/project-config.md:66` now accurately records backend/frontend scaffold completion in Layer 0 and actual verification activity.
- JWT runtime registration remains correctly specified as a prerequisite in Layer 1 task-01, not an L0 gap.

## Residual risk

- Task-level review reports record live MongoDB and browser-rendered responsive verification limitations. They do not represent a new contradiction or blocker for the reviewed L0 acceptance criteria.

## Report path

`.context/review-reports/feature-ecommerce-mvp-layer-0-phase-review-round-4-review.md`
