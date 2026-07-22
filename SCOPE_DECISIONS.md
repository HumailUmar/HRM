# HRM Production Handover Scope Decisions

## Decision SCOPE-001 — CLI/API parity

**Decision:** NOT APPLICABLE to the HRM production product.

**Rationale:** HRM has a web client and authenticated Express API. There is no CLI product surface, CLI command contract, or CLI entry point. The API is the supported programmatic entry point.

**Release treatment:** The CLI/API parity gate is removed from the HRM release gate. API contract tests remain mandatory.

## Decision SCOPE-002 — MAX_PIPELINE_CHUNKS

**Decision:** NOT APPLICABLE as named.

**Rationale:** HRM does not process a content-rewriting pipeline divided into chunks. HRM uses domain batches and already enforces applicable constraints through:

- `MAX_BULK_SIZE` for API bulk requests.
- 50MB importer file limit.
- Express JSON and URL-encoded body limits.
- Route-specific rate limits.
- Video-analysis size and concurrency limits.

**Release treatment:** `MAX_PIPELINE_CHUNKS` is not introduced because it would be unrelated behavior. Existing HRM batch and payload limits are the enforced equivalents.

## Decision SCOPE-003 — Protected text, citation position, em-dash, redundancy, and general proper-noun rules

**Decision:** NOT APPLICABLE to HRM production.

**Rationale:** HRM does not rewrite arbitrary prose. Its only production text transformation is recruitment matching normalization, which is covered by FR-057–062 and matching tests. Adding a generic text-rewriting subsystem would introduce unapproved product behavior.

**Release treatment:** These content-rewriting gates are removed from the HRM release gate. Recruitment skill normalization, candidate/job data preservation, and match-result integrity remain mandatory.

## Applicable HRM release gates

The following remain mandatory and are verified by the HRM test/build pipeline:

- Authentication and authorization.
- Input and schema validation.
- Adapter selection and persistence.
- Offline queue behavior.
- Employee lifecycle state constraints.
- Attendance, leave, payroll, and biometric processing.
- Recruitment matching and score guardrails.
- Onboarding, performance, training, and document persistence.
- External integration failure handling.
- Stale-write conflict handling for Google Sheets.
- Optimistic-state rollback.
- Audit history and log redaction.
- API contract and RBAC tests.
- Production type-check and build.

## Decision result

The generic checklist is now scope-reconciled to the HRM product. No generic CLI, chunked prose pipeline, citation transformer, or redundancy-removal subsystem will be added without a new approved product requirement.
