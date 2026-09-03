import { Component, OnDestroy, signal } from '@angular/core';

type CallStatus = 'idle' | 'waiting' | 'completed' | 'timeout' | 'cancelled';

interface ServiceLane {
  id: string;
  label: string;
  status: CallStatus;
  note: string;
}

interface ScriptStep {
  laneId: string;
  atMs: number;
  status: CallStatus;
  note: string;
}

const DRAIN_BUDGET_MS = 3000;

const SCRIPT: ScriptStep[] = [
  { laneId: 'payment', atMs: 900, status: 'completed', note: 'response arrived just before the shutdown deadline' },
  { laneId: 'thirdParty', atMs: 1600, status: 'cancelled', note: 'drain budget hit first — request cancelled rather than left hanging' },
  { laneId: 'email', atMs: 2500, status: 'timeout', note: 'exceeded its own timeout while the process was draining' },
];

@Component({
  selector: 'app-external-services-shutdown',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="gs-external-services">
      <div class="container">
        <p class="lab-index">19 — EXTERNAL SERVICES</p>
        <h2 class="lab-title">Shutdown meets calls you don't control</h2>
        <p class="lab-lede">
          When a request fans out to services outside your process, a shutdown cannot just wait for all of them —
          some finish, some are still running, and some need to be actively cut off before the drain budget runs
          out.
        </p>

        <div class="lab-panel gs-scene ext-scene">
          <p class="lab-node">API &rarr; PAYMENT SERVICE &middot; EMAIL SERVICE &middot; THIRD-PARTY API</p>

          <div class="ext-budget">
            <div class="ext-budget-head">
              <span class="mono">SHUTDOWN DRAIN BUDGET</span>
              <span class="mono">{{ (elapsedMs() / 1000).toFixed(1) }}s / {{ (budgetMs / 1000).toFixed(1) }}s</span>
            </div>
            <div class="ext-budget-track"><div class="ext-budget-fill" [style.width.%]="budgetPct()"></div></div>
          </div>

          <div class="ext-lanes" role="list" aria-label="Outbound calls to external services">
            @for (lane of lanes(); track lane.id) {
              <div class="ext-lane" role="listitem" [class]="'status-' + lane.status">
                <div class="ext-lane-head">
                  <span class="mono ext-lane-label">{{ lane.label }}</span>
                  @switch (lane.status) {
                    @case ('idle') { <span class="pill">IDLE</span> }
                    @case ('waiting') { <span class="pill pill-conditional">WAITING</span> }
                    @case ('completed') { <span class="pill pill-yes">COMPLETED</span> }
                    @case ('timeout') { <span class="pill pill-no">TIMEOUT</span> }
                    @case ('cancelled') { <span class="pill pill-no">CANCELLED</span> }
                  }
                </div>
                <div class="ext-track">
                  <div class="ext-fill" [class]="'fill-' + lane.status"></div>
                </div>
                @if (lane.note) {
                  <p class="mono ext-note">{{ lane.note }}</p>
                }
              </div>
            }
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-danger" [disabled]="isRunning()" (click)="triggerShutdown()">
              Trigger shutdown mid-flight
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <div class="ext-legend">
            <div class="ext-legend-item">
              <span class="ext-legend-tag">TIMEOUTS</span>
              <span>cap how long the drain budget will wait on any one call.</span>
            </div>
            <div class="ext-legend-item">
              <span class="ext-legend-tag">CANCELLATION</span>
              <span>actively stops a call once the budget runs out, instead of leaving it hanging.</span>
            </div>
            <div class="ext-legend-item">
              <span class="ext-legend-tag">RETRIES</span>
              <span>decide what happens next for a call that timed out or was cancelled.</span>
            </div>
            <div class="ext-legend-item">
              <span class="ext-legend-tag">IDEMPOTENCY</span>
              <span>is what makes retrying that same call safe if it may have already taken effect.</span>
            </div>
          </div>
        </div>

        <p class="lab-note">
          These four ideas only work as a set. A timeout without cancellation just tells you that you gave up — the
          call keeps burning resources on the other end. Cancellation without a plan for what comes next just
          drops work on the floor. And retrying anything that was cut off mid-flight is only safe if the call was
          idempotent to begin with, because a shutdown can interrupt a call after its side effect already fired but
          before you ever found out.
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

    .ext-budget { margin-top: 22px; }
    .ext-budget-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-muted); }
    .ext-budget-track {
      width: 100%;
      height: 10px;
      border-radius: 999px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      overflow: hidden;
    }
    .ext-budget-fill { height: 100%; background: var(--signal); transition: width 0.1s linear; }

    .ext-lanes { margin-top: 20px; display: flex; flex-direction: column; gap: 12px; }
    .ext-lane {
      padding: 12px 14px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
      transition: border-color 0.2s ease, background 0.2s ease;
    }
    .ext-lane.status-waiting { border-color: var(--draining); }
    .ext-lane.status-completed { border-color: var(--running); }
    .ext-lane.status-timeout { border-color: var(--stopped); background: color-mix(in srgb, var(--stopped) 8%, var(--surface)); }
    .ext-lane.status-cancelled { border-color: var(--cancelled); background: color-mix(in srgb, var(--cancelled) 8%, var(--surface)); }

    .ext-lane-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
    .ext-lane-label { color: var(--text); font-size: 0.8125rem; }

    .ext-track {
      margin-top: 10px;
      width: 100%;
      height: 8px;
      border-radius: 999px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      overflow: hidden;
    }
    .ext-fill { height: 100%; width: 0%; }
    .fill-idle { width: 0%; }
    .fill-waiting { width: 60%; background: var(--draining); animation: ext-pulse 1.1s ease-in-out infinite; }
    .fill-completed { width: 100%; background: var(--running); }
    .fill-timeout { width: 100%; background: var(--stopped); }
    .fill-cancelled { width: 45%; background: var(--cancelled); }

    @keyframes ext-pulse {
      0%, 100% { opacity: 0.55; }
      50% { opacity: 1; }
    }
    @media (prefers-reduced-motion: reduce) {
      .fill-waiting { animation: none; opacity: 0.85; }
      .ext-fill, .ext-budget-fill { transition: none; }
    }

    .ext-note { margin: 8px 0 0; color: var(--text-faint); font-size: 0.75rem; }

    .ext-legend { margin-top: 22px; display: grid; grid-template-columns: 1fr; gap: 10px; }
    @media (min-width: 640px) { .ext-legend { grid-template-columns: repeat(2, 1fr); } }
    .ext-legend-item { display: flex; align-items: baseline; gap: 8px; font-size: 0.8125rem; color: var(--text-muted); }
    .ext-legend-tag {
      flex: none;
      font-family: var(--font-mono);
      font-size: 0.6875rem;
      letter-spacing: 0.06em;
      color: var(--accent-2);
      border: 1px solid var(--accent-2-dim);
      border-radius: 4px;
      padding: 2px 6px;
    }
  `,
})
export class ExternalServicesShutdown implements OnDestroy {
  protected readonly budgetMs = DRAIN_BUDGET_MS;

  protected readonly lanes = signal<ServiceLane[]>(this.initialLanes());
  protected readonly elapsedMs = signal(0);
  protected readonly isRunning = signal(false);

  protected readonly budgetPct = signal(0);

  private timers: ReturnType<typeof setTimeout>[] = [];
  private clockInterval: ReturnType<typeof setInterval> | null = null;

  private initialLanes(): ServiceLane[] {
    return [
      { id: 'payment', label: 'PAYMENT SERVICE', status: 'idle', note: '' },
      { id: 'email', label: 'EMAIL SERVICE', status: 'idle', note: '' },
      { id: 'thirdParty', label: 'THIRD-PARTY API', status: 'idle', note: '' },
    ];
  }

  protected triggerShutdown(): void {
    if (this.isRunning()) return;
    this.clearTimers();
    this.isRunning.set(true);
    this.elapsedMs.set(0);
    this.budgetPct.set(0);
    this.lanes.set(
      this.lanes().map((l) => ({ ...l, status: 'waiting' as CallStatus, note: 'shutdown triggered — call already in flight' })),
    );

    const tickMs = 80;
    this.clockInterval = setInterval(() => {
      this.elapsedMs.update((v) => Math.min(this.budgetMs, v + tickMs));
      this.budgetPct.set(Math.min(100, (this.elapsedMs() / this.budgetMs) * 100));
      if (this.elapsedMs() >= this.budgetMs && this.clockInterval) {
        clearInterval(this.clockInterval);
        this.clockInterval = null;
      }
    }, tickMs);

    for (const step of SCRIPT) {
      this.timers.push(
        setTimeout(() => {
          this.lanes.update((list) =>
            list.map((l) => (l.id === step.laneId ? { ...l, status: step.status, note: step.note } : l)),
          );
          if (step === SCRIPT[SCRIPT.length - 1]) {
            this.isRunning.set(false);
          }
        }, step.atMs),
      );
    }
  }

  protected reset(): void {
    this.clearTimers();
    this.lanes.set(this.initialLanes());
    this.elapsedMs.set(0);
    this.budgetPct.set(0);
    this.isRunning.set(false);
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  private clearTimers(): void {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }
  }
}
