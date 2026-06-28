import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createWarrant,
  getWarrants,
  updateWarrant,
  logActivity,
  createNotification,
  getAllUsers,
  hasPermission,
  getDb,
} from "../db";
import { warrants } from "../../drizzle/schema";

import { nanoid } from "nanoid";

// ─── Warrant Display Status ───────────────────────────────────────────────────

export type WarrantDisplayStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "denied"
  | "executed"
  | "expired";

/**
 * Computes the display status for a warrant.
 * An approved warrant whose expiresAt is in the past is shown as "expired".
 * All other status values pass through unchanged.
 */
export function getWarrantDisplayStatus(w: {
  status: string;
  expiresAt: Date | null;
}): WarrantDisplayStatus {
  if (w.status === "approved" && w.expiresAt && w.expiresAt < new Date()) {
    return "expired";
  }
  return w.status as WarrantDisplayStatus;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const warrantsRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          type: z.string().optional(),
          status: z.string().optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "view_warrant"))
        throw new TRPCError({ code: "FORBIDDEN" });
      return getWarrants(input);
    }),

  listByCase: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "view_warrant"))
        throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(warrants)
        .where(eq(warrants.caseId, input.caseId))
        .orderBy(desc(warrants.createdAt));
      return rows.map((w) => ({
        ...w,
        displayStatus: getWarrantDisplayStatus(w),
      }));
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "view_warrant"))
        throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db
        .select()
        .from(warrants)
        .where(eq(warrants.id, input.id))
        .limit(1);
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND" });
      const w = rows[0];
      return { ...w, displayStatus: getWarrantDisplayStatus(w) };
    }),

  create: protectedProcedure
    .input(
      z.object({
        caseId: z.number().optional(),
        type: z.enum([
          "search_warrant",
          "arrest_warrant",
          "bench_warrant",
          "subpoena",
        ]),
        subject: z.string().optional(),
        description: z.string().optional(),
        expiresAt: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "create_warrant"))
        throw new TRPCError({ code: "FORBIDDEN" });
      const warrantNumber = `WRT-${new Date().getFullYear()}-${nanoid(6).toUpperCase()}`;
      const id = await createWarrant({
        ...input,
        warrantNumber,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        createdBy: ctx.user.id,
      });
      await logActivity({
        userId: ctx.user.id,
        userName: ctx.user.name ?? "",
        action: "create_warrant",
        entityType: "warrant",
        entityId: id,
        details: `Created warrant ${warrantNumber}`,
      });
      return { id, warrantNumber };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z
          .enum([
            "draft",
            "pending_approval",
            "approved",
            "denied",
            "executed",
            "expired",
          ])
          .optional(),
        issuedBy: z.string().optional(),
        issuedAt: z.number().optional(),
        executedAt: z.number().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      const { id, issuedAt, executedAt, ...rest } = input;
      if (
        rest.status === "approved" ||
        rest.status === "denied" ||
        rest.status === "pending_approval"
      ) {
        if (!await hasPermission(daRole, "approve_warrant"))
          throw new TRPCError({ code: "FORBIDDEN" });
      } else {
        if (!await hasPermission(daRole, "create_warrant"))
          throw new TRPCError({ code: "FORBIDDEN" });
      }
      await updateWarrant(id, {
        ...rest,
        ...(issuedAt ? { issuedAt: new Date(issuedAt) } : {}),
        ...(executedAt ? { executedAt: new Date(executedAt) } : {}),
      });
      // Notify on status change
      if (rest.status) {
        const allUsers = await getAllUsers();
        for (const u of allUsers) {
          if (u.daRole && u.id !== ctx.user.id) {
            await createNotification({
              userId: u.id,
              title: "Warrant Status Updated",
              message: `Warrant #${id} status changed to ${rest.status.replace(/_/g, " ")}`,
              type: "warrant_update",
              relatedId: id,
              relatedType: "warrant",
            });
          }
        }
      }
      await logActivity({
        userId: ctx.user.id,
        userName: ctx.user.name ?? "",
        action: "update_warrant",
        entityType: "warrant",
        entityId: id,
      });
      return { success: true };
    }),

  submit: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "create_warrant"))
        throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Verify warrant exists and is in draft status
      const rows = await db
        .select()
        .from(warrants)
        .where(eq(warrants.id, input.id))
        .limit(1);
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND" });
      const warrant = rows[0];
      if (warrant.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Warrant is already in status "${warrant.status}"; only draft warrants can be submitted`,
        });
      }
      await updateWarrant(input.id, { status: "pending_approval" });
      // Log activity on the parent case
      await logActivity({
        userId: ctx.user.id,
        userName: ctx.user.name ?? "",
        action: "warrant_submitted",
        entityType: "case",
        entityId: warrant.caseId ?? undefined,
        details: `Warrant ${warrant.warrantNumber} (${warrant.type.replace(/_/g, " ")}) submitted for approval`,
      });
      return { success: true };
    }),

  approve: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        approvedBy: z.string(),
        dateApproved: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "approve_warrant"))
        throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db
        .select()
        .from(warrants)
        .where(eq(warrants.id, input.id))
        .limit(1);
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND" });
      const warrant = rows[0];
      await updateWarrant(input.id, {
        status: "approved",
        approvedBy: input.approvedBy,
        dateApproved: new Date(input.dateApproved),
      });
      await logActivity({
        userId: ctx.user.id,
        userName: ctx.user.name ?? "",
        action: "warrant_approved",
        entityType: "case",
        entityId: warrant.caseId ?? undefined,
        details: `Warrant ${warrant.warrantNumber} (${warrant.type.replace(/_/g, " ")}) approved by ${input.approvedBy}`,
      });
      return { success: true };
    }),

  deny: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "approve_warrant"))
        throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db
        .select()
        .from(warrants)
        .where(eq(warrants.id, input.id))
        .limit(1);
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND" });
      const warrant = rows[0];
      await updateWarrant(input.id, { status: "denied" });
      await logActivity({
        userId: ctx.user.id,
        userName: ctx.user.name ?? "",
        action: "warrant_denied",
        entityType: "case",
        entityId: warrant.caseId ?? undefined,
        details: `Warrant ${warrant.warrantNumber} (${warrant.type.replace(/_/g, " ")}) denied`,
      });
      return { success: true };
    }),

  execute: protectedProcedure
    .input(z.object({ id: z.number(), executedAt: z.number().optional() }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "create_warrant"))
        throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db
        .select()
        .from(warrants)
        .where(eq(warrants.id, input.id))
        .limit(1);
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND" });
      const warrant = rows[0];
      const executedAt = input.executedAt
        ? new Date(input.executedAt)
        : new Date();
      await updateWarrant(input.id, { status: "executed", executedAt });
      await logActivity({
        userId: ctx.user.id,
        userName: ctx.user.name ?? "",
        action: "warrant_executed",
        entityType: "case",
        entityId: warrant.caseId ?? undefined,
        details: `Warrant ${warrant.warrantNumber} (${warrant.type.replace(/_/g, " ")}) executed`,
      });
      return { success: true };
    }),
});
