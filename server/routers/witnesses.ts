import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createWitness,
  getWitnessesByCaseId,
  getWitnessById,
  updateWitness,
  deleteWitness,
  getCaseById,
  logActivity,
  hasPermission,
} from "../db";

/** Redact protected contact fields when the caller lacks manage_witnesses */
function redactWitness<T extends {
  isProtected: boolean;
  phone: string | null;
  email: string | null;
  address: string | null;
}>(witness: T, canManage: boolean): T {
  if (witness.isProtected && !canManage) {
    return { ...witness, phone: null, email: null, address: null };
  }
  return witness;
}

export const witnessesRouter = router({
  listByCase: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "view_witnesses")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const canManage = await hasPermission(daRole, "manage_witnesses");
      const rows = await getWitnessesByCaseId(input.caseId);
      return rows.map(w => redactWitness(w, canManage));
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "view_witnesses")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const witness = await getWitnessById(input.id);
      if (!witness) throw new TRPCError({ code: "NOT_FOUND" });
      const canManage = await hasPermission(daRole, "manage_witnesses");
      return redactWitness(witness, canManage);
    }),

  create: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      name: z.string().min(1),
      witnessType: z.enum(["eyewitness", "expert", "character", "law_enforcement", "other"]),
      phone: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
      statement: z.string().optional(),
      isProtected: z.boolean().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "manage_witnesses")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const parentCase = await getCaseById(input.caseId);
      if (!parentCase) throw new TRPCError({ code: "NOT_FOUND" });

      const id = await createWitness({ ...input, createdBy: ctx.user.id });
      await logActivity({
        userId: ctx.user.id,
        userName: ctx.user.name ?? "",
        action: "witness_added",
        entityType: "case",
        entityId: input.caseId,
        details: `Witness added: ${input.name} (${input.witnessType})`,
      });
      return { id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      witnessType: z.enum(["eyewitness", "expert", "character", "law_enforcement", "other"]).optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
      statement: z.string().optional(),
      isProtected: z.boolean().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "manage_witnesses")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const witness = await getWitnessById(input.id);
      if (!witness) throw new TRPCError({ code: "NOT_FOUND" });

      const { id, ...data } = input;
      await updateWitness(id, data);
      await logActivity({
        userId: ctx.user.id,
        userName: ctx.user.name ?? "",
        action: "witness_updated",
        entityType: "case",
        entityId: witness.caseId,
        details: `Witness updated: ${witness.name}`,
      });
      return { success: true as const };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "manage_witnesses")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const witness = await getWitnessById(input.id);
      if (!witness) throw new TRPCError({ code: "NOT_FOUND" });

      await deleteWitness(input.id);
      await logActivity({
        userId: ctx.user.id,
        userName: ctx.user.name ?? "",
        action: "witness_deleted",
        entityType: "case",
        entityId: witness.caseId,
        details: `Witness deleted: ${witness.name}`,
      });
      return { success: true as const };
    }),
});
