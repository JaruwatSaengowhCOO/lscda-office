import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { authRouter } from "./routers/auth";
import { casesRouter } from "./routers/cases";
import { defendantsRouter } from "./routers/defendants";
import { hearingsRouter } from "./routers/hearings";
import { warrantsRouter } from "./routers/warrants";
import { evidenceRouter } from "./routers/evidence";
import { victimsRouter } from "./routers/victims";
import { complaintsRouter } from "./routers/complaints";
import { usersRouter } from "./routers/users";
import { notificationsRouter } from "./routers/notifications";
import { publicRouter } from "./routers/public";
import { contentRouter } from "./routers/content";
import { reportsRouter } from "./routers/reports";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    login: authRouter.login,
  }),
  cases: casesRouter,
  defendants: defendantsRouter,
  hearings: hearingsRouter,
  warrants: warrantsRouter,
  evidence: evidenceRouter,
  victims: victimsRouter,
  complaints: complaintsRouter,
  users: usersRouter,
  notifications: notificationsRouter,
  public: publicRouter,
  content: contentRouter,
  reports: reportsRouter,
});

export type AppRouter = typeof appRouter;
