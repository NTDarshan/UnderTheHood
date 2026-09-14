import { Component, OnDestroy, signal } from '@angular/core';

type StageId = 'client' | 'request' | 'controller' | 'service' | 'repository' | 'database' | 'response';
type StageState = 'pending' | 'active' | 'done';

interface Book {
  id: number;
  title: string;
  author: string;
  genre: string;
  price: number;
}

const SEED_BOOKS: Book[] = [
  { id: 1, title: 'Clean Code', author: 'Robert Martin', genre: 'Programming', price: 35 },
  { id: 42, title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', genre: 'Architecture', price: 42 },
];

const STAGES: Stage[] = [
  { id: 'client', label: 'CLIENT', detail: 'edit submitted' },
  { id: 'request', label: 'PATCH /api/books/{id}', detail: 'sent over the network' },
  { id: 'controller', label: 'CONTROLLER', detail: 'parses id & partial body' },
  { id: 'service', label: 'SERVICE', detail: 'applies the change' },
  { id: 'repository', label: 'REPOSITORY', detail: 'loads existing row' },
  { id: 'database', label: 'DATABASE', detail: 'UPDATE — row modified in place' },
  { id: 'response', label: '200 OK', detail: 'updated resource returned' },
];

interface Stage {
  id: StageId;
  label: string;
  detail: string;
}

const STEP_MS = 460;

@Component({
  selector: 'app-crud-playground-update',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cr-scene" id="crud-update">
      <div class="container">
        <p class="lab-index mono">07 — UPDATE</p>
        <h2 class="lab-title">UPDATE changes a resource that already exists.</h2>
        <p class="lab-lede">
          Edit the price below and save — watch <span class="mono">PATCH /api/books/{{ book().id }}</span> travel
          through the same layered pipeline, ending in <span class="mono">200 OK</span> with the updated book.
        </p>

        <div class="lab-panel">
          <h3 class="panel-heading">{{ book().title }}</h3>
          @if (!editing()) {
            <div class="book-summary mono">
              <span>author: {{ book().author }}</span>
              <span>genre: {{ book().genre }}</span>
              <span class="price">price: {{ '$' + book().price }}</span>
            </div>
            <div class="lab-btn-row">
              <button type="button" class="lab-btn lab-btn-primary" (click)="startEdit()">EDIT BOOK</button>
            </div>
          } @else {
            <label class="lab-field price-field">
              <span>Price ($)</span>
              <input type="number" min="0" [value]="draftPrice()" (input)="draftPrice.set(+$any($event.target).value)" />
            </label>
            <pre class="lab-code mono">{{ patchPreview() }}</pre>
            <div class="lab-btn-row">
              <button type="button" class="lab-btn lab-btn-primary" (click)="saveChanges()" [disabled]="isRunning()">SAVE CHANGES</button>
              <button type="button" class="lab-btn" (click)="cancelEdit()" [disabled]="isRunning()">CANCEL</button>
            </div>
          }
        </div>

        <div class="lab-panel">
          <h3 class="panel-heading">Pipeline</h3>
          <div class="stage-track">
            @for (stage of stages; track stage.id) {
              <div class="stage-node" [attr.data-state]="stateOf(stage.id)">
                <span class="node-dot" aria-hidden="true"></span>
                <span class="node-label mono">{{ stage.label }}</span>
                <span class="node-detail">{{ stage.detail }}</span>
              </div>
            }
          </div>
          <p class="log-line mono" aria-live="polite">{{ logLine() }}</p>
        </div>

        <div class="lab-panel compare-panel">
          <h3 class="panel-heading">PUT vs PATCH</h3>
          <div class="compare-grid">
            <div class="compare-card">
              <p class="compare-title mono">PUT</p>
              <p class="compare-desc">Replace the complete representation.</p>
              <pre class="lab-code mono small">PUT /api/books/42

{{ '{' }}
  "title": "Designing Data-Intensive Applications",
  "author": "Martin Kleppmann",
  "genre": "Architecture",
  "price": 49
{{ '}' }}</pre>
            </div>
            <div class="compare-card">
              <p class="compare-title mono">PATCH</p>
              <p class="compare-desc">Change only selected fields.</p>
              <pre class="lab-code mono small">PATCH /api/books/42

{{ '{' }} "price": 49 {{ '}' }}</pre>
            </div>
          </div>
          <p class="lab-note">PATCH changes part of a resource.</p>
        </div>

        <div class="lab-panel">
          <h3 class="panel-heading">Idempotency</h3>
          <p class="lab-lede small">
            Repeating the same request produces the same intended server state — that's idempotency. It does
            <em>not</em> mean the response is always identical (a second PUT against a since-deleted resource can
            respond differently), only that the resource ends up in the same place either way.
          </p>
          <div class="lab-btn-row">
            <button type="button" class="lab-btn" (click)="runIdempotencyDemo()" [disabled]="idempotencyRunning()">
              SEND PATCH price &rarr; $49, TWICE
            </button>
          </div>
          @if (attempts().length > 0) {
            <div class="attempt-grid">
              @for (a of attempts(); track a.n) {
                <div class="attempt-card">
                  <p class="attempt-title mono">Attempt {{ a.n }}</p>
                  <p class="attempt-req mono">PATCH price &rarr; $49</p>
                  <p class="attempt-result mono">resulting price: <strong>{{ '$' + a.resultPrice }}</strong></p>
                </div>
              }
            </div>
          }
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

    .panel-heading { margin: 0 0 16px; font-size: 1.0625rem; color: var(--text); }
    .book-summary { display: flex; flex-wrap: wrap; gap: 18px; font-size: 0.8125rem; color: var(--text-muted); }
    .book-summary .price { color: var(--cr-accent); font-weight: 600; }
    .price-field { max-width: 200px; }

    .lab-code.small { font-size: 0.75rem; padding: 12px 14px; }
    .lab-lede.small { font-size: 0.875rem; max-width: 680px; }

    .stage-track { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
    .stage-node {
      display: grid;
      grid-template-columns: 14px minmax(180px, auto) 1fr;
      align-items: center;
      gap: 14px;
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      border: 1px solid transparent;
      opacity: 0.45;
      transition: opacity 0.25s ease, border-color 0.25s ease, background 0.25s ease;
    }
    .stage-node[data-state='active'],
    .stage-node[data-state='done'] { opacity: 1; background: var(--surface); border-color: var(--border); }
    .stage-node[data-state='active'] { border-color: var(--cr-warning); }
    .stage-node[data-state='done'] { border-color: color-mix(in srgb, var(--cr-success) 40%, var(--border)); }

    .node-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border-strong); }
    .stage-node[data-state='active'] .node-dot {
      background: var(--cr-warning);
      box-shadow: 0 0 8px color-mix(in srgb, var(--cr-warning) 60%, transparent);
      animation: node-pulse 0.8s ease-in-out infinite;
    }
    .stage-node[data-state='done'] .node-dot { background: var(--cr-success); }
    @media (prefers-reduced-motion: reduce) { .stage-node[data-state='active'] .node-dot { animation: none; } }
    @keyframes node-pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.6; } }

    .node-label { font-size: 0.8125rem; font-weight: 700; color: var(--text); }
    .node-detail { font-size: 0.75rem; color: var(--text-muted); }

    .log-line { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border); font-size: 0.8125rem; color: var(--text-faint); min-height: 1.2em; }

    .compare-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 640px) { .compare-grid { grid-template-columns: repeat(2, 1fr); } }
    .compare-card { padding: 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); }
    .compare-title { font-size: 0.875rem; font-weight: 700; color: var(--cr-cyan); margin: 0 0 6px; }
    .compare-desc { font-size: 0.8125rem; color: var(--text-muted); margin: 0 0 12px; }

    .lab-note { margin-top: 14px; font-size: 0.8125rem; color: var(--text-faint); }

    .attempt-grid { margin-top: 16px; display: grid; grid-template-columns: 1fr; gap: 12px; }
    @media (min-width: 560px) { .attempt-grid { grid-template-columns: repeat(2, 1fr); } }
    .attempt-card { padding: 14px 16px; background: var(--surface); border: 1px solid color-mix(in srgb, var(--cr-success) 35%, var(--border)); border-radius: var(--radius-sm); }
    .attempt-title { font-size: 0.75rem; color: var(--text-faint); margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.06em; }
    .attempt-req { font-size: 0.8125rem; color: var(--text-muted); margin: 0 0 6px; }
    .attempt-result { font-size: 0.8125rem; color: var(--text); margin: 0; }
    .attempt-result strong { color: var(--cr-success); }

    @media (max-width: 640px) {
      .stage-node { grid-template-columns: 10px 1fr; }
      .node-detail { display: none; }
    }
  `,
})
export class CrudPlaygroundUpdate implements OnDestroy {
  protected readonly stages = STAGES;
  protected readonly book = signal<Book>({ ...SEED_BOOKS[1] });

  protected readonly editing = signal(false);
  protected readonly draftPrice = signal(SEED_BOOKS[1].price);
  protected readonly isRunning = signal(false);
  protected readonly stageStates = signal<Record<StageId, StageState>>(this.idleStates());
  protected readonly logLine = signal('Click EDIT BOOK to change its price.');

  protected readonly idempotencyRunning = signal(false);
  protected readonly attempts = signal<{ n: number; resultPrice: number }[]>([]);

  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }

  protected patchPreview(): string {
    return `PATCH /api/books/${this.book().id}\n\n{ "price": ${this.draftPrice()} }`;
  }

  protected stateOf(id: StageId): StageState {
    return this.stageStates()[id] ?? 'pending';
  }

  protected startEdit(): void {
    this.draftPrice.set(this.book().price);
    this.editing.set(true);
  }

  protected cancelEdit(): void {
    this.editing.set(false);
  }

  protected saveChanges(): void {
    if (this.isRunning()) return;
    this.isRunning.set(true);
    this.stageStates.set(this.idleStates());
    const newPrice = this.draftPrice();
    this.logLine.set(`Saving PATCH /api/books/${this.book().id}…`);

    this.stages.forEach((stage, i) => {
      this.after(i * STEP_MS, () => {
        this.setState(stage.id, 'active');
        this.logLine.set(`${stage.label} — ${stage.detail}`);
        this.after(STEP_MS - 80, () => {
          this.setState(stage.id, 'done');
          if (i === this.stages.length - 1) {
            this.book.update((b) => ({ ...b, price: newPrice }));
            this.logLine.set('Row updated in place — same resource, new value.');
            this.isRunning.set(false);
            this.editing.set(false);
          }
        });
      });
    });
  }

  protected runIdempotencyDemo(): void {
    if (this.idempotencyRunning()) return;
    this.idempotencyRunning.set(true);
    this.attempts.set([]);
    this.book.update((b) => ({ ...b, price: 42 }));

    this.after(200, () => {
      this.book.update((b) => ({ ...b, price: 49 }));
      this.attempts.update((a) => [...a, { n: 1, resultPrice: 49 }]);
    });
    this.after(900, () => {
      this.book.update((b) => ({ ...b, price: 49 }));
      this.attempts.update((a) => [...a, { n: 2, resultPrice: 49 }]);
      this.idempotencyRunning.set(false);
    });
  }

  private setState(id: StageId, state: StageState): void {
    this.stageStates.update((s) => ({ ...s, [id]: state }));
  }

  private idleStates(): Record<StageId, StageState> {
    const record = {} as Record<StageId, StageState>;
    for (const s of STAGES) record[s.id] = 'pending';
    return record;
  }

  private after(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }
}
