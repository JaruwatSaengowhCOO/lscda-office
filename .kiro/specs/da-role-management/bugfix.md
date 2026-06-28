# Bugfix Requirements Document

## Introduction

The DA Role Management UI is incomplete. The "Roles & Permissions" page (`/dashboard/admin/permissions`) contains a `RoleEditor` component with a "Create Custom Role" button, but the form is fully disabled and no server-side procedures exist to support creating, editing, or managing DA roles at runtime. Administrators currently have no way to view role details, create new roles, or edit role metadata (label, description, rank order) through the UI — the only management surface is the permission toggle matrix, which modifies permissions but not roles themselves.

This gap prevents authorized administrators from fulfilling their role management responsibilities and renders the Role Editor section of the admin page non-functional.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN an administrator with `manage_users` permission navigates to `/dashboard/admin/permissions` and clicks "Create Custom Role" THEN the system displays a disabled form with a visible warning message stating that the feature is unavailable because the `permissions.createRole` tRPC procedure does not exist on the server

1.2 WHEN an administrator views the Roles list in the Role Editor THEN the system displays each role as a read-only row showing only the role identifier and label, with no "Edit" button, no link to a detail view, and no way to modify the role's label or description

1.3 WHEN an administrator attempts to create a new DA role THEN the system provides no functional form input, no `permissions.createRole` tRPC endpoint, and no database write path — the role is never persisted

1.4 WHEN an administrator attempts to edit an existing DA role's display label or description THEN the system provides no edit action in the UI and no `permissions.updateRole` tRPC endpoint, leaving the role's metadata unchanged

1.5 WHEN an administrator navigates to `/dashboard/admin/roles/new` or `/dashboard/admin/roles/[roleId]/edit` THEN the system returns a Next.js 404 "page not found" error because neither route exists in the `src/app/dashboard/admin/` directory

### Expected Behavior (Correct)

2.1 WHEN an administrator with `manage_users` permission clicks "Create Role" THEN the system SHALL display a modal or dedicated page form with fields for role identifier (slug, max 32 chars, lowercase alphanumeric and underscores only) and display label (max 64 chars)

2.2 WHEN the administrator submits the Create Role form with a unique identifier and non-empty label THEN the system SHALL insert the role into the database, make it immediately available for assignment to users, and return the newly created role to the client

2.3 WHEN the administrator submits the Create Role form with a role identifier that already exists THEN the system SHALL reject the submission and display an inline field error: "Role identifier already exists"

2.4 WHEN an administrator with `manage_users` permission views the Roles list THEN the system SHALL display an "Edit" action for each role that navigates to `/dashboard/admin/roles/[roleId]/edit` pre-populated with the role's current label and description

2.5 WHEN an administrator submits the Edit Role form with a non-empty label THEN the system SHALL update the role's label and description in the database and write an audit log entry containing: actor user ID, action type `role.updated`, role ID, previous label, new label, and ISO 8601 timestamp

2.6 WHEN an administrator with `manage_users` permission submits the Create Role form with valid input THEN the system SHALL write an audit log entry containing: actor user ID, action type `role.created`, new role ID, new label, and ISO 8601 timestamp

2.7 WHEN an administrator navigates to `/dashboard/admin/roles/[roleId]/edit` with a roleId that does not exist in the database THEN the system SHALL render a "Role not found" error state within the dashboard layout and SHALL NOT throw an unhandled error

2.8 WHEN an administrator navigates to `/dashboard/admin/roles/new` THEN the system SHALL display a functional Create Role page within the dashboard layout, accessible only to users with `manage_users` permission, and SHALL redirect unauthorized users to `/dashboard`

### Unchanged Behavior (Regression Prevention)

3.1 WHEN any user with `manage_users` permission views the permission matrix on the Roles & Permissions page THEN the system SHALL CONTINUE TO display the complete role × permission grid for all roles defined in the `role_permissions` table, and SHALL allow toggling each cell; IF a toggle request fails due to a server or database error THEN the system SHALL revert the cell to its previous state and display an error toast

3.2 WHEN a user with `manage_users` permission accesses `/dashboard/admin/permissions` THEN the system SHALL CONTINUE TO render both the `PermissionMatrix` and `RoleEditor` components on the same page without layout regressions

3.3 WHEN a user without `manage_users` permission accesses `/dashboard/admin/permissions` THEN the system SHALL CONTINUE TO redirect them to `/dashboard` with a 302 response and SHALL NOT render any admin UI content

3.4 WHEN an administrator views the audit log in the Role Editor THEN the system SHALL CONTINUE TO display permission change history entries, supporting filter by role and filter by date range; the list SHALL cap at 200 entries per query and return results in reverse-chronological order

3.5 WHEN the application resolves permissions for a user's DA role THEN the system SHALL CONTINUE TO query the `role_permissions` table by `daRole` value and return the correct boolean map; IF the database is unavailable THEN the system SHALL fall back to denying all optional permissions rather than throwing an unhandled exception

3.6 WHEN built-in DA roles (`da`, `chief_deputy_da`, `division_chief`, `senior_ada`, `aida`, `lda`) are displayed in the Roles list THEN the system SHALL CONTINUE TO show them with a "Built-in" badge, SHALL disable the delete action for those roles, and SHALL display an explanatory tooltip "Built-in roles cannot be deleted" when the disabled delete button is hovered; "active users" means at least one user record in the `users` table has that `daRole` value and `status` is not `terminated`
