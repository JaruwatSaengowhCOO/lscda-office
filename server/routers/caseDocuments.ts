import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getCaseDocuments,
  getCaseDocumentById,
  createCaseDocument,
  updateCaseDocument,
  deleteCaseDocument,
  addCaseDocumentVersion,
  getCaseDocumentVersions,
  getCaseById,
  logActivity,
  hasPermission,
} from "../db";
import { CASE_DOCUMENT_TYPES } from "../../drizzle/schema";

const DOCUMENT_TYPE_SCHEMA = z.enum(CASE_DOCUMENT_TYPES);

export const caseDocumentsRouter = router({
  listByCase: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "view_case_documents")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getCaseDocuments(input.caseId);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "view_case_documents")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const doc = await getCaseDocumentById(input.id);
      if (!doc) throw new TRPCError({ code: "NOT_FOUND" });
      const versions = await getCaseDocumentVersions(doc.id);
      return { ...doc, versions };
    }),

  create: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      title: z.string().min(1),
      documentType: DOCUMENT_TYPE_SCHEMA,
      notes: z.string().optional(),
      fileKey: z.string().optional(),
      fileUrl: z.string().optional(),
      fileName: z.string().optional(),
      fileSize: z.number().optional(),
      mimeType: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "manage_case_documents")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const caseRecord = await getCaseById(input.caseId);
      if (!caseRecord) throw new TRPCError({ code: "NOT_FOUND", message: "Case not found" });

      const id = await createCaseDocument({
        caseId: input.caseId,
        title: input.title,
        documentType: input.documentType,
        notes: input.notes,
        fileKey: input.fileKey,
        fileUrl: input.fileUrl,
        fileName: input.fileName,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        authorId: ctx.user.id,
        authorName: ctx.user.name ?? "",
        version: 1,
      });

      await logActivity({
        userId: ctx.user.id,
        userName: ctx.user.name ?? "",
        action: "document_uploaded",
        entityType: "case",
        entityId: input.caseId,
        details: `Document "${input.title}" (${input.documentType}) v1 uploaded`,
      });

      return { id };
    }),

  uploadVersion: protectedProcedure
    .input(z.object({
      id: z.number(),
      fileKey: z.string(),
      fileUrl: z.string(),
      fileName: z.string(),
      fileSize: z.number(),
      mimeType: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "manage_case_documents")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const doc = await getCaseDocumentById(input.id);
      if (!doc) throw new TRPCError({ code: "NOT_FOUND" });

      const caseRecord = await getCaseById(doc.caseId);
      if (!caseRecord) throw new TRPCError({ code: "NOT_FOUND", message: "Case not found" });

      // Archive the current version as a historical version entry
      await addCaseDocumentVersion({
        documentId: doc.id,
        version: doc.version,
        fileKey: doc.fileKey ?? undefined,
        fileUrl: doc.fileUrl ?? undefined,
        fileName: doc.fileName ?? undefined,
        fileSize: doc.fileSize ?? undefined,
        uploadedBy: doc.authorId ?? undefined,
        notes: doc.notes ?? undefined,
      });

      // Increment version and update with new file metadata
      const newVersion = doc.version + 1;
      await updateCaseDocument(doc.id, {
        version: newVersion,
        fileKey: input.fileKey,
        fileUrl: input.fileUrl,
        fileName: input.fileName,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        notes: input.notes,
      });

      await logActivity({
        userId: ctx.user.id,
        userName: ctx.user.name ?? "",
        action: "document_version_added",
        entityType: "case",
        entityId: doc.caseId,
        details: `Document "${doc.title}" (${doc.documentType}) updated to v${newVersion}`,
      });

      return { version: newVersion };
    }),

  updateMetadata: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).optional(),
      documentType: DOCUMENT_TYPE_SCHEMA.optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "view_case_documents")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const doc = await getCaseDocumentById(input.id);
      if (!doc) throw new TRPCError({ code: "NOT_FOUND" });

      const { id, ...updates } = input;
      await updateCaseDocument(id, updates);

      await logActivity({
        userId: ctx.user.id,
        userName: ctx.user.name ?? "",
        action: "document_metadata_updated",
        entityType: "case",
        entityId: doc.caseId,
        details: `Document "${doc.title}" metadata updated`,
      });

      return { success: true as const };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "manage_case_documents")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const doc = await getCaseDocumentById(input.id);
      if (!doc) throw new TRPCError({ code: "NOT_FOUND" });

      await deleteCaseDocument(input.id);

      await logActivity({
        userId: ctx.user.id,
        userName: ctx.user.name ?? "",
        action: "document_deleted",
        entityType: "case",
        entityId: doc.caseId,
        details: `Document "${doc.title}" (${doc.documentType}) deleted`,
      });

      return { success: true as const };
    }),
});
