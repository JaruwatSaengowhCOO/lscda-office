import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createCase,
  getCases,
  getCaseById,
  getCaseByCaseNumber,
  updateCase,
  getCaseCharges,
  addCaseCharge,
  deleteCaseCharge,
  getCaseDefendants,
  addDefendantToCase,
  logActivity,
} from "../db";
import { hasPermission } from "../../shared/permissions";

export const casesRouter = router({
  list: protectedProcedure
    .input(z.object({ status: z.string().optional(), search: z.string().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "view_cases")) throw new TRPCError({ code: "FORBIDDEN" });
      return getCases(input);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "view_cases")) throw new TRPCError({ code: "FORBIDDEN" });
      const c = await getCaseById(input.id);
      if (!c) throw new TRPCError({ code: "NOT_FOUND" });
      return c;
    }),

  getByCaseNumber: protectedProcedure
    .input(z.object({ caseNumber: z.string() }))
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "view_cases")) throw new TRPCError({ code: "FORBIDDEN" });
      const c = await getCaseByCaseNumber(input.caseNumber);
      if (!c) throw new TRPCError({ code: "NOT_FOUND" });
      return c;
    }),

  create: protectedProcedure
    .input(z.object({
      caseNumber: z.string().min(1),
      title: z.string().min(1),
      description: z.string().optional(),
      status: z.enum(["investigation","case_review","filed","arraignment","preliminary_hearing","trial","sentencing","closed","dismissed"]).optional(),
      arrestingAgency: z.string().optional(),
      court: z.string().optional(),
      leadProsecutorId: z.number().optional(),
      filedDate: z.date().optional(),
      isPublic: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "edit_cases")) throw new TRPCError({ code: "FORBIDDEN" });
      const id = await createCase({ ...input, createdBy: ctx.user.id });
      await logActivity({ userId: ctx.user.id, userName: ctx.user.name ?? "", action: "create_case", entityType: "case", entityId: id });
      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["investigation","case_review","filed","arraignment","preliminary_hearing","trial","sentencing","closed","dismissed"]).optional(),
      arrestingAgency: z.string().optional(),
      court: z.string().optional(),
      leadProsecutorId: z.number().optional(),
      filedDate: z.date().optional(),
      closedDate: z.date().optional(),
      outcome: z.string().optional(),
      isPublic: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "edit_cases")) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      await updateCase(id, data);
      await logActivity({ userId: ctx.user.id, userName: ctx.user.name ?? "", action: "update_case", entityType: "case", entityId: id });
      return { success: true };
    }),

  getCharges: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "view_cases")) throw new TRPCError({ code: "FORBIDDEN" });
      return getCaseCharges(input.caseId);
    }),

  addCharge: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      chargeCode: z.string().optional(),
      chargeDescription: z.string().min(1),
      severity: z.enum(["felony","misdemeanor","infraction"]).optional(),
      statute: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "edit_cases")) throw new TRPCError({ code: "FORBIDDEN" });
      return addCaseCharge(input);
    }),

  deleteCharge: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "edit_cases")) throw new TRPCError({ code: "FORBIDDEN" });
      await deleteCaseCharge(input.id);
      return { success: true };
    }),

  getDefendants: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "view_cases")) throw new TRPCError({ code: "FORBIDDEN" });
      return getCaseDefendants(input.caseId);
    }),

  addDefendant: protectedProcedure
    .input(z.object({ caseId: z.number(), defendantId: z.number(), role: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "edit_cases")) throw new TRPCError({ code: "FORBIDDEN" });
      await addDefendantToCase(input.caseId, input.defendantId, input.role);
      return { success: true };
    }),
});
