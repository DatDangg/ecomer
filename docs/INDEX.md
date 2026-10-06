# docs/ — Index

> `/spec-init` auto-scan và classify file trong `docs/`. File này phân loại rõ
> **canonical** (dùng để validate) vs **historical** (tham khảo, không dùng để chặn).

## Canonical (source of truth — dùng để validate)

| File | Loại | Ghi chú |
|------|------|---------|
| `BRD.md` | business_requirements | Yêu cầu nghiệp vụ (intent) |
| `PRD.md` | product_requirements | **PRD chi tiết** — persona, feature spec, AC, state machine, edge cases, release plan |
| `USER_FLOW.md` | user_flow | Luồng Guest/Buyer/Seller/Admin/System + edge cases (theo BR-AUTH-012) |
| `ARCHITECTURE.md` | architecture | Kiến trúc hệ thống, module, request lifecycle, quyết định thiết kế |
| `DESIGN.md` | design_spec | Design spec + screen inventory (Stitch) + responsive |
| `API_SPEC.md` | api_spec | **Overview + pointer** → code + `src/shared/types/api.ts` |
| `ERD.md` | database_schema | **Overview + pointer** → migration/schema file |
| `PERMISSION.md` | business_rules | Role list + guard order, **sync từ seed + guards thật** |
| `generated/` | generated | Sinh tự động bằng `check_commands.docs_inventory` — **không sửa tay** |

## Historical (tham khảo — không dùng để validate)

| File | Ghi chú |
|------|---------|
| `diagrams/` | Diagram minh họa (archify) — verify với code trước khi tin |
| `../project-ecommerce/01..10` | Spec nghiệp vụ chi tiết (nguồn dựng BRD/DESIGN/API/ERD/PERMISSION). **Có phần cũ/mâu thuẫn** — roadmap & `BR-AUTH-012` mới hơn; xem `BRD.md` § Open Questions |
| `../PRODUCT_BACKLOG_ROADMAP.md` | Backlog + trạng thái thực thi (bản `2026-10-06`, mới nhất). Roadmap thắng khi mâu thuẫn doc cũ |

## Optional: manual classification hint

Nếu muốn bỏ auto-detect, điền:

```yaml
# - filename.md: brd
# - filename.md: design
# - filename.md: api_spec
# - filename.md: erd
# - filename.md: architecture
# - filename.md: other
```

## Không có docs?

Để trống/điền tối thiểu — `/spec-init` sẽ dựng spec từ code.

## Quy tắc

- **Không nhúng code/schema tay** vào docs canonical → dùng pointer + `docs/generated/`.
- Mọi thay đổi code/config/docs/schema → commit-first tracking là source of truth.
