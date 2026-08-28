export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';
export type RouteMethod = HttpMethod | '*';

export interface RouteDef {
  id: string;
  method: RouteMethod;
  pattern: string;
  description: string;
  enabled: boolean;
}

export interface MatchedParam {
  name: string;
  value: string;
}

export type AttemptStatus = 'winner' | 'rejected' | 'shadowed' | 'disabled';

export interface MatchAttempt {
  route: RouteDef;
  status: AttemptStatus;
  reason: string;
  params: MatchedParam[];
}

export interface MatchResult {
  matched: boolean;
  route?: RouteDef;
  params: MatchedParam[];
  query: MatchedParam[];
  attempts: MatchAttempt[];
  path: string;
}

function splitSegments(path: string): string[] {
  return path.split('/').filter((s) => s.length > 0);
}

function isInt(value: string): boolean {
  return /^-?\d+$/.test(value);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Attempts to match a single route pattern against a request path.
 * Pattern segment syntax (educational, framework-agnostic):
 *   users            -> literal segment
 *   {id}             -> dynamic segment, any value
 *   {id:int}         -> dynamic segment, must be an integer
 *   {id:uuid}        -> dynamic segment, must be a UUID
 *   {category?}      -> optional trailing segment
 *   {*rest}          -> catch-all, consumes all remaining segments
 */
function tryMatchPattern(pattern: string, requestPath: string): { ok: boolean; reason: string; params: MatchedParam[] } {
  const patternSegments = splitSegments(pattern);
  const requestSegments = splitSegments(requestPath);
  const params: MatchedParam[] = [];

  let pi = 0;
  let ri = 0;

  while (pi < patternSegments.length) {
    const seg = patternSegments[pi];

    const catchAll = seg.match(/^\{\*(\w+)\}$/);
    if (catchAll) {
      params.push({ name: catchAll[1], value: requestSegments.slice(ri).join('/') });
      return { ok: true, reason: `Catch-all segment "${seg}" absorbed the remaining path.`, params };
    }

    const optional = seg.match(/^\{(\w+)\?\}$/);
    if (optional) {
      if (ri < requestSegments.length) {
        params.push({ name: optional[1], value: requestSegments[ri] });
        ri++;
      }
      pi++;
      continue;
    }

    const dynamic = seg.match(/^\{(\w+)(?::(\w+))?\}$/);
    if (dynamic) {
      if (ri >= requestSegments.length) {
        return { ok: false, reason: `Expected a value for "{${dynamic[1]}}" but the path ran out of segments.`, params };
      }
      const value = requestSegments[ri];
      const constraint = dynamic[2];
      if (constraint === 'int' && !isInt(value)) {
        return { ok: false, reason: `Segment "${value}" does not satisfy the ":int" constraint on "{${dynamic[1]}}".`, params };
      }
      if (constraint === 'uuid' && !isUuid(value)) {
        return { ok: false, reason: `Segment "${value}" does not satisfy the ":uuid" constraint on "{${dynamic[1]}}".`, params };
      }
      params.push({ name: dynamic[1], value });
      pi++;
      ri++;
      continue;
    }

    // Static literal segment.
    if (ri >= requestSegments.length || requestSegments[ri] !== seg) {
      return { ok: false, reason: `Literal segment "${seg}" did not match "${requestSegments[ri] ?? '(nothing)'}".`, params };
    }
    pi++;
    ri++;
  }

  if (ri < requestSegments.length) {
    return { ok: false, reason: `Path has extra segments ("${requestSegments.slice(ri).join('/')}") the pattern doesn't account for.`, params };
  }

  return { ok: true, reason: 'Every segment matched exactly.', params };
}

function parseUrl(url: string): { path: string; query: MatchedParam[] } {
  const [path, queryString = ''] = url.split('?');
  const query: MatchedParam[] = [];
  if (queryString) {
    for (const pair of queryString.split('&')) {
      if (!pair) continue;
      const [key, value = ''] = pair.split('=');
      query.push({ name: decodeURIComponent(key), value: decodeURIComponent(value) });
    }
  }
  return { path: path || '/', query };
}

export function matchRoute(routes: RouteDef[], method: string, url: string): MatchResult {
  const { path, query } = parseUrl(url);
  const attempts: MatchAttempt[] = [];
  let winner: MatchAttempt | undefined;

  for (const route of routes) {
    if (!route.enabled) {
      attempts.push({ route, status: 'disabled', reason: 'This route is disabled and is skipped entirely.', params: [] });
      continue;
    }

    if (winner) {
      attempts.push({ route, status: 'shadowed', reason: 'Never reached — an earlier route already won.', params: [] });
      continue;
    }

    const methodOk = route.method === '*' || route.method === method;
    if (!methodOk) {
      attempts.push({ route, status: 'rejected', reason: `Method mismatch: route expects ${route.method}, request is ${method}.`, params: [] });
      continue;
    }

    const result = tryMatchPattern(route.pattern, path);
    if (result.ok) {
      winner = { route, status: 'winner', reason: result.reason, params: result.params };
      attempts.push(winner);
    } else {
      attempts.push({ route, status: 'rejected', reason: result.reason, params: [] });
    }
  }

  return {
    matched: !!winner,
    route: winner?.route,
    params: winner?.params ?? [],
    query,
    attempts,
    path,
  };
}
