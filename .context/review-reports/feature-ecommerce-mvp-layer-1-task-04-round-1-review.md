# Independent Review — ecommerce-mvp Layer 1 Task 04

- **Review level:** STRICT
- **Reason:** Adds a public API and database-backed Product schema/seed path; both database integrity and shared API contract are high-risk review triggers.
- **Blast radius:** `ProductsModule` and `GET /api/v1/products[/:id]`; Product schema/indexes and browse consumers; sample Category/Product records in the configured development database; `AppModule` module registration and the manually invoked seed runner.

## Verify commands + result

Commands below are the API commands configured in `.context/project-config.md` and were run independently:

| Command | Result |
|---|---|
| `npm --prefix backend run lint` | PASS (exit 0) |
| `npm --prefix backend exec -- tsc --noEmit -p backend/tsconfig.json` | PASS (exit 0) |
| `npm --prefix backend run test` | PASS — 37 suites, 246 tests passed |

`seed:sample` was not run: it connects to a configured MongoDB and this review is not authorized to execute DB/manual verification. Seed service automated tests passed as part of the configured test command; real-database seed behavior remains a residual risk.

## Scope / requirements review

- Public list always applies `isActive: true, isBlocked: false`; detail applies the same filter and rejects invalid ObjectId strings before querying. Controller converts a null detail result to 404.
- DTO restricts sort fields/orders, validates Mongo IDs and nonnegative integer price bounds; shared pagination parsing clamps limit to 100. Service uses inclusive `$gte`/`$lte`, computes total with the same filter, and defaults to `createdAt desc`.
- Sample data has 8 products across 3 categories, including zero stock, inactive, and blocked records; uses public Picsum URLs, checks existing slug/category before create, and handles duplicate-key races. No seller CRUD/upload/moderation/cart scope was added.
- `@Public()` is applied to both browse routes. No request-body write routes exist, so `sellerId`/`slug`/`isBlocked` mass assignment is not exposed in this task.
- The paginated response data uses the shared `{ items, total, page, limit, totalPages }` builder and the application response wrapper supplies `{ success, data }`.

## Responsive Checklist Gate

**N/A** — this diff adds no route/component/CSS for a browser UI. The configured UI breakpoints (375/768/1280) therefore do not apply.

## Skill gates

- **aislop:** `skip — CLI not installed`; attempted `aislop scan --changes --json`, which returned `command not found` (exit 127), so no score is available.
- **oxlint (anti-slop):** **OK** — `npx oxlint` completed with 0 warnings and 0 errors (156 files, 96 rules).
- **ocr (open-code-review):** `skip — not installed`; attempted `ocr review --format json`, returned `command not found` (exit 127).
- **AI-readable:** **OK** — inspected new implementation files have descriptive names and focused responsibilities; visible implementation files are below 300 lines (largest is `sample-seed.service.ts`, 267 lines), and the reviewed methods are below 50 lines. No three-indicator AI-chaos threshold found. Test fixtures/harnesses were not exhaustively line-counted in this pass.
- **AI-friendly-web:** **N/A** — change exposes a backend API only; it does not add a public web page/site surface or alter crawler resources.
- **blitzstrike:** `skip — no authorized live target/environment was provided`; no pentest was run. Static review and configured tests only.

## Findings

### [MAJOR] Seed fabricates a seller reference when no real customer exists

- **Location:** `backend/src/database/seed/sample-seed.service.ts:24-26, 220-233`
- When no active customer is found, the seed uses the constant all-zero ObjectId as `sellerId`. This ID does not identify a real user, yet the Product schema declares `sellerId` required and references `User`. The resulting seeded products have orphaned ownership references, contrary to the requirement to use an existing customer and not fabricate a seller; later seller/shop/order flows can fail to resolve the owner. Passing the browse tests does not validate this data relationship.
- **Suggested fix:** Never invent a seller ID. If no real eligible customer exists, stop/skip Product seeding with a clear warning (or first resolve the task/schema requirement for seller-less sample products); preserve the required `sellerId` invariant and add a test asserting no orphan reference is written.

## Residual risk

- Actual seed execution/idempotency against MongoDB was not independently exercised; automated seed unit tests and all configured verification commands passed. No app/browser/DB manual reproduction was performed.
- No live pentest was possible without an authorized target. `aislop` and `ocr` were unavailable in this environment.

## Verdict

❌ **FAIL** — one MAJOR database-integrity/ownership defect remains.
