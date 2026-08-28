export type StageStatus = 'pass' | 'fail' | 'not-reached';

export interface FieldIssue {
  field: string;
  message: string;
}

export interface StageResult {
  id: string;
  label: string;
  status: StageStatus;
  detail?: string;
}

/** Transform: normalizes representation. Deliberately separate from validation, which judges acceptability. */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function parseIntStrict(raw: string): { ok: boolean; value?: number } {
  const trimmed = raw.trim();
  if (!/^-?\d+$/.test(trimmed)) return { ok: false };
  return { ok: true, value: Number(trimmed) };
}

export function normalizePhone(raw: string): string {
  return raw.replace(/[\s-]/g, '');
}

export function isSyntacticallyValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return /^\+?\d{7,15}$/.test(phone);
}

export function isValidIsoDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const d = new Date(date + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === date;
}

export interface OrderRequestRaw {
  productId: string;
  quantity: string;
  couponCode: string;
}

export interface OrderPipelineResult {
  stages: StageResult[];
  finalIssues: FieldIssue[];
}

/**
 * Runs a simplified request through the same conceptual pipeline every
 * chapter in this series has been building toward: parse -> transform ->
 * validate -> authorize -> service -> repository -> database. A failure at
 * any stage marks every later stage 'not-reached' rather than continuing —
 * this is the core lesson: invalid input never touches business logic.
 */
export function runOrderPipeline(raw: OrderRequestRaw, authorized: boolean, accountBalance: number, priceEach: number): OrderPipelineResult {
  const stages: StageResult[] = [];
  const issues: FieldIssue[] = [];

  stages.push({ id: 'parse', label: 'Parse', status: 'pass', detail: 'Request body parsed as JSON.' });

  const productId = parseIntStrict(raw.productId);
  const quantity = parseIntStrict(raw.quantity);
  const couponCode = raw.couponCode.trim().toUpperCase();

  if (!productId.ok || !quantity.ok) {
    const failedField = !productId.ok ? 'productId' : 'quantity';
    stages.push({ id: 'transform', label: 'Transform', status: 'fail', detail: `"${failedField}" could not be converted to a number.` });
    issues.push({ field: failedField, message: `"${raw[failedField as keyof OrderRequestRaw]}" is not a valid integer.` });
    pushNotReached(stages, ['validate', 'authorize', 'service', 'repository', 'database']);
    return { stages, finalIssues: issues };
  }

  stages.push({ id: 'transform', label: 'Transform', status: 'pass', detail: `productId → ${productId.value}, quantity → ${quantity.value}, couponCode → "${couponCode}"` });

  if (quantity.value! <= 0) issues.push({ field: 'quantity', message: 'quantity must be greater than 0.' });
  if (couponCode && !/^[A-Z0-9]{3,12}$/.test(couponCode)) issues.push({ field: 'couponCode', message: 'couponCode must be 3-12 alphanumeric characters.' });

  if (issues.length > 0) {
    stages.push({ id: 'validate', label: 'Validate', status: 'fail', detail: issues.map((i) => i.message).join(' ') });
    pushNotReached(stages, ['authorize', 'service', 'repository', 'database']);
    return { stages, finalIssues: issues };
  }

  stages.push({ id: 'validate', label: 'Validate', status: 'pass', detail: 'All fields structurally acceptable.' });

  if (!authorized) {
    stages.push({ id: 'authorize', label: 'Authorize', status: 'fail', detail: 'This identity is not permitted to create orders.' });
    pushNotReached(stages, ['service', 'repository', 'database']);
    issues.push({ field: 'authorization', message: 'Not authorized to create orders.' });
    return { stages, finalIssues: issues };
  }

  stages.push({ id: 'authorize', label: 'Authorize', status: 'pass', detail: 'Authorized to create orders.' });

  const total = quantity.value! * priceEach;
  if (total > accountBalance) {
    stages.push({ id: 'service', label: 'Service', status: 'fail', detail: `Order total $${total} exceeds account balance $${accountBalance} — a domain rule, not an input error.` });
    pushNotReached(stages, ['repository', 'database']);
    issues.push({ field: 'business-rule', message: `Insufficient balance: order total $${total} exceeds $${accountBalance}.` });
    return { stages, finalIssues: issues };
  }

  stages.push({ id: 'service', label: 'Service', status: 'pass', detail: `Order total $${total} is within account balance.` });
  stages.push({ id: 'repository', label: 'Repository', status: 'pass', detail: 'Order entity persisted.' });
  stages.push({ id: 'database', label: 'Database', status: 'pass', detail: 'Row committed.' });

  return { stages, finalIssues: [] };
}

function pushNotReached(stages: StageResult[], ids: string[]): void {
  const labels: Record<string, string> = {
    validate: 'Validate',
    authorize: 'Authorize',
    service: 'Service',
    repository: 'Repository',
    database: 'Database',
  };
  for (const id of ids) stages.push({ id, label: labels[id], status: 'not-reached' });
}
