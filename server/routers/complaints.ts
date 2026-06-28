import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { createComplaint, getComplaints, updateComplaint, logActivity, createNotification, getAllUsers , hasPermission } from "../db";

import { nanoid } from "nanoid";

export const complaintsRouter = router({
  list: protectedProcedure
    .input(z.object({ type: z.string().optional(), status: z.string().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "view_complaints")) throw new TRPCError({ code: "FORBIDDEN" });
      return getComplaints(input);
    }),

  submitPublic: publicProcedure
    .input(z.object({
      type: z.enum(["citizen_complaint","officer_misconduct","prosecutor_misconduct","administrative"]),
      complainantName: z.string().optional(),
      complainantContact: z.string().optional(),
      subject: z.string().min(1),
      description: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const complaintNumber = `CMP-${new Date().getFullYear()}-${nanoid(6).toUpperCase()}`;
      const id = await createComplaint({ ...input, complaintNumber });
      // Notify DA and Chief
      const allUsers = await getAllUsers();
      for (const u of allUsers) {
        if (u.daRole === "da" || u.daRole === "chief_deputy_da" || u.daRole === "admin") {
          await createNotification({
            userId: u.id,
            title: "New Complaint Received",
            message: `New ${input.type.replace(/_/g, " ")}: ${input.subject}`,
            type: "new_complaint",
            relatedId: id,
            relatedType: "complaint",
          });
        }
      }
      return { id, complaintNumber };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["received","under_review","investigation","resolved","dismissed"]).optional(),
      assignedTo: z.number().optional(),
      resolution: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "manage_complaints")) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      await updateComplaint(id, {
        ...data,
        ...(data.status === "resolved" ? { resolvedAt: new Date() } : {}),
      });
      await logActivity({ userId: ctx.user.id, userName: ctx.user.name ?? "", action: "update_complaint", entityType: "complaint", entityId: id });
      return { success: true };
    }),
});
