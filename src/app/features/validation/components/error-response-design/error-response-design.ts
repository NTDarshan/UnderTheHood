import { Component, computed, signal } from '@angular/core';

interface ErrorField {
  field: string;
  message: string;
}

const ERROR_FIELDS: ErrorField[] = [
  { field: 'name', message: 'required' },
  { field: 'age', message: 'must be >= 18' },
  { field: 'email', message: 'invalid format' },
];

@Component({
  selector: 'app-error-response-design',
  standalone: true,
  template: `
    <section class="lab-section" id="error-response-design">
      <div class="container">
        <p class="lab-index">VALIDATION / 27 — ERROR RESPONSE DESIGN</p>
        <h2 class="lab-title">Structured, or vague and dangerous?</h2>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn" [class.is-active]="!structured()" (click)="structured.set(false)">Bad response</button>
          <button type="button" class="lab-btn" [class.is-active]="structured()" (click)="structured.set(true)">Good response</button>
        </div>

        <div class="lab-panel error-panel">
          @if (!structured()) {
            <pre class="lab-code mono is-bad">HTTP/1.1 500 Internal Server Error

"Something went wrong."</pre>
            <p class="lab-note lab-note-warn">No indication of what to fix, and — worse — a 500 implies a server fault for what is actually a client input problem.</p>
          } @else {
            <pre class="lab-code mono is-good">HTTP/1.1 400 Bad Request

{{ '{' }}
  "title": "Validation failed",
  "status": 400,
  "errors": {{ '{' }}
    "email": ["Email format is invalid."],
    "age": ["Age must be between 18 and 100."]
  {{ '}' }}
{{ '}' }}</pre>
            <p class="lab-note">A structured, problem-details-style body tells the client exactly what to fix, field by field.</p>
          }
        </div>

        <p class="lab-note lab-note-warn">Never leak internal exceptions, SQL details, stack traces, or other sensitive implementation information in an error response.</p>
      </div>
    </section>

    <section class="lab-section" id="400-vs-422">
      <div class="container">
        <p class="lab-index">VALIDATION / 28 — 400 VS. 422</p>
        <h2 class="lab-title">Two conventions, both legitimate.</h2>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn" [class.is-active]="api() === 'a'" (click)="api.set('a')">API A — uses 400 for everything</button>
          <button type="button" class="lab-btn" [class.is-active]="api() === 'b'" (click)="api.set('b')">API B — uses 422 for semantic failures</button>
        </div>

        <div class="lab-panel status-panel">
          @if (api() === 'a') {
            <p class="status-line mono">Malformed JSON → 400 Bad Request</p>
            <p class="status-line mono">Semantic failure (age too high) → 400 Bad Request</p>
          } @else {
            <p class="status-line mono">Malformed JSON → 400 Bad Request</p>
            <p class="status-line mono">Semantic failure (age too high) → 422 Unprocessable Content</p>
          }
        </div>

        <p class="lab-note lab-note-warn">
          400 commonly indicates the request cannot be processed because it is malformed or invalid.
          Some API designs additionally use 422 when the syntax is understood but semantic validation
          fails. Neither convention is mandatory — what matters is choosing deliberately and staying consistent.
        </p>
      </div>
    </section>

    <section class="lab-section" id="validation-error-structure">
      <div class="container">
        <p class="lab-index">VALIDATION / 29 — VALIDATION ERROR STRUCTURE</p>
        <h2 class="lab-title">Click an error to see the exact field it points to.</h2>

        <pre class="lab-code mono">{{ '{' }}
  "name": "",
  "age": 17,
  "email": "hello"
{{ '}' }}</pre>

        <div class="error-tree">
          @for (e of errorFields; track e.field) {
            <button type="button" class="error-branch" [class.is-active]="selectedField() === e.field" (click)="selectedField.set(e.field)">
              <span class="error-field mono">{{ e.field }}</span>
              <span class="error-message">└── {{ e.message }}</span>
            </button>
          }
        </div>

        @if (selectedField()) {
          <p class="highlight-note">Field highlighted: <strong>{{ selectedField() }}</strong> — {{ activeMessage() }}</p>
        }
      </div>
    </section>
  `,
  styles: `
    .error-panel { margin-top: 24px; }
    .lab-code.is-bad { color: var(--danger); border-color: color-mix(in srgb, var(--danger) 30%, var(--border)); }
    .lab-code.is-good { color: var(--accent-2); border-color: color-mix(in srgb, var(--accent-2) 30%, var(--border)); }

    .status-panel { margin-top: 24px; }
    .status-line { font-size: 0.8125rem; color: var(--text-muted); margin-top: 6px; }

    .error-tree { margin-top: 24px; display: flex; flex-direction: column; gap: 8px; max-width: 400px; }
    .error-branch { text-align: left; padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface-raised); }
    .error-branch.is-active { border-color: var(--danger); }
    .error-field { display: block; color: var(--accent-strong); font-size: 0.8125rem; }
    .error-message { display: block; margin-top: 4px; font-size: 0.8125rem; color: var(--danger); }

    .highlight-note { margin-top: 16px; font-size: 0.875rem; color: var(--text-muted); }
  `,
})
export class ErrorResponseDesign {
  protected readonly structured = signal(false);
  protected readonly api = signal<'a' | 'b'>('a');

  protected readonly errorFields = ERROR_FIELDS;
  protected readonly selectedField = signal<string | null>(null);
  protected readonly activeMessage = computed(() => this.errorFields.find((e) => e.field === this.selectedField())?.message ?? '');
}
