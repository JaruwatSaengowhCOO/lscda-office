import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { sdk } from "../_core/sdk";
import { getSessionCookieOptions } from "../_core/cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import * as db from "../db";
import { createHash, randomBytes, timingSafeEqual } from "crypto";

function hashPassword(password: string, salt: string): string {
  return createHash("sha256").update(salt + password).digest("hex");
}

function generateSalt(): string {
  return randomBytes(16).toString("hex");
}

function verifyPassword(password: string, storedHash: string): boolean {
  // Format: salt:hash
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const computed = hashPassword(password, salt);
  try {
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(computed, "hex"));
  } catch {
    return false;
  }
}

export function createPasswordHash(password: string): string {
  const salt = generateSalt();
  const hash = hashPassword(password, salt);
  return `${salt}:${hash}`;
}

export const authRouter = router({
  login: publicProcedure
    .input(z.object({
      username: z.string().min(1),
      password: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await db.getUserByUsername(input.username);

      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid username or password" });
      }

      if (!user.isActive) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Account is disabled" });
      }

      const valid = verifyPassword(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid username or password" });
      }

      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name ?? user.username ?? "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return { success: true };
    }),
});
