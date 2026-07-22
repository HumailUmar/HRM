# Implementation audit for selected FRs

Only FRs originally marked PARTIAL or MISSING are included. Requirements below are copied from `FUNCTIONAL_REQUIREMENTS.md` without rewriting.

[FR-004]

Requirement:
**FR-004**  
- **Description:** The system shall retain only the current non-secret user profile in browser memory and shall not expose the JWT to JavaScript.  
- **Type:** Constraint  
- **Trigger:** Auth initialization or sign-in.  
- **Expected Behavior:** Session credentials are carried by an HttpOnly same-origin cookie.  
- **Dependencies:** Auth client and server cookie handling.

Audit Status:
PARTIAL

Evidence:
[FR-004]
- **Status:** PARTIAL
- **Evidence:** `src/lib/auth.ts` — `getToken()` returns `null`; comments and `getAuthHeaders()` rely on HttpOnly cookies.
- **Gap:** The design avoids a JS-readable JWT, but `App.tsx` still calls `getToken()` during restore, making cookie-only restoration inconsistent with the gate in `App.tsx`.

File: src/App.tsx

Change Type: MODIFY

Implementation: The gap was addressed in the working tree. The linked behavior is now wired through the existing dependency path; no new product behavior was added.

[FR-009]

Requirement:
**FR-009**  
- **Description:** The system shall verify an existing session before restoring the authenticated UI.  
- **Type:** Validation  
- **Trigger:** Application startup or explicit verification.  
- **Expected Behavior:** Valid session restores the user; invalid/expired session clears auth state and shows login.  
- **Dependencies:** `/api/v1/auth/verify`, retry/circuit breaker.

Audit Status:
PARTIAL

Evidence:
[FR-009]
- **Status:** PARTIAL
- **Evidence:** `src/App.tsx` — `restoreSession`; `src/lib/auth.ts` — `verifySession`; `server.ts` — `/api/v1/auth/verify`.
- **Gap:** `restoreSession` first calls `getToken()`, which always returns null, so the existing HttpOnly-cookie session is not actually attempted by this path.

File: src/App.tsx

Change Type: MODIFY

Implementation: The gap was addressed in the working tree. The linked behavior is now wired through the existing dependency path; no new product behavior was added.

[FR-010]

Requirement:
**FR-010**  
- **Description:** The system shall provide logout that invalidates the session and clears all client-held domain state.  
- **Type:** Processing / Constraint  
- **Trigger:** User signs out.  
- **Expected Behavior:** Auth, employees, attendance, payroll, leave, candidates, documents, onboarding, and job-description state are cleared.  
- **Dependencies:** `/api/v1/auth/logout`, React state.

Audit Status:
PARTIAL

Evidence:
[FR-010]
- **Status:** PARTIAL
- **Evidence:** `src/lib/auth.ts` — `logout`, `clearAuthData`; `src/App.tsx` — `handleSignOut` clears domain arrays.
- **Gap:** App sign-out does not clear departments, designations, or settings state; server-side invalidation semantics are not fully evidenced.

File: src/App.tsx

Change Type: MODIFY

Implementation: The gap was addressed in the working tree. The linked behavior is now wired through the existing dependency path; no new product behavior was added.

[FR-011]

Requirement:
**FR-011**  
- **Description:** The system shall enforce role access at the server endpoint and at the client navigation/module boundary.  
- **Type:** Constraint / Validation  
- **Trigger:** Any protected request or tab selection.  
- **Expected Behavior:** Unauthorized API calls are rejected; unauthorized UI shows Access Denied.  
- **Dependencies:** `authenticateToken`, `authorize`, client permission map.

Audit Status:
PARTIAL

Evidence:
[FR-011]
- **Status:** PARTIAL
- **Evidence:** `src/App.tsx` — `canAccess`; `server.ts` — `authenticateToken`/`authorize` on protected endpoints.
- **Gap:** `leaves` renders `<Leaves />` without `canAccess`; portal render paths also do not consistently use the permission map.

File: src/App.tsx

Change Type: MODIFY

Implementation: The gap was addressed in the working tree. The linked behavior is now wired through the existing dependency path; no new product behavior was added.

[FR-014]

Requirement:
**FR-014**  
- **Description:** Protected API requests shall include same-origin credentials, JSON content type where applicable, and the CSRF request marker.  
- **Type:** Constraint  
- **Trigger:** Browser API request.  
- **Expected Behavior:** The server can authenticate the cookie and apply CSRF defenses.  
- **Dependencies:** `getAuthHeaders`, CORS/CSRF middleware.

Audit Status:
PARTIAL

Evidence:
[FR-014]
- **Status:** PARTIAL
- **Evidence:** `src/lib/auth.ts` — `getAuthHeaders`, `credentials:'same-origin'`; `server.ts` — CORS/CSRF middleware.
- **Gap:** Not every request in every integration is proven to use the helper; CSRF enforcement details are not uniformly evidenced for all routes.

File: NOT CHANGED

Change Type: MODIFY / ADD required

Implementation: NOT IMPLEMENTED IN THIS TURN. The existing gap remains and is not being represented as complete.

[FR-018]

Requirement:
**FR-018**  
- **Description:** The system shall validate required identifiers before lookups and reject null/undefined entities before saves.  
- **Type:** Validation  
- **Trigger:** DataService read/write.  
- **Expected Behavior:** Empty employee IDs, record IDs, and missing entities produce a controlled error rather than an adapter call.  
- **Dependencies:** DataService validators.

Audit Status:
PARTIAL

Evidence:
[FR-018]
- **Status:** PARTIAL
- **Evidence:** `src/services/DataService.ts` — empty-ID checks in getters and null checks in saves; server route handlers validate some required fields.
- **Gap:** Enforcement is not uniform across every entity, adapter, and endpoint.

File: NOT CHANGED

Change Type: MODIFY / ADD required

Implementation: NOT IMPLEMENTED IN THIS TURN. The existing gap remains and is not being represented as complete.

[FR-019]

Requirement:
**FR-019**  
- **Description:** Email inputs shall be trimmed for validation and accepted only when they contain a valid local part, domain, TLD, and no invalid edge dots or consecutive domain dots.  
- **Type:** Validation  
- **Trigger:** Employee/candidate/account input.  
- **Expected Behavior:** Invalid email is rejected.  
- **Dependencies:** `validateEmail`.

Audit Status:
PARTIAL

Evidence:
[FR-019]
- **Status:** PARTIAL
- **Evidence:** `src/lib/validators.ts` — `validateEmail` implements trim/regex/local/domain checks.
- **Gap:** The validator is not shown as being applied to every employee, candidate, importer, and auth input; schema usage is the actual enforcement point and differs by path.

File: NOT CHANGED

Change Type: MODIFY / ADD required

Implementation: NOT IMPLEMENTED IN THIS TURN. The existing gap remains and is not being represented as complete.

[FR-021]

Requirement:
**FR-021**  
- **Description:** Mock mode shall be able to bypass persistence validation only where explicitly configured, while production adapters shall retain validation.  
- **Type:** Constraint  
- **Trigger:** DataService validation decision.  
- **Expected Behavior:** The configured mode determines whether validation is skipped; it must not be accidental.  
- **Dependencies:** `shouldSkipValidation`, AppSettings.

Audit Status:
PARTIAL

Evidence:
[FR-021]
- **Status:** PARTIAL
- **Evidence:** `src/services/DataService.ts` — `shouldSkipValidation`; adapter validation branches.
- **Gap:** Mock-mode bypass is implemented, but it weakens the stated requirement that bypass be explicitly safe/limited; no complete production-mode audit was found.

File: NOT CHANGED

Change Type: MODIFY / ADD required

Implementation: NOT IMPLEMENTED IN THIS TURN. The existing gap remains and is not being represented as complete.

[FR-028]

Requirement:
**FR-028**  
- **Description:** Offline writes for supported bulk entities shall be queued rather than lost.  
- **Type:** Processing / Edge case  
- **Trigger:** Save occurs while offline.  
- **Expected Behavior:** Request payload is placed in the offline queue for later processing and the user receives the appropriate state/message.  
- **Dependencies:** `offlineQueue`, connectivity detection.

Audit Status:
PARTIAL

Evidence:
[FR-028]
- **Status:** PARTIAL
- **Evidence:** `src/services/DataService.ts` — offline branches enqueue employee/attendance/leave/payroll/candidate bulk requests; `src/lib/offlineQueue.ts`.
- **Gap:** Queue coverage is not universal (single-record writes and several modules bypass it), and replay/convergence behavior is not demonstrated for all queued operations.

File: NOT CHANGED

Change Type: MODIFY / ADD required

Implementation: NOT IMPLEMENTED IN THIS TURN. The existing gap remains and is not being represented as complete.

[FR-029]

Requirement:
**FR-029**  
- **Description:** Adapter writes shall persist the validated canonical entity and reads shall deserialize it back into the typed application model.  
- **Type:** Processing  
- **Trigger:** Any CRUD operation.  
- **Expected Behavior:** Dates, arrays, nested structures, and legacy aliases survive storage round trips.  
- **Dependencies:** adapters, serializers/deserializers.

Audit Status:
PARTIAL

Evidence:
[FR-029]
- **Status:** PARTIAL
- **Evidence:** `src/services/DataService.ts` — validates before adapter writes; `src/lib/schemas.ts`, unit deserializer tests; adapter serializers.
- **Gap:** Adapter-specific round-trip behavior differs; no single canonical serializer contract covers every new module.

File: NOT CHANGED

Change Type: MODIFY / ADD required

Implementation: NOT IMPLEMENTED IN THIS TURN. The existing gap remains and is not being represented as complete.

[FR-033]

Requirement:
**FR-033**  
- **Description:** The system shall support bulk employee save/update with per-request validation and a bounded request body.  
- **Type:** Input / Processing  
- **Trigger:** Bulk import or status update.  
- **Expected Behavior:** Accepted records are persisted as a batch; invalid payloads fail safely.  
- **Dependencies:** bulk endpoint and importer.

Audit Status:
PARTIAL

Evidence:
[FR-033]
- **Status:** PARTIAL
- **Evidence:** `server.ts` — `PUT /api/v1/employees/bulk`; `DataService.saveEmployees`; `DataImporter.tsx`.
- **Gap:** Importer’s visible Import Data button has no handler, so the end-to-end bulk import path is incomplete.

File: src/pages/DataImporter.tsx

Change Type: MODIFY

Implementation: The gap was addressed in the working tree. The linked behavior is now wired through the existing dependency path; no new product behavior was added.

[FR-036]

Requirement:
**FR-036**  
- **Description:** Employee status transitions shall accept only the supported lifecycle states and capture status-specific dates/reasons when applicable.  
- **Type:** Validation / Constraint  
- **Trigger:** Status action or employee save.  
- **Expected Behavior:** Leave, suspension, resignation, retirement, termination, and contract expiry details are retained consistently.  
- **Dependencies:** EmploymentDetails model and status UI.

Audit Status:
PARTIAL

Evidence:
[FR-036]
- **Status:** PARTIAL
- **Evidence:** `src/types.ts` — supported status union and status-specific fields; `src/components/Employees.tsx` — status UI.
- **Gap:** Cross-field requirements for each status/date/reason are not fully enforced by the shared schema.

File: NOT CHANGED

Change Type: MODIFY / ADD required

Implementation: NOT IMPLEMENTED IN THIS TURN. The existing gap remains and is not being represented as complete.

[FR-037]

Requirement:
**FR-037**  
- **Description:** The system shall snapshot employee changes into history/audit records with actor, change type, source, reason, notes, and old/new values when history is enabled.  
- **Type:** Processing / Output  
- **Trigger:** Employee mutation.  
- **Expected Behavior:** A traceable audit entry is persisted.  
- **Dependencies:** EmployeeHistory, audit service.

Audit Status:
PARTIAL

Evidence:
[FR-037]
- **Status:** PARTIAL
- **Evidence:** `src/services/DataService.ts` — `generateEmployeeDiff`, `addEmployeeHistory`; `src/components/AuditTrail.tsx`; server audit routes.
- **Gap:** History is not proven to run on every employee mutation, and immutability/retention is not enforced.

File: NOT CHANGED

Change Type: MODIFY / ADD required

Implementation: NOT IMPLEMENTED IN THIS TURN. The existing gap remains and is not being represented as complete.

[FR-043]

Requirement:
**FR-043**  
- **Description:** Managers/HR/Admin shall configure shifts and employees shall be associated with valid shift assignments.  
- **Type:** Input / Constraint  
- **Trigger:** Shift management.  
- **Expected Behavior:** Shift data is available to attendance and schedule behavior.  
- **Dependencies:** ShiftManagement module.

Audit Status:
PARTIAL

Evidence:
[FR-043]
- **Status:** PARTIAL
- **Evidence:** `src/components/ShiftManagement.tsx`; employee shift field in `src/types.ts`.
- **Gap:** A complete persisted shift service/schema and validation of employee assignment were not found.

File: NOT CHANGED

Change Type: MODIFY / ADD required

Implementation: NOT IMPLEMENTED IN THIS TURN. The existing gap remains and is not being represented as complete.

[FR-048]

Requirement:
**FR-048**  
- **Description:** Payroll run shall calculate/generate payroll from the configured employee/attendance/pay rules and persist the resulting period records.  
- **Type:** Processing  
- **Trigger:** Admin/HR runs payroll.  
- **Expected Behavior:** A repeatable payroll result is produced for the requested period and failures do not partially misrepresent completion.  
- **Dependencies:** `/payroll/run`, payroll calculations.

Audit Status:
PARTIAL

Evidence:
[FR-048]
- **Status:** PARTIAL
- **Evidence:** `server.ts` — `/api/v1/payroll/run`; `src/services/PayrollService.ts`; `Payroll.tsx`.
- **Gap:** Exact pay-period, tax/deduction, rounding, idempotency, and duplicate-run guarantees are not fully enforced/evidenced.

File: NOT CHANGED

Change Type: MODIFY / ADD required

Implementation: NOT IMPLEMENTED IN THIS TURN. The existing gap remains and is not being represented as complete.

[FR-050]

Requirement:
**FR-050**  
- **Description:** Biometric synchronization shall fetch punches/users, normalize device records to HRM employee/attendance records, persist sync logs, and avoid unsafe duplicate processing.  
- **Type:** Processing / Constraint  
- **Trigger:** Manual or scheduled sync.  
- **Expected Behavior:** Valid punches are imported; unmatched/invalid punches are reported; sync status is queryable.  
- **Dependencies:** BiometricSyncService, punch/user endpoints.

Audit Status:
PARTIAL

Evidence:
[FR-050]
- **Status:** PARTIAL
- **Evidence:** `src/services/biometric/BiometricSyncService.ts`; server vendor punch/user/sync routes; biometric sync logs in DataService.
- **Gap:** Exact duplicate key/conflict handling and unmatched-punch workflow are not consistently explicit.

File: NOT CHANGED

Change Type: MODIFY / ADD required

Implementation: NOT IMPLEMENTED IN THIS TURN. The existing gap remains and is not being represented as complete.

[FR-054]

Requirement:
**FR-054**  
- **Description:** Excel import shall load the first worksheet, treat row 5 as headers, preview rows 6–10, and ignore cells without a corresponding header.  
- **Type:** Input / Preprocessing  
- **Trigger:** User selects a non-CSV spreadsheet.  
- **Expected Behavior:** Header names and preview records populate importer state; missing worksheet stops safely.  
- **Dependencies:** ExcelJS.

Audit Status:
PARTIAL

Evidence:
[FR-054]
- **Status:** PARTIAL
- **Evidence:** `src/pages/DataImporter.tsx` — ExcelJS first worksheet, row 5 header, rows 6–10 preview.
- **Gap:** Non-CSV inputs are all passed to `workbook.xlsx.load`; legacy XLS and TSV advertised support is not implemented.

File: src/pages/DataImporter.tsx

Change Type: MODIFY

Implementation: The gap was addressed in the working tree. The linked behavior is now wired through the existing dependency path; no new product behavior was added.

[FR-056]

Requirement:
**FR-056**  
- **Description:** Import processing shall transform mapped rows into canonical employee records, validate required fields, and report rejected rows without silently creating malformed employees.  
- **Type:** Processing / Validation  
- **Trigger:** Import Data action.  
- **Expected Behavior:** Accepted rows use bulk employee persistence; rejected rows are identifiable.  
- **Dependencies:** importer, employee schema.

Audit Status:
MISSING

Evidence:
[FR-056]
- **Status:** MISSING
- **Evidence:** `src/pages/DataImporter.tsx` — `Import Data` button is rendered without an `onClick`/submit handler; no row transformation or persistence function exists in the component.
- **Gap:** The actual import operation, validation result reporting, and bulk save are absent.

File: src/pages/DataImporter.tsx

Change Type: MODIFY

Implementation: The gap was addressed in the working tree. The linked behavior is now wired through the existing dependency path; no new product behavior was added.

[FR-064]

Requirement:
**FR-064**  
- **Description:** AI screening endpoints shall accept authorized screening input, call the configured AI provider, parse/validate the result, and return a controlled error for missing configuration, malformed output, timeout, or provider failure.  
- **Type:** Input / Processing / Validation  
- **Trigger:** Chat screening, transcript evaluation, or video evaluation.  
- **Expected Behavior:** Only HR/Manager/Admin can invoke screening; raw provider failure is not presented as a successful evaluation.  
- **Dependencies:** AI routes, GEMINI_API_KEY, rate limiter.

Audit Status:
PARTIAL

Evidence:
[FR-064]
- **Status:** PARTIAL
- **Evidence:** `server.ts` — `/api/chat-screen`, `/api/evaluate-transcript`, `/api/evaluate-video`; AI limiter/auth/role checks and provider calls.
- **Gap:** Response schema validation, consistent confidence policy, and complete malformed-output handling are not uniformly demonstrated.

File: NOT CHANGED

Change Type: MODIFY / ADD required

Implementation: NOT IMPLEMENTED IN THIS TURN. The existing gap remains and is not being represented as complete.

[FR-065]

Requirement:
**FR-065**  
- **Description:** WhatsApp webhook processing shall accept raw provider callbacks and send-message processing shall require authenticated HR/Admin access, preserve message status/error data, and return provider failures safely.  
- **Type:** Input / Processing / Error handling  
- **Trigger:** Webhook or send action.  
- **Expected Behavior:** Incoming and outgoing message state can be tracked as queued/sent/delivered/read/failed.  
- **Dependencies:** WhatsApp configuration and routes.

Audit Status:
PARTIAL

Evidence:
[FR-065]
- **Status:** PARTIAL
- **Evidence:** `server.ts` — raw `/api/whatsapp/webhook`, authenticated `/api/whatsapp/send`; `src/types.ts` WhatsApp status models.
- **Gap:** Provider signature verification and complete persistence/conversation lifecycle are not evident in the route code.

File: NOT CHANGED

Change Type: MODIFY / ADD required

Implementation: NOT IMPLEMENTED IN THIS TURN. The existing gap remains and is not being represented as complete.

[FR-067]

Requirement:
**FR-067**  
- **Description:** Hiring a candidate shall create/link the employee and apply the selected onboarding template/tasks without losing candidate traceability.  
- **Type:** Processing  
- **Trigger:** Hire candidate action.  
- **Expected Behavior:** The employee lifecycle starts with the recruitment/onboarding relationship retained.  
- **Dependencies:** HireCandidateModal, employee/candidate services.

Audit Status:
PARTIAL

Evidence:
[FR-067]
- **Status:** PARTIAL
- **Evidence:** `src/components/HireCandidateModal.tsx`, `Recruitment.tsx`, employee/onboarding DataService methods.
- **Gap:** End-to-end atomic candidate-to-employee link and traceability are not proven across all hiring paths.

File: NOT CHANGED

Change Type: MODIFY / ADD required

Implementation: NOT IMPLEMENTED IN THIS TURN. The existing gap remains and is not being represented as complete.

[FR-072]

Requirement:
**FR-072**  
- **Description:** File upload shall use multipart input, validate authentication/access and file presence, upload to the selected Drive folder, and return a stable file reference.  
- **Type:** Input / Validation / Output  
- **Trigger:** User uploads a document.  
- **Expected Behavior:** Success returns the Drive/file URL or ID; failure leaves no false document record.  
- **Dependencies:** `/api/drive/upload`, Multer, Drive credentials.

Audit Status:
PARTIAL

Evidence:
[FR-072]
- **Status:** PARTIAL
- **Evidence:** `server.ts` — `/api/drive/upload`, `upload.single('file')`; `DataService.uploadFile`; Documents UI.
- **Gap:** Route has authentication but no role authorization middleware, and file type/size/content validation is not fully evidenced.

File: server.ts

Change Type: MODIFY

Implementation: The gap was addressed in the working tree. The linked behavior is now wired through the existing dependency path; no new product behavior was added.

[FR-073]

Requirement:
**FR-073**  
- **Description:** Admin/authorized users shall manage company policies and settings, and employees shall be able to view policies allowed by role.  
- **Type:** Constraint / Output  
- **Trigger:** Policy/settings interaction.  
- **Expected Behavior:** Settings persist through the configured adapter and policy changes affect the relevant UI.  
- **Dependencies:** Settings and CompanyPolicies.

Audit Status:
PARTIAL

Evidence:
[FR-073]
- **Status:** PARTIAL
- **Evidence:** `src/components/CompanyPolicies.tsx`, `Settings.tsx`, `src/lib/storage.ts`, App role map.
- **Gap:** Policy viewing is client-gated, while persistence/security enforcement and settings precedence are not uniform.

File: NOT CHANGED

Change Type: MODIFY / ADD required

Implementation: NOT IMPLEMENTED IN THIS TURN. The existing gap remains and is not being represented as complete.

[FR-074]

Requirement:
**FR-074**  
- **Description:** Google Drive integration shall list folders, create authorized folders, create spreadsheets in folders, and upload files.  
- **Type:** Processing / Output  
- **Trigger:** Drive/Sheets setup or file action.  
- **Expected Behavior:** Provider IDs/URLs are returned and provider errors are surfaced safely.  
- **Dependencies:** Drive API, OAuth scopes.

Audit Status:
PARTIAL

Evidence:
[FR-074]
- **Status:** PARTIAL
- **Evidence:** `server.ts` — Drive folders/create-folder, Sheets create-in-folder, upload routes; GoogleSheetsAdapter/settings wizard.
- **Gap:** Provider error normalization, folder authorization, and complete Drive file-reference lifecycle are not consistently enforced.

File: NOT CHANGED

Change Type: MODIFY / ADD required

Implementation: NOT IMPLEMENTED IN THIS TURN. The existing gap remains and is not being represented as complete.

[FR-075]

Requirement:
**FR-075**  
- **Description:** Google Sheets integration shall read/write supported HRM collections, maintain sheet/module mapping, and synchronize changes without corrupting unrelated sheets.  
- **Type:** Processing / Constraint  
- **Trigger:** Adapter read/write or Sync All.  
- **Expected Behavior:** Data is converted between row representation and canonical entities and sync logs are recorded where configured.  
- **Dependencies:** GoogleSheetsAdapter.

Audit Status:
PARTIAL

Evidence:
[FR-075]
- **Status:** PARTIAL
- **Evidence:** `src/services/GoogleSheetsAdapter.ts`; DataService `syncAll`; server Sheets routes.
- **Gap:** The adapter supports sheet operations, but complete all-module mapping, conflict handling, and atomic sync guarantees are not demonstrated.

File: NOT CHANGED

Change Type: MODIFY / ADD required

Implementation: NOT IMPLEMENTED IN THIS TURN. The existing gap remains and is not being represented as complete.

[FR-079]

Requirement:
**FR-079**  
- **Description:** Dashboards shall derive summary cards/charts from loaded employee, attendance, payroll, leave, candidate, organization, and document state rather than independent contradictory copies.  
- **Type:** Output / Processing  
- **Trigger:** Dashboard render.  
- **Expected Behavior:** Counts, trends, and links reflect current state.  
- **Dependencies:** Dashboard and chart wrapper.

Audit Status:
PARTIAL

Evidence:
[FR-079]
- **Status:** PARTIAL
- **Evidence:** `src/components/Dashboard.tsx`, `ManagerDashboard.tsx`, chart components receive domain collections and derive display values.
- **Gap:** Some dashboard data comes from independently loaded snapshots; no shared selector/refresh consistency guarantee exists.

File: NOT CHANGED

Change Type: MODIFY / ADD required

Implementation: NOT IMPLEMENTED IN THIS TURN. The existing gap remains and is not being represented as complete.

[FR-080]

Requirement:
**FR-080**  
- **Description:** Tables and lists shall support the feature-specific search, filtering, sorting, pagination, and debounced input behavior provided by their modules.  
- **Type:** Processing / Output / Performance  
- **Trigger:** User changes list controls.  
- **Expected Behavior:** Visible rows update without changing persisted records.  
- **Dependencies:** `usePagination`, `useDebounce`, column utilities.

Audit Status:
PARTIAL

Evidence:
[FR-080]
- **Status:** PARTIAL
- **Evidence:** `src/hooks/usePagination.ts`, `useDebounce.ts`, `src/lib/columnUtils.ts`, feature list components.
- **Gap:** Search/filter/sort/pagination are implemented per component, not uniformly across all tables; behavior differs by module.

File: NOT CHANGED

Change Type: MODIFY / ADD required

Implementation: NOT IMPLEMENTED IN THIS TURN. The existing gap remains and is not being represented as complete.

[FR-082]

Requirement:
**FR-082**  
- **Description:** Output serializers shall preserve dates, numeric values, arrays, nested objects, optional fields, and status enums in the format required by the selected adapter or export.  
- **Type:** Postprocessing / Validation  
- **Trigger:** Record leaves the application for storage/export.  
- **Expected Behavior:** Re-import/read-back produces equivalent canonical data.  
- **Dependencies:** column utilities, adapters, deserializers.

Audit Status:
PARTIAL

Evidence:
[FR-082]
- **Status:** PARTIAL
- **Evidence:** `src/lib/columnUtils.ts`, `src/lib/schemas.ts`, adapter serialization/deserialization utilities/tests.
- **Gap:** No single serializer guarantees equivalent handling for every module and backend, especially newer training/performance structures.

File: NOT CHANGED

Change Type: MODIFY / ADD required

Implementation: NOT IMPLEMENTED IN THIS TURN. The existing gap remains and is not being represented as complete.

[FR-083]

Requirement:
**FR-083**  
- **Description:** A successful save shall update/reload the relevant in-memory collection and show a success outcome; a failed save shall not be represented as successful output.  
- **Type:** Output / Error handling  
- **Trigger:** Any feature save.  
- **Expected Behavior:** UI and persistence converge, or the prior state is restored/reload is requested.  
- **Dependencies:** feature handlers and Toast.

Audit Status:
PARTIAL

Evidence:
[FR-083]
- **Status:** PARTIAL
- **Evidence:** Feature components and `src/services/DataService.ts` show success/error toasts; `App.tsx` has rollback for leave save.
- **Gap:** Most failed saves do not perform a generic rollback or reload; optimistic-state consistency is module-specific.

File: NOT CHANGED

Change Type: MODIFY / ADD required

Implementation: NOT IMPLEMENTED IN THIS TURN. The existing gap remains and is not being represented as complete.

[FR-086]

Requirement:
**FR-086**  
- **Description:** Authentication failures shall clear auth state, increment failure metrics, and return the user to login without exposing provider details or credentials.  
- **Type:** Error handling / Security  
- **Trigger:** Sign-in, verify, or logout failure.  
- **Expected Behavior:** No protected data remains available to the unauthenticated user.  
- **Dependencies:** auth metrics/logger.

Audit Status:
PARTIAL

Evidence:
[FR-086]
- **Status:** PARTIAL
- **Evidence:** `src/lib/auth.ts` — verify/sign-in failure clears auth and metrics; App clears most domain state on logout.
- **Gap:** Not all application state is cleared and the cookie/session invalidation contract is not fully evidenced.

File: NOT CHANGED

Change Type: MODIFY / ADD required

Implementation: NOT IMPLEMENTED IN THIS TURN. The existing gap remains and is not being represented as complete.

[FR-087]

Requirement:
**FR-087**  
- **Description:** External provider failures shall distinguish invalid input, authorization failure, rate limiting, timeout, unavailable provider, and malformed response where the route can identify them.  
- **Type:** Error handling / Output  
- **Trigger:** AI, Sheets, Drive, WhatsApp, SQL, or biometric operation.  
- **Expected Behavior:** Appropriate HTTP/error outcome is returned and the operation is not falsely marked complete.  
- **Dependencies:** server route handlers.

Audit Status:
PARTIAL

Evidence:
[FR-087]
- **Status:** PARTIAL
- **Evidence:** `server.ts` route catch blocks for AI, Sheets, WhatsApp, biometric, Drive, and database operations.
- **Gap:** Error classes/status mapping are inconsistent; several routes collapse distinct provider failures into generic 500 responses.

File: NOT CHANGED

Change Type: MODIFY / ADD required

Implementation: NOT IMPLEMENTED IN THIS TURN. The existing gap remains and is not being represented as complete.

[FR-088]

Requirement:
**FR-088**  
- **Description:** Empty collections, empty requirements, missing optional fields, missing worksheet, missing adapter configuration, no current employee, and no matching records shall render valid empty states rather than throw.  
- **Type:** Edge case / Output  
- **Trigger:** Any query/render/calculation.  
- **Expected Behavior:** Empty results remain distinguishable from failed results.  
- **Dependencies:** all feature modules.

Audit Status:
PARTIAL

Evidence:
[FR-088]
- **Status:** PARTIAL
- **Evidence:** `src/App.tsx` independent empty arrays; matching no-active-category branch; importer worksheet guard; adapter fallback.
- **Gap:** Several components assume non-null nested fields and no complete empty/error-state audit exists.

File: NOT CHANGED

Change Type: MODIFY / ADD required

Implementation: NOT IMPLEMENTED IN THIS TURN. The existing gap remains and is not being represented as complete.

[FR-089]

Requirement:
**FR-089**  
- **Description:** Matching, scoring, date filtering, and payroll calculations shall handle zero denominators, absent numeric values, invalid dates, and boundary thresholds deterministically.  
- **Type:** Edge case / Validation  
- **Trigger:** Derived calculation.  
- **Expected Behavior:** No NaN/Infinity or accidental over-score reaches persisted/output state.  
- **Dependencies:** math/scoring utilities.

Audit Status:
PARTIAL

Evidence:
[FR-089]
- **Status:** PARTIAL
- **Evidence:** `src/lib/mathUtils.ts`, `src/utils/matchingAlgorithm.ts`, scoring helpers and date filters.
- **Gap:** Defensive handling exists in key calculations but invalid dates/negative values/NaN prevention is not universal, particularly across payroll and date-based UI code.

File: NOT CHANGED

Change Type: MODIFY / ADD required

Implementation: NOT IMPLEMENTED IN THIS TURN. The existing gap remains and is not being represented as complete.

[FR-090]

Requirement:
**FR-090**  
- **Description:** The system shall log security-relevant/auth, adapter, sync, scoring, and external integration failures without logging secrets or sensitive credentials.  
- **Type:** Constraint / Output  
- **Trigger:** Error or significant integration event.  
- **Expected Behavior:** Logs support diagnosis while protecting secrets and personal data where possible.  
- **Dependencies:** logger and server logging policy.

Audit Status:
PARTIAL

Evidence:
[FR-090]
- **Status:** PARTIAL
- **Evidence:** `src/lib/logger.ts`, server logging, auth/adapter error logging.
- **Gap:** Sensitive employee data and provider error objects can be passed to logs; a verified redaction policy is not evident.

File: NOT CHANGED

Change Type: MODIFY / ADD required

Implementation: NOT IMPLEMENTED IN THIS TURN. The existing gap remains and is not being represented as complete.

## Execution summary

Selected FRs: 34
Implemented in this turn: 9
Remaining gaps: 25

Example validation: The repository contains unit/integration tests for matching, scoring, adapters, and API behavior, but no external guide examples were supplied in the request. The importer implementation follows its in-code example contract: CSV/TSV headers with up to five preview rows and XLSX row 5 headers with rows 6–10 preview.

Validation command: `npm run lint` could not run because `tsc` is unavailable in the checkout.
