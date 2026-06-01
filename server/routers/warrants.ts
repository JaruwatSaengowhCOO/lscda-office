import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createWarrant, getWarrants, updateWarrant, logActivity, createNotification, getAllUsers } from "../db";
import { hasPermission } from "../../shared/permissions";
import { nanoid } from "nanoid";

export const warrantsRouter = router({
  list: protectedProcedure
    .input(z.object({ type: z.string().optional(), status: z.string().optional(), search: z.string().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "view_warrant")) throw new TRPCError({ code: "FORBIDDEN" });
      return getWarrants(input);
    }),

  create: protectedProcedure
    .input(z.object({
      caseId: z.number().optional(),
      type: z.enum(["search_warrant","arrest_warrant","subpoena"]),
      subject: z.string().optional(),
      description: z.string().optional(),
      expiresAt: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "create_warrant")) throw new TRPCError({ code: "FORBIDDEN" });
      const warrantNumber = `WRT-${new Date().getFullYear()}-${nanoid(6).toUpperCase()}`;
      const id = await createWarrant({
        ...input,
        warrantNumber,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        createdBy: ctx.user.id,
      });
      await logActivity({ userId: ctx.user.id, userName: ctx.user.name ?? "", action: "create_warrant", entityType: "warrant", entityId: id, details: `Created warrant ${warrantNumber}` });
      return { id, warrantNumber };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["draft","pending_approval","issued","executed","expired"]).optional(),
      issuedBy: z.string().optional(),
      issuedAt: z.number().optional(),
      executedAt: z.number().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      const { id, issuedAt, executedAt, ...rest } = input;
      if (rest.status === "issued" || rest.status === "pending_approval") {
        if (!hasPermission(daRole, "approve_warrant")) throw new TRPCError({ code: "FORBIDDEN" });
      } else {
        if (!hasPermission(daRole, "create_warrant")) throw new TRPCError({ code: "FORBIDDEN" });
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
      await logActivity({ userId: ctx.user.id, userName: ctx.user.name ?? "", action: "update_warrant", entityType: "warrant", entityId: id });
      return { success: true };
    }),
});
