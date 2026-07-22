# HRM – Complete Functional Requirements Decomposition

**Basis:** executable source in `src/`, `server.ts`, adapters, services, utilities, tests, and UI route wiring. This is a requirements extraction, not an implementation specification. Where the current source is incomplete or inconsistent, the ambiguity is explicitly recorded at the end.

## 1. System walkthrough (A → Z)

1. A browser loads the Vite/Express application and initializes the React shell, auth state, settings, data provider, and lazy feature modules.
2. The user enters through Google sign-in, or through an existing same-origin HttpOnly session cookie. The server verifies the identity, assigns an HRM role, and returns the non-secret user profile.
3. The client verifies/restores the session before exposing the authenticated shell. Unauthenticated, unauthorized, loading, and component-failure states are distinct outcomes.
4. The authenticated shell selects a role-permitted module. Initial data is requested concurrently for employees, attendance, payroll, leave, organizational data, documents, onboarding, job descriptions, and candidates.
5. Each request passes through the DataService, which selects the configured adapter (mock/local storage, Google Sheets, MySQL, or PostgreSQL), validates returned entities, and may queue writes while offline.
6. Feature modules accept user input, normalize/validate it, calculate derived values (attendance statistics, payroll, leave state, recruitment scores/matches, performance/training state), then persist the resulting intermediate/final state.
7. External flows include spreadsheet/file import, Google Drive upload, AI screening/transcript/video evaluation, WhatsApp, and biometric device integration. Each validates access, payloads, external responses, and failure states.
8. Results are reloaded or applied optimistically to React state, rendered in dashboards/tables/portals, and optionally exported as PDF/CSV or synchronized to the configured backend. Errors are logged, surfaced as denial/toast/error-boundary states, and must not leak data across sessions.

## 2. Functional requirements

### STAGE A — Application bootstrap and input entry

**FR-001**  
- **Description:** The system shall serve the browser application and expose the SPA fallback for client routes.  
- **Type:** Input / Output  
- **Trigger:** Browser requests the application.  
- **Expected Behavior:** Express/Vite serves the app and static assets; unknown browser paths resolve to the application shell.  
- **Dependencies:** Express, Vite, build output.

**FR-002**  
- **Description:** The system shall initialize the React application with the data provider, global error boundary, lazy-module suspense state, and toast container.  
- **Type:** Processing  
- **Trigger:** Browser loads the application.  
- **Expected Behavior:** The shell is mounted without loading every feature module eagerly.  
- **Dependencies:** React, DataContext, feature modules.

**FR-003**  
- **Description:** The system shall load persisted application settings before constructing the data service.  
- **Type:** Input / Processing  
- **Trigger:** Application initialization.  
- **Expected Behavior:** Storage type, mock mode, and integration settings determine the adapter instance.  
- **Dependencies:** `getSettings`, `DataService`.

**FR-004**  
- **Description:** The system shall retain only the current non-secret user profile in browser memory and shall not expose the JWT to JavaScript.  
- **Type:** Constraint  
- **Trigger:** Auth initialization or sign-in.  
- **Expected Behavior:** Session credentials are carried by an HttpOnly same-origin cookie.  
- **Dependencies:** Auth client and server cookie handling.

**FR-005**  
- **Description:** The system shall present a loading state while session restoration is pending.  
- **Type:** Output  
- **Trigger:** Initial auth check.  
- **Expected Behavior:** No authenticated feature is rendered until verification completes.  
- **Dependencies:** `verifySession`.

### STAGE B — Authentication, authorization, and session boundaries

**FR-006**  
- **Description:** The system shall support Google Workspace sign-in using Firebase popup authentication and the configured Google Sheets/Drive scopes.  
- **Type:** Input / Processing  
- **Trigger:** User selects Sign in.  
- **Expected Behavior:** Obtain a Google ID token, send it to the server, and establish the HRM session.  
- **Dependencies:** Firebase config, `/api/v1/auth/google`.

**FR-007**  
- **Description:** The server shall verify the submitted Google identity before creating a session.  
- **Type:** Validation  
- **Trigger:** Google auth request.  
- **Expected Behavior:** Invalid, missing, or unverifiable identity is rejected.  
- **Dependencies:** Google verification and server auth configuration.

**FR-008**  
- **Description:** The system shall assign and propagate one of `Employee`, `Manager`, `HR`, or `Admin` roles.  
- **Type:** Constraint  
- **Trigger:** Successful authentication.  
- **Expected Behavior:** The role is available to UI and server authorization checks.  
- **Dependencies:** User record and JWT/session claims.

**FR-009**  
- **Description:** The system shall verify an existing session before restoring the authenticated UI.  
- **Type:** Validation  
- **Trigger:** Application startup or explicit verification.  
- **Expected Behavior:** Valid session restores the user; invalid/expired session clears auth state and shows login.  
- **Dependencies:** `/api/v1/auth/verify`, retry/circuit breaker.

**FR-010**  
- **Description:** The system shall provide logout that invalidates the session and clears all client-held domain state.  
- **Type:** Processing / Constraint  
- **Trigger:** User signs out.  
- **Expected Behavior:** Auth, employees, attendance, payroll, leave, candidates, documents, onboarding, and job-description state are cleared.  
- **Dependencies:** `/api/v1/auth/logout`, React state.

**FR-011**  
- **Description:** The system shall enforce role access at the server endpoint and at the client navigation/module boundary.  
- **Type:** Constraint / Validation  
- **Trigger:** Any protected request or tab selection.  
- **Expected Behavior:** Unauthorized API calls are rejected; unauthorized UI shows Access Denied.  
- **Dependencies:** `authenticateToken`, `authorize`, client permission map.

**FR-012**  
- **Description:** The system shall default a missing client role to Employee for access evaluation but visibly warn that the account has no assigned role.  
- **Type:** Constraint / Output  
- **Trigger:** Authenticated user has no role.  
- **Expected Behavior:** Only Employee permissions are considered and a warning is shown.  
- **Dependencies:** App role handling.

**FR-013**  
- **Description:** The system shall reject unknown navigation tab identifiers rather than silently granting access.  
- **Type:** Validation  
- **Trigger:** Access check for an unmapped tab.  
- **Expected Behavior:** Access is denied and the problem is logged.  
- **Dependencies:** Client permission map.

**FR-014**  
- **Description:** Protected API requests shall include same-origin credentials, JSON content type where applicable, and the CSRF request marker.  
- **Type:** Constraint  
- **Trigger:** Browser API request.  
- **Expected Behavior:** The server can authenticate the cookie and apply CSRF defenses.  
- **Dependencies:** `getAuthHeaders`, CORS/CSRF middleware.

### STAGE C — Transport, security, and request validation

**FR-015**  
- **Description:** The server shall parse JSON, URL-encoded, multipart, and raw WhatsApp webhook bodies using route-appropriate limits.  
- **Type:** Input / Constraint  
- **Trigger:** HTTP request enters Express.  
- **Expected Behavior:** Valid bodies are parsed; oversized or malformed bodies are rejected.  
- **Dependencies:** Express, Multer, raw webhook middleware.

**FR-016**  
- **Description:** The server shall apply CORS policy before protected API processing.  
- **Type:** Constraint  
- **Trigger:** Cross-origin request.  
- **Expected Behavior:** Only configured origins/methods/credentials are accepted.  
- **Dependencies:** CORS configuration.

**FR-017**  
- **Description:** The system shall rate-limit general API, AI, spreadsheet/Drive, WhatsApp, and biometric traffic according to their route groups.  
- **Type:** Constraint / Performance  
- **Trigger:** Request reaches a limited route.  
- **Expected Behavior:** Excess requests receive a controlled rejection and do not execute the operation.  
- **Dependencies:** Express rate limiters.

**FR-018**  
- **Description:** The system shall validate required identifiers before lookups and reject null/undefined entities before saves.  
- **Type:** Validation  
- **Trigger:** DataService read/write.  
- **Expected Behavior:** Empty employee IDs, record IDs, and missing entities produce a controlled error rather than an adapter call.  
- **Dependencies:** DataService validators.

**FR-019**  
- **Description:** Email inputs shall be trimmed for validation and accepted only when they contain a valid local part, domain, TLD, and no invalid edge dots or consecutive domain dots.  
- **Type:** Validation  
- **Trigger:** Employee/candidate/account input.  
- **Expected Behavior:** Invalid email is rejected.  
- **Dependencies:** `validateEmail`.

**FR-020**  
- **Description:** The system shall validate each supported entity and each element of entity arrays using the schema registry.  
- **Type:** Validation  
- **Trigger:** Adapter read or write through DataService.  
- **Expected Behavior:** Invalid records fail with the entity/path context; valid records continue.  
- **Dependencies:** Zod schemas and `schemas.ts`.

**FR-021**  
- **Description:** Mock mode shall be able to bypass persistence validation only where explicitly configured, while production adapters shall retain validation.  
- **Type:** Constraint  
- **Trigger:** DataService validation decision.  
- **Expected Behavior:** The configured mode determines whether validation is skipped; it must not be accidental.  
- **Dependencies:** `shouldSkipValidation`, AppSettings.

**FR-022**  
- **Description:** Transient external requests shall retry within configured limits and use circuit breakers for repeated failures.  
- **Type:** Processing / Performance  
- **Trigger:** Auth, AI, external integration, or adapter request.  
- **Expected Behavior:** Retryable failures back off; an open breaker fails fast; successful calls close/recover the breaker.  
- **Dependencies:** retry utility and metrics.

### STAGE D — Initial ingestion, adapter selection, and intermediate state

**FR-023**  
- **Description:** DataService shall choose exactly one active adapter based on resolved settings: mock/local storage, Google Sheets, MySQL, or PostgreSQL.  
- **Type:** Processing / Constraint  
- **Trigger:** Service creation or settings change.  
- **Expected Behavior:** Adapter is recreated when relevant storage settings change and its signature changes.  
- **Dependencies:** DataAdapterFactory, BackendService.

**FR-024**  
- **Description:** If Google Sheets is selected without a spreadsheet ID, the system shall fall back to local storage and log the configuration problem.  
- **Type:** Validation / Error handling  
- **Trigger:** Adapter creation.  
- **Expected Behavior:** The application remains usable with local persistence.  
- **Dependencies:** GoogleSheetsAdapter, settings.

**FR-025**  
- **Description:** The system shall load initial employees, attendance, payroll, leaves, departments, designations, documents, onboarding tasks/templates, job descriptions, and candidates concurrently.  
- **Type:** Processing / Performance  
- **Trigger:** Authenticated shell loads.  
- **Expected Behavior:** Independent results are applied independently; one failed load does not discard successful datasets.  
- **Dependencies:** `Promise.allSettled`, DataService getters.

**FR-026**  
- **Description:** The system shall preserve each successfully loaded dataset as an independent intermediate React state collection.  
- **Type:** Processing  
- **Trigger:** A getter resolves.  
- **Expected Behavior:** Corresponding feature modules receive the collection without requiring unrelated datasets to succeed.  
- **Dependencies:** App state.

**FR-027**  
- **Description:** Manual synchronization shall set a busy state, invoke adapter synchronization, reload all initial datasets, and clear the busy state in a finally path.  
- **Type:** Processing / Output  
- **Trigger:** User selects Sync.  
- **Expected Behavior:** The header reflects progress and partial refresh failures are logged.  
- **Dependencies:** `syncAll`, DataService getters.

**FR-028**  
- **Description:** Offline writes for supported bulk entities shall be queued rather than lost.  
- **Type:** Processing / Edge case  
- **Trigger:** Save occurs while offline.  
- **Expected Behavior:** Request payload is placed in the offline queue for later processing and the user receives the appropriate state/message.  
- **Dependencies:** `offlineQueue`, connectivity detection.

**FR-029**  
- **Description:** Adapter writes shall persist the validated canonical entity and reads shall deserialize it back into the typed application model.  
- **Type:** Processing  
- **Trigger:** Any CRUD operation.  
- **Expected Behavior:** Dates, arrays, nested structures, and legacy aliases survive storage round trips.  
- **Dependencies:** adapters, serializers/deserializers.

### STAGE E — Core HR master data and employee lifecycle

**FR-030**  
- **Description:** HR/Admin shall create employees with a unique ID, required name/email/status, and valid personal, employment, compensation, onboarding, and exit fields.  
- **Type:** Input / Validation  
- **Trigger:** Save employee.  
- **Expected Behavior:** Valid employee is persisted; invalid or duplicate data is rejected.  
- **Dependencies:** employee schema, EmployeeService.

**FR-031**  
- **Description:** HR/Admin shall edit an employee while preserving the employee identity and unrelated fields.  
- **Type:** Processing  
- **Trigger:** Employee update.  
- **Expected Behavior:** Only submitted changes are applied and persisted.  
- **Dependencies:** deep merge, employee service.

**FR-032**  
- **Description:** Admin shall delete an employee only after the server authorization check.  
- **Type:** Constraint  
- **Trigger:** Delete employee.  
- **Expected Behavior:** Authorized deletion removes the record; other roles receive denial.  
- **Dependencies:** `/employees/:id`, adapter.

**FR-033**  
- **Description:** The system shall support bulk employee save/update with per-request validation and a bounded request body.  
- **Type:** Input / Processing  
- **Trigger:** Bulk import or status update.  
- **Expected Behavior:** Accepted records are persisted as a batch; invalid payloads fail safely.  
- **Dependencies:** bulk endpoint and importer.

**FR-034**  
- **Description:** Department records shall be created/updated and remain selectable by employees, designations, dashboards, and reporting.  
- **Type:** Processing  
- **Trigger:** Department maintenance.  
- **Expected Behavior:** Department references remain consistent.  
- **Dependencies:** Department schema and service.

**FR-035**  
- **Description:** Designation records shall be created/updated and associated with departments and employees.  
- **Type:** Processing  
- **Trigger:** Designation maintenance.  
- **Expected Behavior:** Designation references are available to dependent forms and views.  
- **Dependencies:** Designation schema and service.

**FR-036**  
- **Description:** Employee status transitions shall accept only the supported lifecycle states and capture status-specific dates/reasons when applicable.  
- **Type:** Validation / Constraint  
- **Trigger:** Status action or employee save.  
- **Expected Behavior:** Leave, suspension, resignation, retirement, termination, and contract expiry details are retained consistently.  
- **Dependencies:** EmploymentDetails model and status UI.

**FR-037**  
- **Description:** The system shall snapshot employee changes into history/audit records with actor, change type, source, reason, notes, and old/new values when history is enabled.  
- **Type:** Processing / Output  
- **Trigger:** Employee mutation.  
- **Expected Behavior:** A traceable audit entry is persisted.  
- **Dependencies:** EmployeeHistory, audit service.

**FR-038**  
- **Description:** The system shall support employee education, certifications, previous employers, onboarding checklist, exit checklist, and compensation history as separate persisted substructures.  
- **Type:** Processing  
- **Trigger:** Employee detail save.  
- **Expected Behavior:** Lists and checklist flags are retained and displayed in the corresponding tabs/portals.  
- **Dependencies:** Employee schema and forms.

### STAGE F — Attendance, shifts, leave, payroll, and biometrics

**FR-039**  
- **Description:** The system shall ingest attendance records containing employee, date, status, and supported time/shift fields.  
- **Type:** Input / Validation  
- **Trigger:** Manual attendance save, import, or biometric sync.  
- **Expected Behavior:** Missing employee or date is rejected; valid records are persisted.  
- **Dependencies:** AttendanceService/schema.

**FR-040**  
- **Description:** The system shall query attendance globally, by employee, by inclusive date range, and by calendar month.  
- **Type:** Processing  
- **Trigger:** Attendance view/report request.  
- **Expected Behavior:** Results are filtered by employee/date using the record date.  
- **Dependencies:** adapter attendance queries.

**FR-041**  
- **Description:** Attendance statistics shall count Full Day, Absent, Half Day, and On Leave records separately.  
- **Type:** Processing / Output  
- **Trigger:** Attendance dashboard calculation.  
- **Expected Behavior:** Counts are derived from actual statuses, not placeholders.  
- **Dependencies:** `calculateStats`.

**FR-042**  
- **Description:** The system shall support bulk attendance save and attendance synchronization.  
- **Type:** Processing  
- **Trigger:** Bulk action or sync.  
- **Expected Behavior:** Records are validated and persisted/synchronized as a unit where the adapter supports it.  
- **Dependencies:** bulk endpoint, adapter sync.

**FR-043**  
- **Description:** Managers/HR/Admin shall configure shifts and employees shall be associated with valid shift assignments.  
- **Type:** Input / Constraint  
- **Trigger:** Shift management.  
- **Expected Behavior:** Shift data is available to attendance and schedule behavior.  
- **Dependencies:** ShiftManagement module.

**FR-044**  
- **Description:** The system shall create leave requests with employee, leave type, dates, and status data, and shall query them globally or by employee.  
- **Type:** Input / Processing  
- **Trigger:** Leave submission.  
- **Expected Behavior:** Valid leave is saved and visible to the requester and authorized approver.  
- **Dependencies:** LeaveService/schema.

**FR-045**  
- **Description:** An authorized approver shall transition a leave request to Approved or Rejected and record approver and approval timestamp.  
- **Type:** Processing / Validation  
- **Trigger:** Approval action.  
- **Expected Behavior:** The status change is persisted and reflected in all relevant views.  
- **Dependencies:** leave approval endpoint.

**FR-046**  
- **Description:** The client shall optimistically update leave status and roll back to the prior collection if persistence fails.  
- **Type:** Intermediate state / Error handling  
- **Trigger:** UI leave approval.  
- **Expected Behavior:** Failed save never leaves a false approved/rejected state in memory.  
- **Dependencies:** App leave handler.

**FR-047**  
- **Description:** Payroll records shall be loaded and saved only for HR/Admin and shall support bulk persistence.  
- **Type:** Constraint / Processing  
- **Trigger:** Payroll view or save.  
- **Expected Behavior:** Unauthorized users cannot read or mutate payroll.  
- **Dependencies:** PayrollService/endpoints.

**FR-048**  
- **Description:** Payroll run shall calculate/generate payroll from the configured employee/attendance/pay rules and persist the resulting period records.  
- **Type:** Processing  
- **Trigger:** Admin/HR runs payroll.  
- **Expected Behavior:** A repeatable payroll result is produced for the requested period and failures do not partially misrepresent completion.  
- **Dependencies:** `/payroll/run`, payroll calculations.

**FR-049**  
- **Description:** The system shall configure biometric devices through the supported adapter factory and test connectivity before sync.  
- **Type:** Input / Validation  
- **Trigger:** Admin/HR saves or tests device configuration.  
- **Expected Behavior:** Device type/connection errors are reported without importing records.  
- **Dependencies:** ZKTeco, BioStar, Hikvision, Generic, Mock adapters.

**FR-050**  
- **Description:** Biometric synchronization shall fetch punches/users, normalize device records to HRM employee/attendance records, persist sync logs, and avoid unsafe duplicate processing.  
- **Type:** Processing / Constraint  
- **Trigger:** Manual or scheduled sync.  
- **Expected Behavior:** Valid punches are imported; unmatched/invalid punches are reported; sync status is queryable.  
- **Dependencies:** BiometricSyncService, punch/user endpoints.

### STAGE G — Recruitment, import, matching, and communication

**FR-051**  
- **Description:** The system shall ingest candidate records with contact, skills, experience, education, certifications, and recruitment-stage data.  
- **Type:** Input / Validation  
- **Trigger:** Candidate create/import.  
- **Expected Behavior:** Valid candidates are persisted and appear in recruitment lists.  
- **Dependencies:** candidate schema/service.

**FR-052**  
- **Description:** The system shall manage job descriptions and typed requirements categorized as Skill, Experience, Education, or Certification.  
- **Type:** Input / Processing  
- **Trigger:** Job-description maintenance.  
- **Expected Behavior:** Requirements are available to matching and recruitment workflows.  
- **Dependencies:** JobDescription schema/service.

**FR-053**  
- **Description:** CSV import shall parse the first row as headers, preview up to five rows, expose discovered columns, and tolerate an empty/no-file selection without mutation.  
- **Type:** Input / Preprocessing  
- **Trigger:** User selects a `.csv`.  
- **Expected Behavior:** Parsed fields and preview rows populate importer state.  
- **Dependencies:** Papa Parse.

**FR-054**  
- **Description:** Excel import shall load the first worksheet, treat row 5 as headers, preview rows 6–10, and ignore cells without a corresponding header.  
- **Type:** Input / Preprocessing  
- **Trigger:** User selects a non-CSV spreadsheet.  
- **Expected Behavior:** Header names and preview records populate importer state; missing worksheet stops safely.  
- **Dependencies:** ExcelJS.

**FR-055**  
- **Description:** The importer shall allow each source column to map to Name, Email, Role, Department, Joining Date, Phone, or Skip Column.  
- **Type:** Input / Processing  
- **Trigger:** Column-mapping interaction.  
- **Expected Behavior:** Mapping state is retained per source column.  
- **Dependencies:** importer UI.

**FR-056**  
- **Description:** Import processing shall transform mapped rows into canonical employee records, validate required fields, and report rejected rows without silently creating malformed employees.  
- **Type:** Processing / Validation  
- **Trigger:** Import Data action.  
- **Expected Behavior:** Accepted rows use bulk employee persistence; rejected rows are identifiable.  
- **Dependencies:** importer, employee schema.

**FR-057**  
- **Description:** Matching shall calculate skill, experience, education, and certification sub-scores from candidate/job data.  
- **Type:** Processing  
- **Trigger:** Candidate is matched against a job description.  
- **Expected Behavior:** Scores are real-data derived, not placeholders.  
- **Dependencies:** `calculateMatch`.

**FR-058**  
- **Description:** Skill matching shall normalize case/punctuation/spacing and classify exact matches, partial substring matches, and missing skills separately.  
- **Type:** Preprocessing / Processing  
- **Trigger:** Skill comparison.  
- **Expected Behavior:** Matching/missing/partial lists are populated consistently.  
- **Dependencies:** matching text normalization.

**FR-059**  
- **Description:** Experience score shall be 1 when no experience is required and otherwise be candidate years divided by required years, capped at 1.  
- **Type:** Processing / Constraint  
- **Trigger:** Experience scoring.  
- **Expected Behavior:** Missing candidate experience is treated as zero.  
- **Dependencies:** job requirement and candidate experience.

**FR-060**  
- **Description:** Matching shall use base weights 0.4 skill, 0.3 experience, 0.2 education, and 0.1 certification, redistribute active weights proportionally when categories are absent, and return zero/not-a-match when no category is active.  
- **Type:** Processing / Constraint  
- **Trigger:** Overall match calculation.  
- **Expected Behavior:** Active weights sum to 1; no-requirement jobs yield a zero match with explanatory details.  
- **Dependencies:** scoring helpers.

**FR-061**  
- **Description:** When required skills exist but the candidate has no skill match, the overall score shall be capped below the strong-match range (0.49 maximum).  
- **Type:** Constraint  
- **Trigger:** Overall score calculation.  
- **Expected Behavior:** Other categories cannot overstate a no-skill candidate.  
- **Dependencies:** matching guardrail.

**FR-062**  
- **Description:** The system shall round the overall score to a percentage, assign a match level, generate score details, and classify recommendations as Advance at ≥70, Consider at ≥40, otherwise Reject.  
- **Type:** Processing / Output  
- **Trigger:** Match completion.  
- **Expected Behavior:** A complete persisted match includes IDs, scores, lists, reasoning, status Pending, timestamps, and notes.  
- **Dependencies:** matching algorithm.

**FR-063**  
- **Description:** Recruitment shall manage stage templates, interview panels, scorecards, candidate status, and JD-match records through the data adapter.  
- **Type:** Processing  
- **Trigger:** Recruitment configuration or review.  
- **Expected Behavior:** Each collection can be loaded and persisted independently.  
- **Dependencies:** DataService methods and recruitment modules.

**FR-064**  
- **Description:** AI screening endpoints shall accept authorized screening input, call the configured AI provider, parse/validate the result, and return a controlled error for missing configuration, malformed output, timeout, or provider failure.  
- **Type:** Input / Processing / Validation  
- **Trigger:** Chat screening, transcript evaluation, or video evaluation.  
- **Expected Behavior:** Only HR/Manager/Admin can invoke screening; raw provider failure is not presented as a successful evaluation.  
- **Dependencies:** AI routes, GEMINI_API_KEY, rate limiter.

**FR-065**  
- **Description:** WhatsApp webhook processing shall accept raw provider callbacks and send-message processing shall require authenticated HR/Admin access, preserve message status/error data, and return provider failures safely.  
- **Type:** Input / Processing / Error handling  
- **Trigger:** Webhook or send action.  
- **Expected Behavior:** Incoming and outgoing message state can be tracked as queued/sent/delivered/read/failed.  
- **Dependencies:** WhatsApp configuration and routes.

### STAGE H — Onboarding, performance, training, documents, and policies

**FR-066**  
- **Description:** The system shall load and manage onboarding templates and employee onboarding tasks.  
- **Type:** Processing  
- **Trigger:** Employee/recruitment/onboarding screen.  
- **Expected Behavior:** Templates can be selected and task status can be pending, in-progress, completed, or overdue.  
- **Dependencies:** onboarding models/services.

**FR-067**  
- **Description:** Hiring a candidate shall create/link the employee and apply the selected onboarding template/tasks without losing candidate traceability.  
- **Type:** Processing  
- **Trigger:** Hire candidate action.  
- **Expected Behavior:** The employee lifecycle starts with the recruitment/onboarding relationship retained.  
- **Dependencies:** HireCandidateModal, employee/candidate services.

**FR-068**  
- **Description:** The system shall create, assign, update, and complete performance reviews and goals with role-appropriate visibility.  
- **Type:** Input / Processing / Constraint  
- **Trigger:** Performance action or portal view.  
- **Expected Behavior:** Self, manager, and HR/Admin review flows retain status, scores, comments, and dates.  
- **Dependencies:** PerformanceService and review components.

**FR-069**  
- **Description:** Performance scoring shall apply configured review templates, weights, red flags, and decision-matrix conditions, while invalid conditions are skipped/logged rather than crashing the review.  
- **Type:** Processing / Validation  
- **Trigger:** Review evaluation.  
- **Expected Behavior:** A deterministic weighted result and applicable decision are returned.  
- **Dependencies:** scoring utilities/templates.

**FR-070**  
- **Description:** The system shall manage training modules, assignments, quizzes, requests, mentor workflows, and analytics.  
- **Type:** Input / Processing  
- **Trigger:** Training navigation or action.  
- **Expected Behavior:** Employees can consume/request training; managers/HR can assign/mentor and view analytics.  
- **Dependencies:** TrainingService and training components.

**FR-071**  
- **Description:** Documents shall be associated with employees, listed, saved, and filtered by employee/designation as applicable.  
- **Type:** Input / Processing  
- **Trigger:** Document create/view.  
- **Expected Behavior:** Metadata and file references remain linked to the correct employee.  
- **Dependencies:** DocumentService and schema.

**FR-072**  
- **Description:** File upload shall use multipart input, validate authentication/access and file presence, upload to the selected Drive folder, and return a stable file reference.  
- **Type:** Input / Validation / Output  
- **Trigger:** User uploads a document.  
- **Expected Behavior:** Success returns the Drive/file URL or ID; failure leaves no false document record.  
- **Dependencies:** `/api/drive/upload`, Multer, Drive credentials.

**FR-073**  
- **Description:** Admin/authorized users shall manage company policies and settings, and employees shall be able to view policies allowed by role.  
- **Type:** Constraint / Output  
- **Trigger:** Policy/settings interaction.  
- **Expected Behavior:** Settings persist through the configured adapter and policy changes affect the relevant UI.  
- **Dependencies:** Settings and CompanyPolicies.

### STAGE I — External storage and synchronization

**FR-074**  
- **Description:** Google Drive integration shall list folders, create authorized folders, create spreadsheets in folders, and upload files.  
- **Type:** Processing / Output  
- **Trigger:** Drive/Sheets setup or file action.  
- **Expected Behavior:** Provider IDs/URLs are returned and provider errors are surfaced safely.  
- **Dependencies:** Drive API, OAuth scopes.

**FR-075**  
- **Description:** Google Sheets integration shall read/write supported HRM collections, maintain sheet/module mapping, and synchronize changes without corrupting unrelated sheets.  
- **Type:** Processing / Constraint  
- **Trigger:** Adapter read/write or Sync All.  
- **Expected Behavior:** Data is converted between row representation and canonical entities and sync logs are recorded where configured.  
- **Dependencies:** GoogleSheetsAdapter.

**FR-076**  
- **Description:** SQL adapters shall connect using configured host/port/database/credentials/pool/timeout, execute supported entity operations, and release/handle failed connections.  
- **Type:** Processing / Error handling  
- **Trigger:** MySQL/PostgreSQL adapter operation.  
- **Expected Behavior:** Connection/configuration failure is controlled and does not produce fabricated data.  
- **Dependencies:** mysql2/pg adapters.

**FR-077**  
- **Description:** Local storage/mock adapters shall provide a functional persistence fallback and initialize compatible mock data when configured.  
- **Type:** Processing / Edge case  
- **Trigger:** Local/mock mode.  
- **Expected Behavior:** Core screens can load/save without external services.  
- **Dependencies:** local adapter and mockData.

### STAGE J — Output formation, presentation, export, and validation

**FR-078**  
- **Description:** The system shall map sidebar tab IDs to employee and manager portal sections and pass the selected initial section to the portal.  
- **Type:** Processing / Output  
- **Trigger:** Portal-related navigation.  
- **Expected Behavior:** Profile, attendance, payslips, onboarding, performance, team, approvals, and team-performance entries open the correct section.  
- **Dependencies:** `portalSectionMap`.

**FR-079**  
- **Description:** Dashboards shall derive summary cards/charts from loaded employee, attendance, payroll, leave, candidate, organization, and document state rather than independent contradictory copies.  
- **Type:** Output / Processing  
- **Trigger:** Dashboard render.  
- **Expected Behavior:** Counts, trends, and links reflect current state.  
- **Dependencies:** Dashboard and chart wrapper.

**FR-080**  
- **Description:** Tables and lists shall support the feature-specific search, filtering, sorting, pagination, and debounced input behavior provided by their modules.  
- **Type:** Processing / Output / Performance  
- **Trigger:** User changes list controls.  
- **Expected Behavior:** Visible rows update without changing persisted records.  
- **Dependencies:** `usePagination`, `useDebounce`, column utilities.

**FR-081**  
- **Description:** The system shall generate PDF outputs for supported reports/documents using safe text conversion and tabular formatting.  
- **Type:** Output  
- **Trigger:** User requests PDF/export.  
- **Expected Behavior:** Output contains the selected validated records and does not crash on null/unsafe text.  
- **Dependencies:** `pdfGenerator`, jsPDF.

**FR-082**  
- **Description:** Output serializers shall preserve dates, numeric values, arrays, nested objects, optional fields, and status enums in the format required by the selected adapter or export.  
- **Type:** Postprocessing / Validation  
- **Trigger:** Record leaves the application for storage/export.  
- **Expected Behavior:** Re-import/read-back produces equivalent canonical data.  
- **Dependencies:** column utilities, adapters, deserializers.

**FR-083**  
- **Description:** A successful save shall update/reload the relevant in-memory collection and show a success outcome; a failed save shall not be represented as successful output.  
- **Type:** Output / Error handling  
- **Trigger:** Any feature save.  
- **Expected Behavior:** UI and persistence converge, or the prior state is restored/reload is requested.  
- **Dependencies:** feature handlers and Toast.

### STAGE K — Error handling, observability, and edge cases

**FR-084**  
- **Description:** Data-load failures shall be isolated per dataset, logged with a dataset label/reason, and leave successful datasets usable.  
- **Type:** Error handling  
- **Trigger:** Initial load or post-sync refresh failure.  
- **Expected Behavior:** The shell remains rendered and the failed module can show an empty/error state.  
- **Dependencies:** Promise.allSettled and logger.

**FR-085**  
- **Description:** Unhandled React render/lazy-load failures shall be caught by the error boundary and shown as a recoverable error state rather than blanking the entire browser page.  
- **Type:** Error handling / Output  
- **Trigger:** Component exception.  
- **Expected Behavior:** Error boundary UI is rendered and the exception is logged.  
- **Dependencies:** ErrorBoundary.

**FR-086**  
- **Description:** Authentication failures shall clear auth state, increment failure metrics, and return the user to login without exposing provider details or credentials.  
- **Type:** Error handling / Security  
- **Trigger:** Sign-in, verify, or logout failure.  
- **Expected Behavior:** No protected data remains available to the unauthenticated user.  
- **Dependencies:** auth metrics/logger.

**FR-087**  
- **Description:** External provider failures shall distinguish invalid input, authorization failure, rate limiting, timeout, unavailable provider, and malformed response where the route can identify them.  
- **Type:** Error handling / Output  
- **Trigger:** AI, Sheets, Drive, WhatsApp, SQL, or biometric operation.  
- **Expected Behavior:** Appropriate HTTP/error outcome is returned and the operation is not falsely marked complete.  
- **Dependencies:** server route handlers.

**FR-088**  
- **Description:** Empty collections, empty requirements, missing optional fields, missing worksheet, missing adapter configuration, no current employee, and no matching records shall render valid empty states rather than throw.  
- **Type:** Edge case / Output  
- **Trigger:** Any query/render/calculation.  
- **Expected Behavior:** Empty results remain distinguishable from failed results.  
- **Dependencies:** all feature modules.

**FR-089**  
- **Description:** Matching, scoring, date filtering, and payroll calculations shall handle zero denominators, absent numeric values, invalid dates, and boundary thresholds deterministically.  
- **Type:** Edge case / Validation  
- **Trigger:** Derived calculation.  
- **Expected Behavior:** No NaN/Infinity or accidental over-score reaches persisted/output state.  
- **Dependencies:** math/scoring utilities.

**FR-090**  
- **Description:** The system shall log security-relevant/auth, adapter, sync, scoring, and external integration failures without logging secrets or sensitive credentials.  
- **Type:** Constraint / Output  
- **Trigger:** Error or significant integration event.  
- **Expected Behavior:** Logs support diagnosis while protecting secrets and personal data where possible.  
- **Dependencies:** logger and server logging policy.

**FR-091**  
- **Description:** The system shall expose health and API documentation endpoints that accurately describe availability and supported API operations.  
- **Type:** Output  
- **Trigger:** Operational probe or API consumer request.  
- **Expected Behavior:** Health returns a controlled status; docs/docs.json are retrievable according to their route policy.  
- **Dependencies:** `/api/health`, `/api/docs`, `/api/docs.json`.

**FR-092**  
- **Description:** Admin shall be able to generate/list/delete API keys and reset the circuit breaker only after Admin authorization.  
- **Type:** Constraint / Processing  
- **Trigger:** Admin maintenance operation.  
- **Expected Behavior:** Key lifecycle and breaker reset are audited/controlled and denied to other roles.  
- **Dependencies:** API-key and circuit-breaker routes.

## 3. Coverage and dependency check

| Pipeline concern | Covered by |
|---|---|
| Input entry | FR-001–005, FR-006, FR-015, FR-039, FR-051, FR-053–055 |
| Input validation | FR-007–021, FR-030, FR-039, FR-044, FR-051, FR-056, FR-064, FR-072 |
| Preprocessing/cleaning | FR-029, FR-053–058, FR-082 |
| Core transformation | FR-023–029, FR-036–062, FR-066–076 |
| Intermediate state | FR-025–028, FR-046, FR-067, FR-083 |
| Postprocessing | FR-062, FR-075, FR-081–082 |
| Output generation | FR-078–083, FR-091–092 |
| Output validation | FR-020–021, FR-056, FR-064, FR-082–083 |
| Error handling | FR-017–022, FR-024, FR-046, FR-084–090 |
| Edge cases | FR-021, FR-024, FR-028, FR-040–041, FR-060–061, FR-088–089 |
| Functional performance behavior | FR-002, FR-017, FR-022, FR-025, FR-027–028, FR-050, FR-080 |

**Total FR count: 92.**

## 4. Ambiguous, incomplete, or contradictory areas found in the code

1. **Client token restoration:** `getToken()` returns `null`, while comments say the JWT is an HttpOnly cookie. `App` calls `getToken()` before `verifySession()`, and later gates on `hasToken()`. The intended requirement is cookie-based restoration (FR-004/009), but the exact startup behavior needs confirmation.
2. **Leave access mismatch:** the `leaves` route renders `<Leaves />` without the same `canAccess` guard used by most modules, while the permission map includes `leaves`. Server-side policy and intended UI policy need confirmation.
3. **Importer completeness:** the current importer previews and stores column mappings, but the visible `Import Data` button has no shown persistence handler. FR-056 describes the required end-to-end behavior; whether this is intentionally stubbed or missing is ambiguous.
4. **Spreadsheet file types:** the label advertises CSV/XLS/XLSX/TSV, but the shown branch treats every non-CSV input as XLSX via `workbook.xlsx.load`; legacy XLS and TSV behavior is not established.
5. **Payroll formula:** the route exists, but the authoritative payroll rules, period boundaries, tax/deduction rules, rounding, idempotency, and duplicate-run behavior are not fully inferable from the inspected wiring.
6. **Data atomicity:** several bulk saves are described as batch operations, but adapter transaction/rollback guarantees differ by backend and are not uniform in the visible contract.
7. **AI output contract:** provider prompts and response parsing exist in server code, but the required JSON schema, confidence thresholds, and retention/redaction rules need product confirmation.
8. **Biometric duplicate policy:** adapters expose punch/sync operations, but the exact deduplication key and conflict rule for the same employee/timestamp are not explicit.
9. **Role visibility:** the client supports employee/manager portals, but several server collection endpoints are restricted to HR/Admin/Manager. The exact row-level filtering rules for employee self-data and manager direct reports need confirmation.
10. **Export surface:** PDF generation is present, but the complete list of UI actions that must export CSV/PDF and the exact column/locale/date format are not centrally specified.
11. **Settings precedence:** local settings, environment variables, and server settings all participate in adapter/integration configuration; the authoritative precedence and secret ownership should be documented.
12. **Audit retention:** audit/history structures are present, but retention, immutability, actor identity requirements, and deletion policy are not explicit.
