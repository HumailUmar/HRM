# Functional Requirements Audit

Audit basis: current checked-out source. Status is based on behavior, not symbol presence. `PARTIAL` includes code that exists but does not fully satisfy the stated FR.

## Per-FR verification

[FR-001]
- **Status:** IMPLEMENTED
- **Evidence:** `server.ts` — `startServer`, Vite/static middleware and `app.get('*')`; serves SPA/static assets and fallback.
- **Gap:** None identified.

[FR-002]
- **Status:** IMPLEMENTED
- **Evidence:** `src/main.tsx` — `createRoot`; `src/App.tsx` — lazy imports, `ErrorBoundary`, `Suspense`, `ToastContainer`; `src/contexts/DataContext.tsx` — `DataProvider`.
- **Gap:** None identified.

[FR-003]
- **Status:** IMPLEMENTED
- **Evidence:** `src/main.tsx` — `getSettings()` passed to `DataProvider`; `DataContext.tsx` — service memoization; `DataService.ts` — constructor/createAdapter.
- **Gap:** Settings are loaded, but settings changes are not all guaranteed to recreate the provider because the provider receives its original `getSettings()` value.

[FR-004]
- **Status:** PARTIAL
- **Evidence:** `src/lib/auth.ts` — `getToken()` returns `null`; comments and `getAuthHeaders()` rely on HttpOnly cookies.
- **Gap:** The design avoids a JS-readable JWT, but `App.tsx` still calls `getToken()` during restore, making cookie-only restoration inconsistent with the gate in `App.tsx`.

[FR-005]
- **Status:** IMPLEMENTED
- **Evidence:** `src/App.tsx` — `isAuthLoading` branch renders `Loading...` before authenticated content.
- **Gap:** None identified.

[FR-006]
- **Status:** IMPLEMENTED
- **Evidence:** `src/lib/auth.ts` — `googleSignIn`; Firebase popup, workspace scopes, ID-token POST to `/api/v1/auth/google`.
- **Gap:** None identified.

[FR-007]
- **Status:** IMPLEMENTED
- **Evidence:** `server.ts` — `/api/v1/auth/google`; verifies Google token and creates server auth state.
- **Gap:** Exact provider/account policy is configuration-dependent, but verification is present.

[FR-008]
- **Status:** IMPLEMENTED
- **Evidence:** `src/lib/auth.ts` — `AuthUser` role union; `server.ts` — auth user/authorization handling.
- **Gap:** Role assignment source is server/database configuration, not a client-enforced rule.

[FR-009]
- **Status:** PARTIAL
- **Evidence:** `src/App.tsx` — `restoreSession`; `src/lib/auth.ts` — `verifySession`; `server.ts` — `/api/v1/auth/verify`.
- **Gap:** `restoreSession` first calls `getToken()`, which always returns null, so the existing HttpOnly-cookie session is not actually attempted by this path.

[FR-010]
- **Status:** PARTIAL
- **Evidence:** `src/lib/auth.ts` — `logout`, `clearAuthData`; `src/App.tsx` — `handleSignOut` clears domain arrays.
- **Gap:** App sign-out does not clear departments, designations, or settings state; server-side invalidation semantics are not fully evidenced.

[FR-011]
- **Status:** PARTIAL
- **Evidence:** `src/App.tsx` — `canAccess`; `server.ts` — `authenticateToken`/`authorize` on protected endpoints.
- **Gap:** `leaves` renders `<Leaves />` without `canAccess`; portal render paths also do not consistently use the permission map.

[FR-012]
- **Status:** IMPLEMENTED
- **Evidence:** `src/App.tsx` — `canAccess` defaults `role || 'Employee'` and renders missing-role warning.
- **Gap:** None identified.

[FR-013]
- **Status:** IMPLEMENTED
- **Evidence:** `src/App.tsx` — `canAccess` checks `tab in permissions`, logs unknown tab, returns false.
- **Gap:** None identified.

[FR-014]
- **Status:** PARTIAL
- **Evidence:** `src/lib/auth.ts` — `getAuthHeaders`, `credentials:'same-origin'`; `server.ts` — CORS/CSRF middleware.
- **Gap:** Not every request in every integration is proven to use the helper; CSRF enforcement details are not uniformly evidenced for all routes.

[FR-015]
- **Status:** IMPLEMENTED
- **Evidence:** `server.ts` — raw WhatsApp body middleware, `express.json({limit:'2mb'})`, `express.urlencoded({limit:'200mb'})`, Multer upload.
- **Gap:** XLS/TSV handling is not covered by the generic body parsers.

[FR-016]
- **Status:** IMPLEMENTED
- **Evidence:** `server.ts` — `cors(corsOptions)` before route registration.
- **Gap:** Actual allowed-origin values depend on environment.

[FR-017]
- **Status:** IMPLEMENTED
- **Evidence:** `server.ts` — `apiLimiter`, `aiLimiter`, `sheetsLimiter`, `whatsappLimiter`, `biometricLimiter` mounted on the relevant route groups.
- **Gap:** Limits are configuration behavior, not validated against a product SLA.

[FR-018]
- **Status:** PARTIAL
- **Evidence:** `src/services/DataService.ts` — empty-ID checks in getters and null checks in saves; server route handlers validate some required fields.
- **Gap:** Enforcement is not uniform across every entity, adapter, and endpoint.

[FR-019]
- **Status:** PARTIAL
- **Evidence:** `src/lib/validators.ts` — `validateEmail` implements trim/regex/local/domain checks.
- **Gap:** The validator is not shown as being applied to every employee, candidate, importer, and auth input; schema usage is the actual enforcement point and differs by path.

[FR-020]
- **Status:** IMPLEMENTED
- **Evidence:** `src/services/DataService.ts` — `validate`, `validateArray`; `src/lib/schemas.ts` — entity schemas.
- **Gap:** Validation can be intentionally bypassed in mock mode via `shouldSkipValidation`.

[FR-021]
- **Status:** PARTIAL
- **Evidence:** `src/services/DataService.ts` — `shouldSkipValidation`; adapter validation branches.
- **Gap:** Mock-mode bypass is implemented, but it weakens the stated requirement that bypass be explicitly safe/limited; no complete production-mode audit was found.

[FR-022]
- **Status:** IMPLEMENTED
- **Evidence:** `src/lib/retry.ts` — retry/backoff/circuit breaker; `src/lib/auth.ts` and server integration calls use retry/limit behavior.
- **Gap:** Not every adapter operation demonstrably uses retry/circuit breaker.

[FR-023]
- **Status:** IMPLEMENTED
- **Evidence:** `src/services/DataService.ts` — `createAdapter`; `src/services/DataAdapterFactory.ts` — storage-type dispatch.
- **Gap:** None identified for supported adapter selection.

[FR-024]
- **Status:** IMPLEMENTED
- **Evidence:** `src/services/DataAdapterFactory.ts` — missing Google Sheets spreadsheet ID logs warning and falls back to local storage.
- **Gap:** None identified.

[FR-025]
- **Status:** IMPLEMENTED
- **Evidence:** `src/App.tsx` — `loadAll` uses `Promise.allSettled` for all eleven datasets.
- **Gap:** None identified.

[FR-026]
- **Status:** IMPLEMENTED
- **Evidence:** `src/App.tsx` — independent `useState` collections and `applyResult` per dataset.
- **Gap:** None identified.

[FR-027]
- **Status:** IMPLEMENTED
- **Evidence:** `src/App.tsx` — `handleSyncAll` sets busy state, calls `data.syncAll`, reloads via `Promise.allSettled`, clears in `finally`.
- **Gap:** None identified.

[FR-028]
- **Status:** PARTIAL
- **Evidence:** `src/services/DataService.ts` — offline branches enqueue employee/attendance/leave/payroll/candidate bulk requests; `src/lib/offlineQueue.ts`.
- **Gap:** Queue coverage is not universal (single-record writes and several modules bypass it), and replay/convergence behavior is not demonstrated for all queued operations.

[FR-029]
- **Status:** PARTIAL
- **Evidence:** `src/services/DataService.ts` — validates before adapter writes; `src/lib/schemas.ts`, unit deserializer tests; adapter serializers.
- **Gap:** Adapter-specific round-trip behavior differs; no single canonical serializer contract covers every new module.

[FR-030]
- **Status:** IMPLEMENTED
- **Evidence:** `src/components/Employees.tsx` — employee form; `src/services/DataService.ts` — `saveEmployee`; `src/lib/schemas.ts` — employee schema.
- **Gap:** Uniqueness behavior is adapter-dependent and not consistently proven for email/ID.

[FR-031]
- **Status:** IMPLEMENTED
- **Evidence:** `src/components/Employees.tsx` — edit/save flow; `src/services/DataService.ts` — save; `src/lib/deepMerge.ts` used by employee update paths.
- **Gap:** Some form paths submit full objects, so preservation depends on the component rather than one universal patch contract.

[FR-032]
- **Status:** IMPLEMENTED
- **Evidence:** `server.ts` — `DELETE /api/v1/employees/:id` authorized for Admin; `DataService.deleteEmployee`; Employees UI.
- **Gap:** None identified at endpoint authorization level.

[FR-033]
- **Status:** PARTIAL
- **Evidence:** `server.ts` — `PUT /api/v1/employees/bulk`; `DataService.saveEmployees`; `DataImporter.tsx`.
- **Gap:** Importer’s visible Import Data button has no handler, so the end-to-end bulk import path is incomplete.

[FR-034]
- **Status:** IMPLEMENTED
- **Evidence:** `src/components/Departments.tsx`; `DataService.getDepartments/saveDepartment`; department schema.
- **Gap:** Referential deletion/update constraints are not clearly enforced.

[FR-035]
- **Status:** IMPLEMENTED
- **Evidence:** `src/components/Designations.tsx`; `DataService.getDesignations/saveDesignation`; designation schema.
- **Gap:** Referential deletion/update constraints are not clearly enforced.

[FR-036]
- **Status:** PARTIAL
- **Evidence:** `src/types.ts` — supported status union and status-specific fields; `src/components/Employees.tsx` — status UI.
- **Gap:** Cross-field requirements for each status/date/reason are not fully enforced by the shared schema.

[FR-037]
- **Status:** PARTIAL
- **Evidence:** `src/services/DataService.ts` — `generateEmployeeDiff`, `addEmployeeHistory`; `src/components/AuditTrail.tsx`; server audit routes.
- **Gap:** History is not proven to run on every employee mutation, and immutability/retention is not enforced.

[FR-038]
- **Status:** IMPLEMENTED
- **Evidence:** `src/types.ts` — education/certification/employer/checklist/compensation structures; Employees detail tabs and save paths.
- **Gap:** None material identified for data representation.

[FR-039]
- **Status:** IMPLEMENTED
- **Evidence:** `src/services/AttendanceService.ts` — `log` rejects missing employee/date; attendance schema and Attendance UI.
- **Gap:** Status/time cross-field validation is limited.

[FR-040]
- **Status:** IMPLEMENTED
- **Evidence:** `src/services/AttendanceService.ts` — `getByEmployee`, `getByDateRange` inclusive comparisons, `getMonthly` calendar filtering.
- **Gap:** Date parsing/time-zone semantics may differ between adapters.

[FR-041]
- **Status:** IMPLEMENTED
- **Evidence:** `src/services/AttendanceService.ts` — `calculateStats` counts Full Day, Absent, Half Day, On Leave.
- **Gap:** Exact case/status normalization is not universal.

[FR-042]
- **Status:** IMPLEMENTED
- **Evidence:** `AttendanceService.bulkLog`; `DataService.saveAttendance`; `PUT /api/v1/attendance/bulk`.
- **Gap:** Transactional all-or-nothing semantics are adapter-dependent.

[FR-043]
- **Status:** PARTIAL
- **Evidence:** `src/components/ShiftManagement.tsx`; employee shift field in `src/types.ts`.
- **Gap:** A complete persisted shift service/schema and validation of employee assignment were not found.

[FR-044]
- **Status:** IMPLEMENTED
- **Evidence:** `src/services/LeaveService.ts`, `DataService.getLeaves/getLeavesByEmployee/saveLeave`, `src/pages/Leaves.tsx`.
- **Gap:** Some leave form/business rule validation is component-local.

[FR-045]
- **Status:** IMPLEMENTED
- **Evidence:** `src/App.tsx` — `handleUpdateLeaveStatus` sets status, approver, timestamp; `server.ts` — `/leaves/:id/approve` authorization.
- **Gap:** No explicit transition guard preventing re-approval of already finalized leave was found.

[FR-046]
- **Status:** IMPLEMENTED
- **Evidence:** `src/App.tsx` — previousLeaves snapshot and rollback in catch.
- **Gap:** Rollback is client-state only; concurrent server changes are not reconciled.

[FR-047]
- **Status:** IMPLEMENTED
- **Evidence:** `server.ts` — payroll GET/POST/bulk routes authorized HR/Admin; `Payroll.tsx`, `DataService` payroll methods.
- **Gap:** None identified for role restriction.

[FR-048]
- **Status:** PARTIAL
- **Evidence:** `server.ts` — `/api/v1/payroll/run`; `src/services/PayrollService.ts`; `Payroll.tsx`.
- **Gap:** Exact pay-period, tax/deduction, rounding, idempotency, and duplicate-run guarantees are not fully enforced/evidenced.

[FR-049]
- **Status:** IMPLEMENTED
- **Evidence:** `src/services/biometric/BiometricAdapterFactory.ts`; Settings biometric UI; server `/api/biometric/test` and vendor test routes.
- **Gap:** Configuration validation depth varies by adapter.

[FR-050]
- **Status:** PARTIAL
- **Evidence:** `src/services/biometric/BiometricSyncService.ts`; server vendor punch/user/sync routes; biometric sync logs in DataService.
- **Gap:** Exact duplicate key/conflict handling and unmatched-punch workflow are not consistently explicit.

[FR-051]
- **Status:** IMPLEMENTED
- **Evidence:** `src/components/Recruitment.tsx`; `DataService.getCandidates/saveCandidate/saveCandidates`; candidate schema.
- **Gap:** Candidate uniqueness/contact validation is not uniform.

[FR-052]
- **Status:** IMPLEMENTED
- **Evidence:** `src/components/JobDescriptions.tsx`; `DataService.getJobDescriptions/saveJobDescriptions`; `JobDescription` types.
- **Gap:** Requirement category/value cross-validation is limited.

[FR-053]
- **Status:** IMPLEMENTED
- **Evidence:** `src/pages/DataImporter.tsx` — `handleFileUpload`, Papa Parse `header:true`, `preview:5`.
- **Gap:** No file type/50MB enforcement is implemented in this component.

[FR-054]
- **Status:** PARTIAL
- **Evidence:** `src/pages/DataImporter.tsx` — ExcelJS first worksheet, row 5 header, rows 6–10 preview.
- **Gap:** Non-CSV inputs are all passed to `workbook.xlsx.load`; legacy XLS and TSV advertised support is not implemented.

[FR-055]
- **Status:** IMPLEMENTED
- **Evidence:** `src/pages/DataImporter.tsx` — `systemFields`, per-column select, Skip Column, mapping state.
- **Gap:** None for mapping UI.

[FR-056]
- **Status:** MISSING
- **Evidence:** `src/pages/DataImporter.tsx` — `Import Data` button is rendered without an `onClick`/submit handler; no row transformation or persistence function exists in the component.
- **Gap:** The actual import operation, validation result reporting, and bulk save are absent.

[FR-057]
- **Status:** IMPLEMENTED
- **Evidence:** `src/utils/matchingAlgorithm.ts` — `calculateMatch` calls skill/experience/education/certification calculators.
- **Gap:** None material identified.

[FR-058]
- **Status:** IMPLEMENTED
- **Evidence:** `src/utils/matchingAlgorithm.ts` — `normalizeText`, `getMatchedSkills`, `getPartialSkills`, `getMissingSkills`.
- **Gap:** Substring partial matching can produce false positives; this is current behavior rather than a missing function.

[FR-059]
- **Status:** IMPLEMENTED
- **Evidence:** `src/utils/matchingAlgorithm.ts` — `calculateExperienceScore`, zero-required returns 1, ratio capped at 1, missing experience defaults 0.
- **Gap:** Invalid/negative required values are not clearly rejected.

[FR-060]
- **Status:** IMPLEMENTED
- **Evidence:** `src/utils/matchingAlgorithm.ts` — base weights, active-category detection, redistribution, zero-active return.
- **Gap:** Requirement presence and numeric validity are assumed from input.

[FR-061]
- **Status:** IMPLEMENTED
- **Evidence:** `src/utils/matchingAlgorithm.ts` — `overallScore` capped with `Math.min(rawOverallScore, 0.49)` when required skill score is zero.
- **Gap:** None identified.

[FR-062]
- **Status:** IMPLEMENTED
- **Evidence:** `src/utils/matchingAlgorithm.ts` — percentage rounding, `getMatchLevel`, recommendation thresholds, scoringDetails, timestamps/status.
- **Gap:** IDs use `MATCH-${Date.now()}`, which can collide for same-millisecond matches.

[FR-063]
- **Status:** IMPLEMENTED
- **Evidence:** `src/services/DataService.ts` — stage templates, interview panels, scorecards, JD matches getters/savers; corresponding recruitment components.
- **Gap:** Workflow transition validation is not centralized.

[FR-064]
- **Status:** PARTIAL
- **Evidence:** `server.ts` — `/api/chat-screen`, `/api/evaluate-transcript`, `/api/evaluate-video`; AI limiter/auth/role checks and provider calls.
- **Gap:** Response schema validation, consistent confidence policy, and complete malformed-output handling are not uniformly demonstrated.

[FR-065]
- **Status:** PARTIAL
- **Evidence:** `server.ts` — raw `/api/whatsapp/webhook`, authenticated `/api/whatsapp/send`; `src/types.ts` WhatsApp status models.
- **Gap:** Provider signature verification and complete persistence/conversation lifecycle are not evident in the route code.

[FR-066]
- **Status:** IMPLEMENTED
- **Evidence:** `DataService.getOnboardingTasks/getOnboardingTemplates`; `OnboardingTemplates.tsx`, employee onboarding fields/status types.
- **Gap:** Overdue derivation/scheduling is not clearly centralized.

[FR-067]
- **Status:** PARTIAL
- **Evidence:** `src/components/HireCandidateModal.tsx`, `Recruitment.tsx`, employee/onboarding DataService methods.
- **Gap:** End-to-end atomic candidate-to-employee link and traceability are not proven across all hiring paths.

[FR-068]
- **Status:** IMPLEMENTED
- **Evidence:** `src/services/PerformanceService.ts`; `Performance.tsx`, `SelfReview.tsx`, `ManagerReview.tsx`, review/goal components.
- **Gap:** Row-level visibility depends on component filtering; a universal server policy was not found.

[FR-069]
- **Status:** IMPLEMENTED
- **Evidence:** `src/lib/scoring.ts` — weighted scoring, red-flag evaluation, `evaluateDecisionMatrix` catches invalid items and continues; performance templates.
- **Gap:** Invalid condition semantics are logged/skipped, but input schema enforcement is incomplete.

[FR-070]
- **Status:** IMPLEMENTED
- **Evidence:** `src/services/TrainingService.ts`; Training, TrainingRequests, TrainingMentor, TrainingAnalytics components.
- **Gap:** None material identified.

[FR-071]
- **Status:** IMPLEMENTED
- **Evidence:** `src/services/DocumentService.ts`; `DataService` document methods; `Documents.tsx`.
- **Gap:** File metadata/file-reference validation is not uniform.

[FR-072]
- **Status:** PARTIAL
- **Evidence:** `server.ts` — `/api/drive/upload`, `upload.single('file')`; `DataService.uploadFile`; Documents UI.
- **Gap:** Route has authentication but no role authorization middleware, and file type/size/content validation is not fully evidenced.

[FR-073]
- **Status:** PARTIAL
- **Evidence:** `src/components/CompanyPolicies.tsx`, `Settings.tsx`, `src/lib/storage.ts`, App role map.
- **Gap:** Policy viewing is client-gated, while persistence/security enforcement and settings precedence are not uniform.

[FR-074]
- **Status:** PARTIAL
- **Evidence:** `server.ts` — Drive folders/create-folder, Sheets create-in-folder, upload routes; GoogleSheetsAdapter/settings wizard.
- **Gap:** Provider error normalization, folder authorization, and complete Drive file-reference lifecycle are not consistently enforced.

[FR-075]
- **Status:** PARTIAL
- **Evidence:** `src/services/GoogleSheetsAdapter.ts`; DataService `syncAll`; server Sheets routes.
- **Gap:** The adapter supports sheet operations, but complete all-module mapping, conflict handling, and atomic sync guarantees are not demonstrated.

[FR-076]
- **Status:** IMPLEMENTED
- **Evidence:** `src/services/adapters/MySQLAdapter.ts`, `PostgreSQLAdapter.ts` — configured pool/port/timeout and database operations.
- **Gap:** Error/release behavior is adapter-library dependent and transaction coverage is not universal.

[FR-077]
- **Status:** IMPLEMENTED
- **Evidence:** `src/services/adapters/LocalStorageAdapter.ts`, `src/lib/mockData.ts`, `DataAdapterFactory.ts`.
- **Gap:** None material identified for fallback availability.

[FR-078]
- **Status:** IMPLEMENTED
- **Evidence:** `src/App.tsx` — `portalSectionMap`, mapped portal render branches and `initialSection`.
- **Gap:** Mapped portal branches are not independently passed through `canAccess`, creating an authorization gap.

[FR-079]
- **Status:** PARTIAL
- **Evidence:** `src/components/Dashboard.tsx`, `ManagerDashboard.tsx`, chart components receive domain collections and derive display values.
- **Gap:** Some dashboard data comes from independently loaded snapshots; no shared selector/refresh consistency guarantee exists.

[FR-080]
- **Status:** PARTIAL
- **Evidence:** `src/hooks/usePagination.ts`, `useDebounce.ts`, `src/lib/columnUtils.ts`, feature list components.
- **Gap:** Search/filter/sort/pagination are implemented per component, not uniformly across all tables; behavior differs by module.

[FR-081]
- **Status:** IMPLEMENTED
- **Evidence:** `src/utils/pdfGenerator.ts` — jsPDF/autotable generation; components invoke export/report flows.
- **Gap:** Export coverage is feature-specific rather than a universal report contract.

[FR-082]
- **Status:** PARTIAL
- **Evidence:** `src/lib/columnUtils.ts`, `src/lib/schemas.ts`, adapter serialization/deserialization utilities/tests.
- **Gap:** No single serializer guarantees equivalent handling for every module and backend, especially newer training/performance structures.

[FR-083]
- **Status:** PARTIAL
- **Evidence:** Feature components and `src/services/DataService.ts` show success/error toasts; `App.tsx` has rollback for leave save.
- **Gap:** Most failed saves do not perform a generic rollback or reload; optimistic-state consistency is module-specific.

[FR-084]
- **Status:** IMPLEMENTED
- **Evidence:** `src/App.tsx` — `Promise.allSettled`, per-label `logRejected`, per-result setters.
- **Gap:** None identified.

[FR-085]
- **Status:** IMPLEMENTED
- **Evidence:** `src/components/ErrorBoundary.tsx`; App wraps authenticated shell and lazy modules in boundary.
- **Gap:** Errors in the unauthenticated Login path are outside the App-level boundary.

[FR-086]
- **Status:** PARTIAL
- **Evidence:** `src/lib/auth.ts` — verify/sign-in failure clears auth and metrics; App clears most domain state on logout.
- **Gap:** Not all application state is cleared and the cookie/session invalidation contract is not fully evidenced.

[FR-087]
- **Status:** PARTIAL
- **Evidence:** `server.ts` route catch blocks for AI, Sheets, WhatsApp, biometric, Drive, and database operations.
- **Gap:** Error classes/status mapping are inconsistent; several routes collapse distinct provider failures into generic 500 responses.

[FR-088]
- **Status:** PARTIAL
- **Evidence:** `src/App.tsx` independent empty arrays; matching no-active-category branch; importer worksheet guard; adapter fallback.
- **Gap:** Several components assume non-null nested fields and no complete empty/error-state audit exists.

[FR-089]
- **Status:** PARTIAL
- **Evidence:** `src/lib/mathUtils.ts`, `src/utils/matchingAlgorithm.ts`, scoring helpers and date filters.
- **Gap:** Defensive handling exists in key calculations but invalid dates/negative values/NaN prevention is not universal, particularly across payroll and date-based UI code.

[FR-090]
- **Status:** PARTIAL
- **Evidence:** `src/lib/logger.ts`, server logging, auth/adapter error logging.
- **Gap:** Sensitive employee data and provider error objects can be passed to logs; a verified redaction policy is not evident.

[FR-091]
- **Status:** IMPLEMENTED
- **Evidence:** `server.ts` — `/api/health`, `/api/docs`, `/api/docs.json`.
- **Gap:** Documentation accuracy is generated/static behavior and was not independently checked against every route.

[FR-092]
- **Status:** IMPLEMENTED
- **Evidence:** `server.ts` — API-key generate/list/delete routes and `/api/admin/circuit-breaker/reset`, all using Admin authorization.
- **Gap:** Audit persistence for API-key lifecycle/reset was not clearly shown.

## Dependency and sequencing audit

1. **Bootstrap → auth:** broken/inconsistent. `App.tsx` gates on `getToken()` even though the auth implementation intentionally uses an HttpOnly cookie and returns `null`. This can prevent valid session restoration (FR-004, FR-009).
2. **Auth → initial load:** sequencing is otherwise correct: authenticated render precedes feature use, and initial collections load concurrently. Partial failures are isolated.
3. **Settings → adapter:** partially correct. `DataProvider` memoizes on selected settings props, but the provider receives settings from a one-time `getSettings()` call; UI setting changes do not necessarily replace the DataService instance.
4. **Importer → employee persistence:** broken. File parsing and mapping stop before transformation/persistence (FR-056), so the advertised A→Z import pipeline is incomplete.
5. **UI authorization → API authorization:** inconsistent. `leaves`, portal mappings, and Drive upload have weaker visible enforcement than the stated policy. Server endpoint policy is the authoritative safety layer, but some routes are too broad.
6. **Optimistic UI → persistence:** inconsistent. Leave has rollback; most modules do not have a common rollback/reload protocol (FR-083).
7. **External sync → canonical state:** partially complete. Adapter and sync methods exist, but conflict/transaction/deduplication behavior is backend/vendor-specific.
8. **Output → validation:** schemas protect many DataService paths, but exports, AI output, importer rows, and some provider payloads do not share a single validation boundary.

## Gap analysis

### Critical gaps

- **Session restoration can fail:** `getToken()` returns `null` while `App.tsx` requires it before calling/accepting verification.
- **Importer is non-functional end-to-end:** no Import Data handler, row mapping transformation, validation, persistence, or rejected-row report.
- **Authorization inconsistency:** leaves and portal sections are not consistently guarded; Drive upload has authentication but lacks the stated HR/Admin authorization.
- **Settings/adapter staleness:** changing settings may leave the existing DataService/adapter active because `DataProvider` is constructed from an initial settings snapshot.
- **Incomplete state clearing:** sign-out leaves departments/designations/settings in client state, risking stale cross-session display.

### Silent gaps

- No universal email/uniqueness or cross-field status validation.
- Bulk operations do not have a uniform transaction/rollback guarantee.
- Biometric duplicate/conflict rules are unclear.
- AI response schema and confidence validation are incomplete.
- XLS/TSV support is advertised but not implemented by the importer path.
- PDF/export behavior is not standardized across modules.
- Error status mapping and sensitive-log redaction are inconsistent.
- Match IDs based only on `Date.now()` can collide.

### Redundant/conflicting logic

- Client role map and server route authorization duplicate policy but are not synchronized.
- Auth comments/HttpOnly-cookie behavior conflict with the `getToken()`/`hasToken()` startup gate.
- Multiple adapters implement parallel serialization, validation, sync, and error behavior without one shared contract.
- Feature-local optimistic updates/toasts coexist with DataService error handling, producing inconsistent rollback and user feedback.

## Summary

- **Total FRs:** 92
- **Implemented:** 58
- **Partial:** 33
- **Missing:** 1

**System risk: HIGH**

The primary reasons are the potentially broken session restoration path, missing end-to-end importer operation, authorization inconsistencies, and lack of a uniform persistence/rollback/validation contract across adapters and feature modules.

## Verification note

`npm run lint` could not execute in this checkout because the `tsc` executable is unavailable (`sh: 1: tsc: not found`). The statuses above are source-level audit results; they are not a substitute for a successful type-check, test run, or live integration test.
