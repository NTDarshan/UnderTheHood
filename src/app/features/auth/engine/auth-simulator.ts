export type Role = 'viewer' | 'editor' | 'admin';
export type Permission = 'read' | 'create' | 'update' | 'delete';
export type AuthMethod = 'session' | 'jwt' | 'api-key';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  viewer: ['read'],
  editor: ['read', 'create', 'update'],
  admin: ['read', 'create', 'update', 'delete'],
};

export interface SimUser {
  name: string;
  role: Role;
  department: string;
}

export interface SimResource {
  owner: string;
  department: string;
}

export interface AccessCheck {
  authenticated: boolean;
  authorized: boolean;
  status: 401 | 403 | 200 | 204;
  statusLabel: string;
  reason: string;
}

/**
 * The core distinction the whole chapter teaches: authentication (is there a
 * valid identity at all?) is evaluated first and independently of
 * authorization (does that identity's role/permission allow this action?).
 */
export function checkAccess(
  user: SimUser | null,
  action: Permission,
  resource?: SimResource,
): AccessCheck {
  if (!user) {
    return {
      authenticated: false,
      authorized: false,
      status: 401,
      statusLabel: '401 Unauthorized',
      reason: 'There is no valid authenticated identity attached to this request.',
    };
  }

  const permissions = ROLE_PERMISSIONS[user.role];
  const hasPermission = permissions.includes(action);

  if (!hasPermission) {
    return {
      authenticated: true,
      authorized: false,
      status: 403,
      statusLabel: '403 Forbidden',
      reason: `${user.name} is authenticated as a "${user.role}", but that role does not include "${action}".`,
    };
  }

  if (resource && resource.owner !== user.name && user.role !== 'admin') {
    return {
      authenticated: true,
      authorized: false,
      status: 403,
      statusLabel: '403 Forbidden',
      reason: `${user.name} has "${action}" permission in general, but this specific resource belongs to "${resource.owner}", not them.`,
    };
  }

  return {
    authenticated: true,
    authorized: true,
    status: action === 'delete' ? 204 : 200,
    statusLabel: action === 'delete' ? '204 No Content' : '200 OK',
    reason: `${user.name} is authenticated and their "${user.role}" role permits "${action}"${resource ? ' on this resource' : ''}.`,
  };
}

/** Illustrative-only "hash" — deterministic but NOT a real cryptographic digest. Used purely so the UI can show salt changing the stored value. */
export function illustrativeHash(input: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const combined = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  return combined.padStart(14, '0');
}

export function randomSalt(): string {
  const chars = 'abcdef0123456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length) % chars.length];
  return out;
}

function base64UrlEncode(obj: unknown): string {
  const json = JSON.stringify(obj);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(str.length + ((4 - (str.length % 4)) % 4), '=');
  return decodeURIComponent(escape(atob(b64)));
}

export interface JwtParts {
  headerB64: string;
  payloadB64: string;
  signatureB64: string;
  token: string;
}

/** Builds an illustrative JWT — real structure (header.payload.signature), but the "signature" is a simple keyed hash, not a real HMAC/RSA implementation. */
export function buildJwt(payload: Record<string, unknown>, secret: string): JwtParts {
  const header = { alg: 'HS256-demo', typ: 'JWT' };
  const headerB64 = base64UrlEncode(header);
  const payloadB64 = base64UrlEncode(payload);
  const signatureB64 = illustrativeHash(`${headerB64}.${payloadB64}.${secret}`);
  return { headerB64, payloadB64, signatureB64, token: `${headerB64}.${payloadB64}.${signatureB64}` };
}

export interface JwtVerifyResult {
  headerJson: string;
  payloadJson: string;
  signatureValid: boolean;
}

export function verifyJwt(token: string, secret: string): JwtVerifyResult {
  const [headerB64, payloadB64, signatureB64] = token.split('.');
  const expectedSignature = illustrativeHash(`${headerB64}.${payloadB64}.${secret}`);
  return {
    headerJson: safePrettyDecode(headerB64),
    payloadJson: safePrettyDecode(payloadB64),
    signatureValid: signatureB64 === expectedSignature,
  };
}

function safePrettyDecode(b64: string | undefined): string {
  if (!b64) return '{}';
  try {
    return JSON.stringify(JSON.parse(base64UrlDecode(b64)), null, 2);
  } catch {
    return '{ "error": "could not decode segment" }';
  }
}

export interface RequestTimingSample {
  label: string;
  ms: number;
}
