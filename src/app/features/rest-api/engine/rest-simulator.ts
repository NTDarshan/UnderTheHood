/**
 * Pure, UI-independent REST API design simulation logic — shared by every
 * component in the REST API Design Studio. Mirrors the pattern already used
 * by validation-simulator.ts / auth-simulator.ts / backend-simulator.ts:
 * no Angular here, just types and functions the components call into.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface MethodInfo {
  method: HttpMethod;
  purpose: string;
  typicalUse: string;
  hasRequestBody: boolean;
  safe: boolean;
  idempotent: 'yes' | 'no' | 'depends';
  typicalStatus: number;
  cacheable: boolean;
}

export const METHOD_INFO: Record<HttpMethod, MethodInfo> = {
  GET: {
    method: 'GET',
    purpose: 'Retrieve a representation of a resource.',
    typicalUse: 'GET /books/42',
    hasRequestBody: false,
    safe: true,
    idempotent: 'yes',
    typicalStatus: 200,
    cacheable: true,
  },
  POST: {
    method: 'POST',
    purpose: 'Create a resource in a collection, or trigger processing/an action.',
    typicalUse: 'POST /books',
    hasRequestBody: true,
    safe: false,
    idempotent: 'no',
    typicalStatus: 201,
    cacheable: false,
  },
  PUT: {
    method: 'PUT',
    purpose: 'Replace the target resource with the supplied representation.',
    typicalUse: 'PUT /books/42',
    hasRequestBody: true,
    safe: false,
    idempotent: 'yes',
    typicalStatus: 200,
    cacheable: false,
  },
  PATCH: {
    method: 'PATCH',
    purpose: 'Apply a partial modification to a resource.',
    typicalUse: 'PATCH /books/42',
    hasRequestBody: true,
    safe: false,
    idempotent: 'depends',
    typicalStatus: 200,
    cacheable: false,
  },
  DELETE: {
    method: 'DELETE',
    purpose: 'Remove the target resource.',
    typicalUse: 'DELETE /books/42',
    hasRequestBody: false,
    safe: false,
    idempotent: 'yes',
    typicalStatus: 204,
    cacheable: false,
  },
  HEAD: {
    method: 'HEAD',
    purpose: 'Like GET, but returns headers only — no body.',
    typicalUse: 'HEAD /books/42',
    hasRequestBody: false,
    safe: true,
    idempotent: 'yes',
    typicalStatus: 200,
    cacheable: true,
  },
  OPTIONS: {
    method: 'OPTIONS',
    purpose: 'Describe communication options for the target resource (e.g. CORS preflight).',
    typicalUse: 'OPTIONS /books',
    hasRequestBody: false,
    safe: true,
    idempotent: 'yes',
    typicalStatus: 204,
    cacheable: false,
  },
};

export interface StatusCodeInfo {
  code: number;
  label: string;
  category: 'success' | 'client-error' | 'server-error';
  meaning: string;
  whenToUse: string;
  example: string;
}

export const STATUS_CODES: StatusCodeInfo[] = [
  { code: 200, label: 'OK', category: 'success', meaning: 'The request succeeded and the response carries a representation or result.', whenToUse: 'Successful GET, PUT, PATCH, or an action that completed synchronously.', example: 'GET /books/42 → 200 OK' },
  { code: 201, label: 'Created', category: 'success', meaning: 'The request succeeded and a new resource was created.', whenToUse: 'Successful POST that created a resource in a collection.', example: 'POST /books → 201 Created' },
  { code: 202, label: 'Accepted', category: 'success', meaning: 'The request has been accepted for processing, but processing is not complete.', whenToUse: 'Long-running/async operations — the response is not the final result.', example: 'POST /reports → 202 Accepted { "jobId": "123" }' },
  { code: 204, label: 'No Content', category: 'success', meaning: 'The request succeeded and there is no response body.', whenToUse: 'Successful DELETE, or an update with nothing meaningful to return.', example: 'DELETE /books/42 → 204 No Content' },
  { code: 400, label: 'Bad Request', category: 'client-error', meaning: 'The request is malformed or fails validation.', whenToUse: 'Missing required field, wrong type, unparseable body.', example: 'POST /books { } → 400 Bad Request' },
  { code: 401, label: 'Unauthorized', category: 'client-error', meaning: 'The client’s identity could not be established.', whenToUse: 'Missing or invalid credentials/token.', example: 'GET /orders (no token) → 401 Unauthorized' },
  { code: 403, label: 'Forbidden', category: 'client-error', meaning: 'The client is known, but not permitted to perform this action.', whenToUse: 'Authenticated user lacks the required role/permission.', example: 'DELETE /users/9 (as customer) → 403 Forbidden' },
  { code: 404, label: 'Not Found', category: 'client-error', meaning: 'The specific requested resource does not exist.', whenToUse: 'An individual resource lookup with no match — never an empty collection.', example: 'GET /books/999999 → 404 Not Found' },
  { code: 409, label: 'Conflict', category: 'client-error', meaning: 'The request conflicts with the current state of the resource.', whenToUse: 'Duplicate unique field, concurrent edit conflict, state that disallows the operation.', example: 'POST /users { email: taken } → 409 Conflict' },
  { code: 422, label: 'Unprocessable Content', category: 'client-error', meaning: 'The request is well-formed, but semantically invalid.', whenToUse: 'Passes JSON parsing but fails domain-level validation, depending on API convention.', example: 'POST /orders { "quantity": -1 } → 422 Unprocessable Content' },
  { code: 429, label: 'Too Many Requests', category: 'client-error', meaning: 'The client has sent too many requests in a given time.', whenToUse: 'Rate limiting.', example: '101 requests in 60s (limit 100) → 429 Too Many Requests' },
  { code: 500, label: 'Internal Server Error', category: 'server-error', meaning: 'An unexpected failure occurred on the server.', whenToUse: 'Unhandled exceptions, infrastructure failures — never for predictable validation errors.', example: 'Database connection lost → 500 Internal Server Error' },
];

/** Idempotency lab — simulates repeated requests against server state. */
export type IdempotencyMethod = 'GET' | 'POST' | 'PUT' | 'PATCH_SET' | 'PATCH_INCREMENT' | 'DELETE';

export interface IdempotencyStep {
  action: string;
  stateBefore: string;
  stateAfter: string;
}

export interface IdempotencyResult {
  steps: IdempotencyStep[];
  isIdempotent: boolean;
  verdict: string;
}

export function runIdempotencyTest(method: IdempotencyMethod, repeats: number): IdempotencyResult {
  const steps: IdempotencyStep[] = [];

  switch (method) {
    case 'GET': {
      for (let i = 0; i < repeats; i++) steps.push({ action: `GET /books/42`, stateBefore: 'title = "Clean Architecture"', stateAfter: 'title = "Clean Architecture"' });
      return { steps, isIdempotent: true, verdict: 'Idempotent — reading never changes server state, no matter how many times it runs.' };
    }
    case 'POST': {
      let count = 10;
      for (let i = 0; i < repeats; i++) {
        const before = count;
        count += 1;
        steps.push({ action: 'POST /orders', stateBefore: `orders = ${before}`, stateAfter: `orders = ${count} (new order #${100 + i + 1} created)` });
      }
      return { steps, isIdempotent: false, verdict: 'Generally non-idempotent — each repeated call creates another new resource.' };
    }
    case 'PUT': {
      let title = 'Old Title';
      for (let i = 0; i < repeats; i++) {
        const before = title;
        title = 'New Title';
        steps.push({ action: 'PUT /books/42 { title: "New Title" }', stateBefore: `title = "${before}"`, stateAfter: `title = "${title}"` });
      }
      return { steps, isIdempotent: true, verdict: 'Idempotent — repeating the same replacement leaves the resource in the same final state.' };
    }
    case 'PATCH_SET': {
      let price = 500;
      for (let i = 0; i < repeats; i++) {
        const before = price;
        price = 550;
        steps.push({ action: 'PATCH /books/42 { price: 550 }', stateBefore: `price = ${before}`, stateAfter: `price = ${price}` });
      }
      return { steps, isIdempotent: true, verdict: 'This particular PATCH is idempotent — it sets an absolute value, so repeating it changes nothing further.' };
    }
    case 'PATCH_INCREMENT': {
      let price = 500;
      for (let i = 0; i < repeats; i++) {
        const before = price;
        price += 50;
        steps.push({ action: 'PATCH /books/42 { increment: 50 }', stateBefore: `price = ${before}`, stateAfter: `price = ${price}` });
      }
      return { steps, isIdempotent: false, verdict: 'This particular PATCH is non-idempotent — it applies a relative change, so each repetition changes the result further. PATCH itself is not inherently idempotent; it depends on the operation.' };
    }
    case 'DELETE': {
      let exists = true;
      for (let i = 0; i < repeats; i++) {
        const before = exists ? 'resource exists' : 'resource does not exist';
        const status = exists ? 204 : 404;
        exists = false;
        steps.push({ action: 'DELETE /books/42', stateBefore: before, stateAfter: `resource does not exist (${status} returned)` });
      }
      return { steps, isIdempotent: true, verdict: 'Idempotent — the intended end state ("this resource is gone") is reached after the first call and stays true, even though the second call returns 404 instead of 204.' };
    }
  }
}

/** Pagination */
export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  firstIndex: number;
  lastIndex: number;
  offset: number;
}

export function calculatePagination(total: number, page: number, limit: number): PaginationResult {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const offset = (safePage - 1) * safeLimit;
  const firstIndex = total === 0 ? 0 : offset + 1;
  const lastIndex = Math.min(offset + safeLimit, total);

  return { page: safePage, limit: safeLimit, total, totalPages, firstIndex, lastIndex, offset };
}

/** Sorting — allowlist enforcement */
export const SORT_ALLOWLIST = ['title', 'createdAt', 'price'];

export function isSortFieldAllowed(field: string): boolean {
  return SORT_ALLOWLIST.includes(field);
}

/** URL linting */
export interface UrlWarning {
  id: string;
  message: string;
}

export function lintUrl(url: string): UrlWarning[] {
  const warnings: UrlWarning[] = [];
  const path = url.split('?')[0];

  if (/[A-Z]/.test(path)) {
    warnings.push({ id: 'uppercase', message: 'Contains uppercase characters — URL paths are conventionally lowercase.' });
  }
  if (/_/.test(path)) {
    warnings.push({ id: 'underscore', message: 'Contains underscores — hyphens are the conventional word separator in URL paths.' });
  }
  if (/\/(get|create|update|delete|find|remove)[A-Z]/i.test(path)) {
    warnings.push({ id: 'verb', message: 'Contains a verb in the path — the HTTP method already expresses the operation; the URL should identify the resource.' });
  }
  const segments = path.split('/').filter(Boolean);
  for (const seg of segments) {
    if (/^[a-z]+$/.test(seg) && !seg.endsWith('s') && !/^\d+$/.test(seg) && seg.length > 2 && !['api', 'v1', 'v2'].includes(seg)) {
      warnings.push({ id: `singular-${seg}`, message: `"${seg}" looks like a singular collection name — plural (e.g. "${seg}s") is the more common convention.` });
      break;
    }
  }
  return warnings;
}

export function suggestUrlFix(url: string): string {
  return url
    .toLowerCase()
    .replace(/_/g, '-');
}

/** Full endpoint design linter — used by the API Design Studio + API Linter */
export interface EndpointDesign {
  method: HttpMethod;
  path: string;
  hasPagination?: boolean;
  hasSorting?: boolean;
  sortFieldAllowed?: boolean;
  statusCode?: number;
}

export interface LintFinding {
  id: string;
  level: 'pass' | 'warn' | 'fail';
  message: string;
}

export function lintEndpoint(design: EndpointDesign): LintFinding[] {
  const findings: LintFinding[] = [];
  const urlWarnings = lintUrl(design.path);

  if (urlWarnings.length === 0) {
    findings.push({ id: 'url-naming', level: 'pass', message: 'Resource-oriented, lowercase, hyphen-separated URL.' });
  } else {
    for (const w of urlWarnings) findings.push({ id: `url-${w.id}`, level: w.id === 'verb' ? 'fail' : 'warn', message: w.message });
  }

  if (/\/(get|create|update|delete|find)/i.test(design.path.split('?')[0])) {
    findings.push({ id: 'method-semantics', level: 'fail', message: `Verb embedded in the URL duplicates what ${design.method} already communicates.` });
  } else {
    findings.push({ id: 'method-semantics', level: 'pass', message: `${design.method} used with a resource-oriented path — the method already communicates the operation.` });
  }

  const isCollection = !/\/\d+(\/|$)/.test(design.path) && !design.path.split('?')[0].split('/').some((s) => s && !/^[a-z0-9-]+$/i.test(s) === false && false);
  const looksLikeCollectionGet = design.method === 'GET' && !/\/\d+/.test(design.path);
  if (looksLikeCollectionGet) {
    if (design.hasPagination) {
      findings.push({ id: 'pagination', level: 'pass', message: 'Collection endpoint includes pagination — protects against unbounded result sets.' });
    } else {
      findings.push({ id: 'pagination', level: 'warn', message: 'Collection endpoint has no pagination — large datasets could return unbounded results.' });
    }
    if (design.hasSorting) {
      findings.push({
        id: 'sorting',
        level: design.sortFieldAllowed === false ? 'fail' : 'pass',
        message: design.sortFieldAllowed === false
          ? 'Sort field is not on the server allowlist — never pass client-supplied field names directly into a query.'
          : 'Sort field is validated against an explicit allowlist.',
      });
    }
  }

  if (design.statusCode !== undefined) {
    const expected = METHOD_INFO[design.method].typicalStatus;
    if (design.statusCode === expected) {
      findings.push({ id: 'status', level: 'pass', message: `${design.statusCode} matches the typical response for ${design.method}.` });
    } else {
      findings.push({ id: 'status', level: 'warn', message: `${design.statusCode} is unusual for ${design.method} — ${expected} is the more typical response, depending on the exact scenario.` });
    }
  }

  return findings;
}

/** API design heuristic score — explicitly NOT an objective industry-standard metric. */
export interface ScoreCategory {
  id: string;
  label: string;
  points: number;
  max: number;
  note: string;
}

export function scoreEndpoint(findings: LintFinding[]): { total: number; max: number; categories: ScoreCategory[] } {
  const max = findings.length * 10;
  let total = 0;
  const categories: ScoreCategory[] = findings.map((f) => {
    const points = f.level === 'pass' ? 10 : f.level === 'warn' ? 5 : 0;
    total += points;
    return { id: f.id, label: f.id, points, max: 10, note: f.message };
  });
  return { total, max: max || 1, categories };
}

/** API contract evolution classifier */
export type ChangeSafety = 'safe' | 'warning' | 'breaking';

export interface ContractChange {
  id: string;
  label: string;
  safety: ChangeSafety;
  explanation: string;
}

export const CONTRACT_CHANGES: ContractChange[] = [
  { id: 'add-optional', label: 'Add an optional field', safety: 'safe', explanation: 'Existing clients that don’t know about the field simply ignore it.' },
  { id: 'add-required', label: 'Add a required field to the request', safety: 'breaking', explanation: 'Existing clients that don’t send this field will now fail.' },
  { id: 'remove-field', label: 'Remove a field from the response', safety: 'breaking', explanation: 'Clients reading that field will now get undefined/missing data.' },
  { id: 'rename-field', label: 'Rename a field', safety: 'breaking', explanation: 'Functionally equivalent to removing one field and adding another — old clients lose the data under the old name.' },
  { id: 'change-type', label: 'Change a field’s type (string → number)', safety: 'breaking', explanation: 'Clients parsing/deserializing the old type will fail or misbehave.' },
  { id: 'widen-enum', label: 'Add a new allowed enum value', safety: 'warning', explanation: 'Safe for clients that handle unknown values gracefully — breaking for clients with an exhaustive switch that doesn’t.' },
  { id: 'add-endpoint', label: 'Add a brand-new endpoint', safety: 'safe', explanation: 'No existing client depends on it, so nothing existing can break.' },
];

/** Sample dataset used by pagination/sorting/filtering labs */
export interface SampleBook {
  id: number;
  title: string;
  author: string;
  status: 'published' | 'draft' | 'archived';
  price: number;
  createdAt: string;
}

export const SAMPLE_BOOKS: SampleBook[] = [
  { id: 1, title: 'Clean Architecture', author: 'martin', status: 'published', price: 450, createdAt: '2024-01-10' },
  { id: 2, title: 'Designing Data-Intensive Applications', author: 'kleppmann', status: 'published', price: 620, createdAt: '2024-03-22' },
  { id: 3, title: 'Domain-Driven Design', author: 'evans', status: 'draft', price: 580, createdAt: '2023-11-02' },
  { id: 4, title: 'Refactoring', author: 'fowler', status: 'published', price: 500, createdAt: '2024-06-15' },
  { id: 5, title: 'The Pragmatic Programmer', author: 'hunt', status: 'archived', price: 400, createdAt: '2022-08-19' },
  { id: 6, title: 'Working Effectively with Legacy Code', author: 'feathers', status: 'published', price: 470, createdAt: '2024-02-28' },
  { id: 7, title: 'Release It!', author: 'nygard', status: 'draft', price: 430, createdAt: '2023-05-10' },
  { id: 8, title: 'Site Reliability Engineering', author: 'beyer', status: 'published', price: 560, createdAt: '2024-07-01' },
];
