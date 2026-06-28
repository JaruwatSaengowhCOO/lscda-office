import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createCase, getCases, getCaseById, getCaseByCaseNumber, updateCase,
  getCaseCharges, addCaseCharge, deleteCaseCharge,
  getCaseDefendants, addDefendantToCase,
  getHearings, getEvidenceByCaseId, getWarrants,
  getWitnessesByCaseId, getCaseDocuments,
  logActivity, hasPermission, getCaseActivityLogs,
} from "../db";
import { CASE_STATUSES, CASE_STATUS_TRANSITIONS } from "../../drizzle/schema";
import type { CaseStatus } from "../../drizzle/schema";

const CASE_STATUS_SCHEMA = z.enum(CASE_STATUSES);

export const casesRouter = router({
  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      search: z.string().optional(),
      priority: z.string().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "view_case")) throw new TRPCError({ code: "FORBIDDEN" });
      return getCases(input);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "view_case")) throw new TRPCError({ code: "FORBIDDEN" });
      const c = await getCaseById(input.id);
      if (!c) throw new TRPCError({ code: "NOT_FOUND" });
      const [hearings, evidenceList, caseWarrants, witnessesData, documentsData] = await Promise.all([
        getHearings({ caseId: input.id }),
        getEvidenceByCaseId(input.id),
        getWarrants({ caseId: input.id } as any),
        getWitnessesByCaseId(input.id),
        getCaseDocuments(input.id),
      ]);
      return { ...c, hearings, evidence: evidenceList, warrants: caseWarrants, witnesses: witnessesData, documents: documentsData };
    }),

  getByCaseNumber: protectedProcedure
    .input(z.object({ caseNumber: z.string() }))
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "view_case")) throw new TRPCError({ code: "FORBIDDEN" });
      const c = await getCaseByCaseNumber(input.caseNumber);
      if (!c) throw new TRPCError({ code: "NOT_FOUND" });
      return c;
    }),

  create: protectedProcedure
    .input(z.object({
      caseNumber: z.string().min(1),
      title: z.string().min(1),
      description: z.string().optional(),
      status: CASE_STATUS_SCHEMA.optional(),
      priority: z.enum(["low", "medium", "high", "critical"]).optional(),
      arrestingAgency: z.string().optional(),
      investigatingAgency: z.string().optional(),
      court: z.string().optional(),
      leadProsecutorId: z.number().optional(),
      assignedJudge: z.string().optional(),
      defendantName: z.string().optional(),
      defendantId: z.number().optional(),
      filedDate: z.date().optional(),
      filingDate: z.date().optional(),
      isPublic: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "create_case")) throw new TRPCError({ code: "FORBIDDEN" });
      const id = await createCase({ ...input, createdBy: ctx.user.id });
      await logActivity({
        userId: ctx.user.id,
        userName: ctx.user.name ?? "",
        action: "case_created",
        entityType: "case",
        entityId: id,
        details: `Case ${input.caseNumber} created: ${input.title}`,
      });
      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      status: CASE_STATUS_SCHEMA.optional(),
      priority: z.enum(["low", "medium", "high", "critical"]).optional(),
      arrestingAgency: z.string().optional(),
      investigatingAgency: z.string().optional(),
      court: z.string().optional(),
      leadProsecutorId: z.number().optional(),
      assignedJudge: z.string().optional(),
      defendantName: z.string().optional(),
      defendantId: z.number().optional(),
      filedDate: z.date().optional(),
      filingDate: z.date().optional(),
      closedDate: z.date().optional(),
      outcome: z.string().optional(),
      isPublic: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "edit_case")) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, status: newStatus, ...data } = input;

      // Validate status transition if status is being changed
      if (newStatus) {
        const currentCase = await getCaseById(id);
        if (!currentCase) throw new TRPCError({ code: "NOT_FOUND" });
        const currentStatus = currentCase.status as CaseStatus;
        const allowedTransitions = CASE_STATUS_TRANSITIONS[currentStatus] ?? [];
        if (!allowedTransitions.includes(newStatus)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: JSON.stringify({
              currentStatus,
              targetStatus: newStatus,
              validTargets: allowedTransitions,
            }),
          });
        }
        await updateCase(id, { ...data, status: newStatus });
        await logActivity({
          userId: ctx.user.id,
          userName: ctx.user.name ?? "",
          action: "status_changed",
          entityType: "case",
          entityId: id,
          details: `Status changed from "${currentStatus}" to "${newStatus}"`,
        });
      } else {
        await updateCase(id, data as any);
        await logActivity({
          userId: ctx.user.id,
          userName: ctx.user.name ?? "",
          action: "case_updated",
          entityType: "case",
          entityId: id,
        });
      }
      return { success: true };
    }),

  getCharges: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "view_case")) throw new TRPCError({ code: "FORBIDDEN" });
      return getCaseCharges(input.caseId);
    }),

  addCharge: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      chargeCode: z.string().optional(),
      chargeDescription: z.string().min(1),
      severity: z.enum(["felony", "misdemeanor", "infraction"]).optional(),
      statute: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "edit_case")) throw new TRPCError({ code: "FORBIDDEN" });
      await addCaseCharge(input);
      await logActivity({ userId: ctx.user.id, userName: ctx.user.name ?? "", action: "charge_added", entityType: "case", entityId: input.caseId, details: input.chargeDescription });
      return { success: true };
    }),

  deleteCharge: protectedProcedure
    .input(z.object({ id: z.number(), caseId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "edit_case")) throw new TRPCError({ code: "FORBIDDEN" });
      await deleteCaseCharge(input.id);
      await logActivity({ userId: ctx.user.id, userName: ctx.user.name ?? "", action: "charge_removed", entityType: "case", entityId: input.caseId });
      return { success: true };
    }),

  getDefendants: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "view_case")) throw new TRPCError({ code: "FORBIDDEN" });
      return getCaseDefendants(input.caseId);
    }),

  addDefendant: protectedProcedure
    .input(z.object({ caseId: z.number(), defendantId: z.number(), role: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "edit_case")) throw new TRPCError({ code: "FORBIDDEN" });
      await addDefendantToCase(input.caseId, input.defendantId, input.role);
      await logActivity({ userId: ctx.user.id, userName: ctx.user.name ?? "", action: "defendant_added", entityType: "case", entityId: input.caseId });
      return { success: true };
    }),

  getActivityLog: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "view_case")) throw new TRPCError({ code: "FORBIDDEN" });
      return getCaseActivityLogs(input.caseId);
    }),

  getValidTransitions: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "view_case")) throw new TRPCError({ code: "FORBIDDEN" });
      const c = await getCaseById(input.caseId);
      if (!c) throw new TRPCError({ code: "NOT_FOUND" });
      return CASE_STATUS_TRANSITIONS[c.status as CaseStatus] ?? [];
    }),
});
