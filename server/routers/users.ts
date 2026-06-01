import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getAllUsers, updateUserDaRole, logActivity, createUser, updateUser } from "../db";
import { hasPermission } from "../../shared/permissions";
import { createPasswordHash } from "./auth";

const daRoleEnum = z.enum([
  "da", "chief_deputy_da", "division_chief", "senior_prosecutor",
  "deputy_da", "investigator", "legal_clerk", "victim_advocate", "intern", "admin",
]);

export const usersRouter = router({
  list: protectedProcedure
    .query(async ({ ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "manage_users") && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getAllUsers();
    }),

  create: adminProcedure
    .input(z.object({
      username: z.string().min(3).max(64),
      password: z.string().min(6),
      name: z.string().min(1),
      email: z.string().email().optional(),
      role: z.enum(["user", "admin"]).default("user"),
      daRole: daRoleEnum.default("intern"),
      department: z.string().optional(),
      badgeNumber: z.string().optional(),
      phone: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const passwordHash = createPasswordHash(input.password);
      await createUser({ ...input, passwordHash });
      await logActivity({
        userId: ctx.user.id,
        userName: ctx.user.name ?? "",
        action: "create_user",
        entityType: "user",
        details: `Created user ${input.username}`,
      });
      return { success: true };
    }),

  update: adminProcedure
    .input(z.object({
      userId: z.number(),
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      role: z.enum(["user", "admin"]).optional(),
      daRole: daRoleEnum.optional(),
      department: z.string().optional(),
      badgeNumber: z.string().optional(),
      phone: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { userId, ...data } = input;
      await updateUser(userId, data);
      await logActivity({
        userId: ctx.user.id,
        userName: ctx.user.name ?? "",
        action: "update_user",
        entityType: "user",
        entityId: userId,
        details: JSON.stringify(data),
      });
      return { success: true };
    }),

  resetPassword: adminProcedure
    .input(z.object({
      userId: z.number(),
      newPassword: z.string().min(6),
    }))
    .mutation(async ({ input, ctx }) => {
      const passwordHash = createPasswordHash(input.newPassword);
      await updateUser(input.userId, { passwordHash });
      await logActivity({
        userId: ctx.user.id,
        userName: ctx.user.name ?? "",
        action: "reset_password",
        entityType: "user",
        entityId: input.userId,
      });
      return { success: true };
    }),

  // legacy — kept for backward compat
  updateRole: protectedProcedure
    .input(z.object({
      userId: z.number(),
      daRole: daRoleEnum,
      department: z.string().optional(),
      badgeNumber: z.string().optional(),
      phone: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "manage_users") && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await updateUserDaRole(input.userId, input.daRole, input.department, input.badgeNumber, input.phone);
      await logActivity({
        userId: ctx.user.id,
        userName: ctx.user.name ?? "",
        action: "update_user_role",
        entityType: "user",
        entityId: input.userId,
        details: `Set role to ${input.daRole}`,
      });
      return { success: true };
    }),
});
