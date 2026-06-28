# Requirements Document

## Introduction

The DA Case Management System is a comprehensive internal application for the Los Santos County District Attorney's Office, inspired by real California District Attorney workflows. It provides end-to-end case lifecycle management — from initial law enforcement investigation through charging, court proceedings, verdict, and closure — along with integrated modules for Documents, Warrants, Evidence, and Witnesses, all governed by role-based access control and a complete audit trail.

The system extends and replaces an earlier partial implementation, adding a fully-validated case status workflow, enriched case fields, dedicated sub-modules linked to each case, a case detail tabbed interface, a contextual dashboard, and a granular RBAC permission model aligned to real DA office roles.

## Glossary

- **Case_Management_System**: The full internal web application described in this document.
- **Case**: A prosecutorial matter tracked from investigation through disposition.
- **Case_Status**: The current workflow stage of a Case.
- **Status_Transition**: A permitted change from one Case_Status to another.
- **Case_Document**: A legal or evidentiary document attached to a Case (distinct from the general office Documents module).
- **Warrant**: A formal legal instrument (arrest, search, bench, or subpoena) initiated through the system and linked to a Case.
- **Evidence**: Physical or digital material collected in connection with a Case.
- **Witness**: A person with relevant knowledge of a Case, managed within the system.
- **Charge**: A specific criminal allegation associated with a Case.
- **Audit_Log**: An immutable, timestamped record of every significant action taken on a Case or its sub-records.
- **Timeline**: The chronological display of Audit_Log entries on a Case detail page.
- **Activity_Log**: Synonym for Audit_Log in the context of case-level entries.
- **RBAC**: Role-Based Access Control — the permission model restricting what each role may do.
- **DA_Role**: One of the defined staff roles: District_Attorney, Deputy_DA, Investigator, Judge, Clerk, Administrator (mapped to system identifiers defined in the Glossary below).
- **District_Attorney**: The elected chief prosecutor; system role `da`.
- **Deputy_DA**: A line prosecutor; system role `deputy_da` or `senior_prosecutor`.
- **Investigator**: Law enforcement or DA investigator; system role `investigator`.
- **Judge**: A judicial officer who approves warrants; system role mapped via `assignedJudge` field and warrant approval.
- **Clerk**: Administrative court staff; system role `legal_clerk`.
- **Administrator**: System administrator; system role `admin`.
- **Dashboard**: The landing page shown after login, summarizing key case metrics and upcoming events.
- **Case_Detail_Page**: The full case record view, organized into tabs.
- **Chain_of_Custody**: The documented sequence of possession and transfer of evidence items.
- **Version_History**: The ordered list of prior file versions for a Case_Document.
- **Priority_Level**: A severity classification for a Case: Low, Medium, High, or Critical.
- **Role_Permission_Manager**: The admin UI sub-section that allows Administrators to manage roles, permissions, and page-level access controls at runtime.
- **Page_Permission**: A special permission entry in the `role_permissions` table with a key prefixed `page:` that controls whether a role can see a specific navigation item, dashboard route, or case detail tab.
- **Permission_Matrix**: The grid view in the Role_Permission_Manager showing all roles versus all permissions, with each cell representing whether the role currently holds that permission.
- **Cache_TTL**: The maximum duration (60 seconds) after which a permission change is guaranteed to be visible to affected users without requiring a sign-out/sign-in.

---

## Requirements

---

### Requirement 1: Case Status Workflow

**User Story:** As a Deputy DA, I want cases to follow a defined status workflow, so that I can track a case's progress through investigation, charging, court proceedings, and disposition without skipping required stages.

#### Acceptance Criteria

1. THE Case_Management_System SHALL support exactly the following ordered status values: `investigation`, `submitted_to_da`, `case_review`, `rejected`, `filed`, `warrant_requested`, `warrant_issued`, `arraignment`, `preliminary_hearing`, `pre_trial`, `trial`, `verdict`, `sentencing`, `appeal`, `closed`, `dismissed`.

2. WHEN a user attempts to change a Case's status, THE Case_Management_System SHALL validate the requested transition against the permitted transition table and, as an atomic operation, both detect and prevent any transition that is not listed as valid for the current status.

3. THE Case_Management_System SHALL enforce the following permitted forward transitions:
   - `investigation` → `submitted_to_da`, `closed`, `dismissed`
   - `submitted_to_da` → `case_review`, `rejected`
   - `case_review` → `filed`, `rejected`, `warrant_requested`
   - `rejected` → `investigation`
   - `filed` → `arraignment`, `dismissed`
   - `warrant_requested` → `warrant_issued`, `case_review`
   - `warrant_issued` → `arraignment`
   - `arraignment` → `preliminary_hearing`, `dismissed`
   - `preliminary_hearing` → `pre_trial`, `dismissed`
   - `pre_trial` → `trial`, `dismissed`
   - `trial` → `verdict`, `dismissed`
   - `verdict` → `sentencing`, `appeal`, `closed`
   - `sentencing` → `appeal`, `closed`
   - `appeal` → `closed`, `dismissed`
   - `closed` → *(no transitions)*
   - `dismissed` → *(no transitions)*

4. IF a requested status transition is not in the permitted set for the current status, THEN THE Case_Management_System SHALL return an error message identifying the current status, the rejected target status, and the list of valid target statuses.

5. WHEN a Case's status changes successfully, THE Case_Management_System SHALL create an Audit_Log entry recording the previous status, the new status, the user who made the change, and the timestamp.

6. THE Case_Management_System SHALL display all sixteen status values with human-readable labels in every status selector and status badge in the UI.

---

### Requirement 2: Case Fields

**User Story:** As a Deputy DA, I want each case to capture a complete set of prosecutorial fields, so that I have all the information needed to manage the case from filing through disposition.

#### Acceptance Criteria

1. THE Case_Management_System SHALL store the following fields for every Case:
   - Case Number (unique, required)
   - Case Title (required)
   - Description (optional free text)
   - Charges (structured charge records with charge code, description, severity, and statute — see Requirement 5)
   - Court (free text)
   - Status (constrained to Requirement 1 values)
   - Filing Date (date)
   - Defendant Name (free text)
   - Defendant ID (foreign key to the Defendants table)
   - Assigned Prosecutor (foreign key to Users)
   - Assigned Judge (free text)
   - Investigating Agency (free text)
   - Priority Level (`low`, `medium`, `high`, `critical`)
   - Created Date (system-set on creation)
   - Last Updated (system-set on every update)

2. WHEN a new Case is created, THE Case_Management_System SHALL auto-populate the Created Date and Last Updated fields with the current timestamp.

3. WHEN a Case record is updated, THE Case_Management_System SHALL automatically update the Last Updated field to the current timestamp.

4. THE Case_Management_System SHALL enforce that Case Number is unique across all Cases; IF a duplicate Case Number is submitted, THEN THE Case_Management_System SHALL return a validation error.

5. THE Case_Management_System SHALL default Priority Level to `medium` when not specified on creation.

---

### Requirement 3: Case Document Management

**User Story:** As a Legal Clerk, I want to upload and manage legal documents linked to a specific case, so that all case-related paperwork is stored, versioned, and accessible in one place.

#### Acceptance Criteria

1. THE Case_Management_System SHALL provide a Case Documents sub-module accessible from the Documents tab of the Case_Detail_Page.

2. THE Case_Management_System SHALL support the following document types for Case Documents:
   `criminal_complaint`, `arrest_report`, `investigation_report`, `search_warrant_affidavit`, `arrest_warrant_application`, `subpoena`, `motion`, `plea_agreement`, `sentencing_memorandum`, `court_order`, `evidence_report`.

3. WHEN a Case Document is created, THE Case_Management_System SHALL record: Title (required), Type (required, constrained to the list in criterion 2), Author (user reference), Created Date, and optionally a file attachment (file key, URL, name, size, MIME type).

4. THE Case_Management_System SHALL maintain Version History for each Case Document; WHEN a new file is uploaded to an existing Case Document, THE Case_Management_System SHALL increment the version counter and store the prior version in the version history table.

5. THE Case_Management_System SHALL display the full version history for a Case Document when requested, showing version number, file name, uploader, and upload timestamp for each version.

6. WHEN a Case Document is uploaded or a new version is saved, THE Case_Management_System SHALL create an Audit_Log entry for the parent Case, recording the document title, type, version number, author, and timestamp.

7. WHILE a user has the `view_case_documents` permission, THE Case_Management_System SHALL allow that user to view and download documents for cases they can access.

8. WHILE a user has the `manage_case_documents` permission, THE Case_Management_System SHALL allow that user to create, upload, and update documents for cases they can access; users without `manage_case_documents` permission who have `view_case_documents` permission SHALL also be permitted to update existing document metadata (but not upload new versions).

---

### Requirement 4: Warrant System

**User Story:** As a Deputy DA, I want to request and track warrants linked to a case, so that I can manage the approval process from drafting through execution in a single workflow.

#### Acceptance Criteria

1. THE Case_Management_System SHALL provide a Warrants sub-module accessible from the Warrants tab of the Case_Detail_Page and as a standalone Warrants section in the dashboard navigation.

2. THE Case_Management_System SHALL support the following warrant types: `arrest_warrant`, `search_warrant`, `bench_warrant`, `subpoena`.

3. WHEN a Warrant is created, THE Case_Management_System SHALL record: Warrant Number (unique, required), Related Case (foreign key), Requested By (user name or text), Approved By Judge (text), Date Requested, Date Approved, Expiration Date, and Status.

4. THE Case_Management_System SHALL constrain Warrant Status to exactly: `draft`, `pending_approval`, `approved`, `denied`, `executed`, `expired`.

5. WHEN a Warrant is submitted for approval (status transitions to `pending_approval`), THE Case_Management_System SHALL create an Audit_Log entry on the related Case recording the warrant number, type, and submitting user.

6. WHEN a Warrant's status changes to `approved`, THE Case_Management_System SHALL create an Audit_Log entry on the related Case recording the warrant number, approving judge, and approval timestamp.

7. WHILE a user has the `create_warrant` permission, THE Case_Management_System SHALL allow that user to create and submit warrants.

8. WHILE a user has the `approve_warrant` permission, THE Case_Management_System SHALL allow that user to approve or deny pending warrants.

9. IF a Warrant's Expiration Date is in the past and its database status is `approved`, THEN THE Case_Management_System SHALL display the warrant with label `expired` in all UI displays; the underlying database status SHALL remain `approved` and SHALL NOT be automatically updated.

---

### Requirement 5: Evidence Management

**User Story:** As an Investigator, I want to log and track evidence linked to a case, so that chain of custody is documented and all uploaded materials are traceable.

#### Acceptance Criteria

1. THE Case_Management_System SHALL provide an Evidence sub-module accessible from the Evidence tab of the Case_Detail_Page.

2. WHEN an Evidence record is created, THE Case_Management_System SHALL record: Evidence Number (unique per case), Evidence Type (constrained to: `document`, `image`, `video`, `audio`, `physical`, `digital`, `other`), Description, Submitted By (user name), Chain of Custody (JSON array of custody transfer entries), optional file attachment (file key, URL, name, size, MIME type), and Date Collected.

3. THE Case_Management_System SHALL append a new custody entry to the Chain of Custody array WHEN evidence is transferred between custodians, recording the transferring user, receiving party, date, and notes.

4. WHEN an Evidence record is added to a Case, THE Case_Management_System SHALL create an Audit_Log entry on the Case recording the evidence number, type, and submitting user.

5. WHILE a user has the `upload_evidence` permission, THE Case_Management_System SHALL allow that user to create evidence records and attach files.

6. WHILE a user has the `view_evidence` permission, THE Case_Management_System SHALL allow that user to view evidence records for cases they can access; downloading an evidence file SHALL also require the `view_evidence` permission.

---

### Requirement 6: Witness Management

**User Story:** As a Deputy DA, I want to record and manage witnesses linked to a case, so that I can track contact information, witness type, and statements in a structured way.

#### Acceptance Criteria

1. THE Case_Management_System SHALL provide a Witnesses sub-module accessible from the Witnesses tab of the Case_Detail_Page.

2. WHEN a Witness record is created, THE Case_Management_System SHALL record: Name (required), Contact Information (phone and/or email), Witness Type (constrained to: `eyewitness`, `expert`, `character`, `law_enforcement`, `other`), Statement (free text), and Related Case (foreign key).

3. THE Case_Management_System SHALL allow optional fields: address, protected status flag, and internal notes.

4. WHILE a user has the `manage_witnesses` permission, THE Case_Management_System SHALL allow that user to create, edit, and delete witness records for cases they can access; this permission operates independently and SHALL NOT require the `view_witnesses` permission as a prerequisite.

5. WHILE a user has the `view_witnesses` permission, THE Case_Management_System SHALL allow that user to view witness records for cases they can access; IF the witness has the protected status flag set, THEN THE Case_Management_System SHALL hide the witness's contact information from users who do not have the `manage_witnesses` permission.

---

### Requirement 7: Dashboard

**User Story:** As any authenticated DA Office staff member, I want a summary dashboard on login, so that I can quickly see the state of active cases, pending work items, and upcoming court dates.

#### Acceptance Criteria

1. THE Case_Management_System SHALL display the following summary statistics on the Dashboard:
   - Open Cases count (cases not in `closed` or `dismissed`)
   - Pending Reviews count (cases in `case_review` or `submitted_to_da`)
   - Pending Warrants count (warrants in `pending_approval`)
   - Upcoming Court Dates count (court hearings scheduled within the next 7 days)
   - Recently Updated Cases (up to 5 cases ordered by last updated, descending)

2. WHEN the Dashboard is loaded, THE Case_Management_System SHALL fetch all five metrics in parallel and render loading skeletons for each card until data is available.

3. THE Case_Management_System SHALL display the Upcoming Court Dates list with hearing type, scheduled date/time, courtroom, and a relative-time indicator (e.g., "in 2 days").

4. THE Case_Management_System SHALL display the Recently Updated Cases list with case number, title, status badge, and last updated timestamp.

5. WHERE a user's role permits case creation (`create_case` permission), THE Case_Management_System SHALL show a "New Case" shortcut button on the Dashboard.

---

### Requirement 8: Case Detail Page — Tabbed Interface

**User Story:** As a Deputy DA, I want the case detail page to be organized into tabs, so that I can navigate between case overview, documents, evidence, warrants, witnesses, court filings, timeline, and activity log without leaving the page.

#### Acceptance Criteria

1. THE Case_Management_System SHALL organize the Case_Detail_Page into the following eight tabs:
   - **Overview** — core case fields, charges, defendant info, assigned personnel
   - **Documents** — Case Documents sub-module (Requirement 3)
   - **Evidence** — Evidence sub-module (Requirement 5)
   - **Warrants** — Warrants sub-module (Requirement 4)
   - **Witnesses** — Witnesses sub-module (Requirement 6)
   - **Court Filings** — scheduled and completed court hearings
   - **Timeline** — chronological Audit_Log (Requirement 9)
   - **Activity Log** — filterable table of Audit_Log entries

2. WHEN a tab is selected, THE Case_Management_System SHALL load only the data required for that tab (lazy loading), without reloading the full page.

3. THE Case_Management_System SHALL persist the selected tab in the URL query parameter so that direct links to a specific tab are shareable.

4. WHILE a user lacks a required permission for a tab's content (e.g., `view_evidence`), THE Case_Management_System SHALL render that tab as disabled or hidden.

---

### Requirement 9: Timeline and Audit Log

**User Story:** As a District Attorney, I want every action on a case to generate an immutable audit entry, so that I have a complete, chronological history of every change for legal accountability.

#### Acceptance Criteria

1. THE Case_Management_System SHALL create an Audit_Log entry for each of the following events:
   - Case Created
   - Status Changed (recording previous and new status)
   - Document Uploaded (recording document title, type, and version)
   - Warrant Submitted (recording warrant number and type)
   - Warrant Approved (recording warrant number and approving judge)
   - Evidence Added (recording evidence number and type)
   - Court Hearing Scheduled (recording hearing type and scheduled date)

2. WHEN an Audit_Log entry is created, THE Case_Management_System SHALL record: Case ID, User ID, User Name, action type, free-text details, and timestamp; IF any optional fields are unavailable at the time of creation, THEN THE Case_Management_System SHALL store those fields as null and mark them as unavailable rather than rejecting the log entry.

3. THE Case_Management_System SHALL display Audit_Log entries on the Timeline tab in reverse-chronological order, showing action type icon, description, actor name, and formatted timestamp.

4. THE Activity_Log tab SHALL display the same entries as a sortable, filterable table supporting filtering by action type and date range.

5. THE Case_Management_System SHALL NOT allow Audit_Log entries to be deleted by any user role; editing of Audit_Log entries is permitted for administrative correction purposes.

---

### Requirement 10: Role-Based Access Control (RBAC)

**User Story:** As a System Administrator, I want every action in the system to be gated by the user's role, so that confidential case information and sensitive operations are accessible only to authorized personnel.

#### Acceptance Criteria

1. THE Case_Management_System SHALL enforce the following role-to-permission mappings as the minimum default matrix, which is seeded into the `role_permissions` database table on first run:

   | Permission | District Attorney | Deputy DA | Investigator | Clerk | Administrator |
   |---|---|---|---|---|---|
   | `create_case` | ✓ | ✓ | — | — | ✓ |
   | `edit_case` | ✓ | ✓ | — | — | ✓ |
   | `close_case` | ✓ | — | — | — | ✓ |
   | `assign_case` | ✓ | — | — | — | ✓ |
   | `delete_case` | ✓ | — | — | — | ✓ |
   | `view_case` | ✓ | ✓ | ✓ | ✓ | ✓ |
   | `upload_evidence` | ✓ | ✓ | ✓ | ✓ | ✓ |
   | `view_evidence` | ✓ | ✓ | ✓ | ✓ | ✓ |
   | `create_warrant` | ✓ | ✓ | — | — | ✓ |
   | `approve_warrant` | ✓ | — | — | — | ✓ |
   | `view_warrant` | ✓ | ✓ | ✓ | ✓ | ✓ |
   | `manage_case_documents` | ✓ | ✓ | — | ✓ | ✓ |
   | `view_case_documents` | ✓ | ✓ | ✓ | ✓ | ✓ |
   | `manage_witnesses` | ✓ | ✓ | — | — | ✓ |
   | `view_witnesses` | ✓ | ✓ | ✓ | ✓ | ✓ |
   | `view_activity_logs` | ✓ | — | — | — | ✓ |

2. WHEN a user without the required permission attempts a protected operation, THE Case_Management_System SHALL return a `FORBIDDEN` error and display an appropriate message in the UI.

3. THE Case_Management_System SHALL resolve all permissions exclusively from the database-backed `role_permissions` table at runtime; the `DEFAULT_PERMISSION_MATRIX` defined in shared code serves only as the initial seed and SHALL NOT be used for runtime permission checks after the database has been seeded; WHERE the table has been modified by an Administrator via the Role & Permission Management UI (Requirement 13), THE Case_Management_System SHALL use the current database values.

4. WHILE a user has the `manage_users` permission, THE Case_Management_System SHALL allow that user to view and modify the role-to-permission assignments for all roles via the admin panel (see Requirement 13); WHEN the `manage_users` permission is removed from a role, THE Case_Management_System SHALL immediately revoke admin panel access for users of that role.

5. THE Case_Management_System SHALL apply RBAC checks on every tRPC procedure and SHALL NOT rely solely on client-side permission hiding.

6. THE Case_Management_System SHALL resolve page-level and route-level visibility for dashboard navigation items, case detail tabs, and top-level dashboard routes from the database at runtime; no navigation item or route SHALL be hardcoded as visible or hidden based on role in application code — all visibility rules SHALL be driven by the same `role_permissions` table rows that control action permissions.

---

### Requirement 11: File Uploads

**User Story:** As any authorized staff member, I want to attach files to cases, documents, evidence, and warrants, so that original source materials are stored securely within the system.

#### Acceptance Criteria

1. THE Case_Management_System SHALL accept file uploads for Case Documents, Evidence records, and Warrant applications.

2. WHEN a file is uploaded, THE Case_Management_System SHALL store the file key, public URL, original file name, file size in bytes, and MIME type alongside the parent record.

3. THE Case_Management_System SHALL serve uploaded files through the existing `/uploads/[...path]` route, applying the same authentication and authorization checks as the rest of the application.

4. IF an uploaded file exceeds a configurable maximum size limit, THEN THE Case_Management_System SHALL reject the upload and return a validation error specifying the limit.

5. THE Case_Management_System SHALL display file name, size, and upload date for every attached file in the relevant sub-module UI.

---

### Requirement 12: Court Filings (Hearings) Sub-Module

**User Story:** As a Deputy DA, I want to schedule and track court hearings from within a case, so that all upcoming and completed court dates are visible on the case record.

#### Acceptance Criteria

1. THE Case_Management_System SHALL display all court hearings linked to a Case in the Court Filings tab, ordered by scheduled date.

2. WHEN a court hearing is scheduled for a Case, THE Case_Management_System SHALL record: hearing type, scheduled date and time, courtroom, judge, status (`scheduled`, `completed`, `continued`, `cancelled`), and notes.

3. WHEN a court hearing is created, THE Case_Management_System SHALL create an Audit_Log entry on the Case recording the hearing type and scheduled date.

4. THE Case_Management_System SHALL display upcoming hearings (status `scheduled`, date in the future) separately from past hearings (status `completed`, `cancelled`, or `continued`, or date in the past).

5. WHILE a user has the `create_hearing` permission, THE Case_Management_System SHALL allow that user to schedule new hearings from the Court Filings tab.


---

### Requirement 13: Dynamic Role and Permission Management

**User Story:** As a System Administrator, I want a database-backed admin UI where I can create, edit, and delete roles, assign permissions and page-level access controls to those roles, and have all changes take effect immediately at runtime, so that the system's access model can be updated without any code changes or redeployment.

#### Acceptance Criteria

1. THE Case_Management_System SHALL provide a Role & Permission Management section in the admin panel, accessible exclusively to users who hold the `manage_users` permission.

2. THE Role_Permission_Manager SHALL allow an Administrator to perform the following operations on roles:
   - Create a new custom role with a unique identifier and a human-readable display label
   - Edit the display label of an existing role
   - Delete a custom role, provided no active users are currently assigned to it

3. IF an Administrator attempts to delete a role that has one or more active users assigned to it, THEN THE Role_Permission_Manager SHALL reject the deletion and return an error message listing the number of affected users.

4. THE Role_Permission_Manager SHALL display a permission matrix view showing all defined roles as columns and all defined permissions as rows, with each cell indicating whether that role currently holds that permission.

5. WHEN an Administrator toggles a permission cell in the matrix, THE Role_Permission_Manager SHALL update the `role_permissions` table in the database as a single atomic write and confirm the change to the Administrator.

6. THE Role_Permission_Manager SHALL allow an Administrator to assign or revoke page-level and route-level access controls per role; the configurable access targets SHALL include at minimum:
   - All top-level dashboard navigation items (e.g., Cases, Warrants, Reports, Admin)
   - All case detail tabs (Overview, Documents, Evidence, Warrants, Witnesses, Court Filings, Timeline, Activity Log)
   - All standalone dashboard top-level routes

7. THE Case_Management_System SHALL store page-level access controls in the same `role_permissions` table using namespaced permission keys of the form `page:<route_or_tab_identifier>` (e.g., `page:dashboard/cases`, `page:case_detail/evidence`), so that page visibility is resolved through the same runtime permission lookup as action permissions.

8. WHEN the Case_Management_System renders the dashboard navigation or a Case_Detail_Page, THE Case_Management_System SHALL query the current user's resolved permissions from the database and SHALL show or hide each navigation item and tab according to whether the user's role holds the corresponding `page:<identifier>` permission; no navigation item or tab SHALL be conditionally rendered based on hardcoded role checks in the application code.

9. WHEN a role's permissions or page-access assignments are modified, THE Case_Management_System SHALL make the updated permissions visible to all users of that role within a maximum cache TTL of 60 seconds or on the user's next authenticated request, whichever is sooner.

10. IF an active session user's role loses a permission or page-access right that the user is currently exercising (e.g., on an open page), THEN THE Case_Management_System SHALL deny the next server-side request from that user that requires the revoked permission and return an appropriate `FORBIDDEN` error.

11. WHEN an Administrator creates, modifies, or deletes a role definition or changes any permission or page-access assignment, THE Case_Management_System SHALL create an Audit_Log entry in the `activity_logs` table recording: the Administrator's user ID and name, the action performed (role created / permission granted / permission revoked / page access granted / page access revoked / role deleted), the affected role identifier, the affected permission or page identifier, and the timestamp.

12. THE Role_Permission_Manager SHALL display the full audit history of role and permission changes, filterable by role, action type, and date range, so that Administrators can review the history of access control modifications.

13. THE Case_Management_System SHALL seed the `role_permissions` table from `DEFAULT_PERMISSION_MATRIX` defined in shared code on first run WHEN the table is empty; after the initial seed, all permission state SHALL be governed by the database exclusively and the seed SHALL NOT overwrite existing rows.

14. WHILE the Role_Permission_Manager is performing a bulk permission update (e.g., resetting a role to the default matrix), THE Case_Management_System SHALL execute all row insertions and deletions within a single database transaction so that no partial permission state is persisted if the operation fails.
