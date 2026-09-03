import { Component, signal } from '@angular/core';

type ServerState = 'running' | 'killed';

interface HardRequest {
  id: number;
  label: string;
}

const REQUESTS: HardRequest[] = [
  { id: 101, label: 'processing request body' },
  { id: 102, label: 'reading from database' },
  { id: 103, label: 'waiting on external API' },
  { id: 104, label: 'writing response' },
];

@Component({
  selector: 'app-hard-shutdown-lab',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section gs-scene hard-scene" id="gs-hard-lab">
      <div class="container">
        <p class="lab-index">02 — HARD SHUTDOWN</p>
        <h2 class="lab-title">SIGKILL: the process just stops existing</h2>
        <p class="lab-lede">
          Send a hard kill signal and the operating system tears the process down immediately. There is no chance
          for the application to react — whatever it was doing is simply gone.
        </p>

        <div class="lab-panel hard-panel" [class.is-flash]="flashing()">
          <div class="server-status-row">
            <span class="pill" [class.pill-yes]="serverState() === 'running'" [class.pill-no]="serverState() === 'killed'">
              SERVER: {{ serverState() === 'running' ? 'RUNNING' : 'PROCESS TERMINATED' }}
            </span>
            @if (serverState() === 'killed') {
              <span class="kill-line mono" aria-live="assertive">Process terminated.</span>
            }
          </div>

          <div class="request-list" role="list" aria-label="In-flight requests">
            @for (req of requests; track req.id) {
              <div class="request-row" [class.is-dead]="serverState() === 'killed'" role="listitem">
                <span class="req-id mono">REQ {{ req.id }}</span>
                <span class="req-arrow mono">&rarr;</span>
                <span class="req-label mono">{{ req.label }}</span>
                @if (serverState() === 'killed') {
                  <span class="req-mark mono" aria-label="failed">&#10007;</span>
                } @else {
                  <span class="req-mark mono req-mark-pending" aria-label="in progress">&#9679;</span>
                }
              </div>
            }
            <div class="request-row job-row" [class.is-dead]="serverState() === 'killed'" role="listitem">
              <span class="req-id mono">JOB</span>
              <span class="req-arrow mono">&rarr;</span>
              <span class="req-label mono">background export job</span>
              @if (serverState() === 'killed') {
                <span class="pill pill-no small">ABANDONED</span>
              } @else {
                <span class="req-mark mono req-mark-pending" aria-label="in progress">&#9679;</span>
              }
            </div>
          </div>

          @if (serverState() === 'killed') {
            <p class="client-line mono" aria-live="polite">CLIENT STATE: CONNECTION CLOSED</p>
          }

          <div class="lab-btn-row">
            <button
              type="button"
              class="lab-btn lab-btn-danger"
              (click)="kill()"
              [disabled]="serverState() === 'killed'"
            >
              SIGKILL / HARD STOP
            </button>
            <button type="button" class="lab-btn" (click)="reset()" [disabled]="serverState() === 'running'">
              Reset
            </button>
          </div>
        </div>

        <p class="lab-note-warn">
          Hard shutdown does not automatically mean database corruption. What actually happens to each piece of
          in-flight work depends on the operation, the transaction semantics involved, any external systems it
          touched, and the runtime's own behavior on exit. A single-statement write inside a transaction may simply
          roll back cleanly. A multi-step operation without transactional guarantees, or a call that already reached
          an external system (like a payment provider) before the kill, can be left in an inconsistent state. The
          one guarantee is that real work in flight is lost or interrupted — not that every case ends in disaster.
        </p>
      </div>
    </section>
  `,
  styles: `
    .hard-scene {
      --running: #4ade80;
      --draining: var(--accent);
      --stopped: var(--danger);
      --idle: #64748b;
      --signal: #a78bfa;
      --resource: #60a5fa;
      --queue: #fbbf24;
      --cancelled: #f472b6;
    }

    .hard-panel { transition: background 0.06s linear, border-color 0.15s ease; }
    .hard-panel.is-flash {
      background: color-mix(in srgb, var(--stopped) 35%, var(--surface));
      border-color: var(--stopped);
    }
    @media (prefers-reduced-motion: reduce) {
      .hard-panel.is-flash { background: color-mix(in srgb, var(--stopped) 18%, var(--surface)); }
    }

    .server-status-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .kill-line { color: var(--stopped); font-weight: 700; font-size: 0.8125rem; }

    .request-list { display: flex; flex-direction: column; gap: 8px; margin-top: 18px; }
    .request-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      background: var(--surface-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
    }
    .request-row.is-dead {
      border-color: var(--stopped);
      background: color-mix(in srgb, var(--stopped) 10%, var(--surface-elevated));
    }
    .req-id { font-size: 0.75rem; color: var(--text); font-weight: 700; min-width: 56px; }
    .req-arrow { color: var(--text-faint); }
    .req-label { font-size: 0.75rem; color: var(--text-muted); flex: 1; }
    .req-mark { margin-left: auto; font-size: 0.875rem; color: var(--stopped); font-weight: 700; }
    .req-mark-pending { color: var(--running); animation: dotPulse 1s ease-in-out infinite; }
    @media (prefers-reduced-motion: reduce) {
      .req-mark-pending { animation: none; }
    }
    @keyframes dotPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.35; }
    }

    .small { font-size: 0.625rem; padding: 3px 8px; margin-left: auto; }

    .client-line { margin-top: 16px; color: var(--stopped); font-size: 0.8125rem; font-weight: 700; letter-spacing: 0.04em; }
  `,
})
export class HardShutdownLab {
  protected readonly requests = REQUESTS;
  protected readonly serverState = signal<ServerState>('running');
  protected readonly flashing = signal(false);

  private flashTimer: ReturnType<typeof setTimeout> | null = null;

  protected kill(): void {
    if (this.serverState() === 'killed') return;
    this.flashing.set(true);
    this.serverState.set('killed');
    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => this.flashing.set(false), 160);
  }

  protected reset(): void {
    if (this.flashTimer) {
      clearTimeout(this.flashTimer);
      this.flashTimer = null;
    }
    this.flashing.set(false);
    this.serverState.set('running');
  }
}
