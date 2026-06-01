import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getUserNotifications, markNotificationRead, markAllNotificationsRead, getUnreadNotificationCount } from "../db";

export const notificationsRouter = router({
  list: protectedProcedure
    .query(async ({ ctx }) => {
      return getUserNotifications(ctx.user.id, 30);
    }),

  unreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      return getUnreadNotificationCount(ctx.user.id);
    }),

  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await markNotificationRead(input.id);
      return { success: true };
    }),

  markAllRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      await markAllNotificationsRead(ctx.user.id);
      return { success: true };
    }),
});
