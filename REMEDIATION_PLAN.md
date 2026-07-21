# HRM Production Hardening — Phased Remediation Plan

**Based on:** Principal Software Auditor Report (2026-07-20)
**Overall Robustness Score:** 3.5 / 10 (PRE-FIX) → 5.5 / 10 (POST-PHASE-1)

---

## Phase 1: Production Blockers (Week 1) ✅ COMPLETED
**Target:** Bring system to minimum viable production stability.
**Score Target:** 5.5 / 10

| ID | Fix | Files | Status |
|----|-----|-------|--------|
| 1.1 | Add pagination to all unbounded list endpoints | `server.ts` | ✅ Done |
| 1.2 | Add `MAX_BULK_SIZE` to all bulk write endpoints | `server.ts` | ✅ Done |
| 1.3 | Remove `.passthrough()` from Employee PUT schema | `server.ts` | ✅ Done |
| 1.4 | Fix LocalStorageAdapter naming collisions | `LocalStorageAdapter.ts` | ✅ Done |
| 1.5 | Add try/catch to `offlineQueue.saveQueue` | `offlineQueue.ts` | ✅ Done |
| 1.6 | Validate `getEmployeesStore` return type | `server.ts` | ✅ Done |
| 1.7 | Wrap local save in `saveEmployeesStore` try/catch | `server.ts` | ✅ Done |
| 1.8 | Add `PORT` env var support | `server.ts` | ✅ Done |

### Phase 1 Changes Detail

**1.1 Pagination (server.ts)**
- Added `DEFAULT_PAGE_SIZE = 100`, `MAX_PAGE_SIZE = 200` constants
- Applied pagination to: `GET /api/v1/employees`, `/attendance`, `/leaves`, `/payroll`, `/candidates`
- Response now includes: `data`, `count`, `page`, `limit`, `totalPages`
- Accepts `?page=` and `?limit=` query parameters

**1.2 Bulk Size Limits (server.ts)**
- Added `MAX_BULK_SIZE = 1000` constant
- Updated `bulkArraySchema` to enforce `.max(MAX_BULK_SIZE)`
- Prevents DoS via million-record payloads

**1.3 Schema Security (server.ts)**
- Removed `.passthrough()` from `EmployeeSchema.partial()` on PUT endpoint
- Added explicit nested schemas for `personal`, `employment`, `compensation`, `onboarding`
- Prevents arbitrary field injection / privilege escalation

**1.4 Naming Collision Fix (LocalStorageAdapter.ts)**
- Renamed ALL imports from `../lib/storage` with `Local` suffix (e.g., `getEmployees as getEmployeesLocal`)
- Updated every method body to call the renamed import
- Eliminates latent infinite recursion risk on refactoring

**1.5 Offline Queue Error Handling (offlineQueue.ts)**
- Wrapped `localStorage.setItem` in try/catch
- Detects `QuotaExceededError` and dispatches `hrm:storage-quota-exceeded` event
- Prevents silent queue data loss

**1.6 Store Return Validation (server.ts)**
- `getEmployeesStore` now validates DB response is array
- Validates local store response is array
- Throws descriptive error instead of propagating `undefined`

**1.7 Local Save Error Handling (server.ts)**
- `saveEmployeesStore` wraps local save in try/catch
- Throws `'Persistence layer completely unavailable'` if both DB and local fail
- Prevents unhandled promise rejections

**1.8 PORT Env Var (server.ts)**
- Changed `const PORT = 3000` to `const PORT = parseInt(process.env.PORT || '3000', 10)`
- Enables container/PaaS deployment

### Additional Fixes Applied During Phase 1

- **Fixed `isUrlSafe` duplicate code** (server.ts): Removed copy-paste artifact that duplicated the IPv4 regex block
- **Fixed `callGeminiWithRetry` off-by-one** (server.ts): Changed from `while (attempt <= maxRetries)` with `attempt++` at top to `for (let attempt = 0; attempt <= maxRetries; attempt++)` for correct retry count
- **Fixed `generateUUID` fallback** (idHelper.ts): `crypto.getRandomValues` is now called without optional chaining; added warning log if fallback to `Math.random` occurs
- **Fixed `verifySession` stale auth** (auth.ts): Returns `null` on network error instead of stale in-memory user; calls `clearAuthData()`
- **Fixed pre-existing syntax error** (PerformanceGoals.tsx): Missing closing parenthesis on line 105
- **Added missing exports** (storage.ts): `getSalaryComponents`, `saveSalaryComponents`, `getLeaveTypeConfigs`, `saveLeaveTypeConfigs`, `getPayslips`, `savePayslips`, `getNotifications`, `saveNotifications`
- **Added `SheetLog` type** (types.ts): Was missing from exports, causing import errors

### Verification

```bash
# TypeScript compilation: PASS (0 new errors in modified files)
npx tsc --noEmit

# Server boot test: PASS
npx tsx server.ts
# → "Humail Eli HRM server booting up on http://localhost:3000"
```

**Note:** Pre-existing TypeScript errors remain in unrelated frontend components (JDMatching.tsx, Performance.tsx, etc.). These were not introduced by Phase 1 changes.

---

## Phase 2: High Severity (Week 2-3)
**Target:** Resilience against network degradation and partial outages.
**Score Target:** 6.5 / 10

| ID | Fix | Files | Risk if Skipped |
|----|-----|-------|-----------------|
| 2.1 | Add rate limiting to biometric/Drive/Sheets endpoints | `server.ts` | Brute-force / cost amplification |
| 2.2 | Replace passthrough schemas with explicit allowlists | `server.ts`, `schemas.ts` | Data corruption via unknown fields |
| 2.3 | Add `maxLength` validators to all Zod schemas | `schemas.ts` | Memory exhaustion via huge strings |
| 2.4 | Fix `verifySession` to return `null` on network error | `auth.ts` | Stale auth → indefinite sessions |
| 2.5 | Implement distributed locking for bulk writes | `server.ts`, `serverDatabase.ts` | Lost updates on concurrent bulk ops |
| 2.6 | Add CSRF double-submit cookie middleware | `server.ts` | CSRF on state-changing endpoints |
| 2.7 | Validate Google ID token response shape | `server.ts` | Crash on malformed Google response |
| 2.8 | Add multer `fileFilter` for document uploads | `server.ts` | Arbitrary file upload → malware/storage abuse |
| 2.9 | Replace `Math.random()` with `crypto.getRandomValues` | `idHelper.ts` | Predictable IDs → enumeration attacks |
| 2.10 Add frontend pagination / virtualized lists | `App.tsx`, components | UI freeze on large datasets |

## Phase 3: Medium Severity (Week 4-6)
**Target:** Observability, graceful degradation, long-term maintainability.
**Score Target:** 7.5 / 10

| ID | Fix | Files | Risk if Skipped |
|----|-----|-------|-----------------|
| 3.1 | Prune circuit breaker map (TTL + max size) | `retry.ts` | Memory leak in long-running processes |
| 3.2 | Add structured JSON logging (replace console.*) | `logger.ts`, `server.ts` | Unparseable logs in production |
| 3.3 | Implement optimistic concurrency (version column) | `serverDatabase.ts`, adapters | Silent lost updates |
| 3.4 | Batch `appendToSheet` in `addEmployeeHistory` | `storage.ts` | 1000+ sequential API calls on history write |
| 3.5 | Add AbortSignal propagation through fetch stack | `retry.ts` | Cannot cancel long-running requests |
| 3.6 | Change auth cookie `sameSite` to `'strict'` in prod | `server.ts` | CSRF via cross-site requests |
| 3.7 | Add health check endpoint with dependency probes | `server.ts` | No way to verify system readiness |
| 3.8 | Fix `DataContext` dependency array for adapter swaps | `DataContext.tsx` | Stale adapter during settings changes |
| 3.9 | Move `api_keys.json` to secured path with restricted perms | `server.ts` | Secret file in world-readable cwd |
| 3.10 Replace hardcoded crypto salt with per-deployment salt | `crypto.ts` | Static salt weakens AES-256-GCM |

## Phase 4: Hardening & Polish (Week 7-8)
**Target:** Production-grade reliability.
**Score Target:** 8.5 / 10

| ID | Fix | Files | Risk if Skipped |
|----|-----|-------|-----------------|
| 4.1 | Stream video analysis instead of base64-in-memory | `server.ts` | OOM on 100MB video uploads |
| 4.2 | Add row-level upsert to GoogleSheetsAdapter | `GoogleSheetsAdapter.ts` | Data corruption on partial write failure |
| 4.3 | Implement request size limits + content-type validation | `server.ts` | DoS via oversized payloads |
| 4.4 | Add graceful shutdown (SIGTERM handling) | `server.ts` | In-flight requests killed abruptly |
| 4.5 | Remove patch scripts from repo root | root/*.cjs, scripts/ | Confusion / accidental execution |
| 4.6 | Add integration tests for all critical paths | `__tests__/integration/` | Regression on future changes |
| 4.7 | Implement proper session revocation (token blacklist) | `server.ts`, storage | Cannot invalidate compromised JWTs |
| 4.8 | Add request ID tracing across frontend → API → DB | `server.ts`, `logger.ts` | No distributed tracing |
| 4.9 | Replace wildcard CORS dev origins with env-based config | `server.ts` | Accidental exposure of dev CORS in prod |
| 4.10 Add `isUrlSafe` SSRF hardening for all user-supplied URLs | `server.ts` | Internal network scanning |
