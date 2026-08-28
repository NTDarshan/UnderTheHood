import { Component, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

interface CheckRow {
  pattern: string;
  status: 'pending' | 'checking' | 'rejected';
}

const CANDIDATE_ROUTES = ['/users', '/products/{id}', '/orders/{id}', '/users/{id}/orders'];

@Component({
  selector: 'app-catchall-404',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="catch-all">
      <div class="container">
        <p class="lab-index">ROUTING / 13 — CATCH-ALL / WILDCARD ROUTES</p>
        <h2 class="lab-title">A fallback for everything nothing else claimed.</h2>
        <p class="lab-lede">
          A catch-all route — conceptually <span class="mono">{{ '/{*path}' }}</span> — matches whatever is
          left over after every more specific route has had its chance.
        </p>

        <app-explain-simply>
          It's the "General Inquiries" desk at the very end of a building directory — everyone who didn't
          find a more specific department ends up there.
        </app-explain-simply>

        <div class="catchall-flow">
          <div class="catchall-node mono">/something-that-does-not-exist</div>
          <span class="flow-arrow" aria-hidden="true">↓</span>
          <div class="catchall-node muted mono">No specific route matches</div>
          <span class="flow-arrow" aria-hidden="true">↓</span>
          <div class="catchall-node accent mono">{{ '/{*path}' }} catch-all</div>
          <span class="flow-arrow" aria-hidden="true">↓</span>
          <div class="catchall-node handler mono">Fallback handler</div>
        </div>

        <p class="lab-note lab-note-warn">
          A catch-all must sit at the <strong>end</strong> of the route table. Placed earlier, it would
          shadow every specific route below it — the same ordering hazard from the Route Ordering section,
          just at maximum scale.
        </p>
      </div>
    </section>

    <section class="lab-section" id="not-found">
      <div class="container">
        <p class="lab-index">ROUTING / 14 — 404 / NO ROUTE MATCHED</p>
        <h2 class="lab-title">404 is a routing outcome, not just an error message.</h2>
        <p class="lab-lede">
          It's what happens when every candidate route was checked and none of them applied — including
          any catch-all, if one exists.
        </p>

        <p class="scenario mono">Request: <span class="accent">GET /does-not-exist</span> (no catch-all in this table)</p>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn lab-btn-primary" (click)="run()" [disabled]="running()">
            {{ running() ? 'Checking…' : 'Run Request' }}
          </button>
        </div>

        <ol class="check-list">
          @for (row of rows(); track row.pattern) {
            <li [class]="'row-' + row.status">
              <span class="mono">{{ row.pattern }}</span>
              @if (row.status === 'checking') {
                <span class="row-mark checking">checking…</span>
              } @else if (row.status === 'rejected') {
                <span class="row-mark rejected">✕ no match</span>
              }
            </li>
          }
        </ol>

        @if (done()) {
          <div class="result-404">
            <p class="result-404-heading mono">No route matched</p>
            <p class="result-404-code mono">404 Not Found</p>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .catchall-flow {
      margin-top: 28px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }

    .catchall-node {
      padding: 10px 16px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-strong);
      background: var(--surface-raised);
      color: var(--text-muted);
      font-size: 0.8125rem;
    }

    .catchall-node.muted {
      color: var(--text-faint);
    }

    .catchall-node.accent {
      color: var(--accent);
      border-color: var(--accent-dim);
    }

    .catchall-node.handler {
      color: var(--accent-2);
      border-color: var(--accent-2-dim);
    }

    .flow-arrow {
      color: var(--border-strong);
      margin-left: 12px;
    }

    .scenario {
      margin-top: 24px;
      font-size: 0.9375rem;
      color: var(--text-muted);
    }

    .accent {
      color: var(--accent);
    }

    .check-list {
      margin-top: 24px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .check-list li {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--surface-raised);
      color: var(--text-faint);
      font-size: 0.8125rem;
      opacity: 0.5;
      transition: opacity 0.3s ease, border-color 0.3s ease;
    }

    .check-list li.row-checking,
    .check-list li.row-rejected {
      opacity: 1;
    }

    .check-list li.row-rejected {
      border-color: color-mix(in srgb, var(--danger) 40%, var(--border));
    }

    .row-mark.checking {
      color: var(--accent);
    }

    .row-mark.rejected {
      color: var(--danger);
    }

    .result-404 {
      margin-top: 20px;
      padding: 18px;
      border-radius: var(--radius-md);
      border: 1px solid var(--danger);
      background: color-mix(in srgb, var(--danger) 8%, var(--surface-raised));
    }

    .result-404-heading {
      color: var(--danger);
      font-weight: 700;
      font-size: 0.875rem;
    }

    .result-404-code {
      margin-top: 4px;
      color: var(--danger);
      font-size: 0.8125rem;
    }
  `,
})
export class Catchall404 {
  protected readonly rows = signal<CheckRow[]>(CANDIDATE_ROUTES.map((pattern) => ({ pattern, status: 'pending' })));
  protected readonly running = signal(false);
  protected readonly done = signal(false);

  async run(): Promise<void> {
    if (this.running()) return;
    this.running.set(true);
    this.done.set(false);
    this.rows.set(CANDIDATE_ROUTES.map((pattern) => ({ pattern, status: 'pending' })));

    for (let i = 0; i < CANDIDATE_ROUTES.length; i++) {
      this.rows.update((rs) => rs.map((r, idx) => (idx === i ? { ...r, status: 'checking' } : r)));
      await new Promise((r) => setTimeout(r, 350));
      this.rows.update((rs) => rs.map((r, idx) => (idx === i ? { ...r, status: 'rejected' } : r)));
    }

    this.done.set(true);
    this.running.set(false);
  }
}
