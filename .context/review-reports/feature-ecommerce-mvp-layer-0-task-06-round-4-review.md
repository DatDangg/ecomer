# Review: ecommerce-mvp / layer-0-task-06 / round-4 (FINAL)

## Review level
**STRICT**

## Reason
Task 06 thay đổi shared Axios API client cùng luồng auth/token refresh, retry và session state. Đây là risk đỏ về token/session và shared client; round này chốt thêm race account-switch ở thời điểm retry dispatch.

## Blast radius
- `frontend/src/lib/api-client.ts`: mọi request qua shared client; đặc biệt request retry sau 401 và các authenticated mutation.
- `frontend/src/stores/auth.store.ts`: `sessionGeneration` xác định session sở hữu request; account switch/logout tăng generation.
- `frontend/src/test/api-client.test.ts`: regression coverage cho retry, refresh và account-switch races.
- API consumers phụ thuộc vào `apiClient`; stale request bị hủy thay vì gửi dưới credential của account mới.

## Verify commands + result
- `pnpm --dir frontend run lint` — **PASS**, exit 0; 0 errors, 2 Fast Refresh warnings ở `src/components/ui/badge.tsx` và `button.tsx`.
- `pnpm --dir frontend exec tsc --noEmit` — **PASS**, exit 0.
- `pnpm --dir frontend test` — **PASS**, 7 files / 23 tests.
- `pnpm --dir frontend run build` — builder-verified **PASS**; reviewer không chạy lại vì `build_command: null` trong profile.
- Bug repro verification — **N/A**, đây là initial-build feature task, không phải bug task.

## Responsive Checklist Gate
**N/A** — corrective diff được review ở round này chỉ thay đổi request interceptor và test của API client; không thay đổi route, component, CSS hay UI. Không chạy app/browser theo quyền reviewer.

| Area | Result | Evidence |
|---|---|---|
| Layout | N/A | Không có layout/container/grid/overflow change trong corrective diff. |
| Typography / spacing | N/A | Không có UI typography hoặc spacing change. |
| Media / images | N/A | Không thêm/sửa media. |
| Touch / interaction | N/A | Không thêm/sửa UI control hoặc navigation. |
| Viewport / accessibility | N/A | Không có viewport, motion hoặc UI accessibility change. |

## Skill gates
- **aislop — skip, not installed:** `aislop scan --changes --json` → `aislop: command not found` (exit 127); không có score để báo cáo.
- **oxlint / anti-slop — skip, oxlint not configured:** repo glob `**/*oxlint*` không tìm thấy config; theo gate không chạy `npx oxlint`.
- **ocr / open-code-review — skip, not installed:** `ocr delegate preview` → `ocr: command not found` (exit 127); không có OCR findings được tuyên bố.
- **AI-readable — OK:** tên `sessionGeneration`/`CanceledError`/test mô tả đúng intent; request guard nằm trước khi gắn bearer; không thấy hàm mới >50 dòng hoặc ≥3 AI-chaos indicators. `frontend/README.md` đã mô tả shared API client và refresh flow.
- **AI-friendly web — N/A:** corrective diff thuộc auth/data layer nội bộ, không thay đổi public page, crawlability hay metadata.
- **blitzstrike — skip, no authorized target:** không có staging/dev target được cung cấp/ủy quyền cho live validation; không thực hiện pentest.
- **Surgical diff — OK:** interceptor guard và regression test đều truy nguyên trực tiếp về finding round 3; không thấy drive-by refactor.
- **Responsive web / impeccable / frontend checklist — N/A:** corrective diff không đụng UI.

## Findings
Không còn finding CRITICAL / MAJOR / MINOR trong scope round này.

### Round 3 finding closure
**Đã đóng.** Request interceptor ở `frontend/src/lib/api-client.ts:43-57` gắn generation cho request mới; với request/retry đã mang generation cũ, nó ném `CanceledError` tại interceptor trước khi gắn `Authorization` hoặc cho request tới adapter. Do retry giữ `__sessionGeneration` của request ban đầu, account switch sau post-refresh generation check nhưng trước dispatch sẽ bị chặn tại interceptor. Test `frontend/src/test/api-client.test.ts:320-355` chứng minh request generation cũ bị reject, adapter không được gọi (`productCalls === 0`, request history rỗng), và session B vẫn nguyên vẹn.

Không tìm thấy đường thực tế trong flow được kiểm tra để stale retry vượt qua guard và được gửi với bearer của session mới, hoặc để lỗi stale retry clear session mới. Vì vậy finding round 3 không còn là blocker.

## Verdict
✅ **PASS** — các verify commands độc lập đều PASS; interceptor guard đóng đúng cửa sổ TOCTOU được nêu ở round 3 và có regression test xác nhận không dispatch request stale.
