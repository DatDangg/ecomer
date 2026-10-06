# Task 03: VNPay signing foundation (buildPaymentUrl + verifySignature)

## Layer
3

## Type
build (initial)

## Description
Dựng `VnpayService` thuần (không gọi DB): `buildPaymentUrl(checkout)` tạo URL VNPay sandbox với
`vnp_TxnRef = checkoutCode`, `vnp_Amount = totalAmount × 100`, `vnp_ExpireDate` (GMT+7), `vnp_ReturnUrl`,
`vnp_IpnUrl` (nếu áp dụng), sắp xếp tham số + ký **HMAC-SHA512** bằng `VNPAY_HASH_SECRET`;
`verifySignature(query)` so checksum; helper format ngày GMT+7; map `vnp_ResponseCode` → kết quả
(00/01/02/04/97/99 và RspCode tương ứng).

## Dependencies
- task-01 Layer 0 (Config/env) + task-02 Layer 0 (constants)

## Acceptance Criteria
- [ ] `buildPaymentUrl` tạo URL đúng tham số bắt buộc, `vnp_Amount` = tổng × 100, `vnp_ExpireDate` GMT+7.
- [ ] Chữ ký HMAC-SHA512 khớp thuật toán VNPay; sai chữ ký → `verifySignature` false.
- [ ] `vnp_TxnRef` dùng `checkoutCode`; không lộ secret ra log.
- [ ] Map đúng `vnp_ResponseCode`/`RspCode` (00/01/02/04/97/99).
- [ ] Unit test ký + verify (case hợp lệ, sai, thiếu tham số).
- [ ] `api_lint` + `api_typecheck` + `test` PASS.

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS
- [ ] committed

## Verification Plan
- Commands:
  - `npm --prefix backend run lint`
  - `npx tsc --noEmit -p backend/tsconfig.json`
  - `npm --prefix backend run test`
- Manual/UAT evidence: URL sinh ra mở được trang VNPay sandbox; sửa 1 tham số → verify false.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-3-task-03-round-1-review.md`

## Files to Create/Modify
- `backend/src/modules/payments/vnpay.service.ts`
- `backend/src/modules/payments/vnpay.util.ts` (sort params, GMT+7 format, response-code map)
- `backend/src/modules/payments/payments.module.ts`

## Notes
- Chỉ nền tảng ký/verify — handler IPN/Return ở Layer 4 task VNPay.
- Tách khỏi Layer 4 để tránh vòng phụ thuộc checkout ↔ payment trong cùng layer.
- Nguồn: `SPECIFICATIONS.md` R-08 · `docs/API_SPEC.md`.
