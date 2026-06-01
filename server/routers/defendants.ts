import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createDefendant, getDefendants, getDefendantById, updateDefendant, logActivity } from "../db";
import { hasPermission } from "../../shared/permissions";

export const defendantsRouter = router({
  list: protectedProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "view_defendants")) throw new TRPCError({ code: "FORBIDDEN" });
      return getDefendants(input?.search);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "view_defendants")) throw new TRPCError({ code: "FORBIDDEN" });
      const d = await getDefendantById(input.id);
      if (!d) throw new TRPCError({ code: "NOT_FOUND" });
      return d;
    }),

  create: protectedProcedure
    .input(z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      dob: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      criminalHistory: z.string().optional(),
      gangAffiliation: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "edit_defendants")) throw new TRPCError({ code: "FORBIDDEN" });
      const id = await createDefendant({ ...input, createdBy: ctx.user.id });
      await logActivity({ userId: ctx.user.id, userName: ctx.user.name ?? "", action: "create_defendant", entityType: "defendant", entityId: id });
      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      dob: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      criminalHistory: z.string().optional(),
      gangAffiliation: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "edit_defendants")) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      await updateDefendant(id, data);
      return { success: true };
    }),
});
