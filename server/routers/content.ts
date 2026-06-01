import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createDocument, getDocuments, createPressRelease, getPressReleases, updatePressRelease,
  createPublicNotice, getPublicNotices, createCareer, getCareers,
  createLegalResearch, getLegalResearch, updateLegalResearch,
  getPublicTips, updatePublicTip, getPublicRequests, updatePublicRequest,
  getActivityLogs, logActivity,
} from "../db";
import { storagePut } from "../storage";
import { hasPermission } from "../../shared/permissions";
import { nanoid } from "nanoid";

export const contentRouter = router({
  // ── Documents ──────────────────────────────────────────────────────────────
  documents: protectedProcedure
    .query(async () => getDocuments()),

  uploadDocument: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      category: z.enum(["form","policy","template","report","other"]).optional(),
      description: z.string().optional(),
      isPublic: z.boolean().optional(),
      fileName: z.string(),
      mimeType: z.string(),
      fileBase64: z.string(),
      fileSize: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "manage_documents")) throw new TRPCError({ code: "FORBIDDEN" });
      const fileBuffer = Buffer.from(input.fileBase64, "base64");
      const fileKey = `documents/${nanoid(8)}-${input.fileName}`;
      const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);
      const id = await createDocument({
        title: input.title,
        category: input.category,
        description: input.description,
        isPublic: input.isPublic ?? false,
        fileKey,
        fileUrl: url,
        fileName: input.fileName,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        uploadedBy: ctx.user.id,
      });
      return { id };
    }),

  // ── Press Releases ─────────────────────────────────────────────────────────
  pressReleases: protectedProcedure
    .query(async () => getPressReleases()),

  createPressRelease: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      summary: z.string().optional(),
      tags: z.string().optional(),
      isPublished: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "manage_press_releases")) throw new TRPCError({ code: "FORBIDDEN" });
      const id = await createPressRelease({
        ...input,
        authorId: ctx.user.id,
        publishedAt: input.isPublished ? new Date() : undefined,
      });
      return { id };
    }),

  updatePressRelease: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      content: z.string().optional(),
      summary: z.string().optional(),
      tags: z.string().optional(),
      isPublished: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "manage_press_releases")) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      await updatePressRelease(id, {
        ...data,
        ...(data.isPublished ? { publishedAt: new Date() } : {}),
      });
      return { success: true };
    }),

  // ── Public Notices ─────────────────────────────────────────────────────────
  notices: protectedProcedure
    .query(async () => getPublicNotices()),

  createNotice: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      noticeType: z.string().optional(),
      isPublished: z.boolean().optional(),
      expiresAt: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "manage_press_releases")) throw new TRPCError({ code: "FORBIDDEN" });
      const id = await createPublicNotice({
        ...input,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        publishedAt: input.isPublished ? new Date() : undefined,
        createdBy: ctx.user.id,
      });
      return { id };
    }),

  // ── Careers ────────────────────────────────────────────────────────────────
  careers: protectedProcedure
    .query(async () => getCareers()),

  createCareer: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      department: z.string().optional(),
      location: z.string().optional(),
      type: z.enum(["full_time","part_time","contract","intern"]).optional(),
      description: z.string().min(1),
      requirements: z.string().optional(),
      salary: z.string().optional(),
      isActive: z.boolean().optional(),
      closingDate: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "manage_users")) throw new TRPCError({ code: "FORBIDDEN" });
      const id = await createCareer({
        ...input,
        closingDate: input.closingDate ? new Date(input.closingDate) : undefined,
        createdBy: ctx.user.id,
      });
      return { id };
    }),

  // ── Legal Research ─────────────────────────────────────────────────────────
  legalResearch: protectedProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .query(async ({ input }) => getLegalResearch(input?.category)),

  createLegalResearch: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      category: z.enum(["penal_code","case_law","policy","memorandum","training"]),
      content: z.string().min(1),
      tags: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "manage_legal_research")) throw new TRPCError({ code: "FORBIDDEN" });
      const id = await createLegalResearch({ ...input, createdBy: ctx.user.id });
      return { id };
    }),

  updateLegalResearch: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      content: z.string().optional(),
      tags: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "manage_legal_research")) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      await updateLegalResearch(id, data);
      return { success: true };
    }),

  // ── Tips & Requests Admin ──────────────────────────────────────────────────
  tips: protectedProcedure
    .query(async ({ ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "view_tips")) throw new TRPCError({ code: "FORBIDDEN" });
      return getPublicTips();
    }),

  updateTip: protectedProcedure
    .input(z.object({ id: z.number(), status: z.enum(["received","under_review","actioned","closed"]) }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "manage_tips")) throw new TRPCError({ code: "FORBIDDEN" });
      await updatePublicTip(input.id, { status: input.status });
      return { success: true };
    }),

  requests: protectedProcedure
    .query(async ({ ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "view_requests")) throw new TRPCError({ code: "FORBIDDEN" });
      return getPublicRequests();
    }),

  updateRequest: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["received","processing","completed","rejected"]).optional(),
      response: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "manage_requests")) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      await updatePublicRequest(id, { ...data, respondedBy: ctx.user.id, respondedAt: new Date() });
      return { success: true };
    }),

  // ── Activity Logs ──────────────────────────────────────────────────────────
  activityLogs: protectedProcedure
    .query(async ({ ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!hasPermission(daRole, "view_activity_logs")) throw new TRPCError({ code: "FORBIDDEN" });
      return getActivityLogs(100);
    }),
});
