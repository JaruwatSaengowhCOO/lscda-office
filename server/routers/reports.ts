import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb, getDashboardStats , hasPermission } from "../db";

import { cases, courtHearings, defendants, victims, complaints } from "../../drizzle/schema";
import { and, eq, gte, lte, sql, desc } from "drizzle-orm";

export const reportsRouter = router({
  dashboard: protectedProcedure
    .query(async ({ ctx }) => {
      return getDashboardStats();
    }),

  monthly: protectedProcedure
    .input(z.object({ year: z.number(), month: z.number() }))
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "view_reports")) throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) return null;

      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);

      const [newCases] = await db.select({ count: sql<number>`count(*)` }).from(cases)
        .where(and(gte(cases.createdAt, startDate), lte(cases.createdAt, endDate)));

      const [closedCases] = await db.select({ count: sql<number>`count(*)` }).from(cases)
        .where(and(eq(cases.status, "closed"), gte(cases.updatedAt, startDate), lte(cases.updatedAt, endDate)));

      const [dismissedCases] = await db.select({ count: sql<number>`count(*)` }).from(cases)
        .where(and(eq(cases.status, "dismissed"), gte(cases.updatedAt, startDate), lte(cases.updatedAt, endDate)));

      const [hearingsCount] = await db.select({ count: sql<number>`count(*)` }).from(courtHearings)
        .where(and(gte(courtHearings.scheduledAt, startDate), lte(courtHearings.scheduledAt, endDate)));

      const statusBreakdown = await db.select({ status: cases.status, count: sql<number>`count(*)` })
        .from(cases).groupBy(cases.status);

      return {
        period: `${input.year}-${String(input.month).padStart(2, "0")}`,
        newCases: newCases?.count ?? 0,
        closedCases: closedCases?.count ?? 0,
        dismissedCases: dismissedCases?.count ?? 0,
        hearings: hearingsCount?.count ?? 0,
        statusBreakdown,
      };
    }),

  convictionStats: protectedProcedure
    .query(async ({ ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "view_reports")) throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) return null;

      const statusBreakdown = await db.select({ status: cases.status, count: sql<number>`count(*)` })
        .from(cases).groupBy(cases.status);

      const total = statusBreakdown.reduce((sum, s) => sum + (s.count ?? 0), 0);
      const closed = statusBreakdown.find(s => s.status === "closed")?.count ?? 0;
      const dismissed = statusBreakdown.find(s => s.status === "dismissed")?.count ?? 0;
      const resolved = closed + dismissed;

      return {
        total,
        closed,
        dismissed,
        convictionRate: resolved > 0 ? Math.round((closed / resolved) * 100) : 0,
        statusBreakdown,
      };
    }),

  caseClosureReport: protectedProcedure
    .input(z.object({ year: z.number() }))
    .query(async ({ input, ctx }) => {
      const daRole = ctx.user.daRole as any;
      if (!await hasPermission(daRole, "view_reports")) throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) return null;

      const startDate = new Date(input.year, 0, 1);
      const endDate = new Date(input.year, 11, 31, 23, 59, 59);

      const closedCases = await db.select().from(cases)
        .where(and(
          eq(cases.status, "closed"),
          gte(cases.updatedAt, startDate),
          lte(cases.updatedAt, endDate)
        ))
        .orderBy(desc(cases.updatedAt));

      return { year: input.year, cases: closedCases };
    }),
});
