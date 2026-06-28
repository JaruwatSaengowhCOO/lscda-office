import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, lte, like } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getAllRolePermissions,
  setRolePermissions,
  getRolePermissions,
  logActivity,
  hasPermission,
  getDb,
} from "../db";
import { activityLogs, rolePermissions } from "../../drizzle/schema";
import type { DaRole, Permission } from "../../shared/permissions";

const DA_ROLES = [
  "da",
  "chief_deputy_da",
  "division_chief",
  "senior_prosecutor",
  "deputy_da",
  "investigator",
  "legal_clerk",
  "victim_advocate",
  "intern",
  "admin",
] as const;

export const permissionsRouter = router({
  /**
   * Returns the full role × permission matrix from the DB.
   * Guard: manage_users
   */
  getMatrix: protectedProcedure
    .query(async ({ ctx }) => {
      const daRole = ctx.user.daRole as DaRole;
      if (!await hasPermission(daRole, "manage_users")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getAllRolePermissions();
    }),

  /**
   * Replaces all permissions for a role in a single DB transaction,
   * evicts the cache, and logs the activity.
   * Guard: manage_users
   */
  setRolePermissions: protectedProcedure
    .input(z.object({
      role: z.enum(DA_ROLES),
      permissions: z.array(z.string()),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as DaRole;
      if (!await hasPermission(daRole, "manage_users")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      // setRolePermissions in db.ts wraps delete+insert in a transaction
      // and immediately evicts the cache entry for the role.
      await setRolePermissions(input.role as DaRole, input.permissions as Permission[]);
      await logActivity({
        userId: ctx.user.id,
        userName: ctx.user.name ?? "",
        action: "permissions_updated",
        entityType: "role",
        details: `Permissions updated for role "${input.role}": [${input.permissions.join(", ")}]`,
      });
      return { success: true as const };
    }),

  /**
   * Inserts or deletes a single rolePermissions row, then refreshes the
   * full permission set for the role (which also evicts the cache) and
   * logs the activity.
   * Guard: manage_users
   */
  togglePermission: protectedProcedure
    .input(z.object({
      role: z.enum(DA_ROLES),
      permission: z.string(),
      granted: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as DaRole;
      if (!await hasPermission(daRole, "manage_users")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      if (input.granted) {
        // Insert the permission row (ignore duplicate if already present)
        await db
          .insert(rolePermissions)
          .values({ role: input.role as any, permission: input.permission })
          .onDuplicateKeyUpdate({ set: { permission: input.permission } });
      } else {
        // Delete the permission row
        await db
          .delete(rolePermissions)
          .where(
            and(
              eq(rolePermissions.role, input.role as any),
              eq(rolePermissions.permission, input.permission),
            ),
          );
      }

      // Force immediate cache eviction: read the updated rows from DB and call
      // setRolePermissions, which deletes the cache entry for this role so the
      // next hasPermission call re-fetches fresh data.
      const currentRows = await db
        .select({ permission: rolePermissions.permission })
        .from(rolePermissions)
        .where(eq(rolePermissions.role, input.role as any));
      await setRolePermissions(
        input.role as DaRole,
        currentRows.map((r) => r.permission as Permission),
      );

      await logActivity({
        userId: ctx.user.id,
        userName: ctx.user.name ?? "",
        action: "permission_toggled",
        entityType: "role",
        details: `Permission "${input.permission}" ${input.granted ? "granted to" : "revoked from"} role "${input.role}"`,
      });

      return { success: true as const };
    }),

  /**
   * Returns activity log entries, optionally filtered by role, action type,
   * and date range.
   * Guard: manage_users
   */
  getAuditLog: protectedProcedure
    .input(z.object({
      role: z.string().optional(),
      actionType: z.string().optional(),
      from: z.number().optional(),
      to: z.number().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as DaRole;
      if (!await hasPermission(daRole, "manage_users")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = await getDb();
      if (!db) return [];

      const conditions = [];

      if (input?.role) {
        conditions.push(like(activityLogs.details, `%"${input.role}"%`));
      }
      if (input?.actionType) {
        conditions.push(eq(activityLogs.action, input.actionType));
      }
      if (input?.from) {
        conditions.push(gte(activityLogs.createdAt, new Date(input.from)));
      }
      if (input?.to) {
        conditions.push(lte(activityLogs.createdAt, new Date(input.to)));
      }

      const query = db
        .select()
        .from(activityLogs)
        .orderBy(desc(activityLogs.createdAt))
        .limit(100);

      if (conditions.length > 0) {
        return query.where(and(...conditions));
      }
      return query;
    }),

  /**
   * Returns the caller's resolved permission set. Used by the client for
   * tab visibility and button gating — no manage_users required.
   * Guard: protectedProcedure only
   */
  myPermissions: protectedProcedure
    .query(async ({ ctx }) => {
      const daRole = ctx.user.daRole as DaRole;
      if (!daRole) return [];
      const perms = await getRolePermissions(daRole);
      return Array.from(perms);
    }),
});
