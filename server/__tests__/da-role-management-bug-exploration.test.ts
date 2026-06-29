/**
 * DA Role Management — Bug Condition Exploration Tests (Task 1)
 *
 * These tests encode EXPECTED (post-fix) behavior and are designed to FAIL on
 * unfixed code. Failure confirms the bug exists. They will PASS once the fix
 * is implemented.
 *
 * Bug Condition (isBugCondition):
 *   Sub-condition A — Create Role: permissions.createRole does not exist on the
 *     router; form inputs in CreateRoleDialog are disabled.
 *   Sub-condition B — Edit Role: permissions.updateRole does not exist on the
 *     router; no Edit button is rendered in RoleList.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 */

import { describe, expect, it, vi } from "vitest";
import { appRouter } from "../routers";
import { permissionsRouter } from "../routers/permissions";
import type { TrpcContext } from "../_core/context";
import type { DaRole, Permission } from "../../shared/permissions";
import { DEFAULT_PERMISSION_MATRIX } from "../../shared/permissions";
import * as fs from "fs";
import * as path from "path";

// ─── Mock DB (mirrors lscda.test.ts pattern) ─────────────────────────────────

vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
  getDashboardStats: vi.fn().mockResolvedValue({}),
  getCases: vi.fn().mockResolvedValue([]),
  getCaseById: vi.fn().mockResolvedValue(null),
  getCaseByCaseNumber: vi.fn().mockResolvedValue(null),
  createCase: vi.fn().mockResolvedValue({ id: 1, caseNumber: "LSCDA-TEST" }),
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
  getUserNotifications: vi.fn().mockResolvedValue([]),
  markNotificationRead: vi.fn().mockResolvedValue(undefined),
  markAllNotificationsRead: vi.fn().mockResolvedValue(undefined),
  getUnreadNotificationCount: vi.fn().mockResolvedValue(0),
  createNotification: vi.fn().mockResolvedValue(1),
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
  hasPermission: vi.fn().mockImplementation(
    async (role: DaRole | null | undefined, permission: Permission) => {
      if (!role) return false;
      const perms = DEFAULT_PERMISSION_MATRIX[role] ?? [];
      return perms.includes(permission);
    },
  ),
  getAllRolePermissions: vi.fn().mockResolvedValue({}),
  getRolePermissions: vi.fn().mockResolvedValue(new Set()),
  setRolePermissions: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "test-key", url: "/uploads/test-key" }),
}));

// ─── Context helpers ──────────────────────────────────────────────────────────

function makeAdminCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      name: "Admin User",
      email: "admin@lscda.gov",
      loginMethod: "local",
      role: "admin",
      daRole: "da", // 'da' has manage_users permission in DEFAULT_PERMISSION_MATRIX
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } as any,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

// ─── Bug Condition Exploration Tests ─────────────────────────────────────────

describe("DA Role Management — Bug Condition Exploration (Property 1)", () => {

  /**
   * Case A — Create Role bug
   *
   * Expected (post-fix) behavior: permissions.createRole exists on the router
   * and returns { id, slug, label, isBuiltIn: false, ... }.
   *
   * On UNFIXED code: this assertion FAILS because createRole does not exist on
   * the router — accessing it will be undefined, and calling it will throw.
   *
   * Validates: Requirements 1.1, 1.3
   */
  describe("Case A — Create Role procedure", () => {
    it("permissions.createRole should exist on the permissionsRouter", () => {
      // Check the router keys directly — on unfixed code, createRole is absent
      const routerKeys = Object.keys(permissionsRouter._def.procedures ?? {});
      // This assertion FAILS on unfixed code (createRole is not a key)
      expect(routerKeys).toContain("createRole");
    });

    it("permissions.createRole should succeed and return a role object with isBuiltIn: false", async () => {
      const caller = appRouter.createCaller(makeAdminCtx());

      // On unfixed code: (caller.permissions as any).createRole is undefined,
      // so calling it throws TypeError: ... is not a function
      // This assertion FAILS on unfixed code.
      const result = await (caller.permissions as any).createRole({
        slug: "paralegal",
        label: "Paralegal",
      });

      expect(result).toBeDefined();
      expect(result.slug).toBe("paralegal");
      expect(result.label).toBe("Paralegal");
      expect(result.isBuiltIn).toBe(false);
      expect(result.id).toBeDefined();
    });
  });

  /**
   * Case B — Update Role bug
   *
   * Expected (post-fix) behavior: permissions.updateRole exists on the router
   * and returns the updated role object.
   *
   * On UNFIXED code: this assertion FAILS because updateRole does not exist.
   *
   * Validates: Requirements 1.2, 1.4
   */
  describe("Case B — Update Role procedure", () => {
    it("permissions.updateRole should exist on the permissionsRouter", () => {
      const routerKeys = Object.keys(permissionsRouter._def.procedures ?? {});
      // This assertion FAILS on unfixed code (updateRole is not a key)
      expect(routerKeys).toContain("updateRole");
    });

    it("permissions.updateRole should succeed and return the updated role", async () => {
      const caller = appRouter.createCaller(makeAdminCtx());

      // On unfixed code: (caller.permissions as any).updateRole is undefined,
      // so calling it throws TypeError: ... is not a function
      // This assertion FAILS on unfixed code.
      const result = await (caller.permissions as any).updateRole({
        id: 1,
        label: "Updated Label",
      });

      expect(result).toBeDefined();
      expect(result.label).toBe("Updated Label");
      expect(result.id).toBeDefined();
    });
  });

  /**
   * Case C — Disabled form (isBugCondition sub-condition A)
   *
   * Expected (post-fix) behavior: The role-id input in CreateRoleDialog is
   * NOT disabled — the form is functional.
   *
   * On UNFIXED code: The source of RoleEditor.tsx contains `disabled` on the
   * role-id input. This assertion FAILS on unfixed code.
   *
   * Validates: Requirement 1.1
   */
  describe("Case C — CreateRoleDialog form inputs", () => {
    it("role-id input in CreateRoleDialog should NOT have disabled attribute (form should be enabled)", () => {
      // Read the RoleEditor source and check for the bug marker:
      // the `disabled` prop on the role-id input.
      const roleEditorPath = path.resolve(
        __dirname,
        "../../src/components/admin/RoleEditor.tsx",
      );
      const source = fs.readFileSync(roleEditorPath, "utf-8");

      // Find the role-id input section
      // Bug marker: <Input id="role-id" ... disabled
      // After fix: the disabled prop should be removed.

      // Extract the role-id Input element text — look for the pattern
      // between id="role-id" and the closing /> or next element
      const roleIdInputMatch = source.match(
        /id="role-id"[^/]*?(\n[^/]*?)*?\/>/,
      );

      // If we couldn't even find the input, that's unexpected — test fails
      expect(roleIdInputMatch).not.toBeNull();

      const roleIdInputText = roleIdInputMatch![0];

      // On unfixed code: this assertion FAILS because the input has `disabled`
      // On fixed code: this passes because `disabled` is removed
      expect(roleIdInputText).not.toMatch(/\bdisabled\b/);
    });
  });

  /**
   * Case D — No Edit button (isBugCondition sub-condition B)
   *
   * Expected (post-fix) behavior: RoleList renders an Edit button (with
   * aria-label matching /edit/i) for each role row.
   *
   * On UNFIXED code: No element with aria-label matching /edit/i exists.
   * This assertion FAILS on unfixed code.
   *
   * Validates: Requirement 1.2
   */
  describe("Case D — RoleList Edit button", () => {
    it("RoleList source should contain an Edit button with aria-label matching /edit/i", () => {
      const roleEditorPath = path.resolve(
        __dirname,
        "../../src/components/admin/RoleEditor.tsx",
      );
      const source = fs.readFileSync(roleEditorPath, "utf-8");

      // After fix, RoleList should contain an edit button with aria-label
      // containing "edit" (case-insensitive). Look for the pattern in the
      // RoleList function body.
      //
      // On unfixed code: no such aria-label exists → assertion FAILS.
      // On fixed code: Edit button rendered → assertion PASSES.

      // Check that somewhere in the RoleList component there is an
      // aria-label that includes "edit" (any casing)
      const hasEditAriaLabel = /aria-label[^=]*=.*[Ee]dit/i.test(source);

      // This assertion FAILS on unfixed code (no edit aria-label in RoleList)
      expect(hasEditAriaLabel).toBe(true);
    });
  });

});
