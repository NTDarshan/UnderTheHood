import { Component, OnDestroy, computed, signal } from '@angular/core';

type RunStatus = 'idle' | 'running' | 'finished';
type ReqStatus = 'active' | 'completed' | 'cut-off';

interface DrainRequest {
  id: string;
  label: string;
  progress: number;
  rate: number;
  status: ReqStatus;
}

const TICK_MS = 200;

const INITIAL_REQUESTS: Array<{ id: string; label: string; progress: number; rate: number }> = [
  { id: 'r1', label: 'R1', progress: 90, rate: 1.4 },
  { id: 'r2', label: 'R2', progress: 30, rate: 0.6 },
  { id: 'r3', label: 'R3', progress: 70, rate: 1.0 },
  { id: 'r4', label: 'R4', progress: 10, rate: 0.35 },
];

@Component({
  selector: 'app-draining-window',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section gs-scene window-scene" id="gs-draining-window">
      <div class="container">
        <p class="lab-index">11 — THE DRAINING WINDOW</p>
        <h2 class="lab-title">The shutdown timeout is a race against a clock</h2>
        <p class="lab-lede">
          Graceful shutdown is not open-ended: an orchestrator gives a process a fixed grace period to finish its
          in-flight work before killing it outright. Anything still running when the clock hits zero gets cut off.
        </p>

        <div class="lab-panel">
          <div class="lab-btn-row" role="group" aria-label="Shutdown timeout">
            @for (t of timeoutOptions; track t) {
              <button
                type="button"
                class="lab-btn"
                [class.is-active]="timeoutSeconds() === t"
                [attr.aria-pressed]="timeoutSeconds() === t"
                [disabled]="status() === 'running'"
                (click)="setTimeoutSeconds(t)"
              >
                {{ t }}s
              </button>
            }
          </div>

          <div class="countdown-row">
            <span class="countdown-label mono">SHUTDOWN TIMEOUT</span>
            <span class="countdown-value mono" [class.is-critical]="remaining() <= 5 && status() === 'running'">
              {{ remaining() }}s
            </span>
          </div>
          <div class="countdown-track">
            <div class="countdown-fill" [style.width.%]="countdownPct()" [class.is-critical]="remaining() <= 5"></div>
          </div>

          <div class="requests-grid" role="list" aria-label="In-flight requests during shutdown">
            @for (req of requests(); track req.id) {
              <div class="req-card" [class.is-completed]="req.status === 'completed'" [class.is-cutoff]="req.status === 'cut-off'" role="listitem">
                <div class="req-head">
                  <span class="req-label mono">{{ req.label }}</span>
                  @switch (req.status) {
                    @case ('active') { <span class="pill pill-conditional">IN FLIGHT</span> }
                    @case ('completed') { <span class="pill pill-yes">&#10003; COMPLETED</span> }
                    @case ('cut-off') { <span class="pill pill-no">&#10007; FORCED CUT OFF</span> }
                  }
                </div>
                <div class="req-track" role="img" [attr.aria-label]="req.label + ' ' + req.progress.toFixed(0) + ' percent complete'">
                  <div class="req-fill" [style.width.%]="req.progress"></div>
                </div>
              </div>
            }
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="start()" [disabled]="status() === 'running'">
              Start shutdown
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <div class="lab-code" aria-live="polite">
            @if (status() === 'idle') {
              waiting to start &mdash; requests will race the {{ timeoutSeconds() }}s countdown to completion
            } @else if (status() === 'running') {
              draining: {{ activeCount() }} request(s) still in flight, {{ remaining() }}s left on the clock
            } @else if (allFinishedCleanly()) {
              every request finished before the timeout &mdash; a clean shutdown
            } @else {
              timeout reached with work still running &mdash; those requests were forcibly cut off mid-flight
            }
          </div>
        </div>

        <p class="lab-note lab-note-warn">
          Pick the timeout too short and you routinely truncate legitimate work; pick it too long and a stuck
          shutdown blocks deploys and autoscaling. Production systems tune this window deliberately, and log every
          forced cut-off so it doesn't happen silently.
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

    .countdown-row {
      margin-top: 20px;
      display: flex;
      align-items: baseline;
      justify-content: space-between;
    }
    .countdown-label { font-size: 0.6875rem; letter-spacing: 0.1em; color: var(--text-faint); }
    .countdown-value { font-size: 1.75rem; font-weight: 700; color: var(--text); transition: color 0.2s ease; }
    .countdown-value.is-critical { color: var(--stopped); }

    .countdown-track {
      margin-top: 8px;
      width: 100%;
      height: 10px;
      border-radius: 999px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      overflow: hidden;
    }
    .countdown-fill {
      height: 100%;
      background: var(--draining);
      transition: width 0.2s linear;
    }
    .countdown-fill.is-critical { background: var(--stopped); }

    .requests-grid {
      margin-top: 22px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
    }
    @media (min-width: 640px) {
      .requests-grid { grid-template-columns: 1fr 1fr; }
    }

    .req-card {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 14px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
      transition: border-color 0.2s ease, opacity 0.2s ease;
    }
    .req-card.is-completed { border-color: var(--running); opacity: 0.7; }
    .req-card.is-cutoff { border-color: var(--stopped); background: color-mix(in srgb, var(--stopped) 8%, var(--surface)); }

    .req-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .req-label { font-weight: 700; font-size: 0.8125rem; letter-spacing: 0.05em; }

    .req-track {
      width: 100%;
      height: 10px;
      border-radius: 999px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      overflow: hidden;
    }
    .req-fill { height: 100%; background: var(--resource); transition: width 0.15s linear; }
    .req-card.is-completed .req-fill { background: var(--running); }
    .req-card.is-cutoff .req-fill { background: var(--stopped); }
  `,
})
export class DrainingWindow implements OnDestroy {
  protected readonly timeoutOptions = [10, 30, 60];

  protected readonly timeoutSeconds = signal(30);
  protected readonly remaining = signal(30);
  protected readonly status = signal<RunStatus>('idle');
  protected readonly requests = signal<DrainRequest[]>(
    INITIAL_REQUESTS.map((r) => ({ ...r, status: 'active' as ReqStatus })),
  );

  private intervalHandle: ReturnType<typeof setInterval> | null = null;

  protected readonly countdownPct = computed(() => (this.remaining() / this.timeoutSeconds()) * 100);
  protected readonly activeCount = computed(() => this.requests().filter((r) => r.status === 'active').length);
  protected readonly allFinishedCleanly = computed(() => this.requests().every((r) => r.status === 'completed'));

  ngOnDestroy(): void {
    this.clearInterval();
  }

  protected setTimeoutSeconds(seconds: number): void {
    if (this.status() === 'running') return;
    this.timeoutSeconds.set(seconds);
    this.remaining.set(seconds);
  }

  protected start(): void {
    this.clearInterval();
    this.status.set('running');
    this.remaining.set(this.timeoutSeconds());
    this.requests.set(INITIAL_REQUESTS.map((r) => ({ ...r, status: 'active' as ReqStatus })));

    let elapsedSeconds = 0;
    this.intervalHandle = setInterval(() => {
      elapsedSeconds += TICK_MS / 1000;

      this.requests.update((list) =>
        list.map((r) => {
          if (r.status !== 'active') return r;
          const nextProgress = Math.min(100, r.progress + r.rate * (TICK_MS / 100));
          return { ...r, progress: nextProgress, status: nextProgress >= 100 ? 'completed' : 'active' };
        }),
      );

      const nextRemaining = Math.max(0, Math.ceil(this.timeoutSeconds() - elapsedSeconds));
      this.remaining.set(nextRemaining);

      const stillActive = this.requests().some((r) => r.status === 'active');

      if (nextRemaining <= 0) {
        this.requests.update((list) =>
          list.map((r) => (r.status === 'active' ? { ...r, status: 'cut-off' as ReqStatus } : r)),
        );
        this.clearInterval();
        this.status.set('finished');
      } else if (!stillActive) {
        this.clearInterval();
        this.status.set('finished');
      }
    }, TICK_MS);
  }

  protected reset(): void {
    this.clearInterval();
    this.status.set('idle');
    this.remaining.set(this.timeoutSeconds());
    this.requests.set(INITIAL_REQUESTS.map((r) => ({ ...r, status: 'active' as ReqStatus })));
  }

  private clearInterval(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }
}
