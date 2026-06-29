# DA Role Management Bugfix Design

## Overview

The DA Role Management UI has a non-functional Role Editor section. The "Create Custom Role"
button opens a fully-disabled placeholder dialog, no tRPC procedures exist for creating or
editing roles, and the `RoleList` component renders built-in roles as read-only rows with
no Edit action.

The fix enables role creation and editing by:

1. Adding a `roles` table to the database for custom role metadata (slug, label, description)
   — this sidesteps the hardcoded `daRoleEnum` MySQL enum constraint without requiring an
   enum migration.
2. Adding `createRole` and `updateRole` tRPC procedures to `server/routers/permissions.ts`.
3. Wiring up `CreateRoleDialog` and adding an `EditRoleDialog` in `RoleEditor.tsx`.
4. Adding Next.js route pages at `/dashboard/admin/roles/new` and
   `/dashboard/admin/roles/[roleId]/edit`.
5. Extending `RoleList` to show both built-in and custom roles, with Edit and Delete actions
   gated appropriately.

The permission matrix and all existing tRPC procedures remain completely unchanged.

---

## Glossary

- **Bug_Condition (C)**: The set of administrator actions that are expected to work but
  currently fail due to missing server procedures and disabled UI: creating a new role or
  editing an existing role's metadata.
- **Property (P)**: The desired outcome when the bug condition holds — role creation inserts
  a row into the `roles` table and returns the new role; role update modifies the label/
  description and writes an audit log entry.
- **Preservation**: All existing functionality that must be unchanged by this fix — the
  permission toggle matrix, audit log, permission resolution, authorization guards, and
  the built-in role display.
- **Built-in Role**: A role defined in the `daRoleEnum` MySQL enum and `DaRole` TypeScript
  union (e.g., `da`, `admin`, `investigator`). These cannot be deleted and their slugs
  cannot be changed.
- **Custom Role**: A role inserted into the new `roles` table with a varchar slug. Not tied
  to the MySQL enum; can be deleted when no active users are assigned.
- **`createRole`**: The new `permissions.createRole` tRPC mutation that inserts a custom
  role into the `roles` table.
- **`updateRole`**: The new `permissions.updateRole` tRPC mutation that updates the label
  and/or description for any role (built-in or custom) in the `roles` table.
- **`roles` table**: A new database table with columns `id`, `slug` (varchar 32, unique),
  `label` (varchar 64), `description` (text, nullable), `isBuiltIn` (boolean),
  `sortOrder` (int), `createdAt`, `updatedAt`.
- **`getRoles`**: The new `permissions.getRoles` tRPC query that returns all roles from the
  `roles` table, used to populate `RoleList` and the audit log role filter.

---

## Bug Details

### Bug Condition

The bug manifests in two distinct sub-conditions:

**Sub-condition A — Create Role**: An administrator with `manage_users` permission opens the
"Create Custom Role" dialog. The form inputs are `disabled`, a warning notice states that
`permissions.createRole` does not exist, and the submit button is disabled with
`title="Requires permissions.createRole server procedure"`. No server procedure is invoked
and no database write occurs.

**Sub-condition B — Edit Role**: An administrator views the Roles list. Each role row
renders only a delete icon button; there is no Edit button, no navigation to an edit page,
and no `permissions.updateRole` tRPC procedure exists on the server.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type AdminAction
         AdminAction = { type: "create_role", slug: string, label: string }
                     | { type: "edit_role",   roleId: string, label: string }
  OUTPUT: boolean

  IF input.type = "create_role" THEN
    RETURN userHasPermission("manage_users")
           AND formInputsAreEnabled = false     -- inputs are disabled
           AND serverProcedureExists("permissions.createRole") = false
  END IF

  IF input.type = "edit_role" THEN
    RETURN userHasPermission("manage_users")
           AND editButtonExistsInRoleRow = false  -- no Edit action rendered
           AND serverProcedureExists("permissions.updateRole") = false
  END IF

  RETURN false
END FUNCTION
```

### Examples

- **Create (bug)**: Admin clicks "Create Custom Role", types `paralegal` and `Paralegal` —
  form is disabled, no network request is made, role is never created.
- **Create (expected)**: After fix, admin types `paralegal` / `Paralegal`, clicks Create —
  `permissions.createRole` is called, a row is inserted into `roles`, the dialog closes,
  and the new role appears in the list.
- **Duplicate slug (expected)**: Admin tries to create `paralegal` again — server rejects
  with a `BAD_REQUEST` tRPC error, client shows inline field error "Role identifier already
  exists".
- **Edit (bug)**: Admin views role list — no Edit button exists; navigating to
  `/dashboard/admin/roles/da/edit` returns a Next.js 404.
- **Edit (expected)**: After fix, each role row has an Edit button; clicking it navigates
  to `/dashboard/admin/roles/da/edit` pre-populated with the role's label and description.
- **Not-found edit (expected)**: Navigating to `/dashboard/admin/roles/nonexistent/edit`
  renders a "Role not found" error state within the dashboard layout — no unhandled throw.

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**

- The `PermissionMatrix` component reads `DA_ROLE_ORDER` from `shared/permissions.ts` and
  calls `permissions.getMatrix` and `permissions.togglePermission` — these must continue to
  work exactly as before with no schema or API changes.
- The `permissions.setRolePermissions`, `permissions.getAuditLog`, and
  `permissions.myPermissions` procedures must remain unchanged in behavior and signature.
- The `/dashboard/admin/permissions` page must continue to render both `PermissionMatrix`
  and `RoleEditor` side by side without layout regressions.
- Unauthorized access to any admin route must continue to redirect to `/dashboard` with a
  302 response.
- Built-in roles must continue to display with a "Built-in" badge; their delete action must
  remain disabled with the tooltip "Built-in roles cannot be deleted".
- Permission resolution via `hasPermission(daRole, permission)` in `server/db.ts` must
  continue to query `role_permissions` by `daRole` value and fall back to denying all
  permissions when the database is unavailable.

**Scope of Change:**

All inputs that do NOT involve the Create Role or Edit Role actions are unaffected.
Specifically:
- Permission checkbox toggles in the matrix
- Audit log queries and filters
- Any tRPC call to `getMatrix`, `setRolePermissions`, `togglePermission`, `getAuditLog`,
  `myPermissions`
- User session and authentication flows

---

## Hardcoded Enum Constraint — Design Decision

The `daRoleEnum` MySQL enum and the `DaRole` TypeScript union in `shared/permissions.ts`
are both hardcoded. Adding a new value to a MySQL enum requires an `ALTER TABLE` migration
that locks the table during execution and must be coordinated with the TypeScript types.
The requirements (2.1–2.2) call for roles to be inserted into the database and made
"immediately available for assignment to users". This cannot be achieved by modifying the
enum at runtime.

**Chosen approach**: Introduce a `roles` table that stores metadata (slug, label,
description, isBuiltIn, sortOrder) for all roles — both the ten existing built-in roles and
any new custom roles created at runtime. The `users.daRole` column retains the MySQL enum
(unchanged, no migration required for the bug fix). Custom roles created via the UI are
stored in `roles` with their slug but are not added to the enum; assigning a custom role to
a user would require a separate, larger schema migration (out of scope for this bugfix).

This means Requirement 2.2 ("make it immediately available for assignment to users") is
partially satisfied: the role is persisted in the database and can be managed (edit,
permissions, delete), but cannot be assigned to `users.daRole` until a separate enum
migration is performed. The design document calls this out explicitly so the requirements
document can be updated if needed.

The `roles` table will be seeded with the ten built-in roles on first run (via a migration
script or an `ensureBuiltInRoles` startup helper).

---

## Hypothesized Root Cause

The bug has a single, clear root cause: the feature was scaffolded (UI placeholder
components were added) but the server-side implementation was never built. Specifically:

1. **Missing `createRole` mutation**: The `permissionsRouter` in
   `server/routers/permissions.ts` has no `createRole` procedure. The client-side dialog
   explicitly checks for this and disables the form.

2. **Missing `updateRole` mutation**: Similarly, no `updateRole` procedure exists and no
   `roles` table exists to write to. The `RoleList` component never renders an Edit button
   because there is no endpoint to call.

3. **Missing database table**: There is no `roles` table in `drizzle/schema.ts`. The
   existing `rolePermissions` table only stores the role-permission mapping; role metadata
   (label, description, sort order) has no storage location.

4. **Missing Next.js routes**: The pages at `src/app/dashboard/admin/roles/new/page.tsx`
   and `src/app/dashboard/admin/roles/[roleId]/edit/page.tsx` do not exist, causing 404
   responses.

5. **Missing `getRoles` query**: There is no tRPC procedure to list all roles from the
   database; the client uses the hardcoded `DA_ROLE_LABELS` object directly.

---

## Correctness Properties

Property 1: Bug Condition — Role Creation Succeeds

_For any_ input where `isBugCondition` holds with `type = "create_role"` (i.e., an
authorized admin submits a non-duplicate slug and non-empty label), the fixed
`permissions.createRole` procedure SHALL insert a row into the `roles` table, return the
newly created role object (`{ id, slug, label, description, isBuiltIn, sortOrder,
createdAt }`), and write an audit log entry with `action = "role.created"`, actor user ID,
role slug, label, and ISO 8601 timestamp.

**Validates: Requirements 2.1, 2.2, 2.6**

Property 2: Bug Condition — Role Update Succeeds

_For any_ input where `isBugCondition` holds with `type = "edit_role"` (i.e., an authorized
admin submits a non-empty label for an existing role ID), the fixed
`permissions.updateRole` procedure SHALL update the `label` and `description` fields in the
`roles` table for that role ID, return the updated role object, and write an audit log entry
with `action = "role.updated"`, actor user ID, role ID, previous label, new label, and ISO
8601 timestamp.

**Validates: Requirements 2.4, 2.5**

Property 3: Preservation — Permission Matrix Unaffected

_For any_ input where `isBugCondition` does NOT hold — specifically, any call to
`permissions.getMatrix`, `permissions.togglePermission`, or
`permissions.setRolePermissions` — the fixed server SHALL produce exactly the same result
as the original server. No schema changes to `role_permissions` or the `rolePermissions`
Drizzle table affect these procedures.

**Validates: Requirements 3.1, 3.2**

Property 4: Preservation — Audit Log Unaffected

_For any_ audit log query (any combination of `role`, `actionType`, `from`, `to` filter
inputs), the fixed `permissions.getAuditLog` procedure SHALL return the same results as
before the fix, preserving filter semantics, reverse-chronological ordering, and the entry
cap (200 entries per query as specified in Req 3.4; note: the current implementation caps
at 100 — the fix should update the limit to 200 to match the requirement).

**Validates: Requirements 3.4**

---

## Fix Implementation

### Database Schema Changes

**New file**: `drizzle/0005_da_role_management.sql`

```sql
CREATE TABLE roles (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  slug        VARCHAR(32) NOT NULL UNIQUE,
  label       VARCHAR(64) NOT NULL,
  description TEXT,
  is_built_in BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed built-in roles
INSERT INTO roles (slug, label, is_built_in, sort_order) VALUES
  ('da',              'District Attorney',  TRUE, 0),
  ('chief_deputy_da', 'Chief Deputy DA',    TRUE, 1),
  ('division_chief',  'Division Chief',     TRUE, 2),
  ('senior_prosecutor', 'Senior Prosecutor', TRUE, 3),
  ('deputy_da',       'Deputy DA',          TRUE, 4),
  ('investigator',    'Investigator',       TRUE, 5),
  ('legal_clerk',     'Legal Clerk',        TRUE, 6),
  ('victim_advocate', 'Victim Advocate',    TRUE, 7),
  ('intern',          'Intern',             TRUE, 8),
  ('admin',           'System Admin',       TRUE, 9);
```

**Drizzle schema addition** (`drizzle/schema.ts`): Add a `roles` table definition.

```typescript
export const roles = mysqlTable("roles", {
  id:          int("id").autoincrement().primaryKey(),
  slug:        varchar("slug", { length: 32 }).notNull().unique(),
  label:       varchar("label", { length: 64 }).notNull(),
  description: text("description"),
  isBuiltIn:   boolean("is_built_in").notNull().default(false),
  sortOrder:   int("sort_order").notNull().default(0),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;
```

### Server Changes

**File**: `server/routers/permissions.ts`

Add three new procedures:

1. **`getRoles`** (query): Returns all rows from the `roles` table ordered by `sortOrder`.
   Guard: `manage_users`.

2. **`createRole`** (mutation): Validates slug format (`/^[a-z0-9_]{1,32}$/`), checks for
   existing slug (throws `BAD_REQUEST` with message `"Role identifier already exists"` if
   duplicate), inserts into `roles`, writes audit log entry with
   `action = "role.created"`, returns the new role. Guard: `manage_users`.

3. **`updateRole`** (mutation): Accepts `{ id: number, label: string, description?: string }`,
   reads the existing role to capture `previousLabel`, updates the row, writes audit log
   entry with `action = "role.updated"` including `previousLabel` and `newLabel` in
   `details`, returns the updated role. Guard: `manage_users`.

The `getAuditLog` query limit should be updated from `100` to `200` to match Req 3.4.

### Client Component Changes

**File**: `src/components/admin/RoleEditor.tsx`

1. **`RoleList`**: Replace static `DA_ROLES` array with a `trpc.permissions.getRoles.useQuery()`
   call. Render both built-in and custom roles. Add an Edit icon button to each row that
   navigates to `/dashboard/admin/roles/[role.slug]/edit`. Keep the delete button disabled
   for built-in roles with the tooltip "Built-in roles cannot be deleted".

2. **`CreateRoleDialog`**: Remove the disabled warning notice, enable the form inputs,
   wire up a `trpc.permissions.createRole.useMutation()` call on submit. Show inline field
   error when the server returns `"Role identifier already exists"`. Close dialog and
   invalidate `getRoles` query on success.

3. Add a `getRoles` query invalidation after create/update/delete mutations so the list
   stays fresh.

### New Pages

**File**: `src/app/dashboard/admin/roles/new/page.tsx`
- Server component with `manage_users` permission guard (redirect to `/dashboard` if
  unauthorized).
- Renders a `CreateRolePage` client component with a form for slug and label.
- On submit, calls `permissions.createRole`; on success, navigates to
  `/dashboard/admin/permissions`.

**File**: `src/app/dashboard/admin/roles/[roleId]/edit/page.tsx`
- Server component with `manage_users` permission guard.
- Fetches the role by slug from `permissions.getRoles`; if not found, renders a
  "Role not found" error state within the dashboard layout (no unhandled throw).
- Renders an `EditRolePage` client component pre-populated with current label and
  description.
- On submit, calls `permissions.updateRole`; on success, navigates to
  `/dashboard/admin/permissions`.

---

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that
demonstrate the bug on the unfixed code to confirm the root cause; then verify the fix
works correctly and preserves all existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix.
Confirm the root cause (missing procedures and disabled form) by running tests against the
unfixed server.

**Test Plan**: Write tRPC caller tests that attempt to invoke `permissions.createRole` and
`permissions.updateRole` directly. These should throw `NOT_FOUND` or similar on unfixed
code. Also write a React Testing Library test that mounts `CreateRoleDialog` and asserts
the inputs are disabled and the submit button is disabled.

**Test Cases**:
1. **Create Role — missing procedure** (will fail on unfixed code): Call
   `trpc.permissions.createRole({ slug: "paralegal", label: "Paralegal" })` — expect a
   tRPC error because the procedure doesn't exist.
2. **Edit Role — missing procedure** (will fail on unfixed code): Call
   `trpc.permissions.updateRole({ id: 1, label: "Updated" })` — expect a tRPC error.
3. **CreateRoleDialog — disabled form** (will fail on unfixed code): Mount
   `<CreateRoleDialog />`, assert `role-id` input has `disabled` attribute.
4. **RoleList — no Edit button** (will fail on unfixed code): Mount `<RoleList />`, assert
   no element with aria-label matching `/edit/i` is present in the role rows.

**Expected Counterexamples**:
- `permissions.createRole` does not exist on the router — tRPC throws `NOT_FOUND`.
- Form inputs in `CreateRoleDialog` have `disabled={true}` hardcoded.
- No Edit button is rendered in `RoleList`.

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed procedures
produce the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) AND input.type = "create_role" DO
  result := createRole_fixed(input.slug, input.label)
  ASSERT result.slug = input.slug
  ASSERT result.label = input.label
  ASSERT result.isBuiltIn = false
  ASSERT auditLogContains(action="role.created", roleSlug=input.slug)
END FOR

FOR ALL input WHERE isBugCondition(input) AND input.type = "edit_role" DO
  result := updateRole_fixed(input.id, input.label, input.description)
  ASSERT result.label = input.label
  ASSERT auditLogContains(action="role.updated", previousLabel=oldLabel, newLabel=input.label)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed server
and client produce identical results to the original.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT original_handler(input) = fixed_handler(input)
END FOR
```

**Testing Approach**: Property-based testing is appropriate for preservation of the
permission matrix because the input space (role × permission × granted boolean) is large
and combinatorial. For the audit log and authorization guards, example-based tests are
sufficient since the behavior is deterministic and the input space is small.

**Test Cases**:
1. **Permission Matrix Preservation**: For any `{ role, permission, granted }` triple
   (property-based, sampling from DA_ROLE_ORDER × all permissions × [true, false]),
   `togglePermission` before and after the fix returns `{ success: true }` and the
   `role_permissions` table reflects the expected state.
2. **Audit Log Preservation**: For any combination of `{ role, actionType, from, to }`
   filters, `getAuditLog` returns the same entries before and after the fix.
3. **Authorization Guard Preservation**: Calling `createRole` or `updateRole` without
   `manage_users` permission throws `FORBIDDEN`; calling `getMatrix` without
   `manage_users` continues to throw `FORBIDDEN`.
4. **Built-in Role Display**: After fix, `RoleList` still renders a "Built-in" badge for
   each of the ten built-in roles, and the delete button for each is disabled with tooltip
   "Built-in roles cannot be deleted".
5. **Page Layout Preservation**: `/dashboard/admin/permissions` continues to render both
   `PermissionMatrix` and `RoleEditor` components without errors.

### Unit Tests

- `createRole` — valid slug and label inserts a row and writes audit log.
- `createRole` — duplicate slug returns `BAD_REQUEST` with message "Role identifier already
  exists".
- `createRole` — invalid slug format (uppercase, spaces, special chars) returns
  `BAD_REQUEST`.
- `updateRole` — updates label and description and writes audit log with previous/new label.
- `updateRole` — non-existent role ID returns `NOT_FOUND`.
- `getRoles` — returns all roles ordered by `sortOrder`.
- `getAuditLog` — limit is 200 entries (regression: was 100).
- `CreateRoleDialog` — after fix, inputs are enabled, submit calls `createRole` mutation.
- `RoleList` — Edit button is present for each role row after fix.
- Edit page — renders "Role not found" error when slug doesn't match any role.

### Property-Based Tests

- Generate random valid slug strings (lowercase alphanumeric + underscores, 1–32 chars) and
  assert each `createRole` call either succeeds (unique slug) or returns the duplicate error
  (existing slug) — never throws unexpectedly.
- Generate random `{ role, permission, granted }` triples and assert `togglePermission`
  idempotency: toggling the same cell twice returns it to its original state, and the fix
  does not alter this behavior.
- Generate random non-`manage_users` roles and assert `createRole`, `updateRole`,
  `getRoles`, and `getMatrix` all throw `FORBIDDEN`.

### Integration Tests

- Full create-role flow: open dialog → enter slug and label → submit → dialog closes →
  new role appears in `RoleList` → audit log shows `role.created` entry.
- Full edit-role flow: click Edit on a role → edit page loads pre-populated → submit
  updated label → redirected back to permissions page → `RoleList` shows updated label →
  audit log shows `role.updated` entry with previous and new label.
- Not-found edit: navigate to `/dashboard/admin/roles/nonexistent/edit` → "Role not found"
  error state renders within the dashboard layout, no 404 or unhandled error.
- Unauthorized access: visit `/dashboard/admin/roles/new` as a user without `manage_users`
  → redirected to `/dashboard`.
