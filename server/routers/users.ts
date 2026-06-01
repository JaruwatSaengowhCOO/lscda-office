import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getAllUsers, updateUserDaRole, logActivity } from "../db";
import { hasPermission } from "../../shared/permissions";

export const usersRouter = router({
  list: protectedProcedure
    .query(async ({ ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "manage_users") && !hasPermission(daRole, "view_case")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getAllUsers();
    }),

  updateRole: protectedProcedure
    .input(z.object({
      userId: z.number(),
      daRole: z.enum(["da","chief_deputy_da","division_chief","senior_prosecutor","deputy_da","investigator","legal_clerk","victim_advocate","intern","admin"]),
      department: z.string().optional(),
      badgeNumber: z.string().optional(),
      phone: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "manage_users")) throw new TRPCError({ code: "FORBIDDEN" });
      await updateUserDaRole(input.userId, input.daRole, input.department, input.badgeNumber, input.phone);
      await logActivity({ userId: ctx.user.id, userName: ctx.user.name ?? "", action: "update_user_role", entityType: "user", entityId: input.userId, details: `Set role to ${input.daRole}` });
      return { success: true };
    }),
});
