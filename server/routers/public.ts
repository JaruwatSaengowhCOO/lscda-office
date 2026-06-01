import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  getPressReleases, getPublicNotices, getCareers, getDocuments,
  incrementDocumentDownload, createPublicTip, createPublicRequest,
  getCaseByCaseNumber,
} from "../db";

export const publicRouter = router({
  pressReleases: publicProcedure
    .query(async () => getPressReleases(true)),

  pressReleaseById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const all = await getPressReleases(true);
      return all.find(p => p.id === input.id) ?? null;
    }),

  notices: publicProcedure
    .query(async () => getPublicNotices(true)),

  careers: publicProcedure
    .query(async () => getCareers(true)),

  careerById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const all = await getCareers(true);
      return all.find(c => c.id === input.id) ?? null;
    }),

  documents: publicProcedure
    .query(async () => getDocuments(true)),

  downloadDocument: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const docs = await getDocuments(true);
      const doc = docs.find(d => d.id === input.id);
      if (!doc) return null;
      await incrementDocumentDownload(input.id);
      return { url: doc.fileUrl, fileName: doc.fileName };
    }),

  checkCaseStatus: publicProcedure
    .input(z.object({ caseNumber: z.string().min(1) }))
    .query(async ({ input }) => {
      const c = await getCaseByCaseNumber(input.caseNumber);
      if (!c || !c.isPublic) return null;
      return { caseNumber: c.caseNumber, title: c.title, status: c.status, court: c.court, filedDate: c.filedDate };
    }),

  submitTip: publicProcedure
    .input(z.object({
      isAnonymous: z.boolean(),
      name: z.string().optional(),
      contact: z.string().optional(),
      subject: z.string().min(1),
      description: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const id = await createPublicTip(input);
      return { id, message: "Your tip has been received. Thank you for your cooperation." };
    }),

  submitRequest: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      contact: z.string().min(1),
      requestType: z.enum(["case_status","document_request","general_inquiry","other"]),
      description: z.string().min(1),
      caseNumberRef: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = await createPublicRequest(input);
      return { id, message: "Your request has been submitted. We will respond within 5-7 business days." };
    }),
});
