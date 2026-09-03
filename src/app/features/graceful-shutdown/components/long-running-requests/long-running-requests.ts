import { Component, OnDestroy, computed, signal } from '@angular/core';

type ReqState = 'completed' | 'running' | 'cancelled';

interface TrackedRequest {
  id: number;
  label: string;
  state: ReqState;
}

const TICK_MS = 120;

@Component({
  selector: 'app-long-running-requests',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section gs-scene lrr-scene" id="gs-long-running">
      <div class="container">
        <p class="lab-index">12 — LONG-RUNNING REQUESTS</p>
        <h2 class="lab-title">Shutdown cannot wait forever</h2>
        <p class="lab-lede">
          A graceful shutdown gives in-flight work a window to finish — but that window has to end. If a request
          keeps running indefinitely, the process either stalls forever or something has to force it to stop.
        </p>

        <div class="lab-panel">
          <p class="lab-node">API SERVER &mdash; in-flight requests</p>

          <div class="request-list" role="list" aria-label="In-flight requests">
            @for (req of requests(); track req.id) {
              <div class="request-row" [attr.data-state]="req.state" role="listitem">
                <span class="req-id mono">REQ {{ req.id }}</span>
                <span class="req-label">{{ req.label }}</span>
                <span class="req-status">
                  @switch (req.state) {
                    @case ('completed') { <span class="pill pill-yes">&check; COMPLETED</span> }
                    @case ('running') {
                      <span class="pill pill-conditional">&#9689; STILL RUNNING</span>
                      <span
                        class="progress-track"
                        role="img"
                        [attr.aria-label]="'still running, ' + progress() + ' percent of deadline elapsed'"
                      >
                        <span class="progress-fill" [style.width.%]="progress()"></span>
                      </span>
                    }
                    @case ('cancelled') { <span class="pill pill-no">&#10007; CANCELLED AT DEADLINE</span> }
                  }
                </span>
              </div>
            }
          </div>

          <div class="lab-btn-row">
            <button
              type="button"
              class="lab-btn lab-btn-danger"
              (click)="triggerDeadline()"
              [disabled]="deadlineHit() || requests()[2].state !== 'running'"
            >
              Advance time to deadline
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <div class="lab-code" aria-live="polite">
            @if (!deadlineHit()) {
              request 103 has been running for {{ elapsedLabel() }} — shutdown is waiting, but not indefinitely
            } @else {
              deadline reached — request 103 was still not done, so it was forced to stop mid-operation
            }
          </div>
        </div>

        <div class="lab-panel concepts-panel">
          <p class="lab-node">THREE CONNECTED CONCEPTS</p>
          <div class="concept-grid">
            <div class="concept-card">
              <p class="concept-title mono">TIMEOUT</p>
              <p class="concept-body">
                The maximum time an operation is allowed to take. Once that duration elapses without a result, the
                caller stops waiting — the operation itself may or may not know yet.
              </p>
            </div>
            <div class="concept-card">
              <p class="concept-title mono">DEADLINE</p>
              <p class="concept-body">
                The absolute point in time by which work must stop, regardless of when it started. A shutdown
                deadline is shared across every in-flight request, not reset per-request like a timeout.
              </p>
            </div>
            <div class="concept-card">
              <p class="concept-title mono">CANCELLATION</p>
              <p class="concept-body">
                Actively signaling running work to stop early, instead of just letting a timeout or deadline pass
                and abandoning it. It's how a deadline actually gets enforced rather than just observed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .lrr-scene {
      --running: #4ade80;
      --draining: var(--accent);
      --stopped: var(--danger);
      --idle: #64748b;
      --signal: #a78bfa;
      --resource: #60a5fa;
      --queue: #fbbf24;
      --cancelled: #f472b6;
    }

    .request-list { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
    .request-row {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      background: var(--surface-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      transition: border-color 0.3s ease, background 0.3s ease;
    }
    .request-row[data-state='running'] { border-color: var(--draining); }
    .request-row[data-state='cancelled'] {
      border-color: var(--cancelled);
      background: color-mix(in srgb, var(--cancelled) 10%, var(--surface-elevated));
    }

    .req-id { font-size: 0.75rem; color: var(--text); font-weight: 700; min-width: 76px; }
    .req-label { font-size: 0.8125rem; color: var(--text-muted); }

    .req-status { display: flex; align-items: center; gap: 10px; justify-self: end; }

    .progress-track {
      display: inline-block;
      width: 90px;
      height: 8px;
      border-radius: 999px;
      background: var(--surface);
      border: 1px solid var(--border);
      overflow: hidden;
    }
    .progress-fill {
      display: block;
      height: 100%;
      background: var(--draining);
      transition: width 0.12s linear;
    }

    @media (max-width: 520px) {
      .request-row { grid-template-columns: 1fr; }
      .req-status { justify-self: start; flex-wrap: wrap; }
    }

    .concepts-panel { margin-top: 24px; }
    .concept-grid {
      margin-top: 16px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    .concept-card {
      padding: 18px;
      border-radius: var(--radius-md);
      background: var(--surface);
      border: 1px solid var(--border);
      border-left: 2px solid var(--signal);
    }
    .concept-title { font-size: 0.75rem; letter-spacing: 0.1em; font-weight: 700; color: var(--signal); margin-bottom: 8px; }
    .concept-body { font-size: 0.8125rem; color: var(--text-muted); line-height: 1.55; }
  `,
})
export class LongRunningRequests implements OnDestroy {
  protected readonly requests = signal<TrackedRequest[]>([
    { id: 101, label: 'write response body', state: 'completed' },
    { id: 102, label: 'flush cache update', state: 'completed' },
    { id: 103, label: 'streaming export job', state: 'running' },
  ]);

  protected readonly deadlineHit = signal(false);
  protected readonly elapsedMs = signal(0);
  protected readonly progress = computed(() => Math.min(100, Math.round((this.elapsedMs() / 6000) * 100)));

  protected readonly elapsedLabel = computed(() => `${(this.elapsedMs() / 1000).toFixed(1)}s`);

  private tickHandle: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startTicking();
  }

  ngOnDestroy(): void {
    this.stopTicking();
  }

  private startTicking(): void {
    this.stopTicking();
    this.tickHandle = setInterval(() => {
      if (this.deadlineHit()) return;
      this.elapsedMs.update((v) => Math.min(6000, v + TICK_MS));
    }, TICK_MS);
  }

  private stopTicking(): void {
    if (this.tickHandle) {
      clearInterval(this.tickHandle);
      this.tickHandle = null;
    }
  }

  protected triggerDeadline(): void {
    if (this.deadlineHit()) return;
    this.deadlineHit.set(true);
    this.requests.update((list) =>
      list.map((r) => (r.id === 103 && r.state === 'running' ? { ...r, state: 'cancelled' } : r)),
    );
  }

  protected reset(): void {
    this.deadlineHit.set(false);
    this.elapsedMs.set(0);
    this.requests.update((list) => list.map((r) => (r.id === 103 ? { ...r, state: 'running' } : r)));
    this.startTicking();
  }
}
