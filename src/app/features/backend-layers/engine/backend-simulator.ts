export type StageStatus = 'pass' | 'fail' | 'not-reached' | 'cancelled';

export interface PipelineStage {
  id: string;
  label: string;
  status: StageStatus;
  detail?: string;
}

export type FailurePoint =
  | 'none'
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'controller'
  | 'service'
  | 'repository'
  | 'database';

const STAGE_ORDER: { id: string; label: string }[] = [
  { id: 'middleware', label: 'Middleware' },
  { id: 'router', label: 'Router' },
  { id: 'controller', label: 'Controller' },
  { id: 'service', label: 'Service' },
  { id: 'repository', label: 'Repository' },
  { id: 'database', label: 'Database' },
  { id: 'response', label: 'Response' },
];

/** Maps a chosen failure point to the middleware sub-stage or main stage it interrupts, plus the HTTP response the client should see. */
const FAILURE_INFO: Record<Exclude<FailurePoint, 'none'>, { stopsAt: string; status: number; body: string; detail: string }> = {
  authentication: {
    stopsAt: 'middleware',
    status: 401,
    body: '{ "error": "Unauthorized" }',
    detail: 'No valid identity could be established from the request.',
  },
  authorization: {
    stopsAt: 'middleware',
    status: 403,
    body: '{ "error": "Forbidden" }',
    detail: 'Identity is known, but this identity may not perform this action.',
  },
  validation: {
    stopsAt: 'controller',
    status: 400,
    body: '{ "error": "Bad Request", "fields": ["quantity"] }',
    detail: 'Request body failed boundary validation before the service was called.',
  },
  controller: {
    stopsAt: 'controller',
    status: 400,
    body: '{ "error": "Bad Request" }',
    detail: 'Input binding failed — the request could not be parsed into expected shape.',
  },
  service: {
    stopsAt: 'service',
    status: 422,
    body: '{ "error": "Unprocessable Entity" }',
    detail: 'A business rule rejected this operation (e.g. insufficient balance).',
  },
  repository: {
    stopsAt: 'repository',
    status: 500,
    body: '{ "error": "Internal Server Error" }',
    detail: 'The data access layer threw — a connection or query failure.',
  },
  database: {
    stopsAt: 'database',
    status: 500,
    body: '{ "error": "Internal Server Error" }',
    detail: 'The database itself rejected or timed out on the operation.',
  },
};

/**
 * Runs a simulated request through the full backend lifecycle. A failure at
 * any stage marks every later stage 'not-reached' — mirroring the same
 * fail-fast lesson from the validation pipeline, now applied to the whole
 * request lifecycle rather than just input validation.
 */
export function runRequestPipeline(failAt: FailurePoint): PipelineStage[] {
  const stages: PipelineStage[] = [];
  const stopIndex = failAt === 'none' ? -1 : STAGE_ORDER.findIndex((s) => s.id === FAILURE_INFO[failAt].stopsAt);

  for (let i = 0; i < STAGE_ORDER.length; i++) {
    const def = STAGE_ORDER[i];
    if (failAt !== 'none' && i === stopIndex) {
      stages.push({ id: def.id, label: def.label, status: 'fail', detail: FAILURE_INFO[failAt].detail });
    } else if (failAt !== 'none' && i > stopIndex) {
      stages.push({ id: def.id, label: def.label, status: 'not-reached' });
    } else {
      stages.push({ id: def.id, label: def.label, status: 'pass', detail: successDetail(def.id) });
    }
  }
  return stages;
}

function successDetail(id: string): string {
  switch (id) {
    case 'middleware':
      return 'Logging, CORS, authentication and rate limiting all passed. Request context populated.';
    case 'router':
      return 'POST /orders matched to the createOrder handler.';
    case 'controller':
      return 'Request body parsed and bound. Input validated at the boundary.';
    case 'service':
      return 'Business rules checked. Price calculated.';
    case 'repository':
      return 'Order entity persisted through the data-access abstraction.';
    case 'database':
      return 'INSERT committed.';
    case 'response':
      return '201 Created returned to the client.';
    default:
      return '';
  }
}

export function responseForFailure(failAt: FailurePoint): { status: number; body: string } {
  if (failAt === 'none') return { status: 201, body: '{ "id": 501, "status": "created" }' };
  return { status: FAILURE_INFO[failAt].status, body: FAILURE_INFO[failAt].body };
}

/** Request-scoped metadata — never shared between requests, never global. */
export interface RequestContext {
  requestId: string;
  traceId: string;
  userId: number;
  role: 'customer' | 'admin';
  cancelled: boolean;
}

export const SAMPLE_CONTEXTS: RequestContext[] = [
  { requestId: 'req_7821', traceId: 'trace_a1', userId: 42, role: 'customer', cancelled: false },
  { requestId: 'req_7822', traceId: 'trace_b2', userId: 17, role: 'admin', cancelled: false },
];

/** Middleware ordering — evaluates a proposed order against a few well-known ordering hazards. Not an exhaustive or "one true order" ruleset — different frameworks make different tradeoffs. */
export interface MiddlewareOrderWarning {
  id: string;
  message: string;
}

export function evaluateMiddlewareOrder(order: string[]): MiddlewareOrderWarning[] {
  const warnings: MiddlewareOrderWarning[] = [];
  const idx = (id: string) => order.indexOf(id);

  if (idx('error-handling') > 0) {
    warnings.push({
      id: 'error-handling',
      message: 'Error Handling is not first. It can only observe failures thrown by middleware that runs after it — anything earlier bypasses it entirely.',
    });
  }

  if (idx('authentication') > idx('routing') && idx('routing') !== -1) {
    warnings.push({
      id: 'auth-after-routing',
      message: 'Routing runs before Authentication. A request could be matched to a protected handler before identity is even known.',
    });
  }

  if (idx('rate-limiting') > idx('routing') && idx('routing') !== -1) {
    warnings.push({
      id: 'rate-limit-after-routing',
      message: 'Rate Limiting runs after Routing — expensive downstream work still happens for requests that should have been throttled first.',
    });
  }

  if (idx('cors') > idx('authentication') && idx('authentication') !== -1) {
    warnings.push({
      id: 'cors-after-auth',
      message: 'CORS runs after Authentication. Browser preflight (OPTIONS) requests carry no credentials and may be rejected before CORS headers are ever applied.',
    });
  }

  if (idx('logging') === order.length - 1) {
    warnings.push({
      id: 'logging-last',
      message: 'Logging runs last. Requests rejected by any earlier middleware will never be logged.',
    });
  }

  return warnings;
}

/** Distributed trace log — same correlation ID travels across service boundaries. */
export const TRACE_LOG_TEMPLATE = [
  { service: 'API Gateway', message: 'request received' },
  { service: 'Order Service', message: 'order request started' },
  { service: 'Payment Service', message: 'payment request started' },
  { service: 'Payment Service', message: 'payment completed' },
  { service: 'Order Service', message: 'order completed' },
];
