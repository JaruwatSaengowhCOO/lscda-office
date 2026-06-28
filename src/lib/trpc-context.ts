import type { CreateNextContextOptions } from '@trpc/server/adapters/next';
import type { User } from '../../drizzle/schema';
import type { ResponseLike } from '../../server/_core/context';
import { sdk } from '../../server/_core/sdk';
import { serializeCookie } from '../../server/_core/cookies';
import { ENV } from '../../server/_core/env';

// Ensure env is loaded
void ENV;

export type TrpcContext = {
  req: CreateNextContextOptions['req'];
  res: ResponseLike;
  user: User | null;
};

function wrapNextResponse(res: CreateNextContextOptions['res']): ResponseLike {
  return {
    cookie(name, value, options = {}) {
      const cookieStr = serializeCookie(name, value, options);
      const existing = res.getHeader('Set-Cookie');
      const existing2 = Array.isArray(existing)
        ? existing
        : existing
          ? [String(existing)]
          : [];
      res.setHeader('Set-Cookie', [...existing2, cookieStr]);
    },
    clearCookie(name) {
      const cookieStr = serializeCookie(name, '', {
        path: '/',
        httpOnly: true,
        maxAge: -1000,
      });
      const existing = res.getHeader('Set-Cookie');
      const existing2 = Array.isArray(existing)
        ? existing
        : existing
          ? [String(existing)]
          : [];
      res.setHeader('Set-Cookie', [...existing2, cookieStr]);
    },
  };
}

export async function createContext(
  opts: CreateNextContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req as any);
  } catch {
    user = null;
  }

  return {
    req: opts.req,
    res: wrapNextResponse(opts.res),
    user,
  };
}
