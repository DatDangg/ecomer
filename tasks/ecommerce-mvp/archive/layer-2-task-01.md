# Task 01: Upload module (Cloudinary image upload)

## Layer
2

## Type
build (initial)

## Description
`POST /upload/image` (login required, multipart field `file`): nhận `jpeg|png|webp` ≤ 5MB, upload lên
Cloudinary, trả `{ url }`. Dùng `multer` memory storage + Cloudinary SDK đọc env `CLOUDINARY_*`.
Expose helper `isOwnCloudinaryUrl(url)` để Product layer validate mảng ảnh.

## Dependencies
- task-04 Layer 0 (guards/login) + task-02 Layer 0 (contract/error)

## Acceptance Criteria
- [ ] Chỉ user đăng nhập upload được (401 nếu thiếu token).
- [ ] File sai định dạng → 400; > 5MB → 400; thiếu field `file` → 400.
- [ ] File hợp lệ trả `{ url }` là URL Cloudinary thuộc cloud của app.
- [ ] `isOwnCloudinaryUrl` trả false cho URL domain khác.
- [ ] Không log/echo secret Cloudinary.
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
- Manual/UAT evidence: upload file .png thật → nhận URL mở được; upload .gif → 400.
- Reviewer report path: `.context/review-reports/feature-ecommerce-mvp-layer-2-task-01-round-1-review.md`

## Files to Create/Modify
- `backend/src/modules/upload/upload.controller.ts`
- `backend/src/modules/upload/upload.service.ts` (Cloudinary)
- `backend/src/modules/upload/upload.module.ts`
- `backend/src/modules/upload/upload.util.ts` (`isOwnCloudinaryUrl`)

## Notes
- URL hợp lệ: prefix `https://res.cloudinary.com/<CLOUDINARY_CLOUD_NAME>/`.
- Nguồn: `SPECIFICATIONS.md` R-13 · `docs/ARCHITECTURE.md` §6.1.
