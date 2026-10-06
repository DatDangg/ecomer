# Spec Validator — Phase Review — ecommerce-mvp / Layer 3 — Round 1

**Review mode:** Phase review (requirement ↔ task ↔ implementation ↔ tests)  
**Work item:** `feature/ecommerce-mvp`  
**Layer reviewed:** 3 — smoke test luồng cơ bản + backend/frontend build  
**Round:** 1  
**Evidence boundary:** Đối chiếu `SPECIFICATIONS.md`, source docs liên quan, Layer 3 task, smoke test/script, task reviewer STRICT round 3, progress và phase reports Layer 1/2. Lệnh verify không được chạy lại trong phase validation này; kết quả được dẫn từ evidence đã ghi và review độc lập.

## Verdict: ✅ COMPLETE — Layer 3 PASS

Task cuối hoàn thành đúng mục tiêu khai báo: tự động kiểm chứng luồng HTTP **register → login → public product list → public product detail**, đồng thời ghi nhận backend/frontend lint, typecheck, test và build đều PASS. Automated smoke dùng các Auth/Product controller và service thật với persistence in-memory; kiểm tra sản phẩm ẩn/blocked không xuất hiện và detail của hidden/blocked/unknown trả 404.

Không phát hiện gap implementation hoặc conflict contract ngăn Layer 3 hoàn thành. Live smoke trên backend/MongoDB dev thật chưa chạy; theo bằng chứng task/reviewer đây là **residual verification risk**, không phải gap của Layer 3. Reviewer STRICT round 3 PASS.

## Coverage matrix

| Requirement | Source | Status | Note |
|---|---|---|---|
| **R-01 — Auth cơ bản:** public register tạo customer, response không lộ password; login trả user + access/refresh token. | `SPECIFICATIONS.md:44-49`; `docs/BRD.md:85-92`; `tasks/ecommerce-mvp/layer-3-task-01.md:12-20,34-36`; `backend/src/smoke/basic-flow.smoke.spec.ts:141-160`; `.context/review-reports/feature-ecommerce-mvp-phase-1-round-2-review.md:19` | ✅ Covered | Smoke assert register 201 và không lộ `password`; login 200, user customer, access/refresh token, không lộ `passwordHash`. Layer 1 round-2 review xác nhận toàn bộ R-01 (bao gồm refresh/logout, TTL/hash, ban/throttle) đã được cover trong scope trước đó. |
| **R-05 — Public product list:** unauthenticated list trả paginated envelope và chỉ chứa sản phẩm active, không blocked. | `SPECIFICATIONS.md:68-73,136-142`; `docs/BRD.md:109-111`; `tasks/ecommerce-mvp/layer-3-task-01.md:12-20,34-36`; `backend/src/smoke/basic-flow.smoke.spec.ts:162-179,204-212`; `.context/review-reports/feature-ecommerce-mvp-phase-1-round-2-review.md:23-24`; `.context/review-reports/feature-ecommerce-mvp-phase-2-round-1-review.md:23-24` | ✅ Covered | Test assert HTTP 200, success/paginated data, visible item có mặt, hidden/blocked không có mặt. Layer 1 xác nhận filter/search/sort/pagination, stock-zero và envelope; Layer 2 xác nhận FE list contract khớp BE. |
| **R-05 — Public product detail:** sản phẩm public trả 200; hidden/blocked/missing trả 404. | `SPECIFICATIONS.md:68-73`; `docs/API_SPEC.md:56-65`; `tasks/ecommerce-mvp/layer-3-task-01.md:12-20,34-36`; `backend/src/smoke/basic-flow.smoke.spec.ts:181-202`; `.context/review-reports/feature-ecommerce-mvp-phase-1-round-2-review.md:23,29-35`; `.context/review-reports/feature-ecommerce-mvp-phase-2-round-1-review.md:25,41` | ✅ Covered | Automated smoke kiểm tra detail public 200 với nested category/seller và 404 cho hidden, blocked, unknown ID. Contract-shape gap từng nêu ở Layer 1 round 1 đã đóng và được round 2 xác nhận. |
| **Layer 3 — smoke harness / live utility:** Jest HTTP smoke dùng flow thật qua controller/service; script dev có credential tạm và kết quả từng bước rõ ràng. | `tasks/ecommerce-mvp/layer-3-task-01.md:14-23,28,34-42`; `backend/src/smoke/basic-flow.smoke.spec.ts:57-92,108-212`; `backend/src/smoke/test-support/smoke-user-store.ts:19-40`; `backend/scripts/smoke-basic-flow.sh:3-23,68-138`; task review round 3 `:20-25,39` | ✅ Covered (automated) / Residual (live execution) | Automated HTTP test dùng controller/service thật và in-memory persistence. Script sinh credential mặc định, dùng curl/jq và báo PASS/FAIL rõ ràng. Chưa chạy script trên Mongo/backend dev thật; task evidence nói đã validate với mock server, nên ghi residual chứ không tính thiếu code/coverage của phase. |
| **Build + configured checks:** backend/frontend lint, typecheck, tests và build theo project config. | `.context/project-config.md:25-30,61-78`; `tasks/ecommerce-mvp/layer-3-task-01.md:24-27,40-60,74-82`; `.context/review-reports/feature-ecommerce-mvp-layer-3-task-01-round-3-review.md:27-39,56-62` | ✅ PASS (evidence-based) | Task evidence ghi PASS: backend lint/typecheck/test (38 suites/256 tests)/build; frontend lint (2 cảnh báo có trước, ngoài diff)/typecheck/build. Reviewer độc lập chạy lại backend lint/typecheck/test PASS; backend build và frontend commands không chạy lại được do shell permission, nhưng chấp nhận primary evidence như ghi rõ trong STRICT round-3 report. |
| **Layer 1/2 prerequisite gates.** | `.context/review-reports/feature-ecommerce-mvp-phase-1-round-2-review.md:9-13,47-49`; `.context/review-reports/feature-ecommerce-mvp-phase-2-round-1-review.md:9-13,61-63`; `.context/progress.json:7-15` | ✅ PASS (prior phase evidence) | Layer 1 và Layer 2 đều có phase PASS. Các residual đã biết của Layer 2 (live FE↔BE UAT, pagination-control regression test) vẫn là validation limitations nêu trong phase-2 report, không bị Layer 3 smoke/build task xác nhận hoặc đóng. |

## Gaps

**Không có [MISSING] hoặc [PARTIAL] gap chặn Layer 3.**

### Residual verification risks (không phải gap)

- Live script `bash backend/scripts/smoke-basic-flow.sh` chưa chạy trên backend/MongoDB dev thật do môi trường không có Mongo/backend đang chạy. Evidence hiện có là automated in-memory HTTP smoke và mock-server validation; xem `tasks/ecommerce-mvp/layer-3-task-01.md:74-82` và task-review round 3 `:23,39,56-59`.
- Reviewer round 3 không thể tự chạy backend build và frontend commands sau khi shell permission bị từ chối. Reviewer ghi nhận primary task evidence PASS; kết quả này evidence-based, không phải independent rerun (`...layer-3-task-01-round-3-review.md:27-39,56-62`).
- Layer 2 còn thiếu live FE↔BE UAT và test click pagination theo phase report (`feature-ecommerce-mvp-phase-2-round-1-review.md:27-28,45-48`); đây là residual downstream, không phát sinh từ task Layer 3.

## Cross-document / scope assessment

- Layer 3 chỉ thêm smoke tests/tooling; không sửa handler, UI, schema hay API behavior (`feature-ecommerce-mvp-layer-3-task-01-round-3-review.md:9-13,24-25`). Không thấy conflict mới với `SPECIFICATIONS.md` hoặc API docs.
- Guest cart/checkout conflict ở các tài liệu legacy đã được ghi nhận trong phase-2 report `:50-52`; cart/checkout không thuộc mục tiêu auth + public browse của task này. Layer 3 không resolve conflict đó và không tuyên bố các luồng này đã build.
- **Phân biệt phạm vi:** ba layer của work item này hoàn tất mục tiêu **MVP cơ bản auth + duyệt sản phẩm**. Điều đó **không đồng nghĩa toàn bộ ecommerce scope trong `SPECIFICATIONS.md`/PRD đã hoàn thành**: PRD mô tả thêm seller/cart/order/payment/admin/go-live (ví dụ `docs/specs/2026-10-06-ecommerce-mvp-design.md:13-16`; `SPECIFICATIONS.md:51-118`). Các capability ngoài basic flow cần được coi là scope khác/chưa được chứng minh hoàn tất ở phase này.

## Kết luận initial build / test-scope handoff

**Initial build MVP cơ bản (auth + public product browse) đã hoàn tất ở Layer 3 và đủ điều kiện bàn giao test-scope** sau checkpoint/close-out theo workflow và bước spec-publisher bắt buộc cho layer cuối. Phase review này không tự cập nhật `progress.json` hoặc sinh `spec/test-scope/current.json`.

Không kết luận toàn bộ marketplace MVP trong PRD/SPECIFICATIONS đã xong; kết luận hoàn tất chỉ áp dụng cho scope cơ bản nêu trên. Trước khi gọi là full ecommerce MVP, các requirement còn lại cần scope/build/phase review tương ứng.

## Sources reviewed

`.agent/FEATURE_WORKFLOW.md`; `.context/project-config.md`; `.agent/spec-validator.md`; `SPECIFICATIONS.md`; `docs/BRD.md`; `docs/API_SPEC.md`; `docs/PRD.md`; `docs/DESIGN.md`; `docs/specs/2026-10-06-ecommerce-mvp-design.md`; `tasks/ecommerce-mvp/layer-3-task-01.md`; `backend/src/smoke/basic-flow.smoke.spec.ts`; `backend/src/smoke/test-support/smoke-user-store.ts`; `backend/scripts/smoke-basic-flow.sh`; `.context/progress.json`; `.context/review-reports/feature-ecommerce-mvp-layer-3-task-01-round-3-review.md`; `.context/review-reports/feature-ecommerce-mvp-phase-1-round-1-review.md`; `.context/review-reports/feature-ecommerce-mvp-phase-1-round-2-review.md`; `.context/review-reports/feature-ecommerce-mvp-phase-2-round-1-review.md`.
