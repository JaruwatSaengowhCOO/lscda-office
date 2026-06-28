# Design Document — DA Case Management

## Overview

This document describes the technical design for the DA Case Management feature. It covers the complete build-out of the case detail page, all missing tRPC routers, enhanced forms, dashboard updates, permission cache TTL, and the Role & Permission Management admin UI.

The system is a Next.js 15 App Router application backed by tRPC v11, Drizzle ORM on MySQL, and shadcn/ui components. The DB schema, helper functions, and partial routers already exist; this design extends them without altering the existing schema or working procedures.

### Goals

- Complete the 8-tab Case Detail Page with lazy per-tab data loading and URL-persisted tab state.
- Fill all missing tRPC routers: `witnesses`, `caseDocuments`, and extend `warrants`, `evidence`, `hearings`, `cases`.
- Enhance the New Case form and build a proper Edit Case page.
- Add the Pending Warrants stat card to the dashboard and gate "New Case" on `create_case` permission.
- Implement a 60-second TTL on the in-process permission cache.
- Build the Role & Permission Management UI at `/dashboard/admin/permissions`.
- Enforce RBAC on every new tRPC procedure via `hasPermission()`.

---

## Architecture

The system follows a three-layer architecture consistent with the existing codebase:

```
┌─────────────────────────────────────────────────────────┐
│  Next.js 15 App Router (src/app/)                       │
│  Client Components — tRPC hooks, shadcn/ui, Tailwind   │
└───────────────────┬─────────────────────────────────────┘
                    │ tRPC v11 (HTTP + superjson)
┌───────────────────▼─────────────────────────────────────┐
│  tRPC Routers (server/routers/)                         │
│  protectedProcedure + hasPermission() + logActivity()   │
└───────────────────┬─────────────────────────────────────┘
                    │ Drizzle ORM
┌───────────────────▼─────────────────────────────────────┐
│  MySQL — all tables already migrated                    │
│  cases, warrants, evidence, witnesses, caseDocuments,   │
│  caseDocumentVersions, courtHearings, activityLogs,     │
│  rolePermissions, users, defendants                     │
└─────────────────────────────────────────────────────────┘
```

### Data Flow — Case Detail Page

```
URL: /dashboard/cases/[id]?tab=evidence

useSearchParams() ──► activeTab state
                           │
         ┌─────────────────┼──────────────────┐
         ▼                 ▼                  ▼
 cases.get (always)  evidence.listByCase  (other tabs load
 (overview data)     (only when tab=      on demand)
                      "evidence")
         │                 │
         ▼                 ▼
    CaseHeader         EvidenceTab
    OverviewTab        (lazy)
```

---

## Components and Interfaces

### File & Folder Structure (new files only)

```
src/app/dashboard/
  cases/
    [id]/
      page.tsx                     ← REWRITE — 8-tab interface
      edit/
        page.tsx                   ← REWRITE — proper edit form
    new/
      page.tsx                     ← ENHANCE — full fields
  admin/
    permissions/
      page.tsx                     ← NEW — Role & Permission Manager

src/components/cases/
  CaseHeader.tsx                   ← case number, title, status badge, actions
  CaseStatusSelect.tsx             ← only shows valid transitions
  tabs/
    OverviewTab.tsx                ← charges, defendant, personnel, key fields
    DocumentsTab.tsx               ← case documents sub-module
    EvidenceTab.tsx                ← evidence sub-module
    WarrantsTab.tsx                ← warrants sub-module
    WitnessesTab.tsx               ← witnesses sub-module
    CourtFilingsTab.tsx            ← hearings sub-module
    TimelineTab.tsx                ← audit log as timeline
    ActivityLogTab.tsx             ← audit log as filterable table

src/components/admin/
  PermissionMatrix.tsx             ← role × permission grid
  RoleEditor.tsx                   ← create/edit/delete role dialog

server/routers/
  witnesses.ts                     ← NEW
  caseDocuments.ts                 ← NEW
  permissions.ts                   ← NEW — admin permission management
```

### Case Detail Page — Component Tree

```
CaseDetailPage (page.tsx)
├── InternalLayout
└── div.p-6
    ├── BackButton
    ├── <Suspense> CaseHeader (cases.get)
    │   ├── CaseStatusSelect (cases.getValidTransitions)
    │   └── EditButton (→ /dashboard/cases/[id]/edit)
    └── <Tabs value={tab} onValueChange={setTab}>
        ├── TabsList
        │   └── [Overview, Documents, Evidence, Warrants,
        │         Witnesses, Court Filings, Timeline, Activity Log]
        │         (tabs hidden/disabled per page permissions)
        ├── <TabsContent value="overview">  → OverviewTab
        ├── <TabsContent value="documents"> → DocumentsTab (lazy)
        ├── <TabsContent value="evidence">  → EvidenceTab (lazy)
        ├── <TabsContent value="warrants">  → WarrantsTab (lazy)
        ├── <TabsContent value="witnesses"> → WitnessesTab (lazy)
        ├── <TabsContent value="filings">   → CourtFilingsTab (lazy)
        ├── <TabsContent value="timeline">  → TimelineTab (lazy)
        └── <TabsContent value="activity">  → ActivityLogTab (lazy)
```

Lazy loading is achieved by rendering each tab component only when its `TabsContent` is active (the default shadcn/ui behavior where `forceMount` is not set), so tRPC queries inside each tab component are only executed when the tab is first mounted.

### URL Tab Persistence

```typescript
// In CaseDetailPage
const searchParams = useSearchParams();
const router = useRouter();
const tab = searchParams.get("tab") ?? "overview";

const setTab = (newTab: string) => {
  const params = new URLSearchParams(searchParams.toString());
  params.set("tab", newTab);
  router.replace(`?${params.toString()}`, { scroll: false });
};
```

---

## Data Models

No schema changes are required. All tables are already defined in `drizzle/schema.ts`. The relevant shapes for new procedures:

### CaseDocument (existing)
```typescript
{ id, caseId, title, documentType, authorId, authorName,
  fileKey, fileUrl, fileName, fileSize, mimeType,
  version, notes, createdAt, updatedAt }
```

### CaseDocumentVersion (existing)
```typescript
{ id, documentId, version, fileKey, fileUrl, fileName,
  fileSize, uploadedBy, notes, createdAt }
```

### Witness (existing)
```typescript
{ id, caseId, name, phone, email, address,
  witnessType, statement, isProtected, notes,
  createdBy, createdAt, updatedAt }
```

### Warrant display status (computed, not stored)
```typescript
type WarrantDisplayStatus = "draft" | "pending_approval" | "approved"
  | "denied" | "executed" | "expired";

// Pure function — DB status "approved" + expiresAt < now → display "expired"
function getWarrantDisplayStatus(w: Warrant): WarrantDisplayStatus {
  if (w.status === "approved" && w.expiresAt && w.expiresAt < new Date()) {
    return "expired";
  }
  return w.status;
}
```

### Permission Cache Entry (updated structure)
```typescript
// Current (no TTL):
const _permCache = new Map<DaRole, Set<Permission>>();

// Updated (60-second TTL):
interface CacheEntry {
  perms: Set<Permission>;
  cachedAt: number; // Date.now() timestamp
}
const _permCache = new Map<DaRole, CacheEntry>();
const PERM_CACHE_TTL_MS = 60_000;
```

---

## tRPC Procedure Signatures

### `caseDocuments` router (new file: `server/routers/caseDocuments.ts`)

```typescript
caseDocuments.listByCase
  input:  { caseId: number }
  output: CaseDocument[]
  guard:  view_case_documents

caseDocuments.get
  input:  { id: number }
  output: CaseDocument & { versions: CaseDocumentVersion[] }
  guard:  view_case_documents

caseDocuments.create
  input:  { caseId, title, documentType, notes?,
            fileKey?, fileUrl?, fileName?, fileSize?, mimeType? }
  output: { id: number }
  guard:  manage_case_documents
  side:   logActivity(case, "document_uploaded", title+type+version)

caseDocuments.uploadVersion
  input:  { id, fileKey, fileUrl, fileName, fileSize, mimeType, notes? }
  output: { version: number }
  guard:  manage_case_documents
  side:   increment version, insert caseDocumentVersions row,
          logActivity(case, "document_version_added", ...)

caseDocuments.updateMetadata
  input:  { id, title?, documentType?, notes? }
  output: { success: true }
  guard:  view_case_documents (metadata update allowed with view only)
  side:   logActivity

caseDocuments.delete
  input:  { id: number }
  output: { success: true }
  guard:  manage_case_documents
```

### `witnesses` router (new file: `server/routers/witnesses.ts`)

```typescript
witnesses.listByCase
  input:  { caseId: number }
  output: WitnessRow[]
          // If caller lacks manage_witnesses:
          //   phone, email, address redacted to null for isProtected=true rows
  guard:  view_witnesses

witnesses.get
  input:  { id: number }
  output: Witness (contact info redacted if isProtected + lacks manage_witnesses)
  guard:  view_witnesses

witnesses.create
  input:  { caseId, name, witnessType, phone?, email?, address?,
            statement?, isProtected?, notes? }
  output: { id: number }
  guard:  manage_witnesses
  side:   logActivity(case, "witness_added", name+type)

witnesses.update
  input:  { id, name?, witnessType?, phone?, email?, address?,
            statement?, isProtected?, notes? }
  output: { success: true }
  guard:  manage_witnesses

witnesses.delete
  input:  { id: number }
  output: { success: true }
  guard:  manage_witnesses
```

### `warrants` router — additions to existing

```typescript
// New procedures added to warrantsRouter:

warrants.listByCase
  input:  { caseId: number }
  output: Warrant[] (with computed displayStatus via getWarrantDisplayStatus)
  guard:  view_warrant

warrants.get
  input:  { id: number }
  output: Warrant & { displayStatus: WarrantDisplayStatus }
  guard:  view_warrant

warrants.submit
  input:  { id: number }   // transitions draft → pending_approval
  output: { success: true }
  guard:  create_warrant
  side:   logActivity(case, "warrant_submitted", warrantNumber+type)

warrants.approve
  input:  { id: number, approvedBy: string, dateApproved: number }
  output: { success: true }
  guard:  approve_warrant
  side:   updateWarrant(status→"approved"), logActivity(case, "warrant_approved", ...)

warrants.deny
  input:  { id: number }
  output: { success: true }
  guard:  approve_warrant
  side:   updateWarrant(status→"denied"), logActivity

warrants.execute
  input:  { id: number, executedAt: number }
  output: { success: true }
  guard:  create_warrant
  side:   updateWarrant(status→"executed"), logActivity

// Extend existing warrants.create to accept bench_warrant type:
warrants.create
  input:  type: z.enum(["arrest_warrant","search_warrant","bench_warrant","subpoena"])
  // (bench_warrant was missing from existing router)
```

### `hearings` router — additions to existing

```typescript
// Already has list, upcoming, create, update.
// No new procedures needed — existing create/update cover requirements.
// logActivity call added to hearings.create for case audit trail:
//   logActivity(case, "hearing_scheduled", hearingType+scheduledAt)
```

### `evidence` router — additions to existing

```typescript
// Existing: listByCase, get, upload, getAuditLogs.
// Add chain-of-custody transfer:

evidence.transferCustody
  input:  { evidenceId, receivingParty: string, notes?: string }
  output: { success: true }
  guard:  upload_evidence
  side:   append custody entry to evidence.chainOfCustody JSON array,
          addEvidenceAuditLog(evidenceId, "custody_transfer", ...)

// Also add a plain create (non-file evidence — physical items):
evidence.create
  input:  { caseId, type, description, submittedByName?,
            dateCollected?, locationCollected? }
  output: { id, referenceNumber }
  guard:  upload_evidence
  side:   logActivity(case, "evidence_added", refNum+type)
```

### `permissions` router (new file: `server/routers/permissions.ts`)

```typescript
permissions.getMatrix
  input:  none
  output: Record<DaRole, Permission[]>
  guard:  manage_users

permissions.setRolePermissions
  input:  { role: DaRole, permissions: Permission[] }
  output: { success: true }
  guard:  manage_users
  side:   db transaction: delete+insert rolePermissions rows,
          _permCache.delete(role),
          logActivity("permission_updated", role, permissions)

permissions.togglePermission
  input:  { role: DaRole, permission: string, granted: boolean }
  output: { success: true }
  guard:  manage_users
  side:   insert or delete single rolePermissions row,
          _permCache.delete(role),
          logActivity("permission_toggled", role, permission, granted)

permissions.getAuditLog
  input:  { role?: string, actionType?: string,
            from?: number, to?: number }
  output: ActivityLog[]
  guard:  manage_users
```

### `cases` router — enhancements

```typescript
// cases.create — add missing fields already in schema:
// (already accepts priority, investigatingAgency, assignedJudge, defendantId,
//  leadProsecutorId, filedDate — confirmed from existing router)
// No change needed.

// cases.update — same, already accepts all fields.

// cases.getValidTransitions — already exists.
// Displayed in CaseStatusSelect to show only valid next statuses.
```

### `reports` router — dashboard enhancement

```typescript
// reports.dashboard already returns pendingWarrants from getDashboardStats().
// getDashboardStats() already queries warrants WHERE status = 'pending_approval'.
// No new procedure needed — just wire up in dashboard UI.
```

---

## RBAC Enforcement Pattern

Every tRPC procedure that is not purely public follows this exact pattern (already established in the codebase):

```typescript
export const widgetRouter = router({
  doThing: protectedProcedure
    .input(z.object({ ... }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as DaRole;
      if (!await hasPermission(daRole, "required_permission")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      // ... procedure logic
    }),
});
```

`hasPermission(role, permission)` in `server/db.ts` reads from `rolePermissions` table via the TTL cache. Client-side, tRPC errors with code `"FORBIDDEN"` are caught by the `onError` callback and displayed via `toast.error()`.

Tab visibility on the Case Detail Page additionally checks page-level permissions:

```typescript
// In CaseDetailPage — tabs are filtered by page permissions:
const { data: myPermissions } = trpc.permissions.myPermissions.useQuery();

const visibleTabs = ALL_TABS.filter(tab => {
  if (tab.requiredPermission) {
    return myPermissions?.includes(tab.requiredPermission);
  }
  return true; // overview always visible
});
```

Page permissions use the `page:case_detail/<tab>` namespace stored in `rolePermissions`, fetched at render time. The "New Case" button on the dashboard checks `create_case` from the same resolved permission set.

---

## Permission Cache TTL Design

### Problem

The current `_permCache` in `server/db.ts` is a plain `Map<DaRole, Set<Permission>>` with no expiry. Once a role's permissions are changed in the DB, the running server process never sees the update until restart.

### Solution — 60-second TTL

Store a `cachedAt` timestamp alongside each permission set. On every `getRolePermissions()` call, compare against `Date.now()`. If stale, re-fetch from DB and update the cache entry.

```typescript
interface PermCacheEntry {
  perms: Set<Permission>;
  cachedAt: number; // ms since epoch
}

const _permCache = new Map<DaRole, PermCacheEntry>();
const PERM_CACHE_TTL_MS = 60_000;

export async function getRolePermissions(role: DaRole): Promise<Set<Permission>> {
  const entry = _permCache.get(role);
  if (entry && (Date.now() - entry.cachedAt) < PERM_CACHE_TTL_MS) {
    return entry.perms; // cache hit within TTL
  }
  // cache miss or stale — re-fetch
  const db = await getDb();
  if (!db) return new Set();
  const rows = await db.select({ permission: rolePermissions.permission })
    .from(rolePermissions)
    .where(eq(rolePermissions.role, role));
  const perms = new Set(rows.map(r => r.permission as Permission));
  _permCache.set(role, { perms, cachedAt: Date.now() });
  return perms;
}

export async function setRolePermissions(role: DaRole, permissions: Permission[]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.transaction(async (tx) => {
    await tx.delete(rolePermissions).where(eq(rolePermissions.role, role));
    if (permissions.length > 0) {
      await tx.insert(rolePermissions).values(
        permissions.map(p => ({ role, permission: p }))
      );
    }
  });
  _permCache.delete(role); // immediate eviction — next check re-fetches
}
```

On `setRolePermissions()` and `togglePermission()`, the cache entry for the affected role is immediately deleted, so the in-process server will re-fetch on the very next request from any user with that role. For other server processes (horizontal scaling), the TTL guarantees the 60-second window.

---

## Error Handling

### tRPC Layer

| Error Condition | Code | Details |
|---|---|---|
| Missing permission | `FORBIDDEN` | Standard message; toast displayed client-side |
| Invalid status transition | `BAD_REQUEST` | Message includes current status, target status, valid targets |
| Resource not found | `NOT_FOUND` | Generic "not found" for the entity type |
| Duplicate case number | `BAD_REQUEST` | "Case number already exists" |
| DB unavailable | `INTERNAL_SERVER_ERROR` | Logged server-side; generic error to client |
| File too large | `BAD_REQUEST` | Includes configured max size |

### Client Layer

All mutations use the standard `onError: (e) => toast.error(e.message)` pattern consistent with the existing codebase. Loading states use shadcn `Skeleton` components. The Case Detail Page wraps tab content in `<Suspense>` boundaries so a failing tab doesn't crash the entire page.

### Audit Log Resilience

Per Requirement 9.2, if optional fields (e.g. `entityId`) are unavailable at log creation time, the `logActivity()` call stores `null` for those fields rather than rejecting the entry. The `logActivity` helper already accepts all optional fields, so no change is required.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Status Transition Guard Correctness

*For any* pair of case status values `(current, target)`, the status transition guard must return "permitted" if and only if `target` is in `CASE_STATUS_TRANSITIONS[current]`, and must return an error whose message includes `current`, `target`, and all valid targets otherwise.

**Validates: Requirements 1.2, 1.4**

### Property 2: Status Change Audit Trail

*For any* valid status transition `(current → new)` applied to a case, after the transition completes the case's `activityLogs` entries must contain at least one new entry whose `details` field records both the previous status and the new status.

**Validates: Requirements 1.5, 9.1**

### Property 3: Case Number Uniqueness

*For any* case number string, attempting to create a second case with that same case number must result in a validation error; the total number of cases in the system must remain unchanged after the failed insertion.

**Validates: Requirements 2.4**

### Property 4: Document Version Monotonicity

*For any* case document at version `N ≥ 1`, after a new file is uploaded to that document, the document's `version` field must equal `N + 1` and the `caseDocumentVersions` table must contain a new row for version `N` preserving the previous file metadata.

**Validates: Requirements 3.4, 3.5**

### Property 5: Document Operations Audit Trail

*For any* case document upload or version update, the parent case's `activityLogs` must contain a new entry whose details include the document title, document type, version number, and author identity.

**Validates: Requirements 3.6, 9.1**

### Property 6: Warrant Expiry Display Logic

*For any* warrant record, the computed display status must equal `"expired"` if and only if the DB status is `"approved"` and `expiresAt` is a non-null date in the past; for all other combinations of DB status and `expiresAt`, the display status must equal the DB status.

**Validates: Requirements 4.9**

### Property 7: Chain of Custody Append Invariant

*For any* evidence record with `N` entries in its `chainOfCustody` array, after a custody transfer operation the array must have exactly `N + 1` entries, and the new entry must contain the transferring user identity, receiving party, a timestamp, and any supplied notes.

**Validates: Requirements 5.3**

### Property 8: Protected Witness Contact Redaction

*For any* witness record with `isProtected = true`, a query executed by a user whose role lacks the `manage_witnesses` permission must return `null` for the `phone`, `email`, and `address` fields, while all other fields (name, witnessType, statement) remain visible.

**Validates: Requirements 6.5**

### Property 9: RBAC Enforcement Universality

*For any* tRPC procedure that requires permission `P`, and *for any* user whose resolved role-permissions set does not contain `P`, invoking that procedure must throw a `TRPCError` with code `"FORBIDDEN"`.

**Validates: Requirements 10.2, 10.5**

### Property 10: Permission Cache TTL Consistency

*For any* role `R` whose permission set is modified at time `T`, a call to `getRolePermissions(R)` at time `T + 60_001ms` (or later) must return the updated permission set and must not return the pre-modification set.

**Validates: Requirements 13.9**

### Property 11: Tab URL Persistence Round-Trip

*For any* valid tab identifier in `{"overview","documents","evidence","warrants","witnesses","filings","timeline","activity"}`, after the user navigates to that tab, `useSearchParams().get("tab")` must return that exact identifier; loading the page with `?tab=<identifier>` in the URL must pre-select that tab.

**Validates: Requirements 8.3**

---

## Testing Strategy

### Unit / Example-Based Tests

Focus on concrete scenarios not covered by properties:

- Creating a case without priority — verify `priority === "medium"` default.
- Attempting a `closed → investigation` transition — verify error message lists valid targets (empty).
- `CASE_STATUS_TRANSITIONS` completeness — every status key is present, all successors are valid status values.
- `CASE_STATUS_LABELS` completeness — every status has a non-empty human-readable label.
- `getWarrantDisplayStatus` with `expiresAt = null` and status `"approved"` — returns `"approved"`.
- `getWarrantDisplayStatus` with `expiresAt` in future and status `"approved"` — returns `"approved"`.
- Bulk permission update that throws midway — verify no partial permission state persisted (transaction rollback test).

### Property-Based Tests

Use [fast-check](https://fast-check.io) (TypeScript-native, no extra setup) for all PBT. Each property test runs a minimum of 100 iterations.

**Library:** `fast-check` (`fc`)
**Tag format:** `// Feature: da-case-management, Property <N>: <text>`

Key generator strategies needed:

```typescript
// Arbitrary for a valid CaseStatus
const arbStatus = fc.constantFrom(...CASE_STATUSES);

// Arbitrary for any (current, target) status pair
const arbStatusPair = fc.tuple(arbStatus, arbStatus);

// Arbitrary for a Warrant with configurable expiresAt
const arbWarrant = fc.record({
  status: fc.constantFrom("draft","pending_approval","approved","denied","executed","expired"),
  expiresAt: fc.option(fc.date(), { nil: null }),
});

// Arbitrary for a permission set (subset of all Permission values)
const arbPermissionSet = fc.subarray(ALL_PERMISSIONS);
```

Property tests are located in `server/__tests__/` and `shared/__tests__/` for pure logic, and use in-memory mocks for any DB interaction.

### Integration Tests

Run against a real test DB (or MySQL testcontainer):

- `cases.create` → `cases.get` round-trip preserves all input fields.
- `hearings.create` → audit log entry appears in `cases.getActivityLog`.
- `setRolePermissions` → `hasPermission` reflects change immediately (cache eviction).
- Dashboard stats reflect accurate counts after case/hearing/warrant mutations.

### Notes on PBT Scope

The following are explicitly excluded from property-based testing and covered by example-based or integration tests instead:

- AWS / external storage calls (use mocks for evidence upload tests).
- UI rendering and tab visibility (use React Testing Library example tests).
- DB schema structure (SMOKE tests via TypeScript type checks).
- One-time seed / migration behavior.

---

## Migration Notes

- **No new DB migrations are required.** All tables (`caseDocuments`, `caseDocumentVersions`, `witnesses`, `warrants`, `evidence`, `courtHearings`, `activityLogs`, `rolePermissions`) are already created by `0004_da_case_management.sql` and are reflected in the current `drizzle/schema.ts`.
- **Permission cache change** in `server/db.ts` is a pure in-memory refactor — adding `cachedAt` to the cache map. No DB change.
- **`bench_warrant` type** is already in the `warrants.type` enum in the schema. The existing `warrantsRouter.create` only includes `search_warrant`, `arrest_warrant`, `subpoena` — the fix is to add `"bench_warrant"` to the Zod enum in that procedure.
- **New routers** (`witnesses`, `caseDocuments`, `permissions`) must be added to `server/routers.ts` under keys `witnesses`, `caseDocuments`, and `permissions` respectively.
- **`page:` permission keys** must be seeded into `rolePermissions` via a one-time admin action or a new seed step. The initial seed should grant all existing roles their current tab permissions based on the action-permission matrix (e.g. roles with `view_evidence` get `page:case_detail/evidence`).
