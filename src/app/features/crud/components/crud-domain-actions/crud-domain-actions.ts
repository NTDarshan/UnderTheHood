import { Component, signal } from '@angular/core';

interface DomainAction {
  id: string;
  title: string;
  method: string;
  url: string;
  response: string;
  why: string;
  crudAttempt: string;
  crudProblem: string;
}

const ACTIONS: DomainAction[] = [
  {
    id: 'archive',
    title: 'Archive a book',
    method: 'POST',
    url: '/api/books/42/archive',
    response: '200 OK',
    why: 'Archiving is a business transition, not a field edit. The endpoint name says exactly what happens.',
    crudAttempt: 'PATCH /api/books/42 { "status": "archived" }',
    crudProblem: 'Works, but hides the real rule: archiving might also revoke checkouts or fire a notification. A field patch looks like a data edit, not an event.',
  },
  {
    id: 'restore',
    title: 'Restore a book',
    method: 'POST',
    url: '/api/books/42/restore',
    response: '200 OK',
    why: 'The reverse of archive deserves its own name too — "restore" is a decision, not just flipping a flag back.',
    crudAttempt: 'PATCH /api/books/42 { "status": "in-stock" }',
    crudProblem: 'Nothing stops a client from setting status to any string at all. The domain action can validate the transition is even legal.',
  },
  {
    id: 'checkout',
    title: 'Check out a book',
    method: 'POST',
    url: '/api/books/42/checkout',
    response: '201 Created',
    why: 'Checking out a book creates a loan record, checks availability, and changes the book — one action, several effects.',
    crudAttempt: 'PATCH /api/books/42 { "status": "checked-out" }',
    crudProblem: 'A single PATCH cannot express "create a loan, only if a copy is available, tied to this borrower." That is a workflow, not a field write.',
  },
];

@Component({
  selector: 'app-crud-domain-actions',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cr-scene" id="crud-domain-actions">
      <div class="container">
        <p class="lab-index mono">10 — WHEN CRUD ISN'T ENOUGH</p>
        <h2 class="lab-title">Not every action is a field you overwrite</h2>
        <p class="lab-lede">
          CRUD is not always simple. Some things a Book does — being archived, being restored, being checked out —
          are business events, not edits. Forcing them into PUT/PATCH/DELETE hides what actually happened.
          Sometimes a domain action — a POST to a verb-like sub-resource — says it more clearly.
        </p>

        <div class="lab-panel">
          <div class="action-grid">
            @for (a of actions; track a.id) {
              <div class="action-card" [class.is-open]="open() === a.id">
                <button type="button" class="action-head" [attr.aria-expanded]="open() === a.id" (click)="toggle(a.id)">
                  <span class="action-title">{{ a.title }}</span>
                  <span class="action-toggle mono" aria-hidden="true">{{ open() === a.id ? '−' : '+' }}</span>
                </button>
                <p class="lab-code action-code">
                  <span class="tok-method">{{ a.method }}</span>
                  <span class="tok-key">{{ a.url }}</span>
                  <br /><span class="tok-dim">&darr;</span>
                  <br /><span class="tok-status-ok">{{ a.response }}</span>
                </p>
                <p class="action-why">{{ a.why }}</p>

                @if (open() === a.id) {
                  <div class="action-compare">
                    <p class="compare-label mono">THE CRUD-ONLY VERSION</p>
                    <p class="lab-code compare-code">{{ a.crudAttempt }}</p>
                    <p class="compare-problem">{{ a.crudProblem }}</p>
                  </div>
                }
              </div>
            }
          </div>

          <p class="lab-note lab-note-warn">
            This is not permission to invent a verb for everything. Reach for a domain action when a state change
            carries real business meaning that a field update would bury — most changes still belong in plain CRUD.
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

    .action-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media (min-width: 860px) { .action-grid { grid-template-columns: repeat(3, 1fr); } }

    .action-card { display: flex; flex-direction: column; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-md); padding: 18px; transition: border-color 0.2s ease; }
    .action-card.is-open { border-color: var(--cr-violet); }

    .action-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; text-align: left; color: var(--text); }
    .action-title { font-size: 0.9375rem; font-weight: 600; }
    .action-toggle { color: var(--cr-violet); font-size: 1rem; flex-shrink: 0; }

    .action-code { margin-top: 12px; font-size: 0.75rem; padding: 12px 14px; }
    .action-why { margin-top: 10px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.55; }

    .action-compare { margin-top: 16px; padding-top: 14px; border-top: 1px dashed var(--border-strong); }
    .compare-label { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--text-faint); }
    .compare-code { margin-top: 8px; font-size: 0.75rem; padding: 10px 12px; color: var(--cr-warning); }
    .compare-problem { margin-top: 8px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.55; }
  `,
})
export class CrudDomainActions {
  protected readonly actions = ACTIONS;
  protected readonly open = signal<string | null>(null);

  protected toggle(id: string): void {
    this.open.set(this.open() === id ? null : id);
  }
}
