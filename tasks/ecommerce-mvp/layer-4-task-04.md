# Task 04: VNPay callbacks (Return/IPN idempotent + cron expire)

## Layer
4

## Type
build (initial)

## Description
`GET /payments/vnpay/return` (browser) + `GET /payments/vnpay/ipn` (server-to-server) dùng **chung một hàm
idempotent** (`findOneAndUpdate({ _id, status: 'pending' })`). Verify HMAC-SHA512 (Layer 3) + số tiền.
Success → mọi Order con `confirmed` + `paid`, xoá item đã mua khỏi cart. Fail/timeout → mọi Order
`cancelled` + hoàn stock (1 lần). Mọi callback (kể cả sai chữ ký) lưu vào `payments`. Cron mỗi phút expire
checkout `pending` quá `expiresAt`; late success ghi `note = late_success_after_expiry`. RspCode 00/01/02/04/97/99.

## Dependencies
- task-02 Layer 3 (Checkout/Order/Payment models + restock) + task-03 Layer 3 (VnpayService verify/build)

## Acceptance Criteria
- [ ] Return + IPN dùng chung handler idempotent; gọi lặp không đổi kết quả lần hai.
- [ ] Sai chữ ký → từ chối xử lý nhưng **vẫn lưu** callback vào `payments`; số tiền sai → fail.
- [ ] Success → tất cả Order con `confirmed`+`paid`; item đã mua xoá khỏi cart.
- [ ] Fail/timeout → tất cả Order `cancelled` + hoàn stock đúng 1 lần.
- [ ] Cron mỗi phút expire checkout pending quá hạn; late success ghi `note = late_success_after_expiry`.
- [ ] Trả `RspCode` đúng chuẩn VNPay (00/01/02/04/97/99).
- [ ] `api_lint` + `api_typecheck` + `test` PASS.

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass (idempotent + verify + expire)
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS
- [ ] committed

## Verification Plan
- Commands:
  - `npm --prefix backend run lint`
  - `npx tsc --noEmit -p backend/tsconfig.json`
  - `npm --prefix backend run test`
- Manual/UAT evidence: gọi IPN 2 lần cùng `TxnRef` → chỉ xử lý 1 lần; IPN sai chữ ký được log.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-4-task-04-round-1-review.md`

## Files to Create/Modify
- `backend/src/modules/payments/payments.controller.ts` (return + ipn)
- `backend/src/modules/payments/payments.service.ts` (idempotent handler)
- `backend/src/modules/payments/checkout-expiry.cron.ts`

## Notes
- Callback VNPay là public route (VNPay gọi) — không bọc JwtAuthGuard, nhưng **bắt buộc verify checksum**.
- Review mức STRICT (payment/security).
- Nguồn: `SPECIFICATIONS.md` R-08 · `docs/API_SPEC.md`.
