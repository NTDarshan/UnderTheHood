import { Component, OnDestroy, computed, signal } from '@angular/core';

type Outcome = 'pending' | 'clean' | 'forced';

const DEADLINE_OPTIONS = [10, 30, 60] as const;
const TICK_MS = 100;
const TOTAL_WORK = 10;

@Component({
  selector: 'app-shutdown-deadline',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="gs-deadline">
      <div class="container">
        <p class="lab-index">23 — THE SHUTDOWN DEADLINE</p>
        <h2 class="lab-title">A grace period is a deadline, not a promise.</h2>
        <p class="lab-lede">
          Every graceful shutdown runs against a clock. Wait forever for in-flight work to finish and you block
          deployments, autoscaling, and recovery from a bad instance. Cut the window too short and you kill work
          that would have finished on its own. The deadline is a deliberate trade-off, not an implementation detail.
        </p>

        <div class="gs-scene deadline-scene lab-panel">
          <div class="lab-field deadline-picker">
            <label id="deadline-label">Termination deadline</label>
            <div class="lab-btn-row" role="group" aria-labelledby="deadline-label">
              @for (opt of deadlineOptions; track opt) {
                <button
                  type="button"
                  class="lab-btn"
                  [class.is-active]="deadlineSeconds() === opt"
                  [attr.aria-pressed]="deadlineSeconds() === opt"
                  (click)="setDeadline(opt)"
                  [disabled]="running()"
                >{{ opt }}s</button>
              }
            </div>
          </div>

          <div class="deadline-readout">
            <div class="countdown-block" [class]="'outcome-' + outcome()">
              <span class="countdown-label mono">TERMINATION DEADLINE</span>
              <span class="countdown-value mono">{{ remainingSeconds().toFixed(1) }}s</span>
              <div class="countdown-bar">
                <div class="countdown-bar-fill" [style.width.%]="deadlinePct()"></div>
              </div>
            </div>

            <div class="work-stats">
              <div class="stat">
                <span class="stat-label mono">COMPLETED</span>
                <span class="stat-value mono metric-good">{{ completed() }}</span>
              </div>
              <div class="stat">
                <span class="stat-label mono">REMAINING</span>
                <span class="stat-value mono" [class.metric-warn]="remainingWork() > 0 && outcome() !== 'pending'">{{ remainingWork() }}</span>
              </div>
            </div>
          </div>

          @if (outcome() === 'clean') {
            <p class="outcome-banner outcome-banner-clean mono">✓ CLEAN SHUTDOWN — all work finished before the deadline.</p>
          } @else if (outcome() === 'forced') {
            <p class="outcome-banner outcome-banner-forced mono">⚠ FORCED TERMINATION MAY OCCUR — {{ remainingWork() }} unit(s) of work still in flight when the deadline hit zero.</p>
          }

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="start()" [disabled]="running()">
              {{ running() ? 'Running…' : 'Start shutdown' }}
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>
        </div>

        <p class="lab-note">
          Why bound it at all? An orchestrator waiting on a stuck process blocks the very things graceful shutdown is
          supposed to enable — rolling deploys, autoscaling down, replacing an unhealthy instance. A short deadline
          finishes fast but risks cutting off legitimate in-flight work; a long one is gentler but delays recovery.
          There's no deadline that's correct for every workload — only one that's a deliberate, measured trade-off
          for yours.
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

    .deadline-scene { display: flex; flex-direction: column; gap: 20px; }

    .deadline-picker label { display: block; margin-bottom: 8px; font-size: 0.8125rem; color: var(--text-muted); }

    .deadline-readout {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    @media (min-width: 640px) {
      .deadline-readout { flex-direction: row; align-items: stretch; }
      .countdown-block { flex: 1.4; }
      .work-stats { flex: 1; }
    }

    .countdown-block {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 18px 20px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-strong);
      background: var(--surface);
    }
    .countdown-label { font-size: 0.6875rem; letter-spacing: 0.1em; color: var(--text-faint); }
    .countdown-value { font-size: 2.25rem; font-weight: 700; color: var(--text); transition: color 0.2s ease; }

    .outcome-forced .countdown-value { color: var(--stopped); }
    .outcome-clean .countdown-value { color: var(--running); }

    .countdown-bar {
      height: 6px;
      border-radius: 3px;
      background: var(--border);
      overflow: hidden;
    }
    .countdown-bar-fill {
      height: 100%;
      background: var(--draining);
      transition: width 0.1s linear, background 0.2s ease;
    }
    .outcome-forced .countdown-bar-fill { background: var(--stopped); }
    .outcome-clean .countdown-bar-fill { background: var(--running); }

    .work-stats {
      display: flex;
      flex-direction: row;
      gap: 12px;
    }
    @media (min-width: 640px) { .work-stats { flex-direction: column; } }

    .stat {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 12px 14px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--surface);
      justify-content: center;
    }
    .stat-label { font-size: 0.625rem; letter-spacing: 0.06em; color: var(--text-faint); }
    .stat-value { font-size: 1.5rem; }
    .metric-good { color: var(--running); }
    .metric-warn { color: var(--stopped); }

    .outcome-banner {
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      font-size: 0.8125rem;
      border: 1px solid var(--border);
    }
    .outcome-banner-clean {
      color: var(--running);
      border-color: var(--running);
      background: color-mix(in srgb, var(--running) 10%, var(--surface));
    }
    .outcome-banner-forced {
      color: var(--stopped);
      border-color: var(--stopped);
      background: color-mix(in srgb, var(--stopped) 10%, var(--surface));
    }
  `,
})
export class ShutdownDeadline implements OnDestroy {
  protected readonly deadlineOptions = DEADLINE_OPTIONS;

  protected readonly deadlineSeconds = signal<number>(30);
  protected readonly remainingSeconds = signal<number>(30);
  protected readonly completed = signal(TOTAL_WORK - 2);
  protected readonly remainingWork = signal(2);
  protected readonly running = signal(false);
  protected readonly outcome = signal<Outcome>('pending');

  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private workTimeouts: ReturnType<typeof setTimeout>[] = [];

  protected readonly deadlinePct = computed(() => {
    const total = this.deadlineSeconds();
    if (total <= 0) return 0;
    return Math.max(0, Math.min(100, (this.remainingSeconds() / total) * 100));
  });

  ngOnDestroy(): void {
    this.clearAll();
  }

  protected setDeadline(seconds: number): void {
    if (this.running()) return;
    this.deadlineSeconds.set(seconds);
    this.remainingSeconds.set(seconds);
  }

  protected start(): void {
    if (this.running()) return;
    this.clearAll();
    this.running.set(true);
    this.outcome.set('pending');
    this.remainingSeconds.set(this.deadlineSeconds());
    this.completed.set(TOTAL_WORK - 2);
    this.remainingWork.set(2);

    this.tickTimer = setInterval(() => {
      const next = Math.max(0, this.remainingSeconds() - TICK_MS / 1000);
      this.remainingSeconds.set(next);
      if (next <= 0) {
        this.finish();
      }
    }, TICK_MS);

    // Remaining work finishes at semi-random intervals, sometimes before the deadline, sometimes not.
    const finishDelays = this.pickFinishDelays();
    finishDelays.forEach((delay) => {
      const t = setTimeout(() => {
        if (!this.running()) return;
        if (this.remainingWork() > 0) {
          this.remainingWork.update((n) => n - 1);
          this.completed.update((n) => n + 1);
        }
        if (this.remainingWork() === 0) {
          this.finish();
        }
      }, delay);
      this.workTimeouts.push(t);
    });
  }

  protected reset(): void {
    this.clearAll();
    this.running.set(false);
    this.outcome.set('pending');
    this.remainingSeconds.set(this.deadlineSeconds());
    this.completed.set(TOTAL_WORK - 2);
    this.remainingWork.set(2);
  }

  private pickFinishDelays(): number[] {
    const deadlineMs = this.deadlineSeconds() * 1000;
    // Spread the two remaining units across a window that straddles the deadline,
    // so the outcome genuinely depends on the chosen deadline length.
    const a = deadlineMs * (0.5 + Math.random() * 0.3);
    const b = deadlineMs * (0.85 + Math.random() * 0.5);
    return [a, b];
  }

  private finish(): void {
    if (!this.running()) return;
    this.clearAll();
    this.running.set(false);
    this.outcome.set(this.remainingWork() === 0 ? 'clean' : 'forced');
    if (this.outcome() === 'forced') {
      this.remainingSeconds.set(0);
    }
  }

  private clearAll(): void {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    this.workTimeouts.forEach((t) => clearTimeout(t));
    this.workTimeouts = [];
  }
}
