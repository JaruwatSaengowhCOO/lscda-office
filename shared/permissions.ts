export type DaRole =
  | "da"
  | "chief_deputy_da"
  | "division_chief"
  | "senior_prosecutor"
  | "deputy_da"
  | "investigator"
  | "legal_clerk"
  | "victim_advocate"
  | "intern"
  | "admin";

export const DA_ROLE_LABELS: Record<DaRole, string> = {
  da: "District Attorney",
  chief_deputy_da: "Chief Deputy DA",
  division_chief: "Division Chief",
  senior_prosecutor: "Senior Prosecutor",
  deputy_da: "Deputy DA",
  investigator: "Investigator",
  legal_clerk: "Legal Clerk",
  victim_advocate: "Victim Advocate",
  intern: "Intern",
  admin: "System Admin",
};

export const DA_ROLE_ORDER: DaRole[] = [
  "da",
  "chief_deputy_da",
  "division_chief",
  "senior_prosecutor",
  "deputy_da",
  "investigator",
  "legal_clerk",
  "victim_advocate",
  "intern",
  "admin",
];

export type Permission =
  | "create_case"
  | "edit_case"
  | "close_case"
  | "assign_case"
  | "delete_case"
  | "view_case"
  | "upload_evidence"
  | "view_evidence"
  | "create_warrant"
  | "approve_warrant"
  | "view_warrant"
  | "create_hearing"
  | "view_hearing"
  | "view_defendants"
  | "edit_defendants"
  | "view_victims"
  | "edit_victims"
  | "view_complaints"
  | "manage_complaints"
  | "view_reports"
  | "export_reports"
  | "manage_users"
  | "manage_press_releases"
  | "manage_documents"
  | "manage_legal_research"
  | "view_tips"
  | "manage_tips"
  | "view_requests"
  | "manage_requests"
  | "view_activity_logs";

const PERMISSION_MATRIX: Record<DaRole, Permission[]> = {
  da: [
    "create_case", "edit_case", "close_case", "assign_case", "delete_case", "view_case",
    "upload_evidence", "view_evidence",
    "create_warrant", "approve_warrant", "view_warrant",
    "create_hearing", "view_hearing",
    "view_defendants", "edit_defendants",
    "view_victims", "edit_victims",
    "view_complaints", "manage_complaints",
    "view_reports", "export_reports",
    "manage_users",
    "manage_press_releases", "manage_documents", "manage_legal_research",
    "view_tips", "manage_tips", "view_requests", "manage_requests",
    "view_activity_logs",
  ],
  chief_deputy_da: [
    "create_case", "edit_case", "close_case", "assign_case", "view_case",
    "upload_evidence", "view_evidence",
    "create_warrant", "approve_warrant", "view_warrant",
    "create_hearing", "view_hearing",
    "view_defendants", "edit_defendants",
    "view_victims", "edit_victims",
    "view_complaints", "manage_complaints",
    "view_reports", "export_reports",
    "manage_press_releases", "manage_documents", "manage_legal_research",
    "view_tips", "manage_tips", "view_requests", "manage_requests",
    "view_activity_logs",
  ],
  division_chief: [
    "create_case", "edit_case", "close_case", "assign_case", "view_case",
    "upload_evidence", "view_evidence",
    "create_warrant", "approve_warrant", "view_warrant",
    "create_hearing", "view_hearing",
    "view_defendants", "edit_defendants",
    "view_victims", "edit_victims",
    "view_complaints",
    "view_reports", "export_reports",
    "manage_documents", "manage_legal_research",
    "view_tips", "view_requests", "manage_requests",
    "view_activity_logs",
  ],
  senior_prosecutor: [
    "create_case", "edit_case", "view_case",
    "upload_evidence", "view_evidence",
    "create_warrant", "view_warrant",
    "create_hearing", "view_hearing",
    "view_defendants", "edit_defendants",
    "view_victims", "edit_victims",
    "view_reports",
    "manage_legal_research",
    "view_tips", "view_requests",
  ],
  deputy_da: [
    "create_case", "edit_case", "view_case",
    "upload_evidence", "view_evidence",
    "create_warrant", "view_warrant",
    "create_hearing", "view_hearing",
    "view_defendants",
    "view_victims",
    "view_reports",
    "view_tips", "view_requests",
  ],
  investigator: [
    "view_case",
    "upload_evidence", "view_evidence",
    "view_warrant",
    "view_hearing",
    "view_defendants",
    "view_tips",
  ],
  legal_clerk: [
    "view_case",
    "upload_evidence", "view_evidence",
    "view_warrant",
    "view_hearing",
    "view_defendants",
    "manage_documents",
    "view_requests",
  ],
  victim_advocate: [
    "view_case",
    "view_victims", "edit_victims",
    "view_hearing",
    "view_requests",
  ],
  intern: [
    "view_case",
    "view_evidence",
    "view_hearing",
    "view_defendants",
  ],
  admin: [
    "create_case", "edit_case", "close_case", "assign_case", "delete_case", "view_case",
    "upload_evidence", "view_evidence",
    "create_warrant", "approve_warrant", "view_warrant",
    "create_hearing", "view_hearing",
    "view_defendants", "edit_defendants",
    "view_victims", "edit_victims",
    "view_complaints", "manage_complaints",
    "view_reports", "export_reports",
    "manage_users",
    "manage_press_releases", "manage_documents", "manage_legal_research",
    "view_tips", "manage_tips", "view_requests", "manage_requests",
    "view_activity_logs",
  ],
};

export function hasPermission(daRole: DaRole | null | undefined, permission: Permission): boolean {
  if (!daRole) return false;
  return PERMISSION_MATRIX[daRole]?.includes(permission) ?? false;
}

export function getPermissions(daRole: DaRole | null | undefined): Permission[] {
  if (!daRole) return [];
  return PERMISSION_MATRIX[daRole] ?? [];
}
