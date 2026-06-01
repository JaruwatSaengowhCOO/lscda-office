import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  bigint,
} from "drizzle-orm/mysql-core";

// ─── Users & Roles ────────────────────────────────────────────────────────────

export const daRoleEnum = mysqlEnum("da_role", [
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
]);

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  username: varchar("username", { length: 64 }).unique(),
  passwordHash: varchar("password_hash", { length: 256 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  daRole: mysqlEnum("da_role", [
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
  ]).default("intern"),
  department: varchar("department", { length: 128 }),
  badgeNumber: varchar("badge_number", { length: 32 }),
  phone: varchar("phone", { length: 32 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Defendants ───────────────────────────────────────────────────────────────

export const defendants = mysqlTable("defendants", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("first_name", { length: 128 }).notNull(),
  lastName: varchar("last_name", { length: 128 }).notNull(),
  dob: varchar("dob", { length: 16 }),
  address: text("address"),
  phone: varchar("phone", { length: 32 }),
  email: varchar("email", { length: 320 }),
  criminalHistory: text("criminal_history"),
  gangAffiliation: varchar("gang_affiliation", { length: 128 }),
  notes: text("notes"),
  createdBy: int("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Defendant = typeof defendants.$inferSelect;
export type InsertDefendant = typeof defendants.$inferInsert;

// ─── Cases ────────────────────────────────────────────────────────────────────

export const caseStatusEnum = mysqlEnum("case_status", [
  "investigation",
  "case_review",
  "filed",
  "arraignment",
  "preliminary_hearing",
  "trial",
  "sentencing",
  "closed",
  "dismissed",
]);

export const cases = mysqlTable("cases", {
  id: int("id").autoincrement().primaryKey(),
  caseNumber: varchar("case_number", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", [
    "investigation",
    "case_review",
    "filed",
    "arraignment",
    "preliminary_hearing",
    "trial",
    "sentencing",
    "closed",
    "dismissed",
  ]).default("investigation").notNull(),
  arrestingAgency: varchar("arresting_agency", { length: 128 }),
  court: varchar("court", { length: 128 }),
  leadProsecutorId: int("lead_prosecutor_id"),
  filedDate: timestamp("filed_date"),
  closedDate: timestamp("closed_date"),
  outcome: varchar("outcome", { length: 64 }),
  isPublic: boolean("is_public").default(false).notNull(),
  createdBy: int("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Case = typeof cases.$inferSelect;
export type InsertCase = typeof cases.$inferInsert;

export const caseDefendants = mysqlTable("case_defendants", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("case_id").notNull(),
  defendantId: int("defendant_id").notNull(),
  role: varchar("role", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const caseCharges = mysqlTable("case_charges", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("case_id").notNull(),
  chargeCode: varchar("charge_code", { length: 64 }),
  chargeDescription: text("charge_description").notNull(),
  severity: mysqlEnum("severity", ["felony", "misdemeanor", "infraction"]),
  statute: varchar("statute", { length: 128 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Court Hearings ───────────────────────────────────────────────────────────

export const courtHearings = mysqlTable("court_hearings", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("case_id").notNull(),
  hearingType: varchar("hearing_type", { length: 64 }).notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  courtroom: varchar("courtroom", { length: 64 }),
  judge: varchar("judge", { length: 128 }),
  status: mysqlEnum("status", ["scheduled", "completed", "continued", "cancelled"]).default("scheduled").notNull(),
  notes: text("notes"),
  createdBy: int("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type CourtHearing = typeof courtHearings.$inferSelect;
export type InsertCourtHearing = typeof courtHearings.$inferInsert;

// ─── Warrants ─────────────────────────────────────────────────────────────────

export const warrants = mysqlTable("warrants", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("case_id"),
  warrantNumber: varchar("warrant_number", { length: 64 }).notNull().unique(),
  type: mysqlEnum("type", ["search_warrant", "arrest_warrant", "subpoena"]).notNull(),
  status: mysqlEnum("status", ["draft", "pending_approval", "issued", "executed", "expired"]).default("draft").notNull(),
  subject: varchar("subject", { length: 256 }),
  description: text("description"),
  issuedBy: varchar("issued_by", { length: 128 }),
  issuedAt: timestamp("issued_at"),
  executedAt: timestamp("executed_at"),
  expiresAt: timestamp("expires_at"),
  createdBy: int("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Warrant = typeof warrants.$inferSelect;
export type InsertWarrant = typeof warrants.$inferInsert;

// ─── Evidence ─────────────────────────────────────────────────────────────────

export const evidence = mysqlTable("evidence", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("case_id").notNull(),
  referenceNumber: varchar("reference_number", { length: 64 }).notNull().unique(),
  type: mysqlEnum("type", ["document", "image", "video", "audio", "physical", "digital", "other"]).notNull(),
  description: text("description"),
  fileKey: varchar("file_key", { length: 512 }),
  fileUrl: varchar("file_url", { length: 512 }),
  fileName: varchar("file_name", { length: 256 }),
  fileSize: bigint("file_size", { mode: "number" }),
  mimeType: varchar("mime_type", { length: 128 }),
  chainOfCustody: json("chain_of_custody"),
  uploadedBy: int("uploaded_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Evidence = typeof evidence.$inferSelect;
export type InsertEvidence = typeof evidence.$inferInsert;

export const evidenceAuditLogs = mysqlTable("evidence_audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  evidenceId: int("evidence_id").notNull(),
  userId: int("user_id").notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Victims ──────────────────────────────────────────────────────────────────

export const victims = mysqlTable("victims", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("case_id").notNull(),
  firstName: varchar("first_name", { length: 128 }).notNull(),
  lastName: varchar("last_name", { length: 128 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  hasProtectionOrder: boolean("has_protection_order").default(false).notNull(),
  protectionOrderDetails: text("protection_order_details"),
  compensationStatus: mysqlEnum("compensation_status", ["pending", "approved", "paid", "denied", "not_applicable"]).default("not_applicable"),
  advocateId: int("advocate_id"),
  notes: text("notes"),
  createdBy: int("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Victim = typeof victims.$inferSelect;
export type InsertVictim = typeof victims.$inferInsert;

// ─── Complaints ───────────────────────────────────────────────────────────────

export const complaints = mysqlTable("complaints", {
  id: int("id").autoincrement().primaryKey(),
  complaintNumber: varchar("complaint_number", { length: 64 }).notNull().unique(),
  type: mysqlEnum("type", ["citizen_complaint", "officer_misconduct", "prosecutor_misconduct", "administrative"]).notNull(),
  complainantName: varchar("complainant_name", { length: 256 }),
  complainantContact: varchar("complainant_contact", { length: 256 }),
  subject: varchar("subject", { length: 256 }).notNull(),
  description: text("description").notNull(),
  status: mysqlEnum("status", ["received", "under_review", "investigation", "resolved", "dismissed"]).default("received").notNull(),
  assignedTo: int("assigned_to"),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Complaint = typeof complaints.$inferSelect;
export type InsertComplaint = typeof complaints.$inferInsert;

// ─── Documents ────────────────────────────────────────────────────────────────

export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  category: mysqlEnum("category", ["form", "policy", "template", "report", "other"]).default("other"),
  description: text("description"),
  fileKey: varchar("file_key", { length: 512 }),
  fileUrl: varchar("file_url", { length: 512 }),
  fileName: varchar("file_name", { length: 256 }),
  fileSize: bigint("file_size", { mode: "number" }),
  mimeType: varchar("mime_type", { length: 128 }),
  isPublic: boolean("is_public").default(false).notNull(),
  downloadCount: int("download_count").default(0),
  uploadedBy: int("uploaded_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// ─── Press Releases ───────────────────────────────────────────────────────────

export const pressReleases = mysqlTable("press_releases", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  isPublished: boolean("is_published").default(false).notNull(),
  publishedAt: timestamp("published_at"),
  authorId: int("author_id"),
  tags: varchar("tags", { length: 512 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PressRelease = typeof pressReleases.$inferSelect;
export type InsertPressRelease = typeof pressReleases.$inferInsert;

// ─── Public Notices ───────────────────────────────────────────────────────────

export const publicNotices = mysqlTable("public_notices", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  content: text("content").notNull(),
  noticeType: varchar("notice_type", { length: 64 }),
  isPublished: boolean("is_published").default(false).notNull(),
  publishedAt: timestamp("published_at"),
  expiresAt: timestamp("expires_at"),
  createdBy: int("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ─── Careers ──────────────────────────────────────────────────────────────────

export const careers = mysqlTable("careers", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  department: varchar("department", { length: 128 }),
  location: varchar("location", { length: 128 }),
  type: mysqlEnum("type", ["full_time", "part_time", "contract", "intern"]).default("full_time"),
  description: text("description").notNull(),
  requirements: text("requirements"),
  salary: varchar("salary", { length: 64 }),
  isActive: boolean("is_active").default(true).notNull(),
  closingDate: timestamp("closing_date"),
  createdBy: int("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ─── Legal Research ───────────────────────────────────────────────────────────

export const legalResearch = mysqlTable("legal_research", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  category: mysqlEnum("category", ["penal_code", "case_law", "policy", "memorandum", "training"]).notNull(),
  content: text("content").notNull(),
  tags: varchar("tags", { length: 512 }),
  fileKey: varchar("file_key", { length: 512 }),
  fileUrl: varchar("file_url", { length: 512 }),
  createdBy: int("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["case_update", "hearing_reminder", "warrant_update", "new_complaint", "new_tip", "system"]).default("system"),
  isRead: boolean("is_read").default(false).notNull(),
  relatedId: int("related_id"),
  relatedType: varchar("related_type", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ─── Activity Logs ────────────────────────────────────────────────────────────

export const activityLogs = mysqlTable("activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id"),
  userName: varchar("user_name", { length: 256 }),
  action: varchar("action", { length: 128 }).notNull(),
  entityType: varchar("entity_type", { length: 64 }),
  entityId: int("entity_id"),
  details: text("details"),
  ipAddress: varchar("ip_address", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

// ─── Public Tips ──────────────────────────────────────────────────────────────

export const publicTips = mysqlTable("public_tips", {
  id: int("id").autoincrement().primaryKey(),
  isAnonymous: boolean("is_anonymous").default(false).notNull(),
  name: varchar("name", { length: 256 }),
  contact: varchar("contact", { length: 256 }),
  subject: varchar("subject", { length: 256 }).notNull(),
  description: text("description").notNull(),
  status: mysqlEnum("status", ["received", "under_review", "actioned", "closed"]).default("received").notNull(),
  assignedTo: int("assigned_to"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ─── Public Requests ──────────────────────────────────────────────────────────

export const publicRequests = mysqlTable("public_requests", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  contact: varchar("contact", { length: 256 }).notNull(),
  requestType: mysqlEnum("request_type", ["case_status", "document_request", "general_inquiry", "other"]).notNull(),
  description: text("description").notNull(),
  caseNumberRef: varchar("case_number_ref", { length: 64 }),
  status: mysqlEnum("status", ["received", "processing", "completed", "rejected"]).default("received").notNull(),
  response: text("response"),
  respondedBy: int("responded_by"),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
