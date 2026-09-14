import { Component, OnDestroy, signal } from '@angular/core';

type StageId = 'client' | 'request' | 'controller' | 'service' | 'repository' | 'database' | 'response';
type StageState = 'pending' | 'active' | 'done';

interface Stage {
  id: StageId;
  label: string;
  detail: string;
}

const STAGES: Stage[] = [
  { id: 'client', label: 'CLIENT', detail: 'form submitted' },
  { id: 'request', label: 'POST /api/books', detail: 'request sent over the network' },
  { id: 'controller', label: 'CONTROLLER', detail: 'parses & validates the body' },
  { id: 'service', label: 'SERVICE', detail: 'applies business rules' },
  { id: 'repository', label: 'REPOSITORY', detail: 'maps object to a row' },
  { id: 'database', label: 'DATABASE', detail: 'INSERT — row persisted, id assigned' },
  { id: 'response', label: '201 CREATED', detail: 'new resource returned to client' },
];

const STEP_MS = 480;

@Component({
  selector: 'app-crud-playground-create',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cr-scene" id="crud-create">
      <div class="container">
        <p class="lab-index mono">05 — CREATE</p>
        <h2 class="lab-title">CREATE adds a brand-new resource.</h2>
        <p class="lab-lede">
          <span class="mono tok-method">POST</span> is the method commonly used to create a new resource. The shape
          is always the same: request &rarr; server &rarr; database &rarr; new resource created — ending in
          <span class="mono">201 Created</span>.
        </p>

        <div class="lab-panel">
          <h3 class="panel-heading">New book</h3>
          <div class="form-grid">
            <label class="lab-field">
              <span>Title</span>
              <input type="text" [value]="title()" (input)="title.set($any($event.target).value)" />
            </label>
            <label class="lab-field">
              <span>Author</span>
              <input type="text" [value]="author()" (input)="author.set($any($event.target).value)" />
            </label>
            <label class="lab-field">
              <span>Genre</span>
              <input type="text" [value]="genre()" (input)="genre.set($any($event.target).value)" />
            </label>
            <label class="lab-field">
              <span>Price ($)</span>
              <input type="number" min="0" [value]="price()" (input)="price.set(+$any($event.target).value)" />
            </label>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="createBook()" [disabled]="isRunning()">
              CREATE BOOK
            </button>
            <button type="button" class="lab-btn" [attr.aria-pressed]="showRequest()" (click)="showRequest.set(!showRequest())">
              {{ showRequest() ? 'Hide' : 'Inspect' }} Request
            </button>
            <button type="button" class="lab-btn" (click)="reset()" [disabled]="isRunning()">RESET</button>
          </div>

          @if (showRequest()) {
            <pre class="lab-code mono">{{ requestJson() }}</pre>
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

        @if (createdBook()) {
          <div class="lab-panel result-panel">
            <h3 class="panel-heading">Response body</h3>
            <pre class="lab-code mono">{{ responseJson() }}</pre>
            <p class="lab-note">
              <strong>Why 201, not 200?</strong> A plain <span class="mono">200 OK</span> just says "the request
              worked" — it doesn't say what happened. <span class="mono">201 Created</span> explicitly signals that a
              new resource now exists, and it commonly pairs with a <span class="mono">Location</span> header
              pointing at where that new resource can be found (e.g. <span class="mono">/api/books/{{ createdBook()!.id }}</span>).
            </p>
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

    .panel-heading { margin: 0 0 16px; font-size: 1.0625rem; color: var(--text); }

    .form-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 640px) { .form-grid { grid-template-columns: repeat(2, 1fr); } }

    .tok-method { color: var(--cr-accent); font-weight: 600; }

    .stage-track { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
    .stage-node {
      display: grid;
      grid-template-columns: 14px minmax(140px, auto) 1fr;
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
    .stage-node[data-state='active'] { border-color: var(--cr-accent); }
    .stage-node[data-state='done'] { border-color: color-mix(in srgb, var(--cr-success) 40%, var(--border)); }

    .node-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border-strong); }
    .stage-node[data-state='active'] .node-dot {
      background: var(--cr-accent);
      box-shadow: 0 0 8px color-mix(in srgb, var(--cr-accent) 60%, transparent);
      animation: node-pulse 0.8s ease-in-out infinite;
    }
    .stage-node[data-state='done'] .node-dot { background: var(--cr-success); }
    @media (prefers-reduced-motion: reduce) { .stage-node[data-state='active'] .node-dot { animation: none; } }
    @keyframes node-pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.6; } }

    .node-label { font-size: 0.8125rem; font-weight: 700; color: var(--text); }
    .node-detail { font-size: 0.75rem; color: var(--text-muted); }

    .log-line { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border); font-size: 0.8125rem; color: var(--text-faint); min-height: 1.2em; }

    .result-panel { border-color: color-mix(in srgb, var(--cr-success) 35%, var(--border)); }
    .lab-note { margin-top: 14px; font-size: 0.8125rem; line-height: 1.6; color: var(--text-muted); max-width: 640px; }
    .lab-note strong { color: var(--text); }

    @media (max-width: 640px) {
      .stage-node { grid-template-columns: 10px 1fr; }
      .node-detail { display: none; }
    }
  `,
})
export class CrudPlaygroundCreate implements OnDestroy {
  protected readonly stages = STAGES;

  protected readonly title = signal('Clean Architecture');
  protected readonly author = signal('Robert C. Martin');
  protected readonly genre = signal('Architecture');
  protected readonly price = signal(42);

  protected readonly showRequest = signal(false);
  protected readonly isRunning = signal(false);
  protected readonly stageStates = signal<Record<StageId, StageState>>(this.idleStates());
  protected readonly logLine = signal('Fill in the form and click CREATE BOOK.');
  protected readonly createdBook = signal<{ id: number; title: string; author: string; genre: string; price: number } | null>(null);

  private nextId = 103;
  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }

  protected requestJson(): string {
    return [
      'POST /api/books',
      'Content-Type: application/json',
      '',
      JSON.stringify(
        { title: this.title(), author: this.author(), genre: this.genre(), price: this.price() },
        null,
        2,
      ),
    ].join('\n');
  }

  protected responseJson(): string {
    const book = this.createdBook();
    if (!book) return '';
    return `201 Created\nLocation: /api/books/${book.id}\n\n${JSON.stringify(book, null, 2)}`;
  }

  protected stateOf(id: StageId): StageState {
    return this.stageStates()[id] ?? 'pending';
  }

  protected createBook(): void {
    if (this.isRunning()) return;
    this.isRunning.set(true);
    this.createdBook.set(null);
    this.stageStates.set(this.idleStates());
    this.logLine.set('Submitting form…');

    const book = {
      id: this.nextId++,
      title: this.title() || 'Untitled',
      author: this.author() || 'Unknown',
      genre: this.genre() || 'General',
      price: this.price() || 0,
    };

    this.stages.forEach((stage, i) => {
      this.after(i * STEP_MS, () => {
        this.setState(stage.id, 'active');
        this.logLine.set(`${stage.label} — ${stage.detail}`);
        this.after(STEP_MS - 80, () => {
          this.setState(stage.id, 'done');
          if (i === this.stages.length - 1) {
            this.createdBook.set(book);
            this.logLine.set('Book created. New resource is now addressable at its own URL.');
            this.isRunning.set(false);
          }
        });
      });
    });
  }

  protected reset(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.isRunning.set(false);
    this.stageStates.set(this.idleStates());
    this.createdBook.set(null);
    this.logLine.set('Fill in the form and click CREATE BOOK.');
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
