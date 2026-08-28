export type TriState = 'yes' | 'no' | 'conditional';

export interface HttpMethodInfo {
  method: string;
  purpose: string;
  safe: TriState;
  idempotent: TriState;
  idempotentNote: string;
  cacheable: TriState;
  cacheableNote: string;
  hasRequestBody: boolean;
}

export const httpMethods: HttpMethodInfo[] = [
  {
    method: 'GET',
    purpose: 'Retrieve a representation of a resource.',
    safe: 'yes',
    idempotent: 'yes',
    idempotentNote: 'Repeating it has the same intended effect as doing it once.',
    cacheable: 'yes',
    cacheableNote: 'Generally cacheable / commonly cached by default.',
    hasRequestBody: false,
  },
  {
    method: 'HEAD',
    purpose: 'Same as GET, but only the headers — no response body.',
    safe: 'yes',
    idempotent: 'yes',
    idempotentNote: 'Read-only, so repeating it changes nothing.',
    cacheable: 'yes',
    cacheableNote: 'Cacheable in the same sense as the GET it mirrors.',
    hasRequestBody: false,
  },
  {
    method: 'OPTIONS',
    purpose: 'Ask what a resource or server supports (methods, headers).',
    safe: 'yes',
    idempotent: 'yes',
    idempotentNote: 'A discovery call — it does not change server state.',
    cacheable: 'no',
    cacheableNote: 'Not typically stored as a reusable representation.',
    hasRequestBody: false,
  },
  {
    method: 'POST',
    purpose: 'Submit data to be processed — often creates a new resource.',
    safe: 'no',
    idempotent: 'no',
    idempotentNote: 'Not idempotent by HTTP method semantics — two identical POSTs can create two resources.',
    cacheable: 'conditional',
    cacheableNote: 'Possible under specific HTTP caching rules, but commonly not cached.',
    hasRequestBody: true,
  },
  {
    method: 'PUT',
    purpose: 'Replace a resource entirely with the supplied representation.',
    safe: 'no',
    idempotent: 'yes',
    idempotentNote: 'Sending the same PUT twice leaves the resource in the same end state.',
    cacheable: 'no',
    cacheableNote: 'Responses to PUT are not typically cached.',
    hasRequestBody: true,
  },
  {
    method: 'PATCH',
    purpose: 'Apply a partial modification to a resource.',
    safe: 'no',
    idempotent: 'conditional',
    idempotentNote: 'Not guaranteed by the method definition — depends on what the patch describes (e.g. "set" is idempotent, "increment" is not).',
    cacheable: 'no',
    cacheableNote: 'Responses to PATCH are not typically cached.',
    hasRequestBody: true,
  },
  {
    method: 'DELETE',
    purpose: 'Remove the specified resource.',
    safe: 'no',
    idempotent: 'yes',
    idempotentNote: 'Deleting an already-deleted resource still leaves it deleted — same end state.',
    cacheable: 'no',
    cacheableNote: 'Responses to DELETE are not typically cached.',
    hasRequestBody: false,
  },
  {
    method: 'CONNECT',
    purpose: 'Ask a proxy to open a tunnel (typically for HTTPS through a proxy).',
    safe: 'no',
    idempotent: 'no',
    idempotentNote: 'Establishes a tunnel/connection — not meaningfully repeatable in the same sense as data methods.',
    cacheable: 'no',
    cacheableNote: 'Not applicable — it establishes a tunnel rather than returning a representation.',
    hasRequestBody: false,
  },
  {
    method: 'TRACE',
    purpose: 'Echo the received request back, mainly for diagnostics.',
    safe: 'yes',
    idempotent: 'yes',
    idempotentNote: 'Purely diagnostic — repeating it has no side effect on server state.',
    cacheable: 'no',
    cacheableNote: 'Not cacheable — and often disabled in production for security reasons (e.g. cross-site tracing).',
    hasRequestBody: false,
  },
];
