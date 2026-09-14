import { Component, computed, signal } from '@angular/core';

type Dimension = 'method' | 'url' | 'status';

interface ApiRow {
  id: string;
  label: string;
  correctMethods: string[];
  correctUrls: string[];
  correctStatuses: string[];
  explanation: string;
}

interface RowSelection {
  method: string | null;
  url: string | null;
  status: string | null;
}

interface RowFeedback {
  row: ApiRow;
  methodOk: boolean;
  urlOk: boolean;
  statusOk: boolean;
  allOk: boolean;
}

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const URLS = ['/api/books', '/api/books/42', '/api/books/:id', '/api/book'];
const STATUSES = ['200 OK', '201 Created', '204 No Content', '404 Not Found'];

const ROWS: ApiRow[] = [
  {
    id: 'create',
    label: 'Create a book',
    correctMethods: ['POST'],
    correctUrls: ['/api/books'],
    correctStatuses: ['201 Created'],
    explanation: 'A new book is added to the collection — POST to the collection URL, 201 Created for the resource that now exists.',
  },
  {
    id: 'read-all',
    label: 'Read all books',
    correctMethods: ['GET'],
    correctUrls: ['/api/books'],
    correctStatuses: ['200 OK'],
    explanation: 'Reading the whole collection is a GET on the collection URL — nothing was created, so 200 OK, not 201.',
  },
  {
    id: 'read-one',
    label: 'Read one book',
    correctMethods: ['GET'],
    correctUrls: ['/api/books/42', '/api/books/:id'],
    correctStatuses: ['200 OK'],
    explanation: 'Reading a single item targets it by ID. /api/books/42 (a real ID) or /api/books/:id (the route pattern) both describe the same shape.',
  },
  {
    id: 'update',
    label: 'Update a book',
    correctMethods: ['PUT', 'PATCH'],
    correctUrls: ['/api/books/42', '/api/books/:id'],
    correctStatuses: ['200 OK', '204 No Content'],
    explanation: 'PUT (full replace) or PATCH (partial update) both target one book by ID. 200 OK if you return the updated book, 204 No Content if you return nothing — either is a reasonable design.',
  },
  {
    id: 'delete',
    label: 'Delete a book',
    correctMethods: ['DELETE'],
    correctUrls: ['/api/books/42', '/api/books/:id'],
    correctStatuses: ['204 No Content'],
    explanation: 'DELETE targets the specific book by ID. There is nothing left to return, so 204 No Content is the conventional response.',
  },
];

const EMPTY_SELECTION: RowSelection = { method: null, url: null, status: null };

@Component({
  selector: 'app-break-the-crud-api',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cr-scene" id="break-the-crud-api">
      <div class="container">
        <p class="lab-index mono">17 — DESIGN THE API</p>
        <h2 class="lab-title">Design the Books API</h2>
        <p class="lab-lede">
          The brief: <strong>build an API for managing books.</strong> For each operation below, pick the HTTP method,
          the URL, and the status code you'd use. There's no trick — just everything this chapter already covered.
        </p>

        <div class="lab-panel">
          <div class="row-list">
            @for (row of rows; track row.id) {
              @let sel = selection()[row.id];
              @let fb = submitted() ? feedback().get(row.id) : null;

              <div class="api-row" [class.is-correct]="fb?.allOk === true" [class.is-incorrect]="fb && !fb.allOk">
                <div class="api-row-head">
                  <span class="api-row-label">{{ row.label }}</span>
                  @if (fb) {
                    <span class="row-pill mono" [class.pill-ok]="fb.allOk" [class.pill-bad]="!fb.allOk">
                      {{ fb.allOk ? 'CORRECT' : 'REVIEW' }}
                    </span>
                  }
                </div>

                <div class="dim-group">
                  <p class="dim-label mono">METHOD</p>
                  <div class="chip-row">
                    @for (m of methods; track m) {
                      <button
                        type="button"
                        class="opt-chip mono"
                        [class.is-selected]="sel.method === m"
                        [class.is-right]="fb && row.correctMethods.includes(m)"
                        [class.is-wrong]="fb && sel.method === m && !fb.methodOk"
                        [disabled]="submitted()"
                        (click)="setSelection(row.id, 'method', m)"
                      >{{ m }}</button>
                    }
                  </div>
                </div>

                <div class="dim-group">
                  <p class="dim-label mono">URL</p>
                  <div class="chip-row">
                    @for (u of urls; track u) {
                      <button
                        type="button"
                        class="opt-chip mono"
                        [class.is-selected]="sel.url === u"
                        [class.is-right]="fb && row.correctUrls.includes(u)"
                        [class.is-wrong]="fb && sel.url === u && !fb.urlOk"
                        [disabled]="submitted()"
                        (click)="setSelection(row.id, 'url', u)"
                      >{{ u }}</button>
                    }
                  </div>
                </div>

                <div class="dim-group">
                  <p class="dim-label mono">STATUS</p>
                  <div class="chip-row">
                    @for (s of statuses; track s) {
                      <button
                        type="button"
                        class="opt-chip mono"
                        [class.is-selected]="sel.status === s"
                        [class.is-right]="fb && row.correctStatuses.includes(s)"
                        [class.is-wrong]="fb && sel.status === s && !fb.statusOk"
                        [disabled]="submitted()"
                        (click)="setSelection(row.id, 'status', s)"
                      >{{ s }}</button>
                    }
                  </div>
                </div>

                @if (fb) {
                  <div class="row-feedback">
                    <p class="feedback-answer mono">
                      <span class="tok-method">{{ row.correctMethods.join(' or ') }}</span>
                      <span class="tok-key">{{ row.correctUrls.join(' or ') }}</span>
                      <span class="tok-status-ok">{{ row.correctStatuses.join(' or ') }}</span>
                    </p>
                    <p class="feedback-text">{{ row.explanation }}</p>
                  </div>
                }
              </div>
            }
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="!allAnswered() || submitted()" (click)="check()">
              Check my answers
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Try again</button>
          </div>

          @if (submitted()) {
            <p class="score-line mono">{{ correctCount() }} / {{ rows.length }} correct</p>
          }
        </div>

        <div class="closing-statement">
          <p class="closing-line">
            CRUD isn't complicated. It's the simple mental model underneath<br class="closing-break" />
            the complicated features we build every day.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .cr-scene {
      --cr-accent: var(--accent);
      --cr-cyan: var(--accent-2);
      --cr-violet: #a78bfa;
      --cr-success: #4ade80;
      --cr-warning: #fbbf24;
      --cr-danger: var(--danger);
    }

    .row-list { display: flex; flex-direction: column; gap: 16px; }

    .api-row {
      padding: 18px;
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      transition: border-color 0.2s ease, background 0.2s ease;
    }
    .api-row.is-correct { border-color: color-mix(in srgb, var(--cr-success) 50%, var(--border-strong)); background: color-mix(in srgb, var(--cr-success) 6%, var(--surface)); }
    .api-row.is-incorrect { border-color: color-mix(in srgb, var(--cr-danger) 45%, var(--border-strong)); background: color-mix(in srgb, var(--cr-danger) 5%, var(--surface)); }

    .api-row-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
    .api-row-label { font-size: 0.9375rem; font-weight: 700; color: var(--text); }

    .row-pill { font-size: 0.625rem; padding: 3px 9px; border-radius: 999px; letter-spacing: 0.06em; border: 1px solid var(--border-strong); }
    .pill-ok { color: var(--cr-success); border-color: color-mix(in srgb, var(--cr-success) 45%, var(--border-strong)); }
    .pill-bad { color: var(--cr-danger); border-color: color-mix(in srgb, var(--cr-danger) 45%, var(--border-strong)); }

    .dim-group { margin-top: 12px; }
    .dim-group:first-of-type { margin-top: 0; }
    .dim-label { font-size: 0.625rem; letter-spacing: 0.08em; color: var(--text-faint); margin-bottom: 8px; }

    .chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
    .opt-chip {
      font-size: 0.75rem;
      padding: 7px 12px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-strong);
      background: var(--surface-elevated);
      color: var(--text-muted);
      transition: all 0.15s ease;
    }
    .opt-chip:hover:not(:disabled) { border-color: var(--cr-accent); color: var(--text); }
    .opt-chip:disabled { cursor: default; }
    .opt-chip.is-selected { border-color: var(--cr-accent); color: var(--accent-strong); background: color-mix(in srgb, var(--cr-accent) 15%, var(--surface-elevated)); }

    .opt-chip.is-right { border-color: var(--cr-success); color: var(--cr-success); }
    .opt-chip.is-wrong { border-color: var(--cr-danger); color: var(--cr-danger); background: color-mix(in srgb, var(--cr-danger) 12%, var(--surface-elevated)); }

    .row-feedback { margin-top: 14px; padding-top: 14px; border-top: 1px dashed var(--border-strong); }
    .feedback-answer { display: flex; flex-wrap: wrap; gap: 10px; font-size: 0.8125rem; }
    .feedback-text { margin-top: 8px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.55; }

    .score-line { margin-top: 18px; font-size: 0.8125rem; color: var(--text-muted); }

    .closing-statement {
      margin-top: 56px;
      padding-top: 44px;
      border-top: 1px solid var(--border);
      text-align: center;
    }
    .closing-line {
      font-size: clamp(1.25rem, 1rem + 1.1vw, 1.75rem);
      font-weight: 700;
      color: var(--text);
      line-height: 1.5;
      max-width: 780px;
      margin: 0 auto;
    }
    @media (max-width: 640px) {
      .closing-break { display: none; }
    }

    @media (prefers-reduced-motion: reduce) {
      .api-row, .opt-chip { transition: none; }
    }
  `,
})
export class BreakTheCrudApi {
  protected readonly rows = ROWS;
  protected readonly methods = METHODS;
  protected readonly urls = URLS;
  protected readonly statuses = STATUSES;

  protected readonly selection = signal<Record<string, RowSelection>>(
    Object.fromEntries(ROWS.map((r) => [r.id, { ...EMPTY_SELECTION }])),
  );
  protected readonly submitted = signal(false);

  protected readonly allAnswered = computed(() =>
    ROWS.every((r) => {
      const s = this.selection()[r.id];
      return s.method !== null && s.url !== null && s.status !== null;
    }),
  );

  protected readonly feedback = computed<Map<string, RowFeedback>>(() => {
    const map = new Map<string, RowFeedback>();
    const sel = this.selection();
    for (const row of ROWS) {
      const s = sel[row.id];
      const methodOk = s.method !== null && row.correctMethods.includes(s.method);
      const urlOk = s.url !== null && row.correctUrls.includes(s.url);
      const statusOk = s.status !== null && row.correctStatuses.includes(s.status);
      map.set(row.id, { row, methodOk, urlOk, statusOk, allOk: methodOk && urlOk && statusOk });
    }
    return map;
  });

  protected readonly correctCount = computed(() => {
    let count = 0;
    for (const fb of this.feedback().values()) {
      if (fb.allOk) count++;
    }
    return count;
  });

  protected setSelection(rowId: string, dim: Dimension, value: string): void {
    if (this.submitted()) return;
    this.selection.update((cur) => ({
      ...cur,
      [rowId]: { ...cur[rowId], [dim]: value },
    }));
  }

  protected check(): void {
    if (this.allAnswered()) {
      this.submitted.set(true);
    }
  }

  protected reset(): void {
    this.submitted.set(false);
    this.selection.set(Object.fromEntries(ROWS.map((r) => [r.id, { ...EMPTY_SELECTION }])));
  }
}
