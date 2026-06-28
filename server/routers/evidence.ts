import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createEvidence, getEvidenceByCaseId, getEvidenceById, updateEvidence, addEvidenceAuditLog, getEvidenceAuditLogs, logActivity, hasPermission } from "../db";
import { storagePut } from "../storage";

import { nanoid } from "nanoid";

export const evidenceRouter = router({
  listByCase: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "view_evidence")) throw new TRPCError({ code: "FORBIDDEN" });
      return getEvidenceByCaseId(input.caseId);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "view_evidence")) throw new TRPCError({ code: "FORBIDDEN" });
      const e = await getEvidenceById(input.id);
      if (!e) throw new TRPCError({ code: "NOT_FOUND" });
      const auditLogs = await getEvidenceAuditLogs(e.id);
      await addEvidenceAuditLog({ evidenceId: e.id, userId: ctx.user.id, action: "view", details: `Viewed by ${ctx.user.name}` });
      return { ...e, auditLogs };
    }),

  upload: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      type: z.enum(["document","image","video","audio","physical","digital","other"]),
      description: z.string().optional(),
      fileName: z.string(),
      mimeType: z.string(),
      fileBase64: z.string(),
      fileSize: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "upload_evidence")) throw new TRPCError({ code: "FORBIDDEN" });
      const refNum = `EVD-${new Date().getFullYear()}-${nanoid(6).toUpperCase()}`;
      const fileBuffer = Buffer.from(input.fileBase64, "base64");
      const fileKey = `evidence/${input.caseId}/${refNum}-${input.fileName}`;
      const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);
      const custodyEntry = { timestamp: new Date().toISOString(), action: "uploaded", by: ctx.user.name, userId: ctx.user.id };
      const id = await createEvidence({
        caseId: input.caseId,
        referenceNumber: refNum,
        type: input.type,
        description: input.description,
        fileKey,
        fileUrl: url,
        fileName: input.fileName,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        chainOfCustody: [custodyEntry],
        uploadedBy: ctx.user.id,
      });
      await addEvidenceAuditLog({ evidenceId: id, userId: ctx.user.id, action: "upload", details: `Uploaded ${input.fileName}` });
      await logActivity({ userId: ctx.user.id, userName: ctx.user.name ?? "", action: "upload_evidence", entityType: "evidence", entityId: id, details: `Uploaded ${input.fileName} for case ${input.caseId}` });
      return { id, referenceNumber: refNum, url };
    }),

  getAuditLogs: protectedProcedure
    .input(z.object({ evidenceId: z.number() }))
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "view_evidence")) throw new TRPCError({ code: "FORBIDDEN" });
      return getEvidenceAuditLogs(input.evidenceId);
    }),

  create: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      type: z.enum(["document", "image", "video", "audio", "physical", "digital", "other"]),
      description: z.string().optional(),
      submittedByName: z.string().optional(),
      dateCollected: z.number().optional(),
      locationCollected: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "upload_evidence")) throw new TRPCError({ code: "FORBIDDEN" });

      const refNum = `EVD-${new Date().getFullYear()}-${nanoid(6).toUpperCase()}`;
      const custodyEntry = {
        timestamp: new Date().toISOString(),
        action: "created",
        by: ctx.user.name ?? "",
        userId: ctx.user.id,
      };

      const id = await createEvidence({
        caseId: input.caseId,
        referenceNumber: refNum,
        type: input.type,
        description: input.description,
        submittedByName: input.submittedByName,
        dateCollected: input.dateCollected ? new Date(input.dateCollected) : undefined,
        locationCollected: input.locationCollected,
        chainOfCustody: [custodyEntry],
        uploadedBy: ctx.user.id,
      });

      await addEvidenceAuditLog({
        evidenceId: id,
        userId: ctx.user.id,
        action: "create",
        details: `Created evidence ${refNum} (${input.type})`,
      });
      await logActivity({
        userId: ctx.user.id,
        userName: ctx.user.name ?? "",
        action: "evidence_added",
        entityType: "case",
        entityId: input.caseId,
        details: `Evidence added: ${refNum} — ${input.type}`,
      });

      return { id, referenceNumber: refNum };
    }),

  transferCustody: protectedProcedure
    .input(z.object({
      evidenceId: z.number(),
      receivingParty: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "upload_evidence")) throw new TRPCError({ code: "FORBIDDEN" });

      const record = await getEvidenceById(input.evidenceId);
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });

      const existing: Array<Record<string, unknown>> = Array.isArray(record.chainOfCustody)
        ? (record.chainOfCustody as Array<Record<string, unknown>>)
        : [];

      const newEntry: Record<string, unknown> = {
        transferredBy: ctx.user.name ?? "",
        receivingParty: input.receivingParty,
        timestamp: new Date().toISOString(),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      };

      await updateEvidence(input.evidenceId, {
        chainOfCustody: [...existing, newEntry],
      });

      await addEvidenceAuditLog({
        evidenceId: input.evidenceId,
        userId: ctx.user.id,
        action: "custody_transfer",
        details: `Custody transferred to ${input.receivingParty} by ${ctx.user.name ?? ""}${input.notes ? ` — ${input.notes}` : ""}`,
      });

      return { success: true as const };
    }),
});
