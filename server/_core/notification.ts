import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { notifications, users } from "../../drizzle/schema";

export type NotificationPayload = {
  title: string;
  content: string;
};

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;

const trimValue = (value: string): string => value.trim();
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const validatePayload = (input: NotificationPayload): NotificationPayload => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Notification title is required." });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Notification content is required." });
  }

  const title = trimValue(input.title);
  const content = trimValue(input.content);

  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`,
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`,
    });
  }

  return { title, content };
};

/**
 * Persists a system notification for every admin user in the database.
 * Returns true if at least one record was inserted, false if DB is unavailable or no admins exist.
 */
export async function notifyOwner(payload: NotificationPayload): Promise<boolean> {
  const { title, content } = validatePayload(payload);

  const db = await getDb();
  if (!db) {
    console.warn("[Notification] Database unavailable — notification not persisted.");
    return false;
  }

  const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));

  if (admins.length === 0) {
    console.warn("[Notification] No admin users found — notification not delivered.");
    return false;
  }

  await db.insert(notifications).values(
    admins.map((admin) => ({
      userId: admin.id,
      title,
      message: content,
      type: "system" as const,
      isRead: false,
    }))
  );

  return true;
}
