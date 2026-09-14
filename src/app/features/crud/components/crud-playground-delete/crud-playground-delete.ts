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
  { id: 42, title: 'Clean Architecture', author: 'Robert C. Martin', genre: 'Architecture', price: 42 },
];

const STAGES: Stage[] = [
  { id: 'client', label: 'CLIENT', detail: 'delete confirmed' },
  { id: 'request', label: 'DELETE /api/books/{id}', detail: 'sent over the network' },
  { id: 'controller', label: 'CONTROLLER', detail: 'parses id' },
  { id: 'service', label: 'SERVICE', detail: 'checks the resource exists' },
  { id: 'repository', label: 'REPOSITORY', detail: 'issues the delete' },
  { id: 'database', label: 'DATABASE', detail: 'DELETE — row removed' },
  { id: 'response', label: '204 NO CONTENT', detail: 'resource is gone' },
];

interface Stage {
  id: StageId;
  label: string;
  detail: string;
}

const STEP_MS = 440;

@Component({
  selector: 'app-crud-playground-delete',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cr-scene" id="crud-delete">
      <div class="container">
        <p class="lab-index mono">08 — DELETE</p>
        <h2 class="lab-title">DELETE removes a resource, permanently.</h2>
        <p class="lab-lede">
          <span class="mono">DELETE /api/books/{{ '{' }}id{{ '}' }}</span> commonly returns
          <span class="mono">204 No Content</span> — there's nothing left to describe, so the server sends an empty
          body. Try deleting a book that exists, then one that doesn't.
        </p>

        <div class="lab-panel">
          <h3 class="panel-heading">Library</h3>
          @if (books().length === 0) {
            <p class="empty-line mono">No books left.</p>
          }
          <ul class="book-list">
            @for (b of books(); track b.id) {
              <li class="book-row">
                <div class="book-main">
                  <span class="book-title">{{ b.title }}</span>
                  <span class="book-author mono">{{ b.author }} &middot; #{{ b.id }}</span>
                </div>
                @if (pendingDeleteId() === b.id) {
                  <div class="confirm-box">
                    <span class="confirm-text">Delete &ldquo;{{ b.title }}&rdquo;?</span>
                    <button type="button" class="lab-btn" (click)="cancelDelete()">Cancel</button>
                    <button type="button" class="lab-btn lab-btn-danger" (click)="confirmDelete(b.id)" [disabled]="isRunning()">Delete</button>
                  </div>
                } @else {
                  <button type="button" class="lab-btn lab-btn-danger" (click)="askDelete(b.id)" [disabled]="isRunning()">Delete</button>
                }
              </li>
            }
          </ul>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" (click)="deleteMissing()" [disabled]="isRunning()">TRY DELETE /api/books/999</button>
            <button type="button" class="lab-btn" (click)="reset()" [disabled]="isRunning()">RESET</button>
          </div>
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

        @if (lastStatus()) {
          <div class="lab-panel result-panel" [attr.data-ok]="lastStatus() === 204">
            <h3 class="panel-heading">
              Response
              <span class="pill" [class.pill-yes]="lastStatus() === 204" [class.pill-no]="lastStatus() === 404">
                {{ lastStatus() }} {{ lastStatus() === 204 ? 'No Content' : 'Not Found' }}
              </span>
            </h3>
            <pre class="lab-code mono">{{ responseText() }}</pre>
            @if (lastStatus() === 204) {
              <p class="lab-note">
                <strong>Why no body?</strong> The resource no longer exists — there's nothing meaningful left to
                return, so the response body is empty and the status code alone carries the meaning.
              </p>
            }
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

    .empty-line { color: var(--text-faint); font-size: 0.8125rem; }
    .book-list { display: flex; flex-direction: column; gap: 4px; }
    .book-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 12px 14px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      flex-wrap: wrap;
    }
    .book-main { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .book-title { font-size: 0.9375rem; font-weight: 600; color: var(--text); }
    .book-author { font-size: 0.6875rem; color: var(--text-faint); }

    .confirm-box {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      background: color-mix(in srgb, var(--cr-danger) 10%, var(--surface));
      border: 1px solid var(--cr-danger);
      border-radius: var(--radius-sm);
    }
    .confirm-text { font-size: 0.8125rem; color: var(--text); }

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
    .stage-node[data-state='active'] { border-color: var(--cr-danger); }
    .stage-node[data-state='done'] { border-color: color-mix(in srgb, var(--cr-success) 40%, var(--border)); }

    .node-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border-strong); }
    .stage-node[data-state='active'] .node-dot {
      background: var(--cr-danger);
      box-shadow: 0 0 8px color-mix(in srgb, var(--cr-danger) 60%, transparent);
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
    .lab-note { margin-top: 14px; font-size: 0.8125rem; line-height: 1.6; color: var(--text-muted); max-width: 640px; }
    .lab-note strong { color: var(--text); }

    @media (max-width: 640px) {
      .stage-node { grid-template-columns: 10px 1fr; }
      .node-detail { display: none; }
    }
  `,
})
export class CrudPlaygroundDelete implements OnDestroy {
  protected readonly stages = STAGES;
  protected readonly books = signal<Book[]>([...SEED_BOOKS]);

  protected readonly pendingDeleteId = signal<number | null>(null);
  protected readonly isRunning = signal(false);
  protected readonly stageStates = signal<Record<StageId, StageState>>(this.idleStates());
  protected readonly logLine = signal('Click Delete on a book to begin.');
  protected readonly lastStatus = signal<number | null>(null);
  protected readonly responseText = signal('');

  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }

  protected stateOf(id: StageId): StageState {
    return this.stageStates()[id] ?? 'pending';
  }

  protected askDelete(id: number): void {
    this.pendingDeleteId.set(id);
  }

  protected cancelDelete(): void {
    this.pendingDeleteId.set(null);
  }

  protected confirmDelete(id: number): void {
    this.pendingDeleteId.set(null);
    this.runDelete(id);
  }

  protected deleteMissing(): void {
    this.runDelete(999);
  }

  private runDelete(id: number): void {
    if (this.isRunning()) return;
    this.isRunning.set(true);
    this.stageStates.set(this.idleStates());
    this.lastStatus.set(null);
    this.responseText.set('');
    this.logLine.set(`Sending DELETE /api/books/${id}…`);

    const exists = this.books().some((b) => b.id === id);

    this.stages.forEach((stage, i) => {
      const isTerminal = i === this.stages.length - 1;
      const label = isTerminal ? (exists ? '204 NO CONTENT' : '404 NOT FOUND') : stage.label;
      const shouldSkip = !exists && (stage.id === 'repository' || stage.id === 'database');

      this.after(i * STEP_MS, () => {
        if (shouldSkip) {
          this.logLine.set(`${stage.label} — skipped, nothing to look up.`);
          return;
        }
        this.setState(stage.id, 'active');
        this.logLine.set(!exists && stage.id === 'service'
          ? 'SERVICE — resource lookup failed, no such id.'
          : `${label} — ${stage.detail}`);
        this.after(STEP_MS - 80, () => {
          this.setState(stage.id, 'done');
          if (isTerminal) {
            this.finish(id, exists);
          }
        });
      });
    });
  }

  private finish(id: number, exists: boolean): void {
    if (exists) {
      this.books.update((list) => list.filter((b) => b.id !== id));
      this.lastStatus.set(204);
      this.responseText.set(`DELETE /api/books/${id}\n204 No Content\n\n(empty body)`);
      this.logLine.set('Row removed. Resource no longer addressable.');
    } else {
      this.lastStatus.set(404);
      this.responseText.set(`DELETE /api/books/${id}\n404 Not Found\n\n${JSON.stringify({ error: `Book ${id} not found` }, null, 2)}`);
      this.logLine.set(`No book with id ${id} — nothing to delete.`);
    }
    this.isRunning.set(false);
  }

  protected reset(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.isRunning.set(false);
    this.stageStates.set(this.idleStates());
    this.pendingDeleteId.set(null);
    this.lastStatus.set(null);
    this.responseText.set('');
    this.books.set([...SEED_BOOKS]);
    this.logLine.set('Click Delete on a book to begin.');
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
