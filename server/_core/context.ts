import type { User } from '../../drizzle/schema';
import { sdk } from './sdk';

/**
 * Minimal abstraction for req/res objects.
 * Compatible with both Express (legacy) and Next.js API routes.
 */
export type RequestLike = {
  headers: Record<string, string | string[] | undefined>;
  protocol?: string;
};

export type ResponseLike = {
  /**
   * Set a cookie on the response.
   * Express: res.cookie(name, value, options)
   * Next.js: adapted via setHeader
   */
  cookie(
    name: string,
    value: string,
    options?: {
      httpOnly?: boolean;
      path?: string;
      sameSite?: 'lax' | 'strict' | 'none';
      secure?: boolean;
      maxAge?: number;
      domain?: string;
    }
  ): void;
  clearCookie(name: string, options?: Record<string, unknown>): void;
};

export type TrpcContext = {
  req: RequestLike;
  res: ResponseLike;
  user: User | null;
};

// Keep Express adapter for legacy usage
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res as unknown as ResponseLike,
    user,
  };
}
