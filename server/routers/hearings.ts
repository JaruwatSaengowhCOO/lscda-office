import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createHearing, getHearings, getUpcomingHearings, updateHearing, logActivity, createNotification, getAllUsers , hasPermission } from "../db";


export const hearingsRouter = router({
  list: protectedProcedure
    .input(z.object({
      caseId: z.number().optional(),
      from: z.number().optional(),
      to: z.number().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "view_hearing")) throw new TRPCError({ code: "FORBIDDEN" });
      return getHearings({
        caseId: input?.caseId,
        from: input?.from ? new Date(input.from) : undefined,
        to: input?.to ? new Date(input.to) : undefined,
      });
    }),

  upcoming: protectedProcedure
    .query(async ({ ctx }) => {
      return getUpcomingHearings(10);
    }),

  create: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      hearingType: z.string().min(1),
      scheduledAt: z.number(),
      courtroom: z.string().optional(),
      judge: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "create_hearing")) throw new TRPCError({ code: "FORBIDDEN" });
      const id = await createHearing({
        ...input,
        scheduledAt: new Date(input.scheduledAt),
        createdBy: ctx.user.id,
      });
      // Notify all staff
      const allUsers = await getAllUsers();
      for (const u of allUsers) {
        if (u.daRole && u.id !== ctx.user.id) {
          await createNotification({
            userId: u.id,
            title: "New Court Hearing Scheduled",
            message: `${input.hearingType} scheduled for ${new Date(input.scheduledAt).toLocaleDateString()} in ${input.courtroom ?? "TBD"}`,
            type: "hearing_reminder",
            relatedId: id,
            relatedType: "hearing",
          });
        }
      }
      await logActivity({ userId: ctx.user.id, userName: ctx.user.name ?? "", action: "create_hearing", entityType: "hearing", entityId: id });
      await logActivity({
        userId: ctx.user.id,
        userName: ctx.user.name ?? "",
        action: "hearing_scheduled",
        entityType: "case",
        entityId: input.caseId,
        details: `${input.hearingType} scheduled for ${new Date(input.scheduledAt).toISOString()}`,
      });
      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      hearingType: z.string().optional(),
      scheduledAt: z.number().optional(),
      courtroom: z.string().optional(),
      judge: z.string().optional(),
      status: z.enum(["scheduled","completed","continued","cancelled"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "create_hearing")) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, scheduledAt, ...rest } = input;
      await updateHearing(id, {
        ...rest,
        ...(scheduledAt ? { scheduledAt: new Date(scheduledAt) } : {}),
      });
      return { success: true };
    }),
});
