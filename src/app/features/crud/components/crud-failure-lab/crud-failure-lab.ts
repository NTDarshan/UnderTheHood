import { Component, computed, signal } from '@angular/core';

interface FailureScenario {
  id: string;
  label: string;
  request: string;
  failurePoint: string;
  status: string;
  statusClass: 'err-4' | 'err-5';
  takeaway: string;
  note?: string;
}

const SCENARIOS: FailureScenario[] = [
  {
    id: 'not-found',
    label: 'Book doesn’t exist',
    request: 'GET /api/books/999',
    failurePoint: 'Database: no matching row for id = 999',
    status: '404 Not Found',
    statusClass: 'err-4',
    takeaway: 'The request was well-formed, but there is nothing at that address. Stop retrying with the same id.',
  },
  {
    id: 'invalid-input',
    label: 'Invalid input',
    request: 'POST /api/books\n{ "title": "Dune", "price": -12 }',
    failurePoint: 'Validation layer: price must be ≥ 0',
    status: '400 Bad Request',
    statusClass: 'err-4',
    takeaway: 'The server never even tried to touch the database — fix the payload and resend.',
  },
  {
    id: 'duplicate',
    label: 'Duplicate resource',
    request: 'POST /api/books\n{ "isbn": "978-0-441-17271-9", ... }',
    failurePoint: 'Database: unique constraint on isbn already satisfied',
    status: '409 Conflict',
    statusClass: 'err-4',
    takeaway: 'This resource already exists — the client should fetch and update it instead of creating a new one.',
  },
  {
    id: 'db-unavailable',
    label: 'Database unavailable',
    request: 'POST /api/books\n{ "title": "Project Hail Mary", ... }',
    failurePoint: 'Connection pool: could not reach the database',
    status: '503 Service Unavailable',
    statusClass: 'err-5',
    takeaway: 'Nothing was written. This is transient — safe to retry with backoff, unlike a 4xx.',
  },
  {
    id: 'concurrent-update',
    label: 'Concurrent update',
    request: 'PATCH /api/books/42  (racing with another PATCH /api/books/42)',
    failurePoint: 'Two writers, one row, no coordination',
    status: '409 Conflict (or a silent lost update)',
    statusClass: 'err-4',
    takeaway: 'Two clients edited the same row at once. Full breakdown in the next section — Concurrent Updates.',
  },
  {
    id: 'unauthorized',
    label: 'Unauthorized user',
    request: 'DELETE /api/books/42\n(no credentials attached)',
    failurePoint: 'Auth middleware: no identity on the request',
    status: '401 Unauthorized',
    statusClass: 'err-4',
    takeaway: 'No one was proven to be logged in. Note: an authenticated user who simply lacks permission gets 403 Forbidden instead — different failure, different fix.',
  },
  {
    id: 'constraint',
    label: 'Database constraint failure',
    request: 'POST /api/books\n{ "title": "Untitled", "author": null }',
    failurePoint: 'Database: NOT NULL constraint on author violated',
    status: '400 Bad Request',
    statusClass: 'err-4',
    takeaway: 'Ideally caught by validation before it reaches SQL — when it isn’t, the database’s rejection should still be reported as a client error, not a 500.',
    note: 'A constraint violation the API layer failed to anticipate (e.g. a foreign key to a genre that was deleted mid-request) can also surface as 500 Internal Server Error — the honest answer depends on whether the failure was foreseeable input, or the server’s own bookkeeping falling out of sync.',
  },
];

@Component({
  selector: 'app-crud-failure-lab',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cr-scene" id="crud-failure-lab">
      <div class="container">
        <p class="lab-index mono">12 — WHAT CAN GO WRONG?</p>
        <h2 class="lab-title">Seven ways a CRUD request fails</h2>
        <p class="lab-lede">
          Every operation above assumed the happy path. Pick a scenario below to see where it actually breaks —
          the request that was sent, the point it failed, the status code that comes back, and what the client is
          supposed to learn from it.
        </p>

        <div class="lab-panel">
          <div class="scenario-pills">
            @for (s of scenarios; track s.id) {
              <button
                type="button"
                class="lab-btn"
                [attr.aria-pressed]="activeId() === s.id"
                (click)="activeId.set(s.id)"
              >
                {{ s.label }}
              </button>
            }
          </div>

          @if (active(); as s) {
            <div class="flow">
              <div class="flow-step">
                <p class="lab-node">Request</p>
                <pre class="lab-code mono step-code">{{ s.request }}</pre>
              </div>
              <span class="flow-arrow" aria-hidden="true">↓</span>
              <div class="flow-step">
                <p class="lab-node">Failure point</p>
                <p class="step-text mono">{{ s.failurePoint }}</p>
              </div>
              <span class="flow-arrow" aria-hidden="true">↓</span>
              <div class="flow-step">
                <p class="lab-node">Response</p>
                <span class="pill status-pill" [class]="s.statusClass">{{ s.status }}</span>
              </div>
            </div>

            <p class="takeaway mono-label">WHAT THE CLIENT SHOULD UNDERSTAND</p>
            <p class="lab-note takeaway-text">{{ s.takeaway }}</p>

            @if (s.note) {
              <p class="lab-note lab-note-warn">{{ s.note }}</p>
            }
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

    .scenario-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .flow {
      margin-top: 28px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    .flow-step {
      width: 100%;
    }

    .step-code {
      margin-top: 8px;
      white-space: pre-wrap;
    }

    .step-text {
      margin-top: 8px;
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .flow-arrow {
      color: var(--text-faint);
      font-size: 1rem;
      padding: 4px 0 4px 4px;
    }

    .status-pill {
      margin-top: 8px;
      font-size: 0.8125rem;
      padding: 6px 14px;
    }

    .status-pill.err-4 {
      color: var(--cr-warning);
      border-color: color-mix(in srgb, var(--cr-warning) 45%, var(--border-strong));
    }

    .status-pill.err-5 {
      color: var(--cr-danger);
      border-color: color-mix(in srgb, var(--cr-danger) 45%, var(--border-strong));
    }

    .mono-label {
      margin-top: 24px;
      font-family: var(--font-mono);
      font-size: 0.6875rem;
      letter-spacing: 0.08em;
      color: var(--cr-cyan);
    }

    .takeaway-text {
      margin-top: 6px;
    }

    @media (prefers-reduced-motion: reduce) {
      .flow-step {
        transition: none;
      }
    }
  `,
})
export class CrudFailureLab {
  protected readonly scenarios = SCENARIOS;
  protected readonly activeId = signal(SCENARIOS[0].id);
  protected readonly active = computed(() => this.scenarios.find((s) => s.id === this.activeId()) ?? null);
}
