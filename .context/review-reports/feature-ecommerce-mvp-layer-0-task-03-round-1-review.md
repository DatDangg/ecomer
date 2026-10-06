# Review — Ecommerce MVP / Layer 0 / Task 03 / Round 1

- **Review level:** STRICT
- **Reason:** The scope is documentation/configuration only, but it documents MongoDB transaction prerequisites and environment credentials. Incorrect guidance can prevent the core checkout transaction from working; therefore I reviewed the DB/setup references conservatively. No application code, schema, migration, or UI was changed.
- **Blast radius:** Root onboarding (`README.md`), local setup (`docs/RUNBOOK.md`, `docs/MONGO_LOCAL_REPLICA_SET.md`), backend/frontend environment templates, `.gitignore`, and developers following the linked environment/deployment guides. No API/client/data implementation is changed.

## Requirements and scope checks

- README includes backend npm and frontend pnpm install/dev instructions and the configured lint/typecheck/test commands: **PASS** (`README.md:25-50`).
- Backend env template includes the canonical required environment keys from `.context/project-config.md` § Secrets, plus app/runtime and IPN settings: **PASS** (`backend/.env.example:4-46`; config `:106-112`). Values are placeholders/local defaults, not real credentials.
- Frontend template includes `VITE_API_URL`: **PASS** (`frontend/.env.example:4-9`).
- `.gitignore` has rules for `.env`, `node_modules/`, `dist/` and build outputs, and negated rules for `.env.example`: **PASS by static inspection** (`.gitignore:1-18`). Runtime verification was blocked; see below.
- Local single-node replica set instructions include `mongod --replSet`, `rs.initiate()`, primary-state check, replica-set URI, transaction probe, and explicit standalone transaction failure: **PASS** (`docs/MONGO_LOCAL_REPLICA_SET.md:23-87`). Runbook also calls replica set mandatory (`docs/RUNBOOK.md:89-101`), consistent with `docs/ARCHITECTURE.md:197-208` and `:212-217` and the deployment guide.
- **Cross-reference conflict:** `README.md:30` and `docs/RUNBOOK.md:4` direct developers to `project-ecommerce/09-environment-setup.md` for env setup. That linked document still says replica set/transactions are not required (`project-ecommerce/09-environment-setup.md:142-145`), contrary to this task's new guides and `docs/ARCHITECTURE.md:214-216`. The new guides state the correct requirement, but the onboarding references leave conflicting setup instructions in the path.

## Verify commands + result

- Configured backend/frontend lint, typecheck, and test commands: **skip, no app code changed** (docs/config-only task; configured profile and task verification plan both specify this skip).
- `git check-ignore -v --no-index .env backend/.env backend/.env.example frontend/.env.example backend/node_modules/probe frontend/dist/probe`: **Blocked** — shell permission denied. Per tool-loop policy, did not retry. Static inspection of `.gitignore` confirms the expected ignore and exception patterns, but actual Git matching remains unverified.

## Responsive Checklist Gate

- **N/A** — no UI route/component/CSS changed; this docs/config-only task does not require responsive testing.

## Skill gates

- **aislop:** N/A — no application code changed.
- **oxlint (anti-slop):** N/A — no TS/JS changed.
- **ocr (open-code-review):** skip — docs/config-only scope; availability was not checked because shell access was denied.
- **AI-readable:** OK — no code-level AI-chaos indicators introduced in the reviewed files; README and architecture documentation exist. The conflicting setup cross-reference is reported separately below.
- **AI-friendly web:** N/A — this task changes internal project setup documentation, not public-facing web pages.
- **blitzstrike:** N/A — no auth/API/input implementation or live attack surface changed.

## Findings

1. **[MAJOR] Conflicting MongoDB prerequisite in the linked setup guide.** `README.md:30` and `docs/RUNBOOK.md:4` direct new contributors to `project-ecommerce/09-environment-setup.md` for env setup; that guide's `:142-145` says replica sets/transactions are not required. Following it can lead to a standalone MongoDB setup where checkout transactions fail, directly contradicting the local replica-set guide (`docs/MONGO_LOCAL_REPLICA_SET.md:3-6, 91-96`) and architecture (`docs/ARCHITECTURE.md:214-216`). **Suggested fix:** update the in-scope README/RUNBOOK references to explicitly state that their replica-set requirement supersedes the stale MongoDB note in the linked guide, or reconcile that guide in a separately scoped change.

## Residual risk

- Git ignore behavior could not be confirmed with `git check-ignore` because shell permission was denied. The patterns appear correct on static inspection, including `.env.example` negations.
- The stale statement in `project-ecommerce/09-environment-setup.md` remains outside the task's declared changed-file list.

## Verdict

**❌ FAIL** — one MAJOR onboarding contradiction remains. Resolve or explicitly disambiguate the linked MongoDB guidance, then rerun review.
