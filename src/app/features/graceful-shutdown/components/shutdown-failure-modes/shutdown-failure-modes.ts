import { Component, signal } from '@angular/core';

interface FailureMode {
  id: string;
  title: string;
  consequence: string;
  explanation: string;
}

const FAILURE_MODES: FailureMode[] = [
  {
    id: 'no-readiness',
    title: 'No readiness transition',
    consequence: 'New traffic keeps arriving during shutdown.',
    explanation:
      'If the instance never flips to "not ready" before the process starts winding down, load balancers keep routing fresh requests to it right up until the connection is refused. Fix it by marking the instance unready — and waiting for that to propagate — before touching the application at all.',
  },
  {
    id: 'close-db-early',
    title: 'Close DB too early',
    consequence: 'Active requests fail mid-flight.',
    explanation:
      'Database pools and other shared resources are often closed as the very first shutdown step because it feels tidy. But requests already in progress still need them. Close shared resources only after in-flight work has actually finished, not on the way in.',
  },
  {
    id: 'wait-forever',
    title: 'Wait forever',
    consequence: 'The deployment hangs indefinitely.',
    explanation:
      'Draining "until everything is done" with no upper bound means one stuck connection, one long-poll, or one leaked handle can block the shutdown forever, stalling deploys and rollouts behind it. Always pair draining with a bounded grace period and a fallback.',
  },
  {
    id: 'timeout-too-short',
    title: 'Timeout too short',
    consequence: 'Valid, legitimate work gets interrupted.',
    explanation:
      'Overcorrecting for "wait forever" by setting an aggressive grace period cuts off requests and jobs that were going to finish fine on their own. Size the grace period from real p99 request/job duration, not a guess, and monitor how often it is actually reached.',
  },
  {
    id: 'no-cancellation',
    title: 'No cancellation',
    consequence: 'Shutdown stalls waiting on work that will never yield.',
    explanation:
      'A grace period only helps if the work inside it can actually be told to stop. Without a cancellation signal wired into request handlers, loops, and long-running jobs, the timeout just expires uselessly and the process gets killed anyway — with none of the graceful benefits.',
  },
  {
    id: 'unsafe-retry',
    title: 'Unsafe retry',
    consequence: 'Duplicate side effects on the client or downstream.',
    explanation:
      'When a shutting-down instance drops a connection mid-request, clients or upstream retries often resend it. If the original request already partially completed (e.g. a payment charged, a row inserted) and the handler is not idempotent, the retry duplicates the effect. Design mutating operations to be safely retryable.',
  },
  {
    id: 'stop-worker-incorrectly',
    title: 'Stop worker incorrectly',
    consequence: 'In-progress work may be lost or corrupted.',
    explanation:
      'Killing a background worker process without letting it acknowledge, checkpoint, or requeue the job it is holding means that job simply vanishes — or gets left in a half-done state. Workers need their own drain path: stop pulling new jobs, finish or safely requeue the current one, then exit.',
  },
  {
    id: 'no-observability',
    title: 'No observability',
    consequence: 'Incidents are hard to diagnose after the fact.',
    explanation:
      'Without logs or metrics around each shutdown phase — signal received, drain started, drain completed, forced kill — a bad rollout just looks like "some requests failed" with no way to tell which phase caused it. Emit structured events for every phase transition so shutdown-related incidents are debuggable.',
  },
];

@Component({
  selector: 'app-shutdown-failure-modes',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section gs-scene sf-scene" id="gs-failure-modes">
      <div class="container">
        <p class="lab-index">27 — SHUTDOWN FAILURE MODES</p>
        <h2 class="lab-title">Eight ways graceful shutdown quietly breaks in production</h2>
        <p class="lab-lede">
          Each of these looks fine in a demo and fails only under real traffic, real timing, and real load. Click a
          card to see why it happens and how to avoid it.
        </p>

        <div class="failure-grid">
          @for (mode of failureModes; track mode.id) {
            <button
              type="button"
              class="failure-card"
              [class.is-expanded]="isExpanded(mode.id)"
              [attr.aria-expanded]="isExpanded(mode.id)"
              [attr.aria-controls]="'detail-' + mode.id"
              (click)="toggle(mode.id)"
            >
              <div class="card-head">
                <p class="mono card-title">{{ mode.title }}</p>
                <span class="card-toggle mono" aria-hidden="true">{{ isExpanded(mode.id) ? '−' : '+' }}</span>
              </div>
              <p class="card-consequence">{{ mode.consequence }}</p>
              @if (isExpanded(mode.id)) {
                <p class="card-detail" [id]="'detail-' + mode.id">{{ mode.explanation }}</p>
              }
            </button>
          }
        </div>

        <p class="lab-note">
          None of these are exotic — they are the default outcome of not deliberately designing a shutdown path.
          Graceful shutdown is a small, specific checklist, not something that happens automatically.
        </p>
      </div>
    </section>
  `,
  styles: `
    .gs-scene {
      --running: #4ade80;
      --draining: var(--accent);
      --stopped: var(--danger);
      --idle: #64748b;
      --signal: #a78bfa;
      --resource: #60a5fa;
      --queue: #fbbf24;
      --cancelled: #f472b6;
    }

    .failure-grid {
      margin-top: 32px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 14px;
    }

    .failure-card {
      text-align: left;
      font-family: var(--font-sans);
      padding: 18px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-strong);
      background: var(--surface-raised);
      color: var(--text);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: border-color 0.2s ease, background 0.2s ease;
    }
    .failure-card:hover {
      border-color: var(--accent);
    }
    .failure-card:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
    .failure-card.is-expanded {
      border-color: var(--accent-2);
      background: color-mix(in srgb, var(--accent-2) 6%, var(--surface-raised));
    }

    .card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
    .card-title { font-size: 0.8125rem; letter-spacing: 0.02em; color: var(--accent-2); }
    .card-toggle { font-size: 1rem; color: var(--text-faint); line-height: 1; flex: none; }

    .card-consequence { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; }
    .card-detail {
      margin-top: 4px;
      padding-top: 12px;
      border-top: 1px solid var(--border);
      font-size: 0.8125rem;
      color: var(--text-muted);
      line-height: 1.6;
    }
  `,
})
export class ShutdownFailureModes {
  protected readonly failureModes = FAILURE_MODES;
  private readonly expandedId = signal<string | null>(null);

  protected isExpanded(id: string): boolean {
    return this.expandedId() === id;
  }

  protected toggle(id: string): void {
    this.expandedId.update((current) => (current === id ? null : id));
  }
}
