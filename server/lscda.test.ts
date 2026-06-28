import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { DEFAULT_PERMISSION_MATRIX } from "../shared/permissions";
import type { DaRole, Permission } from "../shared/permissions";

// ─── Mock DB helpers ────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
  getDashboardStats: vi.fn().mockResolvedValue({
    activeCases: 5,
    pendingReviews: 2,
    upcomingHearings: 3,
    convictionRate: 87,
    totalCases: 20,
    closedCases: 10,
    dismissedCases: 2,
    recentActivity: [],
    hearingsList: [],
  }),
  getCases: vi.fn().mockResolvedValue([]),
  getCaseById: vi.fn().mockResolvedValue(null),
  getCaseByCaseNumber: vi.fn().mockResolvedValue(null),
  createCase: vi.fn().mockResolvedValue({ id: 1, caseNumber: "LSCDA-2026-0001" }),
  updateCase: vi.fn().mockResolvedValue(undefined),
  getCaseCharges: vi.fn().mockResolvedValue([]),
  addCaseCharge: vi.fn().mockResolvedValue({ id: 1 }),
  deleteCaseCharge: vi.fn().mockResolvedValue(undefined),
  getCaseDefendants: vi.fn().mockResolvedValue([]),
  addDefendantToCase: vi.fn().mockResolvedValue(undefined),
  getDefendants: vi.fn().mockResolvedValue([]),
  getDefendantById: vi.fn().mockResolvedValue(null),
  createDefendant: vi.fn().mockResolvedValue(1),
  updateDefendant: vi.fn().mockResolvedValue(undefined),
  getHearings: vi.fn().mockResolvedValue([]),
  getUpcomingHearings: vi.fn().mockResolvedValue([]),
  createHearing: vi.fn().mockResolvedValue(1),
  updateHearing: vi.fn().mockResolvedValue(undefined),
  getWarrants: vi.fn().mockResolvedValue([]),
  createWarrant: vi.fn().mockResolvedValue(1),
  updateWarrant: vi.fn().mockResolvedValue(undefined),
  getEvidenceByCaseId: vi.fn().mockResolvedValue([]),
  createEvidence: vi.fn().mockResolvedValue(1),
  getEvidenceById: vi.fn().mockResolvedValue(null),
  addEvidenceAuditLog: vi.fn().mockResolvedValue(undefined),
  getEvidenceAuditLogs: vi.fn().mockResolvedValue([]),
  getVictims: vi.fn().mockResolvedValue([]),
  createVictim: vi.fn().mockResolvedValue(1),
  updateVictim: vi.fn().mockResolvedValue(undefined),
  getComplaints: vi.fn().mockResolvedValue([]),
  createComplaint: vi.fn().mockResolvedValue(1),
  updateComplaint: vi.fn().mockResolvedValue(undefined),
  getAllUsers: vi.fn().mockResolvedValue([]),
  updateUserDaRole: vi.fn().mockResolvedValue(undefined),
  // Notifications - use correct function names from db.ts
  getUserNotifications: vi.fn().mockResolvedValue([]),
  markNotificationRead: vi.fn().mockResolvedValue(undefined),
  markAllNotificationsRead: vi.fn().mockResolvedValue(undefined),
  getUnreadNotificationCount: vi.fn().mockResolvedValue(0),
  createNotification: vi.fn().mockResolvedValue(1),
  // Content
  getPressReleases: vi.fn().mockResolvedValue([]),
  createPressRelease: vi.fn().mockResolvedValue(1),
  updatePressRelease: vi.fn().mockResolvedValue(undefined),
  getDocuments: vi.fn().mockResolvedValue([]),
  createDocument: vi.fn().mockResolvedValue(1),
  incrementDocumentDownload: vi.fn().mockResolvedValue(undefined),
  getCareers: vi.fn().mockResolvedValue([]),
  createCareer: vi.fn().mockResolvedValue(1),
  getLegalResearch: vi.fn().mockResolvedValue([]),
  createLegalResearch: vi.fn().mockResolvedValue(1),
  updateLegalResearch: vi.fn().mockResolvedValue(undefined),
  getPublicTips: vi.fn().mockResolvedValue([]),
  createPublicTip: vi.fn().mockResolvedValue(1),
  updatePublicTip: vi.fn().mockResolvedValue(undefined),
  getPublicRequests: vi.fn().mockResolvedValue([]),
  createPublicRequest: vi.fn().mockResolvedValue(1),
  updatePublicRequest: vi.fn().mockResolvedValue(undefined),
  getPublicNotices: vi.fn().mockResolvedValue([]),
  createPublicNotice: vi.fn().mockResolvedValue(1),
  getActivityLogs: vi.fn().mockResolvedValue([]),
  logActivity: vi.fn().mockResolvedValue(undefined),
  hasPermission: vi.fn().mockImplementation(async (role: DaRole | null | undefined, permission: Permission) => {
    if (!role) return false;
    const perms = DEFAULT_PERMISSION_MATRIX[role] ?? [];
    return perms.includes(permission);
  }),
}));

// ─── Mock storage ────────────────────────────────────────────────────────────
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "test-key", url: "/uploads/test-key" }),
}));

// ─── Helpers ────────────────────────────────────────────────────────────────
/**
 * makeCtx: สร้าง context สำหรับ authenticated user
 * daRole ที่ถูกต้อง: da, chief_deputy_da, division_chief, senior_prosecutor,
 *                    deputy_da, investigator, legal_clerk, victim_advocate, intern, admin
 */
function makeCtx(role: "admin" | "user" = "user", daRole = "deputy_da"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      name: "Test User",
      email: "test@lscda.gov",
      loginMethod: "manus",
      role,
      daRole,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } as any,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

// ─── Auth Tests ──────────────────────────────────────────────────────────────
describe("auth", () => {
  it("me returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("me returns user for authenticated user", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.openId).toBe("test-user");
  });

  it("logout clears session cookie", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});

// ─── Reports/Dashboard Tests ─────────────────────────────────────────────────
// NOTE: trpc.dashboard does NOT exist. Dashboard stats is at trpc.reports.dashboard
describe("reports", () => {
  it("dashboard returns statistics for authenticated user", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.reports.dashboard();
    expect(result).toBeDefined();
    expect(result.activeCases).toBe(5);
    expect(result.convictionRate).toBe(87);
  });

  it("dashboard throws UNAUTHORIZED for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.reports.dashboard()).rejects.toThrow();
  });

  it("monthly report requires view_reports permission", async () => {
    // deputy_da has view_reports permission
    const caller = appRouter.createCaller(makeCtx("user", "deputy_da"));
    // monthly requires { year, month } - will fail at DB level (db is null) but not at permission level
    // We test that it doesn't throw FORBIDDEN
    const result = await caller.reports.monthly({ year: 2026, month: 6 });
    // DB returns null when db is unavailable
    expect(result).toBeNull();
  });
});

// ─── Cases Tests ─────────────────────────────────────────────────────────────
describe("cases", () => {
  it("list returns empty array when no cases", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.cases.list({ status: undefined });
    expect(Array.isArray(result)).toBe(true);
  });

  it("create returns new case id (da role has create_case permission)", async () => {
    // 'da' is the correct daRole for District Attorney (NOT 'district_attorney')
    const caller = appRouter.createCaller(makeCtx("user", "da"));
    const result = await caller.cases.create({
      caseNumber: "LSCDA-2026-TEST01",
      title: "Test Case",
    });
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it("create throws UNAUTHORIZED for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.cases.create({ caseNumber: "LSCDA-2026-TEST02", title: "Test" })
    ).rejects.toThrow();
  });

  it("create throws FORBIDDEN for role without create_case permission", async () => {
    // investigator does NOT have create_case permission
    const caller = appRouter.createCaller(makeCtx("user", "investigator"));
    await expect(
      caller.cases.create({ caseNumber: "LSCDA-2026-TEST03", title: "Test" })
    ).rejects.toThrow();
  });
});

// ─── Defendants Tests ─────────────────────────────────────────────────────────
describe("defendants", () => {
  it("list returns empty array when no defendants", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.defendants.list({ search: undefined });
    expect(Array.isArray(result)).toBe(true);
  });

  it("create returns new defendant record (da role has edit_defendants permission)", async () => {
    // 'da' has edit_defendants permission
    const caller = appRouter.createCaller(makeCtx("user", "da"));
    const result = await caller.defendants.create({
      firstName: "John",
      lastName: "Doe",
    });
    expect(result).toBeDefined();
    expect(result.id).toBe(1);
  });

  it("create throws FORBIDDEN for role without edit_defendants permission", async () => {
    // investigator does NOT have edit_defendants permission
    const caller = appRouter.createCaller(makeCtx("user", "investigator"));
    await expect(
      caller.defendants.create({ firstName: "John", lastName: "Doe" })
    ).rejects.toThrow();
  });
});

// ─── Warrants Tests ───────────────────────────────────────────────────────────
describe("warrants", () => {
  it("list returns empty array when no warrants", async () => {
    // deputy_da has view_warrant permission
    const caller = appRouter.createCaller(makeCtx("user", "deputy_da"));
    const result = await caller.warrants.list({ status: undefined });
    expect(Array.isArray(result)).toBe(true);
  });

  it("create returns new warrant (da role has create_warrant permission)", async () => {
    // 'da' has create_warrant permission
    const caller = appRouter.createCaller(makeCtx("user", "da"));
    const result = await caller.warrants.create({
      type: "arrest_warrant",
      caseId: 1,
      subject: "John Doe",
      description: "Arrest warrant for robbery",
    });
    expect(result).toBeDefined();
    // warrantNumber is generated by nanoid, just check it exists
    expect(result.warrantNumber).toBeDefined();
  });

  it("create throws FORBIDDEN for role without create_warrant permission", async () => {
    // investigator does NOT have create_warrant permission
    const caller = appRouter.createCaller(makeCtx("user", "investigator"));
    await expect(
      caller.warrants.create({ type: "arrest_warrant" })
    ).rejects.toThrow();
  });
});

// ─── Victims Tests ─────────────────────────────────────────────────────────────
describe("victims", () => {
  it("list returns empty array when no victims (deputy_da has view_victims)", async () => {
    // deputy_da has view_victims permission
    const caller = appRouter.createCaller(makeCtx("user", "deputy_da"));
    const result = await caller.victims.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("create returns new victim record (da role has edit_victims permission)", async () => {
    // 'da' has edit_victims permission
    const caller = appRouter.createCaller(makeCtx("user", "da"));
    const result = await caller.victims.create({
      firstName: "Jane",
      lastName: "Smith",
      caseId: 1,
    });
    expect(result).toBeDefined();
    expect(result.id).toBe(1);
  });

  it("create throws FORBIDDEN for role without edit_victims permission", async () => {
    // deputy_da does NOT have edit_victims permission
    const caller = appRouter.createCaller(makeCtx("user", "deputy_da"));
    await expect(
      caller.victims.create({ firstName: "Jane", lastName: "Smith", caseId: 1 })
    ).rejects.toThrow();
  });
});

// ─── Public Services Tests ────────────────────────────────────────────────────
// NOTE: public router has publicProcedure procedures accessible without auth
describe("public services", () => {
  it("submitTip returns id and message (requires isAnonymous, subject, description)", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.open.submitTip({
      isAnonymous: false,
      name: "John Citizen",
      contact: "john@example.com",
      subject: "Suspicious Activity",
      description: "I saw something suspicious on Main Street",
    });
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.message).toBeDefined();
  });

  it("submitTip works anonymously (isAnonymous: true, no name/contact required)", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.open.submitTip({
      isAnonymous: true,
      subject: "Drug Activity",
      description: "Suspicious drug activity near the park",
    });
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it("submitRequest returns id and message (requires name, contact, requestType, description)", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.open.submitRequest({
      name: "John Public",
      contact: "john@example.com",
      requestType: "general_inquiry",
      description: "I have a general inquiry about the DA office",
    });
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.message).toBeDefined();
  });

  it("submitRequest with case_status type works", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.open.submitRequest({
      name: "Jane Doe",
      contact: "jane@example.com",
      requestType: "case_status",
      description: "Requesting status update on my case",
      caseNumberRef: "LSCDA-2026-ABC123",
    });
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it("checkCaseStatus returns null for non-existent case", async () => {
    // Procedure is named checkCaseStatus (NOT caseStatus)
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.open.checkCaseStatus({ caseNumber: "DA-9999-9999" });
    expect(result).toBeNull();
  });

  it("pressReleases returns empty array (public procedure)", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.open.pressReleases();
    expect(Array.isArray(result)).toBe(true);
  });

  it("careers returns empty array (public procedure)", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.open.careers();
    expect(Array.isArray(result)).toBe(true);
  });

  it("documents returns empty array (public procedure)", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.open.documents();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Notifications Tests ───────────────────────────────────────────────────────
describe("notifications", () => {
  it("list returns empty array when no notifications (protectedProcedure)", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.notifications.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("list throws UNAUTHORIZED for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.notifications.list()).rejects.toThrow();
  });
});

// ─── Content Tests (protectedProcedure - require auth) ─────────────────────────
// NOTE: content.pressReleases, content.documents, content.careers are ALL protectedProcedure
// They require authentication. Public versions are at public.pressReleases, public.documents, public.careers
describe("content (internal - requires auth)", () => {
  it("pressReleases returns empty array for authenticated user", async () => {
    // content.pressReleases is protectedProcedure - needs auth
    const caller = appRouter.createCaller(makeCtx("user", "da"));
    const result = await caller.content.pressReleases();
    expect(Array.isArray(result)).toBe(true);
  });

  it("pressReleases throws UNAUTHORIZED for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.content.pressReleases()).rejects.toThrow();
  });

  it("documents returns empty array for authenticated user", async () => {
    // content.documents is protectedProcedure - needs auth
    const caller = appRouter.createCaller(makeCtx("user", "da"));
    const result = await caller.content.documents();
    expect(Array.isArray(result)).toBe(true);
  });

  it("careers returns empty array for authenticated user", async () => {
    // content.careers is protectedProcedure - needs auth
    const caller = appRouter.createCaller(makeCtx("user", "da"));
    const result = await caller.content.careers();
    expect(Array.isArray(result)).toBe(true);
  });
});
