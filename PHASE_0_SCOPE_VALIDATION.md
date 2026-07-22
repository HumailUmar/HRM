# Phase 0 Scope Validation

## Scope decision

**HRM system scope:** authenticated web application, React feature modules, Express API, DataService, local/SQL/Google Sheets adapters, AI/Drive/WhatsApp/biometric integrations, and persistence/refresh behavior.

**Generic content-rewriting pipeline scope:** not present in the production codebase.

## Checklist-to-HRM mapping

| Checklist gate | HRM mapping | Status | Evidence / decision |
|---|---|---:|---|
| Critical FR implementation | FR-001 through FR-092 | PARTIAL | `FUNCTIONAL_REQUIREMENTS.md`, `IMPLEMENTATION_AUDIT.md`; several FRs remain adapter/integration dependent. |
| Single unified execution pipeline | FR-023–029, FR-075, FR-083 | PARTIAL | DataService is the primary service boundary, but some components and adapters still use parallel/local paths. |
| CLI/API parity | None | NOT APPLICABLE / UNDEFINED | No CLI entry point or CLI contract exists in `package.json`, `src/`, `server.ts`, or README. Requires scope decision before implementation. |
| `MAX_PIPELINE_CHUNKS` | None | NOT APPLICABLE / UNDEFINED | No constant, configuration, endpoint, or pipeline-chunk concept exists in the production code. Requires scope decision before implementation. |
| Protected text byte preservation | None | NOT APPLICABLE / UNDEFINED | No protected-text transformation pipeline exists. The current test only validates a string round trip and does not establish a production invariant. |
| Citation position preservation | None | NOT APPLICABLE / UNDEFINED | No citation parser, citation model, or text transformation service exists. Current test is standalone utility logic, not a production guarantee. |
| Em-dash rule | None | NOT APPLICABLE / UNDEFINED | No content normalization pipeline exists. Current test is standalone utility logic. |
| Redundancy-removal safety | None | NOT APPLICABLE / UNDEFINED | No redundancy-removal implementation exists. |
| Proper-noun preservation | Recruitment/matching only: FR-057–062 | PARTIAL | Matching normalizes skill text, but there is no general proper-noun protection pipeline. |
| Determinism | FR-057–062, FR-089 | PARTIAL | Matching score components are deterministic; generated IDs/timestamps and external AI responses are not identical-output deterministic. |
| Data/content safety | FR-018–021, FR-029, FR-082, FR-090 | PARTIAL | Validation, serialization checks, and log redaction exist; all entity adapters do not share one schema/round-trip contract. |
| Constraint enforcement | FR-011, FR-017–022, FR-030–039, FR-048–050, FR-060–061 | PARTIAL | Role, rate, schema, scoring, payroll, and biometric constraints exist; complete cross-module coverage is not proven. |
| Failure handling | FR-017–024, FR-046, FR-084–090 | PARTIAL | Retry, circuit breaker, rollback, classified errors, and boundaries exist; external integration failure coverage is incomplete. |
| Adversarial validation | FR-018–022, FR-056, FR-064, FR-072, FR-088–089 | PARTIAL | Unit and API adversarial tests exist, but complete external and stress coverage is absent. |
| Regression safety | Existing Jest suite plus production requirements tests | PASS locally | 13 suites / 51 existing tests pass; production requirements test suite has 15 passing tests. |
| Observability | FR-037, FR-075, FR-084–091 | PARTIAL | Logging, audit history, sync logs, redaction, and metrics exist; complete mutation traceability is not universal. |

## Scope decisions required before implementation

### Decision SCOPE-001 — CLI/API parity

- **Current state:** No CLI exists.
- **Required decision:** Either remove CLI/API parity from the HRM handover gate or define and approve a CLI contract.
- **Default recommendation:** Mark CLI/API parity as not applicable to this web/API HRM system unless a CLI is a product requirement.

### Decision SCOPE-002 — MAX_PIPELINE_CHUNKS

- **Current state:** No chunked processing pipeline exists.
- **Required decision:** Either remove this gate or define what an HRM chunk represents: import rows, batch records, AI messages, spreadsheet rows, or another unit.
- **Default recommendation:** Replace it with existing HRM batch-size requirements (`MAX_BULK_SIZE`, file-size limits, rate limits) rather than inventing a new unrelated constraint.

### Decision SCOPE-003 — Text transformation gates

- **Current state:** Protected text, citations, em-dash normalization, redundancy removal, and general proper-noun preservation are not HRM production features.
- **Required decision:** Remove these gates from HRM handover or provide a product specification and production entry point.
- **Default recommendation:** Keep only recruitment matching text normalization under FR-057–062; do not add a generic content rewriting subsystem without approved FRs.

## Phase 0 result

**Status: BLOCKED FOR FULL CHECKLIST SIGN-OFF**

The HRM FR scope and the generic content-pipeline checklist are not fully aligned. HRM-specific requirements can continue through implementation and verification, but the three scope decisions above must be resolved before claiming every checklist item is applicable and satisfied.

## Current executable validation

- `npm run lint`: PASS
- Full Jest suite: PASS — 13 suites, 51 tests
- Production requirements suite: PASS — 15 tests
- `npm run build`: PASS
- `git diff --check`: PASS
