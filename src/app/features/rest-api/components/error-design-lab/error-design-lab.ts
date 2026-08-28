import { Component, computed, signal } from '@angular/core';

type ScenarioId = 'invalid' | 'unauthenticated' | 'unauthorized' | 'missing' | 'conflict' | 'rate-limited' | 'server-failure';

interface Scenario {
  id: ScenarioId;
  label: string;
  status: string;
  request: string;
  path: string;
  errorBody: string;
  note: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'invalid',
    label: 'Invalid input',
    status: '400 / 422',
    request: 'POST /api/v1/books { "price": -10 }',
    path: 'Client → Routing → Controller → Validation → fails before reaching the service',
    errorBody: `{
  "type": "https://example.com/errors/validation",
  "title": "Validation failed",
  "status": 400,
  "errors": { "title": ["Title is required."], "price": ["Price must be positive."] }
}`,
    note: 'Malformed or semantically invalid input never reaches business logic — validation stops it at the boundary.',
  },
  {
    id: 'unauthenticated',
    label: 'Unauthenticated',
    status: '401',
    request: 'GET /api/v1/orders (no Authorization header)',
    path: 'Client → Auth middleware → identity cannot be established → rejected before Routing hands off to the controller',
    errorBody: `{
  "type": "https://example.com/errors/unauthenticated",
  "title": "Authentication required",
  "status": 401
}`,
    note: 'The server doesn’t know who is asking, so it can’t evaluate permissions at all yet.',
  },
  {
    id: 'unauthorized',
    label: 'Unauthorized',
    status: '403',
    request: 'DELETE /api/v1/users/9 (authenticated as role: customer)',
    path: 'Client → Auth middleware (identity OK) → Authorization check → denied',
    errorBody: `{
  "type": "https://example.com/errors/forbidden",
  "title": "Insufficient permissions",
  "status": 403
}`,
    note: 'Identity is known this time — the client just isn’t allowed to perform this specific action.',
  },
  {
    id: 'missing',
    label: 'Resource missing',
    status: '404',
    request: 'GET /api/v1/books/999999',
    path: 'Client → Routing → Controller → Service → Repository → Database returns nothing',
    errorBody: `{
  "type": "https://example.com/errors/not-found",
  "title": "Book not found",
  "status": 404
}`,
    note: 'The request was well-formed and reached all the way to the database — the resource simply doesn’t exist.',
  },
  {
    id: 'conflict',
    label: 'Conflict',
    status: '409',
    request: 'POST /users { "email": "john@example.com" }',
    path: 'Client → Routing → Controller → Validation passes → Service → Repository detects the email already exists',
    errorBody: `{
  "type": "https://example.com/errors/conflict",
  "title": "Email already in use",
  "status": 409
}`,
    note: 'This request is syntactically valid and passes basic validation — the conflict is a business/data-state problem discovered only once the repository checks current state, not a formatting problem.',
  },
  {
    id: 'rate-limited',
    label: 'Rate limited',
    status: '429',
    request: 'GET /api/v1/books (101st request this minute)',
    path: 'Client → Rate Limiting middleware — request count 101/min against a limit of 100 → rejected before reaching Routing',
    errorBody: `{
  "type": "https://example.com/errors/rate-limited",
  "title": "Too many requests",
  "status": 429
}
Retry-After: 42`,
    note: 'Rate limiting middleware tracks request counts per client and short-circuits once the limit is exceeded — Retry-After tells the client how long to back off.',
  },
  {
    id: 'server-failure',
    label: 'Server failure',
    status: '500',
    request: 'GET /api/v1/books/42',
    path: 'Client → Routing → Controller → Service → Repository → Database connection lost (unexpected)',
    errorBody: `{
  "type": "https://example.com/errors/internal",
  "title": "Something went wrong",
  "status": 500
}`,
    note: 'An unexpected failure, not a predictable validation case — and specifically NOT an excuse to leak internals in the response.',
  },
];

@Component({
  selector: 'app-error-design-lab',
  standalone: true,
  template: `
    <section class="lab-section" id="error-design">
      <div class="container">
        <p class="lab-index">REST API / 32 — ERROR DESIGN LAB</p>
        <h2 class="lab-title">A good error response tells the client what happened — and nothing it shouldn't.</h2>

        <div class="lab-panel">
          <div class="lab-btn-row">
            @for (s of scenarios; track s.id) {
              <button type="button" class="lab-btn" [class.is-active]="selected().id === s.id" (click)="selected.set(s)">{{ s.label }}</button>
            }
          </div>

          <p class="lab-node" style="margin-top: 24px;">REQUEST</p>
          <p class="lab-code">{{ selected().request }}</p>

          <p class="lab-node" style="margin-top: 16px;">PATH TO FAILURE</p>
          <p class="lab-note mono">{{ selected().path }}</p>

          <p class="lab-node" style="margin-top: 16px;">STATUS</p>
          <p class="lab-code"><span class="tok-status-err">{{ selected().status }}</span></p>

          <p class="lab-node" style="margin-top: 16px;">STRUCTURED ERROR RESPONSE</p>
          <p class="lab-code">{{ selected().errorBody }}</p>

          <p class="lab-note" style="margin-top: 16px;">{{ selected().note }}</p>

          <p class="lab-note lab-note-warn" style="margin-top: 20px;"><strong>Never</strong> expose stack traces, raw SQL, internal file paths, or secrets in an error response — those belong in server-side logs, not in what the client receives.</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .mono { font-family: var(--font-mono); }
  `,
})
export class ErrorDesignLab {
  protected readonly scenarios = SCENARIOS;
  protected readonly selected = signal<Scenario>(SCENARIOS[0]);
}
