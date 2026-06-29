# Implementation Plan

## Overview

This task list implements the DA Role Management bugfix using the exploratory bugfix workflow. The bug manifests in two sub-conditions: (A) the "Create Custom Role" form is fully disabled because `permissions.createRole` does not exist, and (B) no Edit button exists in the Role List because `permissions.updateRole` does not exist. The fix adds the `roles` database table, three new tRPC procedures (`getRoles`, `createRole`, `updateRole`), updates `RoleEditor.tsx`, and adds two new Next.js pages.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1", "2"] },
    { "wave": 2, "tasks": ["3.1"] },
    { "wave": 3, "tasks": ["3.2"] },
    { "wave": 4, "tasks": ["3.3", "3.4", "3.5", "3.6"] },
    { "wave": 5, "tasks": ["3.7", "3.8"] },
    { "wave": 6, "tasks": ["4"] }
  ]
}
```

Tasks 1 and 2 are written before any implementation and run on unfixed code. Tasks 3.1–3.6 are the implementation steps. Tasks 3.7 and 3.8 re-run the exploration and preservation tests against the fixed code. Task 4 is the final integration checkpoint.

## Tasks

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Missing createRole and updateRole Procedures
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to two concrete failing cases to ensure reproducibility
  - Write a tRPC caller test (or Vitest unit test using the router directly) that:
    - **Case A — Create Role bug**: Call `permissions.createRole({ slug: "paralegal", label: "Paralegal" })` — assert it throws a tRPC `NOT_FOUND` (or equivalent) because the procedure does not exist on the router
    - **Case B — Update Role bug**: Call `permissions.updateRole({ id: 1, label: "Updated" })` — assert it throws a tRPC error because the procedure does not exist
    - **Case C — Disabled form (isBugCondition sub-condition A)**: Mount `<CreateRoleDialog />` with React Testing Library and assert the `role-id` input element has the `disabled` attribute set
    - **Case D — No Edit button (isBugCondition sub-condition B)**: Mount `<RoleList />` and assert no element with `aria-label` matching `/edit/i` is present in the role rows
  - The assertions encode expected post-fix behavior:
    - `createRole` should succeed and return `{ id, slug, label, isBuiltIn: false, ... }`
    - `updateRole` should succeed and return the updated role
    - Form inputs should be enabled after fix
    - An Edit button should be present per row after fix
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: All four assertions FAIL (proves the bug exists)
  - Document counterexamples found (e.g., "permissions.createRole is undefined on the router; form input has disabled=true; no edit button rendered")
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Permission Matrix, Audit Log, and Auth Guard Behavior
  - **IMPORTANT**: Follow observation-first methodology — run unfixed code with non-buggy inputs first, observe outputs, then write assertions
  - **Observe on UNFIXED code** (cases where `isBugCondition` returns false — no create/edit role action involved):
    - `permissions.getMatrix` called by an admin with `manage_users` returns the full role × permission grid
    - `permissions.togglePermission({ role: "intern", permission: "view_case", granted: true })` returns `{ success: true }` and `role_permissions` reflects the change
    - `permissions.getAuditLog({})` returns entries in reverse-chronological order
    - `permissions.getMatrix` called without `manage_users` throws `FORBIDDEN`
    - `<RoleList />` renders a "Built-in" badge and disabled delete button (with tooltip) for each of the ten built-in roles
    - `/dashboard/admin/permissions` renders both `PermissionMatrix` and `RoleEditor` without errors
  - Write property-based tests capturing observed patterns:
    - **Permission toggle idempotency** (PBT): For any `{ role, permission, granted }` triple sampled from `DA_ROLE_ORDER × all permissions × [true, false]`, toggling the same cell twice restores it to its original state; assert `togglePermission` never throws unexpectedly
    - **Audit log preservation** (example-based): For combinations of `{ role, actionType, from, to }` filters, `getAuditLog` returns entries in reverse-chronological order and returns at most 200 entries
    - **Authorization guard** (example-based): A non-`manage_users` role calling `createRole`, `updateRole`, `getRoles`, or `getMatrix` receives `FORBIDDEN`
    - **Built-in role display** (example-based): Each of the ten built-in roles has a "Built-in" badge and its delete button is disabled
  - Run all preservation tests on UNFIXED code
  - **EXPECTED OUTCOME**: All preservation tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 3. Fix — Enable DA Role Creation and Editing

  - [ ] 3.1 Add `roles` table to Drizzle schema and create migration
    - Create `drizzle/0005_da_role_management.sql` with the `roles` table DDL and `INSERT` seed for the ten built-in roles (see design §Database Schema Changes)
    - Add the `roles` table definition to `drizzle/schema.ts`:
      ```ts
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
    - Run the migration against the development database
    - _Bug_Condition: isBugCondition(input) — missing database table is part of root cause_
    - _Expected_Behavior: roles table exists with slug UNIQUE constraint; ten built-in rows seeded_
    - _Preservation: No changes to `role_permissions`, `users`, `daRoleEnum`, or any existing table_
    - _Requirements: 2.1, 2.2_

  - [ ] 3.2 Add `getRoles`, `createRole`, and `updateRole` tRPC procedures
    - In `server/routers/permissions.ts`, add three new procedures (all guarded by `manage_users`):
    - **`getRoles`** (query): `SELECT * FROM roles ORDER BY sort_order` — returns `Role[]`
    - **`createRole`** (mutation):
      - Input: `{ slug: z.string().regex(/^[a-z0-9_]{1,32}$/), label: z.string().min(1).max(64), description: z.string().optional() }`
      - Check for duplicate slug; throw `BAD_REQUEST` with message `"Role identifier already exists"` if found
      - Insert into `roles` with `isBuiltIn: false`
      - Write audit log entry: `action = "role.created"`, `details` includes `roleSlug`, `label`, actor userId, ISO 8601 timestamp
      - Return the newly inserted `Role` object
    - **`updateRole`** (mutation):
      - Input: `{ id: z.number(), label: z.string().min(1).max(64), description: z.string().optional() }`
      - Fetch existing role; throw `NOT_FOUND` if absent
      - Capture `previousLabel` before update
      - Update `label` and `description` in `roles` table
      - Write audit log entry: `action = "role.updated"`, `details` includes `roleId`, `previousLabel`, `newLabel`, actor userId, ISO 8601 timestamp
      - Return the updated `Role` object
    - Also update the `getAuditLog` procedure: change `.limit(100)` to `.limit(200)` to match Req 3.4
    - _Bug_Condition: isBugCondition — serverProcedureExists("permissions.createRole") = false AND serverProcedureExists("permissions.updateRole") = false_
    - _Expected_Behavior: createRole inserts a row, returns Role; updateRole updates row, returns Role; both write audit log entries_
    - _Preservation: getMatrix, setRolePermissions, togglePermission, myPermissions signatures and behavior unchanged; getAuditLog behavior unchanged except limit raised to 200_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.4_

  - [ ] 3.3 Update `RoleList` to use `getRoles` query and add Edit button
    - In `src/components/admin/RoleEditor.tsx`, replace the static `DA_ROLES` array iteration in `RoleList` with `trpc.permissions.getRoles.useQuery()`
    - Render both built-in and custom roles from the query result
    - Add an Edit icon button (`<Pencil />` or equivalent) to each role row that navigates to `/dashboard/admin/roles/[role.slug]/edit` using `useRouter().push()`
    - Keep the delete button disabled for built-in roles (`role.isBuiltIn === true`) with `title="Built-in roles cannot be deleted"`
    - Show a loading skeleton while `isLoading` is true
    - _Bug_Condition: isBugCondition — editButtonExistsInRoleRow = false_
    - _Expected_Behavior: Edit button navigates to /dashboard/admin/roles/[slug]/edit for every role row_
    - _Preservation: "Built-in" badge and disabled delete button still rendered for all ten built-in roles_
    - _Requirements: 2.4, 3.6_

  - [ ] 3.4 Update `CreateRoleDialog` to call `createRole` mutation
    - In `src/components/admin/RoleEditor.tsx`, remove the disabled warning notice from `CreateRoleDialog`
    - Enable the `role-id` and `role-label` inputs (remove `disabled` prop)
    - Wire up `trpc.permissions.createRole.useMutation()`:
      - On submit: call the mutation with `{ slug: roleName, label: roleLabel }`
      - On `BAD_REQUEST` with message `"Role identifier already exists"`: show an inline field error beneath the slug input
      - On success: call `utils.permissions.getRoles.invalidate()`, then call `handleClose()`
      - Show a loading/pending state on the submit button while the mutation is in-flight
    - Add a `description` textarea field (optional) to the dialog
    - _Bug_Condition: isBugCondition — formInputsAreEnabled = false_
    - _Expected_Behavior: Submit calls permissions.createRole; dialog closes on success; getRoles list refreshes_
    - _Preservation: Dialog open/close behavior and Cancel button behavior unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 2.6_

  - [ ] 3.5 Create `/dashboard/admin/roles/new` page
    - Create `src/app/dashboard/admin/roles/new/page.tsx` as a server component
    - Add `manage_users` permission guard: fetch session, check permission, redirect to `/dashboard` (302) if unauthorized
    - Render a `CreateRolePage` client component with a form for slug, label, and optional description
    - On form submit: call `trpc.permissions.createRole`; on success, `router.push("/dashboard/admin/permissions")`
    - On error `"Role identifier already exists"`: display inline field error
    - _Bug_Condition: isBugCondition — navigating to /dashboard/admin/roles/new returns Next.js 404_
    - _Expected_Behavior: Page renders within dashboard layout; unauthorized users redirected to /dashboard_
    - _Preservation: Unauthorized redirect behavior matches all other admin routes (302 to /dashboard)_
    - _Requirements: 2.1, 2.8_

  - [ ] 3.6 Create `/dashboard/admin/roles/[roleId]/edit` page
    - Create `src/app/dashboard/admin/roles/[roleId]/edit/page.tsx` as a server component
    - Add `manage_users` permission guard (same pattern as 3.5)
    - Fetch the role by slug from `permissions.getRoles`; if no matching role is found, render a "Role not found" error state within the dashboard layout — do NOT throw an unhandled error
    - Render an `EditRolePage` client component pre-populated with the role's current `label` and `description`
    - On form submit: call `trpc.permissions.updateRole({ id: role.id, label, description })`; on success, `router.push("/dashboard/admin/permissions")`
    - _Bug_Condition: isBugCondition — navigating to /dashboard/admin/roles/[roleId]/edit returns Next.js 404_
    - _Expected_Behavior: Edit page renders pre-populated; "Role not found" state renders gracefully when slug is absent_
    - _Preservation: Unauthorized redirect behavior unchanged; no unhandled errors thrown_
    - _Requirements: 2.4, 2.5, 2.7, 2.8_

  - [ ] 3.7 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - createRole and updateRole Procedures Exist and Work
    - **IMPORTANT**: Re-run the SAME tests written in task 1 — do NOT write new tests
    - The tests from task 1 encode the expected behavior:
      - `permissions.createRole({ slug: "paralegal", label: "Paralegal" })` succeeds and returns `{ id, slug: "paralegal", label: "Paralegal", isBuiltIn: false, ... }`
      - `permissions.updateRole({ id: <id>, label: "Updated" })` succeeds and returns the updated role
      - `<CreateRoleDialog />` renders with the `role-id` input NOT having the `disabled` attribute
      - `<RoleList />` renders an Edit button for each role row
    - Run the bug condition exploration tests from task 1
    - **EXPECTED OUTCOME**: All four assertions PASS (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.4, 2.5_

  - [ ] 3.8 Verify preservation tests still pass
    - **Property 2: Preservation** - Permission Matrix, Audit Log, and Auth Guard Behavior
    - **IMPORTANT**: Re-run the SAME tests written in task 2 — do NOT write new tests
    - Run all preservation property tests from task 2 against the fixed code
    - Confirm:
      - Permission toggle idempotency property still holds for all sampled triples
      - `getAuditLog` still returns results in reverse-chronological order and the new limit is 200
      - Authorization guards still throw `FORBIDDEN` for non-`manage_users` callers
      - Each built-in role still shows "Built-in" badge and disabled delete button in `RoleList`
      - `/dashboard/admin/permissions` still renders both `PermissionMatrix` and `RoleEditor`
    - **EXPECTED OUTCOME**: All preservation tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [ ] 4. Checkpoint — Ensure all tests pass
  - Run the full test suite (`vitest --run` or equivalent)
  - Ensure all tests pass, ask the user if questions arise
  - Confirm the following integration flows work end-to-end:
    - Create role flow: open dialog → enter `paralegal` / `Paralegal` → submit → dialog closes → new role appears in `RoleList` → audit log shows `role.created` entry
    - Edit role flow: click Edit on a role → edit page loads pre-populated → submit updated label → redirected to permissions page → `RoleList` shows updated label → audit log shows `role.updated` with previous and new label
    - Not-found edit: navigate to `/dashboard/admin/roles/nonexistent/edit` → "Role not found" error state, no 404 or unhandled error
    - Unauthorized access: visit `/dashboard/admin/roles/new` without `manage_users` → redirected to `/dashboard`
    - Duplicate slug: attempt to create `paralegal` a second time → inline error "Role identifier already exists"

## Notes

- **Enum constraint**: The `daRoleEnum` MySQL enum and `DaRole` TypeScript union are NOT modified. Custom roles are stored in the new `roles` table but cannot be assigned to `users.daRole` until a separate enum migration (out of scope for this bugfix). Requirement 2.2 is partially satisfied — see design §Hardcoded Enum Constraint.
- **Audit log action strings**: The design uses `role.created` / `role.updated` (dot-separated); the existing activity log uses underscore-separated strings (`permissions_updated`, `permission_toggled`). Use whatever format is consistent with the existing `logActivity` helper — confirm before implementing 3.2.
- **getAuditLog limit**: The current implementation caps at 100; Req 3.4 and the design both specify 200. The limit change is part of task 3.2.
- **Test framework**: The project uses Vitest. Check `package.json` test script for the correct invocation. Use `vitest --run` for single-pass execution.
- **tRPC caller pattern**: For server-side unit tests of tRPC procedures, use the `createCaller` utility from `@trpc/server` to invoke procedures directly without an HTTP layer.
