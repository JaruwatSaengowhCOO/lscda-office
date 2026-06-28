# Implementation Plan: DA Case Management

## Overview

Incremental implementation of the full DA Case Management feature on top of the existing Next.js 15 / tRPC v11 / Drizzle ORM / MySQL stack. Each task builds on the previous, starting with server-side routers and core logic, then moving to UI components, and finishing with the admin permission manager. All DB tables already exist — no migrations are needed.

## Tasks

- [x] 1. Permission cache TTL and server-side permission helpers
  - [x] 1.1 Update the permission cache in `server/db.ts` to use a 60-second TTL
    - Replace the plain `Map<DaRole, Set<Permission>>` with a `Map<DaRole, { perms: Set<Permission>; cachedAt: number }>` structure
    - Add `PERM_CACHE_TTL_MS = 60_000` constant
    - Update `getRolePermissions()` to check `Date.now() - cachedAt < PERM_CACHE_TTL_MS` and re-fetch when stale
    - Update `setRolePermissions()` to immediately delete the cache entry for the affected role
    - _Requirements: 13.9_

  - [x] 1.2 Write property test for permission cache TTL consistency
    - **Property 10: Permission Cache TTL Consistency**
    - **Validates: Requirements 13.9**
    - Use fast-check; mock `getDb()` to return controlled row sets
    - Verify that calling `getRolePermissions(R)` at `cachedAt + 60_001ms` returns the updated set

- [x] 2. New tRPC routers — witnesses and caseDocuments
  - [x] 2.1 Create `server/routers/witnesses.ts` with `listByCase`, `get`, `create`, `update`, `delete` procedures
    - `listByCase` / `get`: guard `view_witnesses`; for `isProtected=true` rows, redact `phone`, `email`, `address` to `null` when caller lacks `manage_witnesses`
    - `create` / `update` / `delete`: guard `manage_witnesses`
    - All mutating procedures call `logActivity` on the parent case
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x]* 2.2 Write property test for protected witness contact redaction
    - **Property 8: Protected Witness Contact Redaction**
    - **Validates: Requirements 6.5**
    - Generate arbitrary witness records; verify that a caller without `manage_witnesses` always receives `null` for `phone`/`email`/`address` when `isProtected=true`

  - [x] 2.3 Create `server/routers/caseDocuments.ts` with `listByCase`, `get`, `create`, `uploadVersion`, `updateMetadata`, `delete` procedures
    - `listByCase` / `get` / `updateMetadata`: guard `view_case_documents`
    - `create` / `uploadVersion` / `delete`: guard `manage_case_documents`
    - `uploadVersion`: increment `version` on the parent `caseDocuments` row, insert a `caseDocumentVersions` row for the previous version, call `logActivity`
    - `create` and `uploadVersion` call `logActivity(case, "document_uploaded", title+type+version)`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x]* 2.4 Write property test for document version monotonicity
    - **Property 4: Document Version Monotonicity**
    - **Validates: Requirements 3.4, 3.5**
    - For any document at version N, after `uploadVersion` the document's `version` must equal N+1 and a `caseDocumentVersions` row for version N must be present

  - [x]* 2.5 Write property test for document operations audit trail
    - **Property 5: Document Operations Audit Trail**
    - **Validates: Requirements 3.6, 9.1**
    - After any `create` or `uploadVersion` call, verify the parent case's `activityLogs` contains an entry whose `details` includes document title, type, version number, and author identity

- [x] 3. New tRPC router — permissions
  - [x] 3.1 Create `server/routers/permissions.ts` with `getMatrix`, `setRolePermissions`, `togglePermission`, `getAuditLog`, `myPermissions` procedures
    - All procedures except `myPermissions` guard `manage_users`
    - `setRolePermissions`: wrap delete+insert in a single DB transaction; call `_permCache.delete(role)`; call `logActivity`
    - `togglePermission`: insert or delete a single `rolePermissions` row; call `_permCache.delete(role)`; call `logActivity`
    - `myPermissions`: return the caller's resolved permission set (for client-side tab visibility)
    - _Requirements: 10.3, 10.4, 13.1, 13.4, 13.5, 13.7, 13.11, 13.13, 13.14_

  - [x]* 3.2 Write property test for RBAC enforcement universality
    - **Property 9: RBAC Enforcement Universality**
    - **Validates: Requirements 10.2, 10.5**
    - For any procedure that calls `hasPermission`, mock the permission set to exclude the required permission and assert a `TRPCError` with code `"FORBIDDEN"` is thrown

- [x] 4. Extend existing routers
  - [x] 4.1 Extend `server/routers/warrants.ts` — add `listByCase`, `get`, `submit`, `approve`, `deny`, `execute` procedures; fix `bench_warrant` type in `create`
    - `listByCase` / `get`: guard `view_warrant`; attach computed `displayStatus` via `getWarrantDisplayStatus()` pure function
    - `submit`: transitions `draft → pending_approval`; calls `logActivity(case, "warrant_submitted", ...)`
    - `approve`: updates status to `"approved"`, records `approvedBy` and `dateApproved`; calls `logActivity(case, "warrant_approved", ...)`
    - `deny`: updates status to `"denied"`; calls `logActivity`
    - `execute`: updates status to `"executed"` and sets `executedAt`; calls `logActivity`
    - Add `"bench_warrant"` to the Zod enum in `create`; align `update` status enum to match schema (`"approved"` / `"denied"` instead of `"issued"`)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

  - [x]* 4.2 Write property test for warrant expiry display logic
    - **Property 6: Warrant Expiry Display Logic**
    - **Validates: Requirements 4.9**
    - Use fast-check arbitrary for `{ status, expiresAt }`; verify `getWarrantDisplayStatus` returns `"expired"` iff `status === "approved"` && `expiresAt` is non-null and in the past

  - [x] 4.3 Extend `server/routers/evidence.ts` — add `create` (non-file) and `transferCustody` procedures
    - `create`: guard `upload_evidence`; generate `referenceNumber`; call `logActivity(case, "evidence_added", refNum+type)`
    - `transferCustody`: guard `upload_evidence`; append a custody entry to the JSON array; call `addEvidenceAuditLog`
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

  - [x]* 4.4 Write property test for chain of custody append invariant
    - **Property 7: Chain of Custody Append Invariant**
    - **Validates: Requirements 5.3**
    - For any evidence record with N custody entries, after `transferCustody` the array must have exactly N+1 entries; verify the new entry contains user identity, receiving party, timestamp, and notes

  - [x] 4.5 Extend `server/routers/hearings.ts` — add `logActivity` call in `create` for case audit trail
    - After creating the hearing, call `logActivity(case, "hearing_scheduled", hearingType+scheduledAt)`
    - _Requirements: 12.3, 9.1_

  - [x] 4.6 Register new routers in `server/routers.ts`
    - Add `witnesses: witnessesRouter`, `caseDocuments: caseDocumentsRouter`, `permissions: permissionsRouter` to `appRouter`
    - _Requirements: 6.1, 3.1, 13.1_

- [x] 5. Checkpoint — server layer complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Case status workflow — shared logic and validation
  - [x] 6.1 Verify and export `CASE_STATUS_TRANSITIONS`, `CASE_STATUS_LABELS`, `CASE_STATUSES` from `drizzle/schema.ts`; confirm `cases.update` enforces transitions with the correct error format
    - Error message must include `currentStatus`, `targetStatus`, and `validTargets` (Req 1.4)
    - On successful transition, `logActivity` records previous and new status (Req 1.5)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x]* 6.2 Write property test for status transition guard correctness
    - **Property 1: Status Transition Guard Correctness**
    - **Validates: Requirements 1.2, 1.4**
    - Use `fc.tuple(arbStatus, arbStatus)`; for each `(current, target)` pair call `cases.update` mock and assert result matches `CASE_STATUS_TRANSITIONS[current].includes(target)`

  - [x]* 6.3 Write property test for status change audit trail
    - **Property 2: Status Change Audit Trail**
    - **Validates: Requirements 1.5, 9.1**
    - For any valid transition, after the mutation the `activityLogs` must contain an entry whose `details` records both the previous and new status

  - [x]* 6.4 Write property test for case number uniqueness
    - **Property 3: Case Number Uniqueness**
    - **Validates: Requirements 2.4**
    - Attempt to create a second case with an already-used case number; assert a validation error is returned and the case count is unchanged

- [x] 7. New Case form — enhance to full field set
  - [x] 7.1 Rewrite `src/app/dashboard/cases/new/page.tsx` to include all fields from Requirement 2.1
    - Add fields: Priority Level (default `medium`), Defendant Name, Assigned Prosecutor (user select via `trpc.users.list`), Assigned Judge, Investigating Agency, Filing Date
    - Update the status selector to show all 16 status values with labels from `CASE_STATUS_LABELS`
    - Map `arrestingAgency` → `investigatingAgency` to match schema; send full payload to `trpc.cases.create`
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 1.6_

- [x] 8. Edit Case page
  - [x] 8.1 Rewrite `src/app/dashboard/cases/[id]/edit/page.tsx` as a proper edit form
    - Pre-populate all fields from `trpc.cases.get`
    - Use `CaseStatusSelect` component (built in task 9.2) to show only valid next statuses
    - Submit via `trpc.cases.update`; handle `BAD_REQUEST` transition errors with `toast.error`
    - _Requirements: 1.2, 1.4, 2.1, 2.3, 8.1_

- [x] 9. Case Detail Page — core shell and Overview tab
  - [x] 9.1 Rewrite `src/app/dashboard/cases/[id]/page.tsx` as the 8-tab shell
    - Fetch `trpc.cases.get` and `trpc.permissions.myPermissions` on load
    - Persist active tab in URL query param `?tab=` using `useSearchParams` + `router.replace`
    - Filter visible tabs using `myPermissions` against `page:case_detail/<tab>` permission keys
    - Wrap each `<TabsContent>` lazily (no `forceMount`) so queries fire only on tab activation
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 10.6_

  - [x] 9.2 Write property test for tab URL persistence round-trip
    - **Property 11: Tab URL Persistence Round-Trip**
    - **Validates: Requirements 8.3**
    - For each valid tab identifier, assert that `useSearchParams().get("tab")` equals the identifier after navigation; assert loading `?tab=<id>` pre-selects the correct tab

  - [x] 9.3 Create `src/components/cases/CaseHeader.tsx`
    - Display case number, title, status badge, priority badge, last updated
    - Include "Edit" button (→ `/dashboard/cases/[id]/edit`) gated on `edit_case` permission

  - [x] 9.4 Create `src/components/cases/CaseStatusSelect.tsx`
    - Fetch `trpc.cases.getValidTransitions` for the current case
    - Render only valid next statuses using `CASE_STATUS_LABELS`; call `trpc.cases.update` on change
    - _Requirements: 1.2, 1.6_

  - [x] 9.5 Create `src/components/cases/tabs/OverviewTab.tsx`
    - Show all Requirement 2.1 fields, charges list (add/remove via `trpc.cases.addCharge` / `deleteCharge`), defendants, and personnel
    - _Requirements: 2.1, 5.1, 8.1_

- [x] 10. Case Detail Page — sub-module tabs
  - [x] 10.1 Create `src/components/cases/tabs/DocumentsTab.tsx`
    - List documents via `trpc.caseDocuments.listByCase`; show title, type, version, file name, size, upload date
    - "Upload Document" dialog: calls `trpc.caseDocuments.create` (with optional base64 file)
    - "Upload Version" action per row: calls `trpc.caseDocuments.uploadVersion`
    - "Version History" drawer: calls `trpc.caseDocuments.get` and displays `versions` list
    - Gate create/upload actions on `manage_case_documents`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7, 3.8, 11.1, 11.5_

  - [x] 10.2 Create `src/components/cases/tabs/EvidenceTab.tsx`
    - List evidence via `trpc.evidence.listByCase`; show reference number, type, description, file details
    - "Add Evidence" dialog: calls `trpc.evidence.create` (physical) or `trpc.evidence.upload` (file)
    - "Transfer Custody" action: calls `trpc.evidence.transferCustody`
    - Gate add/transfer actions on `upload_evidence`
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 5.6, 11.1, 11.5_

  - [x] 10.3 Create `src/components/cases/tabs/WarrantsTab.tsx`
    - List warrants via `trpc.warrants.listByCase`; show warrant number, type, computed `displayStatus`, subject, expiry
    - "New Warrant" dialog: calls `trpc.warrants.create` (supports all 4 types including `bench_warrant`)
    - Status action buttons: Submit (`trpc.warrants.submit`), Approve/Deny (`trpc.warrants.approve` / `deny`), Execute (`trpc.warrants.execute`)
    - Gate actions on `create_warrant` / `approve_warrant`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.7, 4.8, 4.9_

  - [x] 10.4 Create `src/components/cases/tabs/WitnessesTab.tsx`
    - List witnesses via `trpc.witnesses.listByCase`; show name, type, statement; hide contact info for protected witnesses unless user has `manage_witnesses`
    - "Add Witness" / "Edit Witness" / "Delete" dialog: calls corresponding `trpc.witnesses.*` mutations
    - Gate add/edit/delete on `manage_witnesses`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 10.5 Create `src/components/cases/tabs/CourtFilingsTab.tsx`
    - Fetch hearings via `trpc.hearings.list` filtered by `caseId`
    - Display upcoming hearings (future, `scheduled`) separately from past hearings
    - "Schedule Hearing" dialog: calls `trpc.hearings.create`; gate on `create_hearing`
    - "Update Hearing" action: calls `trpc.hearings.update` for status/notes changes
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 10.6 Create `src/components/cases/tabs/TimelineTab.tsx`
    - Fetch `trpc.cases.getActivityLog` for the case
    - Render entries in reverse-chronological order with action type icon, description, actor name, and formatted timestamp
    - _Requirements: 9.1, 9.2, 9.3, 8.1_

  - [x] 10.7 Create `src/components/cases/tabs/ActivityLogTab.tsx`
    - Same data source as Timeline; render as a sortable table
    - Add filter controls: action type dropdown and date-range picker
    - Gate entire tab visibility on `view_activity_logs`
    - _Requirements: 9.4, 10.1, 8.1_

- [x] 11. Dashboard enhancements
  - [x] 11.1 Update `src/app/dashboard/page.tsx` to add Pending Warrants stat card and gate "New Case" button
    - Add a fourth stat card using `stats.pendingWarrants` from `trpc.reports.dashboard`
    - Show "New Case" shortcut button only when `myPermissions` includes `create_case`
    - Update `STATUS_LABELS` in the cases list to include all 16 statuses
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 11.2 Update `src/app/dashboard/cases/page.tsx` status filter to include all 16 statuses
    - Replace the hardcoded 9-status `STATUS_OPTIONS` array with values derived from `CASE_STATUS_LABELS`
    - _Requirements: 1.6_

- [x] 12. Checkpoint — UI layer complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Role and Permission Management admin UI
  - [x] 13.1 Create `src/components/admin/PermissionMatrix.tsx`
    - Fetch `trpc.permissions.getMatrix`; render a role × permission grid
    - Each cell is a toggle that calls `trpc.permissions.togglePermission`
    - Show optimistic updates; revert on error
    - _Requirements: 13.4, 13.5_

  - [x] 13.2 Create `src/components/admin/RoleEditor.tsx`
    - Dialog to create a new custom role (calls a future `permissions.createRole` stub or POST to admin endpoint) — placeholder for custom role CRUD
    - Show error if deleting a role with active users (Req 13.3)
    - Display audit history via `trpc.permissions.getAuditLog`; support filter by role, action type, and date range
    - _Requirements: 13.2, 13.3, 13.12_

  - [x] 13.3 Create `src/app/dashboard/admin/permissions/page.tsx`
    - Gate entire page on `manage_users` permission (redirect to dashboard if lacking)
    - Compose `PermissionMatrix` and `RoleEditor` components
    - Add page to sidebar nav under Administration section in `InternalLayout.tsx`
    - _Requirements: 13.1, 13.6, 13.8, 10.4_

  - [x] 13.4 Seed `page:` permission keys into `rolePermissions` on startup via `seedRolePermissions`
    - Extend `seedRolePermissions()` in `server/db.ts` to also insert `page:case_detail/<tab>` rows for each role based on their action permissions (e.g. roles with `view_evidence` get `page:case_detail/evidence`)
    - _Requirements: 13.7, 13.13_

- [x] 14. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- All property-based tests use `fast-check` (`fc`) with a minimum of 100 iterations; locate them in `server/__tests__/` or `shared/__tests__/`
- No DB migrations are needed — all tables exist in `drizzle/schema.ts` and `0004_da_case_management.sql`
- The permission cache change (task 1.1) is a pure in-memory refactor; no schema change
- Client-side tab visibility uses `trpc.permissions.myPermissions` to avoid hardcoded role checks
- The existing `cases.update` already enforces status transitions — task 6.1 is verification + any label/display gaps
- `getWarrantDisplayStatus` is a pure function; implement it in `server/routers/warrants.ts` and export it for use in tests and UI

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "6.1"] },
    { "id": 1, "tasks": ["1.2", "2.1", "2.3", "3.1", "4.1", "4.3", "4.5", "6.2", "6.3", "6.4"] },
    { "id": 2, "tasks": ["2.2", "2.4", "2.5", "3.2", "4.2", "4.4", "4.6"] },
    { "id": 3, "tasks": ["7.1", "8.1"] },
    { "id": 4, "tasks": ["9.1", "9.3", "9.4", "9.5", "11.1", "11.2"] },
    { "id": 5, "tasks": ["9.2", "10.1", "10.2", "10.3", "10.4", "10.5", "10.6", "10.7"] },
    { "id": 6, "tasks": ["13.1", "13.2", "13.4"] },
    { "id": 7, "tasks": ["13.3"] }
  ]
}
```
