import { and, desc, eq, like, or, sql, gte, lte, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  defendants, InsertDefendant,
  cases, InsertCase, caseDefendants, caseCharges,
  courtHearings, InsertCourtHearing,
  warrants, InsertWarrant,
  evidence, InsertEvidence, evidenceAuditLogs,
  victims, InsertVictim,
  complaints, InsertComplaint,
  documents, InsertDocument,
  pressReleases, InsertPressRelease,
  publicNotices,
  careers,
  legalResearch,
  notifications, InsertNotification,
  activityLogs, InsertActivityLog,
  publicTips,
  publicRequests,
  rolePermissions,
  caseDocuments, InsertCaseDocument,
  caseDocumentVersions,
  witnesses, InsertWitness,
} from "../drizzle/schema";
import type { DaRole, Permission } from "../shared/permissions";
import { DEFAULT_PERMISSION_MATRIX } from "../shared/permissions";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result[0];
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getUsersForAssignment() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ id: users.id, name: users.name, username: users.username, daRole: users.daRole })
    .from(users)
    .where(eq(users.isActive, true))
    .orderBy(users.name);
}

export async function updateUserDaRole(userId: number, daRole: string, department?: string, badgeNumber?: string, phone?: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ daRole: daRole as any, department, badgeNumber, phone }).where(eq(users.id, userId));
}

export async function createUser(data: {
  username: string;
  passwordHash: string;
  name: string;
  email?: string;
  role?: "user" | "admin";
  daRole?: string;
  department?: string;
  badgeNumber?: string;
  phone?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const openId = `local_${data.username}_${Date.now()}`;
  await db.insert(users).values({
    openId,
    username: data.username,
    passwordHash: data.passwordHash,
    name: data.name,
    email: data.email ?? null,
    role: data.role ?? "user",
    daRole: (data.daRole as any) ?? "intern",
    department: data.department,
    badgeNumber: data.badgeNumber,
    phone: data.phone,
    isActive: true,
    lastSignedIn: new Date(),
  });
}

export async function updateUser(userId: number, data: {
  name?: string;
  email?: string;
  role?: "user" | "admin";
  daRole?: string;
  department?: string;
  badgeNumber?: string;
  phone?: string;
  isActive?: boolean;
  passwordHash?: string;
}) {
  const db = await getDb();
  if (!db) return;
  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.email !== undefined) update.email = data.email;
  if (data.role !== undefined) update.role = data.role;
  if (data.daRole !== undefined) update.daRole = data.daRole;
  if (data.department !== undefined) update.department = data.department;
  if (data.badgeNumber !== undefined) update.badgeNumber = data.badgeNumber;
  if (data.phone !== undefined) update.phone = data.phone;
  if (data.isActive !== undefined) update.isActive = data.isActive;
  if (data.passwordHash !== undefined) update.passwordHash = data.passwordHash;
  await db.update(users).set(update as any).where(eq(users.id, userId));
}

// ─── Cases ────────────────────────────────────────────────────────────────────

export async function createCase(data: InsertCase) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(cases).values(data);
  return (result as any).insertId as number;
}

export async function getCases(filters?: { status?: string; search?: string; isPublic?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status) conditions.push(eq(cases.status, filters.status as any));
  if (filters?.isPublic !== undefined) conditions.push(eq(cases.isPublic, filters.isPublic));
  if (filters?.search) {
    conditions.push(or(like(cases.title, `%${filters.search}%`), like(cases.caseNumber, `%${filters.search}%`)));
  }
  const query = db.select().from(cases).orderBy(desc(cases.createdAt));
  if (conditions.length > 0) return query.where(and(...conditions));
  return query;
}

export async function getCaseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(cases).where(eq(cases.id, id)).limit(1);
  return result[0];
}

export async function getCaseByCaseNumber(caseNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(cases).where(eq(cases.caseNumber, caseNumber)).limit(1);
  return result[0];
}

export async function updateCase(id: number, data: Partial<InsertCase>) {
  const db = await getDb();
  if (!db) return;
  await db.update(cases).set(data).where(eq(cases.id, id));
}

export async function getCaseCharges(caseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(caseCharges).where(eq(caseCharges.caseId, caseId));
}

export async function addCaseCharge(data: typeof caseCharges.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(caseCharges).values(data);
}

export async function deleteCaseCharge(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(caseCharges).where(eq(caseCharges.id, id));
}

export async function getCaseDefendants(caseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ cd: caseDefendants, d: defendants })
    .from(caseDefendants)
    .innerJoin(defendants, eq(caseDefendants.defendantId, defendants.id))
    .where(eq(caseDefendants.caseId, caseId));
}

export async function addDefendantToCase(caseId: number, defendantId: number, role?: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(caseDefendants).values({ caseId, defendantId, role });
}

// ─── Defendants ───────────────────────────────────────────────────────────────

export async function createDefendant(data: InsertDefendant) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(defendants).values(data);
  return (result as any).insertId as number;
}

export async function getDefendants(search?: string) {
  const db = await getDb();
  if (!db) return [];
  if (search) {
    return db.select().from(defendants).where(
      or(like(defendants.firstName, `%${search}%`), like(defendants.lastName, `%${search}%`))
    ).orderBy(desc(defendants.createdAt));
  }
  return db.select().from(defendants).orderBy(desc(defendants.createdAt));
}

export async function getDefendantById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(defendants).where(eq(defendants.id, id)).limit(1);
  return result[0];
}

export async function updateDefendant(id: number, data: Partial<InsertDefendant>) {
  const db = await getDb();
  if (!db) return;
  await db.update(defendants).set(data).where(eq(defendants.id, id));
}

// ─── Court Hearings ───────────────────────────────────────────────────────────

export async function createHearing(data: InsertCourtHearing) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(courtHearings).values(data);
  return (result as any).insertId as number;
}

export async function getHearings(filters?: { caseId?: number; from?: Date; to?: Date }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.caseId) conditions.push(eq(courtHearings.caseId, filters.caseId));
  if (filters?.from) conditions.push(gte(courtHearings.scheduledAt, filters.from));
  if (filters?.to) conditions.push(lte(courtHearings.scheduledAt, filters.to));
  const query = db.select().from(courtHearings).orderBy(courtHearings.scheduledAt);
  if (conditions.length > 0) return query.where(and(...conditions));
  return query;
}

export async function getUpcomingHearings(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(courtHearings)
    .where(and(gte(courtHearings.scheduledAt, new Date()), eq(courtHearings.status, "scheduled")))
    .orderBy(courtHearings.scheduledAt)
    .limit(limit);
}

export async function updateHearing(id: number, data: Partial<InsertCourtHearing>) {
  const db = await getDb();
  if (!db) return;
  await db.update(courtHearings).set(data).where(eq(courtHearings.id, id));
}

// ─── Warrants ─────────────────────────────────────────────────────────────────

export async function createWarrant(data: InsertWarrant) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(warrants).values(data);
  return (result as any).insertId as number;
}

export async function getWarrants(filters?: { type?: string; status?: string; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.type) conditions.push(eq(warrants.type, filters.type as any));
  if (filters?.status) conditions.push(eq(warrants.status, filters.status as any));
  if (filters?.search) conditions.push(like(warrants.subject, `%${filters.search}%`));
  const query = db.select().from(warrants).orderBy(desc(warrants.createdAt));
  if (conditions.length > 0) return query.where(and(...conditions));
  return query;
}

export async function updateWarrant(id: number, data: Partial<InsertWarrant>) {
  const db = await getDb();
  if (!db) return;
  await db.update(warrants).set(data).where(eq(warrants.id, id));
}

// ─── Evidence ─────────────────────────────────────────────────────────────────

export async function createEvidence(data: InsertEvidence) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(evidence).values(data);
  return (result as any).insertId as number;
}

export async function getEvidenceByCaseId(caseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(evidence).where(eq(evidence.caseId, caseId)).orderBy(desc(evidence.createdAt));
}

export async function getEvidenceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(evidence).where(eq(evidence.id, id)).limit(1);
  return result[0];
}

export async function updateEvidence(id: number, data: Partial<InsertEvidence>) {
  const db = await getDb();
  if (!db) return;
  await db.update(evidence).set(data).where(eq(evidence.id, id));
}

export async function addEvidenceAuditLog(data: typeof evidenceAuditLogs.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(evidenceAuditLogs).values(data);
}

export async function getEvidenceAuditLogs(evidenceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(evidenceAuditLogs).where(eq(evidenceAuditLogs.evidenceId, evidenceId)).orderBy(desc(evidenceAuditLogs.createdAt));
}

// ─── Victims ──────────────────────────────────────────────────────────────────

export async function createVictim(data: InsertVictim) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(victims).values(data);
  return (result as any).insertId as number;
}

export async function getVictims(caseId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (caseId) return db.select().from(victims).where(eq(victims.caseId, caseId));
  return db.select().from(victims).orderBy(desc(victims.createdAt));
}

export async function updateVictim(id: number, data: Partial<InsertVictim>) {
  const db = await getDb();
  if (!db) return;
  await db.update(victims).set(data).where(eq(victims.id, id));
}

// ─── Complaints ───────────────────────────────────────────────────────────────

export async function createComplaint(data: typeof complaints.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(complaints).values(data);
  return (result as any).insertId as number;
}

export async function getComplaints(filters?: { type?: string; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.type) conditions.push(eq(complaints.type, filters.type as any));
  if (filters?.status) conditions.push(eq(complaints.status, filters.status as any));
  const query = db.select().from(complaints).orderBy(desc(complaints.createdAt));
  if (conditions.length > 0) return query.where(and(...conditions));
  return query;
}

export async function updateComplaint(id: number, data: Partial<InsertComplaint>) {
  const db = await getDb();
  if (!db) return;
  await db.update(complaints).set(data).where(eq(complaints.id, id));
}

// ─── Documents ────────────────────────────────────────────────────────────────

export async function createDocument(data: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(documents).values(data);
  return (result as any).insertId as number;
}

export async function getDocuments(isPublic?: boolean) {
  const db = await getDb();
  if (!db) return [];
  if (isPublic !== undefined) {
    return db.select().from(documents).where(eq(documents.isPublic, isPublic)).orderBy(desc(documents.createdAt));
  }
  return db.select().from(documents).orderBy(desc(documents.createdAt));
}

export async function incrementDocumentDownload(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(documents).set({ downloadCount: sql`download_count + 1` }).where(eq(documents.id, id));
}

// ─── Press Releases ───────────────────────────────────────────────────────────

export async function createPressRelease(data: InsertPressRelease) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(pressReleases).values(data);
  return (result as any).insertId as number;
}

export async function getPressReleases(publishedOnly = false) {
  const db = await getDb();
  if (!db) return [];
  if (publishedOnly) {
    return db.select().from(pressReleases).where(eq(pressReleases.isPublished, true)).orderBy(desc(pressReleases.publishedAt));
  }
  return db.select().from(pressReleases).orderBy(desc(pressReleases.createdAt));
}

export async function updatePressRelease(id: number, data: Partial<InsertPressRelease>) {
  const db = await getDb();
  if (!db) return;
  await db.update(pressReleases).set(data).where(eq(pressReleases.id, id));
}

// ─── Public Notices ───────────────────────────────────────────────────────────

export async function getPublicNotices(publishedOnly = false) {
  const db = await getDb();
  if (!db) return [];
  if (publishedOnly) {
    return db.select().from(publicNotices).where(eq(publicNotices.isPublished, true)).orderBy(desc(publicNotices.publishedAt));
  }
  return db.select().from(publicNotices).orderBy(desc(publicNotices.createdAt));
}

export async function createPublicNotice(data: typeof publicNotices.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(publicNotices).values(data);
  return (result as any).insertId as number;
}

// ─── Careers ──────────────────────────────────────────────────────────────────

export async function getCareers(activeOnly = false) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(careers).where(eq(careers.isActive, true)).orderBy(desc(careers.createdAt));
  }
  return db.select().from(careers).orderBy(desc(careers.createdAt));
}

export async function createCareer(data: typeof careers.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(careers).values(data);
  return (result as any).insertId as number;
}

// ─── Legal Research ───────────────────────────────────────────────────────────

export async function getLegalResearch(category?: string) {
  const db = await getDb();
  if (!db) return [];
  if (category) {
    return db.select().from(legalResearch).where(eq(legalResearch.category, category as any)).orderBy(desc(legalResearch.createdAt));
  }
  return db.select().from(legalResearch).orderBy(desc(legalResearch.createdAt));
}

export async function createLegalResearch(data: typeof legalResearch.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(legalResearch).values(data);
  return (result as any).insertId as number;
}

export async function updateLegalResearch(id: number, data: Partial<typeof legalResearch.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(legalResearch).set(data).where(eq(legalResearch.id, id));
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data);
}

export async function getUserNotifications(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result[0]?.count ?? 0;
}

// ─── Activity Logs ────────────────────────────────────────────────────────────

export async function logActivity(data: InsertActivityLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(activityLogs).values(data);
}

export async function getActivityLogs(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
}

// ─── Public Tips ──────────────────────────────────────────────────────────────

export async function createPublicTip(data: typeof publicTips.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(publicTips).values(data);
  return (result as any).insertId as number;
}

export async function getPublicTips() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(publicTips).orderBy(desc(publicTips.createdAt));
}

export async function updatePublicTip(id: number, data: Partial<typeof publicTips.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(publicTips).set(data).where(eq(publicTips.id, id));
}

// ─── Public Requests ──────────────────────────────────────────────────────────

export async function createPublicRequest(data: typeof publicRequests.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(publicRequests).values(data);
  return (result as any).insertId as number;
}

export async function getPublicRequests() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(publicRequests).orderBy(desc(publicRequests.createdAt));
}

export async function updatePublicRequest(id: number, data: Partial<typeof publicRequests.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(publicRequests).set(data).where(eq(publicRequests.id, id));
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { activeCases: 0, pendingReviews: 0, upcomingHearings: 0, convictionRate: 0, pendingWarrants: 0 };

  const [activeCasesResult] = await db.select({ count: sql<number>`count(*)` }).from(cases)
    .where(sql`status NOT IN ('closed', 'dismissed', 'rejected')`);

  const [pendingReviewsResult] = await db.select({ count: sql<number>`count(*)` }).from(cases)
    .where(eq(cases.status, "case_review" as any));

  const [upcomingHearingsResult] = await db.select({ count: sql<number>`count(*)` }).from(courtHearings)
    .where(and(gte(courtHearings.scheduledAt, new Date()), eq(courtHearings.status, "scheduled")));

  const [pendingWarrantsResult] = await db.select({ count: sql<number>`count(*)` }).from(warrants)
    .where(eq(warrants.status, "pending_approval"));

  const [closedResult] = await db.select({ count: sql<number>`count(*)` }).from(cases)
    .where(eq(cases.status, "closed" as any));
  const [dismissedResult] = await db.select({ count: sql<number>`count(*)` }).from(cases)
    .where(eq(cases.status, "dismissed" as any));

  const closed = closedResult?.count ?? 0;
  const dismissed = dismissedResult?.count ?? 0;
  const total = closed + dismissed;
  const convictionRate = total > 0 ? Math.round((closed / total) * 100) : 0;

  return {
    activeCases: activeCasesResult?.count ?? 0,
    pendingReviews: pendingReviewsResult?.count ?? 0,
    upcomingHearings: upcomingHearingsResult?.count ?? 0,
    pendingWarrants: pendingWarrantsResult?.count ?? 0,
    convictionRate,
    closedCases: closed,
    dismissedCases: dismissed,
    totalCases: (activeCasesResult?.count ?? 0) + closed + dismissed,
  };
}

// ─── Role Permissions ─────────────────────────────────────────────────────────

interface PermCacheEntry {
  perms: Set<Permission>;
  cachedAt: number; // ms since epoch
}

/** In-process permission cache with a 60-second TTL */
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

export async function hasPermission(role: DaRole | null | undefined, permission: Permission): Promise<boolean> {
  if (!role) return false;
  const perms = await getRolePermissions(role);
  return perms.has(permission);
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

export async function getAllRolePermissions(): Promise<Record<DaRole, Permission[]>> {
  const db = await getDb();
  if (!db) return {} as Record<DaRole, Permission[]>;
  const rows = await db.select().from(rolePermissions);
  const result: Record<string, Permission[]> = {};
  for (const row of rows) {
    if (!result[row.role]) result[row.role] = [];
    result[row.role].push(row.permission as Permission);
  }
  return result as Record<DaRole, Permission[]>;
}

/**
 * Maps each `page:` permission key to the action permission that gates it.
 * A role that holds the action permission also gets the corresponding page key.
 */
const PAGE_PERMISSION_GATES: Array<{ page: string; requiredAction: Permission }> = [
  // Case detail tabs
  { page: "page:case_detail/overview",   requiredAction: "view_case" },
  { page: "page:case_detail/documents",  requiredAction: "view_case_documents" },
  { page: "page:case_detail/evidence",   requiredAction: "view_evidence" },
  { page: "page:case_detail/warrants",   requiredAction: "view_warrant" },
  { page: "page:case_detail/witnesses",  requiredAction: "view_witnesses" },
  { page: "page:case_detail/filings",    requiredAction: "view_case" },
  { page: "page:case_detail/timeline",   requiredAction: "view_case" },
  { page: "page:case_detail/activity",   requiredAction: "view_activity_logs" },
  // Top-level dashboard routes
  { page: "page:dashboard/cases",        requiredAction: "view_case" },
  { page: "page:dashboard/warrants",     requiredAction: "view_warrant" },
  { page: "page:dashboard/admin",        requiredAction: "manage_users" },
];

/** Seed default permissions from the hardcoded matrix if table is empty */
export async function seedRolePermissions(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select({ id: rolePermissions.id }).from(rolePermissions).limit(1);
  if (existing.length > 0) return; // Already seeded — Req 13.13
  const rows: Array<{ role: DaRole; permission: string }> = [];

  for (const [role, perms] of Object.entries(DEFAULT_PERMISSION_MATRIX)) {
    // Seed action permissions from the default matrix
    for (const perm of perms) {
      rows.push({ role: role as DaRole, permission: perm });
    }

    // Seed page: permission keys based on which action permissions the role holds
    const permSet = new Set<string>(perms);
    for (const { page, requiredAction } of PAGE_PERMISSION_GATES) {
      if (permSet.has(requiredAction)) {
        rows.push({ role: role as DaRole, permission: page });
      }
    }
  }

  if (rows.length > 0) {
    await db.insert(rolePermissions).values(rows);
  }
  console.log("[db] Role permissions seeded from default matrix (including page: keys)");
}

// ─── Case Documents ───────────────────────────────────────────────────────────

export async function createCaseDocument(data: InsertCaseDocument) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(caseDocuments).values(data);
  return (result as any).insertId as number;
}

export async function getCaseDocuments(caseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(caseDocuments).where(eq(caseDocuments.caseId, caseId)).orderBy(desc(caseDocuments.createdAt));
}

export async function getCaseDocumentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(caseDocuments).where(eq(caseDocuments.id, id)).limit(1);
  return result[0];
}

export async function updateCaseDocument(id: number, data: Partial<InsertCaseDocument>) {
  const db = await getDb();
  if (!db) return;
  await db.update(caseDocuments).set(data).where(eq(caseDocuments.id, id));
}

export async function deleteCaseDocument(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(caseDocuments).where(eq(caseDocuments.id, id));
}

export async function addCaseDocumentVersion(data: typeof caseDocumentVersions.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(caseDocumentVersions).values(data);
}

export async function getCaseDocumentVersions(documentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(caseDocumentVersions)
    .where(eq(caseDocumentVersions.documentId, documentId))
    .orderBy(desc(caseDocumentVersions.version));
}

// ─── Witnesses ────────────────────────────────────────────────────────────────

export async function createWitness(data: InsertWitness) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(witnesses).values(data);
  return (result as any).insertId as number;
}

export async function getWitnessesByCaseId(caseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(witnesses).where(eq(witnesses.caseId, caseId)).orderBy(desc(witnesses.createdAt));
}

export async function getWitnessById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(witnesses).where(eq(witnesses.id, id)).limit(1);
  return result[0];
}

export async function updateWitness(id: number, data: Partial<InsertWitness>) {
  const db = await getDb();
  if (!db) return;
  await db.update(witnesses).set(data).where(eq(witnesses.id, id));
}

export async function deleteWitness(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(witnesses).where(eq(witnesses.id, id));
}

// ─── Case Activity Logs ───────────────────────────────────────────────────────

export async function getCaseActivityLogs(caseId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activityLogs)
    .where(and(eq(activityLogs.entityType, "case"), eq(activityLogs.entityId, caseId)))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);
}
