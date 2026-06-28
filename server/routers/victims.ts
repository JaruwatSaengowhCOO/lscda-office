import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createVictim, getVictims, updateVictim, logActivity , hasPermission } from "../db";


export const victimsRouter = router({
  list: protectedProcedure
    .input(z.object({ caseId: z.number().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "view_victims")) throw new TRPCError({ code: "FORBIDDEN" });
      return getVictims(input?.caseId);
    }),

  create: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      phone: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
      hasProtectionOrder: z.boolean().optional(),
      protectionOrderDetails: z.string().optional(),
      compensationStatus: z.enum(["pending","approved","paid","denied","not_applicable"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "edit_victims")) throw new TRPCError({ code: "FORBIDDEN" });
      const id = await createVictim({ ...input, createdBy: ctx.user.id });
      await logActivity({ userId: ctx.user.id, userName: ctx.user.name ?? "", action: "create_victim", entityType: "victim", entityId: id });
      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
      hasProtectionOrder: z.boolean().optional(),
      protectionOrderDetails: z.string().optional(),
      compensationStatus: z.enum(["pending","approved","paid","denied","not_applicable"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "edit_victims")) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      await updateVictim(id, data);
      return { success: true };
    }),
});
