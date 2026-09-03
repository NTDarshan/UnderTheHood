import { Component, OnDestroy, signal } from '@angular/core';

type RequestState = 'processing' | 'database' | 'external-api' | 'response' | 'payment';

interface LiveRequest {
  id: number;
  state: RequestState;
  label: string;
}

const REQUEST_TEMPLATE: Array<{ id: number; state: RequestState; label: string }> = [
  { id: 101, state: 'processing', label: 'processing request body' },
  { id: 102, state: 'database', label: 'reading from database' },
  { id: 103, state: 'external-api', label: 'waiting on external API' },
  { id: 104, state: 'response', label: 'writing response' },
  { id: 105, state: 'payment', label: 'charging payment provider' },
];

@Component({
  selector: 'app-why-shutdown-is-a-problem',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section gs-scene why-scene" id="gs-why-problem">
      <div class="container">
        <p class="lab-index">01 — THE PROBLEM</p>
        <h2 class="lab-title">A server is never really "idle"</h2>
        <p class="lab-lede">
          At any given moment a backend is mid-sentence: a request half-processed, a query half-run, a payment
          half-charged. Stopping the process doesn't pause that work — it just stops existing.
        </p>

        <div class="lab-panel">
          <p class="lab-node">API SERVER &mdash; live traffic</p>

          <div class="request-list" role="list" aria-label="In-flight requests">
            @for (req of requests(); track req.id) {
              <div class="request-row" [class.is-danger]="req.state === 'payment'" role="listitem">
                <span class="req-id mono">REQ {{ req.id }}</span>
                <span class="req-arrow mono">&rarr;</span>
                <span class="req-state mono" [attr.data-state]="req.state">{{ stateLabel(req.state) }}</span>
              </div>
            }
          </div>

          @if (deployStarted()) {
            <div class="deploy-banner" role="alert">
              <span class="deploy-dot" aria-hidden="true"></span>
              DEPLOYMENT STARTED &mdash; the server must stop.
            </div>
            <p class="question mono">What should happen to the work already in progress?</p>
          } @else {
            <div class="lab-btn-row">
              <button type="button" class="lab-btn lab-btn-danger" (click)="startDeploy()">
                Trigger deployment
              </button>
            </div>
          }
        </div>

        @if (deployStarted()) {
          <div class="teaser-grid">
            <div class="teaser-card teaser-hard">
              <p class="teaser-title mono">HARD STOP</p>
              <p class="teaser-desc">
                The process is killed the instant the signal arrives. Whatever each request was doing simply stops —
                mid-query, mid-charge, mid-write.
              </p>
              <span class="pill pill-no">EVERYTHING DROPS AT ONCE</span>
            </div>
            <div class="teaser-card teaser-graceful">
              <p class="teaser-title mono">GRACEFUL SHUTDOWN</p>
              <p class="teaser-desc">
                New traffic stops immediately, but in-flight work is given a window to finish cleanly before the
                process exits.
              </p>
              <span class="pill pill-yes">WORK FINISHES FIRST</span>
            </div>
          </div>
          <p class="lab-note">
            Scroll down to run both scenarios yourself and see exactly how each request ends up.
          </p>
        }
      </div>
    </section>
  `,
  styles: `
    .why-scene {
      --running: #4ade80;
      --draining: var(--accent);
      --stopped: var(--danger);
      --idle: #64748b;
      --signal: #a78bfa;
      --resource: #60a5fa;
      --queue: #fbbf24;
      --cancelled: #f472b6;
    }

    .request-list { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
    .request-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      background: var(--surface-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      transition: border-color 0.3s ease, background 0.3s ease;
      animation: rowIn 0.4s ease both;
    }
    @media (prefers-reduced-motion: reduce) {
      .request-row { animation: none; }
    }
    @keyframes rowIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .request-row.is-danger { border-color: var(--cancelled); }

    .req-id { font-size: 0.75rem; color: var(--text); font-weight: 700; min-width: 64px; }
    .req-arrow { color: var(--text-faint); }
    .req-state { font-size: 0.75rem; color: var(--text-muted); }
    .req-state[data-state='processing'] { color: var(--resource); }
    .req-state[data-state='database'] { color: var(--signal); }
    .req-state[data-state='external-api'] { color: var(--queue); }
    .req-state[data-state='response'] { color: var(--running); }
    .req-state[data-state='payment'] { color: var(--cancelled); }

    .deploy-banner {
      margin-top: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: color-mix(in srgb, var(--stopped) 12%, var(--surface));
      border: 1px solid var(--stopped);
      border-radius: var(--radius-sm);
      color: var(--stopped);
      font-family: var(--font-mono);
      font-size: 0.8125rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      animation: bannerIn 0.35s ease both;
    }
    @media (prefers-reduced-motion: reduce) {
      .deploy-banner { animation: none; }
    }
    @keyframes bannerIn {
      from { opacity: 0; transform: scale(0.98); }
      to { opacity: 1; transform: scale(1); }
    }
    .deploy-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--stopped); flex-shrink: 0; }

    .question { margin-top: 16px; font-size: 0.9375rem; color: var(--text); }

    .teaser-grid {
      margin-top: 24px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }
    .teaser-card {
      padding: 20px;
      border-radius: var(--radius-md);
      background: var(--surface);
      border: 1px solid var(--border);
    }
    .teaser-hard { border-color: var(--stopped); }
    .teaser-graceful { border-color: var(--running); }
    .teaser-title { font-size: 0.75rem; letter-spacing: 0.1em; font-weight: 700; margin-bottom: 10px; }
    .teaser-hard .teaser-title { color: var(--stopped); }
    .teaser-graceful .teaser-title { color: var(--running); }
    .teaser-desc { font-size: 0.875rem; color: var(--text-muted); line-height: 1.55; margin-bottom: 12px; }
  `,
})
export class WhyShutdownIsAProblem implements OnDestroy {
  protected readonly requests = signal<LiveRequest[]>(REQUEST_TEMPLATE.map((r) => ({ ...r })));
  protected readonly deployStarted = signal(false);

  private cycleTimer: ReturnType<typeof setInterval> | null = null;

  private readonly cycleStates: RequestState[] = ['processing', 'database', 'external-api', 'response', 'payment'];

  constructor() {
    this.cycleTimer = setInterval(() => {
      if (this.deployStarted()) return;
      this.requests.update((list) =>
        list.map((r) => {
          const idx = this.cycleStates.indexOf(r.state);
          const next = this.cycleStates[(idx + 1) % this.cycleStates.length];
          return { ...r, state: next };
        }),
      );
    }, 1400);
  }

  ngOnDestroy(): void {
    if (this.cycleTimer) clearInterval(this.cycleTimer);
  }

  protected startDeploy(): void {
    this.deployStarted.set(true);
  }

  protected stateLabel(state: RequestState): string {
    switch (state) {
      case 'processing':
        return 'PROCESSING';
      case 'database':
        return 'DATABASE';
      case 'external-api':
        return 'EXTERNAL API';
      case 'response':
        return 'RESPONSE';
      case 'payment':
        return 'PAYMENT OPERATION';
    }
  }
}
