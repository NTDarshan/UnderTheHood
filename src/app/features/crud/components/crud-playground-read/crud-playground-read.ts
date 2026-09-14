import { Component, OnDestroy, signal, computed } from '@angular/core';

type StageId = 'client' | 'request' | 'controller' | 'service' | 'repository' | 'query' | 'rows' | 'response';
type StageState = 'pending' | 'active' | 'done';
type Mode = 'list' | 'single';

interface Book {
  id: number;
  title: string;
  author: string;
  genre: string;
  price: number;
}

const SEED_BOOKS: Book[] = [
  { id: 1, title: 'Clean Code', author: 'Robert Martin', genre: 'Programming', price: 35 },
  { id: 2, title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', genre: 'Architecture', price: 49 },
];

const STAGES: Stage[] = [
  { id: 'client', label: 'CLIENT', detail: 'request triggered' },
  { id: 'request', label: 'GET request', detail: 'sent over the network' },
  { id: 'controller', label: 'CONTROLLER', detail: 'resolves route & params' },
  { id: 'service', label: 'SERVICE', detail: 'delegates to repository' },
  { id: 'repository', label: 'REPOSITORY', detail: 'builds a query' },
  { id: 'query', label: 'DATABASE QUERY', detail: 'SELECT executes' },
  { id: 'rows', label: 'ROWS &rarr; OBJECTS &rarr; JSON', detail: 'rows mapped back into objects, then serialized' },
  { id: 'response', label: 'RESPONSE', detail: 'JSON returned to browser' },
];

interface Stage {
  id: StageId;
  label: string;
  detail: string;
}

const STEP_MS = 420;

@Component({
  selector: 'app-crud-playground-read',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cr-scene" id="crud-read">
      <div class="container">
        <p class="lab-index mono">06 — READ</p>
        <h2 class="lab-title">READ fetches existing resources — one, or many.</h2>
        <p class="lab-lede">
          <span class="mono">GET /api/books</span> asks for the whole <strong>collection</strong>.
          <span class="mono">GET /api/books/{{ '{' }}id{{ '}' }}</span> asks for one specific
          <strong>resource</strong>. Same verb, different target — the URL shape tells the server which one you mean.
        </p>

        <div class="lab-panel">
          <h3 class="panel-heading">Request builder</h3>
          <div class="toggle-grid">
            <button type="button" class="lab-btn" [attr.aria-pressed]="mode() === 'list'" (click)="mode.set('list')">LIST — GET /api/books</button>
            <button type="button" class="lab-btn" [attr.aria-pressed]="mode() === 'single'" (click)="mode.set('single')">SINGLE — GET /api/books/{{ singleId() }}</button>
          </div>

          @if (mode() === 'single') {
            <label class="lab-field id-field">
              <span>Book id</span>
              <input type="number" [value]="singleId()" (input)="singleId.set(+$any($event.target).value)" />
            </label>
          }

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="loadBooks()" [disabled]="isRunning()">LOAD BOOKS</button>
            @if (mode() === 'list') {
              <button type="button" class="lab-btn lab-btn-danger" (click)="clearList()" [disabled]="isRunning()">CLEAR LIST (simulate empty)</button>
            }
            <button type="button" class="lab-btn" (click)="reset()" [disabled]="isRunning()">RESET</button>
          </div>
        </div>

        <div class="lab-panel">
          <h3 class="panel-heading">Pipeline</h3>
          <div class="stage-track">
            @for (stage of stages; track stage.id) {
              <div class="stage-node" [attr.data-state]="stateOf(stage.id)">
                <span class="node-dot" aria-hidden="true"></span>
                <span class="node-label mono" [innerHTML]="stage.label"></span>
                <span class="node-detail">{{ stage.detail }}</span>
              </div>
            }
          </div>
          <p class="log-line mono" aria-live="polite">{{ logLine() }}</p>
        </div>

        @if (responseJson()) {
          <div class="lab-panel result-panel" [attr.data-ok]="lastStatus() === 200">
            <h3 class="panel-heading">
              Response
              <span class="pill" [class.pill-yes]="lastStatus() === 200" [class.pill-no]="lastStatus() === 404">
                {{ lastStatus() }} {{ lastStatus() === 200 ? 'OK' : 'NOT FOUND' }}
              </span>
            </h3>
            <pre class="lab-code mono">{{ responseJson() }}</pre>
          </div>
        }
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

    .panel-heading { margin: 0 0 16px; font-size: 1.0625rem; color: var(--text); display: flex; align-items: center; gap: 10px; }
    .toggle-grid { display: flex; flex-wrap: wrap; gap: 10px; }
    .id-field { margin-top: 16px; max-width: 200px; }

    .stage-track { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
    .stage-node {
      display: grid;
      grid-template-columns: 14px minmax(160px, auto) 1fr;
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
    .stage-node[data-state='active'] { border-color: var(--cr-cyan); }
    .stage-node[data-state='done'] { border-color: color-mix(in srgb, var(--cr-success) 40%, var(--border)); }

    .node-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border-strong); }
    .stage-node[data-state='active'] .node-dot {
      background: var(--cr-cyan);
      box-shadow: 0 0 8px color-mix(in srgb, var(--cr-cyan) 60%, transparent);
      animation: node-pulse 0.8s ease-in-out infinite;
    }
    .stage-node[data-state='done'] .node-dot { background: var(--cr-success); }
    @media (prefers-reduced-motion: reduce) { .stage-node[data-state='active'] .node-dot { animation: none; } }
    @keyframes node-pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.6; } }

    .node-label { font-size: 0.8125rem; font-weight: 700; color: var(--text); }
    .node-detail { font-size: 0.75rem; color: var(--text-muted); }

    .log-line { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border); font-size: 0.8125rem; color: var(--text-faint); min-height: 1.2em; }

    .result-panel[data-ok='true'] { border-color: color-mix(in srgb, var(--cr-success) 35%, var(--border)); }
    .result-panel:not([data-ok='true']) { border-color: color-mix(in srgb, var(--cr-danger) 35%, var(--border)); }

    @media (max-width: 640px) {
      .stage-node { grid-template-columns: 10px 1fr; }
      .node-detail { display: none; }
    }
  `,
})
export class CrudPlaygroundRead implements OnDestroy {
  protected readonly stages = STAGES;

  protected readonly books = signal<Book[]>([...SEED_BOOKS]);
  protected readonly mode = signal<Mode>('list');
  protected readonly singleId = signal(1);

  protected readonly isRunning = signal(false);
  protected readonly stageStates = signal<Record<StageId, StageState>>(this.idleStates());
  protected readonly logLine = signal('Choose LIST or SINGLE, then click LOAD BOOKS.');
  protected readonly lastStatus = signal<number | null>(null);
  protected readonly lastResult = signal<Book[] | Book | null>(null);

  protected readonly responseJson = computed(() => {
    const status = this.lastStatus();
    if (status === null) return '';
    const result = this.lastResult();
    const path = this.mode() === 'list' ? '/api/books' : `/api/books/${this.singleId()}`;
    const statusLine = status === 200 ? '200 OK' : '404 Not Found';
    const body = status === 200 ? JSON.stringify(result, null, 2) : JSON.stringify({ error: `Book ${this.singleId()} not found` }, null, 2);
    return `GET ${path}\n${statusLine}\n\n${body}`;
  });

  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }

  protected stateOf(id: StageId): StageState {
    return this.stageStates()[id] ?? 'pending';
  }

  protected clearList(): void {
    this.books.set([]);
    this.logLine.set('List cleared locally — the next LIST request will come back empty.');
  }

  protected loadBooks(): void {
    if (this.isRunning()) return;
    this.isRunning.set(true);
    this.lastStatus.set(null);
    this.lastResult.set(null);
    this.stageStates.set(this.idleStates());

    const isList = this.mode() === 'list';
    const path = isList ? '/api/books' : `/api/books/${this.singleId()}`;
    this.logLine.set(`Requesting ${path}…`);

    this.stages.forEach((stage, i) => {
      this.after(i * STEP_MS, () => {
        this.setState(stage.id, 'active');
        this.logLine.set(`${this.stripTags(stage.label)} — ${stage.detail}`);
        this.after(STEP_MS - 70, () => {
          this.setState(stage.id, 'done');
          if (i === this.stages.length - 1) {
            this.finish(isList);
          }
        });
      });
    });
  }

  private finish(isList: boolean): void {
    if (isList) {
      const list = this.books();
      this.lastStatus.set(200);
      this.lastResult.set(list);
      this.logLine.set(list.length === 0 ? 'Query matched zero rows — 200 OK with an empty array.' : `Query returned ${list.length} row(s) — mapped to JSON.`);
    } else {
      const found = this.books().find((b) => b.id === this.singleId()) ?? null;
      if (found) {
        this.lastStatus.set(200);
        this.lastResult.set(found);
        this.logLine.set('Row found — mapped to a single JSON object.');
      } else {
        this.lastStatus.set(404);
        this.lastResult.set(null);
        this.logLine.set(`No row matched id ${this.singleId()} — repository returned nothing, so the API answers 404.`);
      }
    }
    this.isRunning.set(false);
  }

  protected reset(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.isRunning.set(false);
    this.stageStates.set(this.idleStates());
    this.lastStatus.set(null);
    this.lastResult.set(null);
    this.books.set([...SEED_BOOKS]);
    this.logLine.set('Choose LIST or SINGLE, then click LOAD BOOKS.');
  }

  private stripTags(s: string): string {
    return s.replace(/&rarr;/g, '->');
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
