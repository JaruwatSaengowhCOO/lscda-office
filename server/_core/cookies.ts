import type { RequestLike } from './context';

function isSecureRequest(req: RequestLike): boolean {
  if (req.protocol === 'https') return true;

  const forwardedProto = req.headers['x-forwarded-proto'];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(',');

  return protoList.some((proto) => proto.trim().toLowerCase() === 'https');
}

export type CookieOptions = {
  domain?: string;
  httpOnly?: boolean;
  path?: string;
  sameSite?: 'lax' | 'strict' | 'none';
  secure?: boolean;
  maxAge?: number;
};

export function getSessionCookieOptions(req: RequestLike): CookieOptions {
  return {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: isSecureRequest(req),
  };
}

/** Serialize a Set-Cookie header string (for Next.js) */
export function serializeCookie(
  name: string,
  value: string,
  options: CookieOptions
): string {
  let str = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (options.path) str += `; Path=${options.path}`;
  if (options.httpOnly) str += '; HttpOnly';
  if (options.secure) str += '; Secure';
  if (options.sameSite) str += `; SameSite=${options.sameSite}`;
  if (options.domain) str += `; Domain=${options.domain}`;
  if (options.maxAge !== undefined) {
    str += `; Max-Age=${Math.floor(options.maxAge / 1000)}`;
  }

  return str;
}
