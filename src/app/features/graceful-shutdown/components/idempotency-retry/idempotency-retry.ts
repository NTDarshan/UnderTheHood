import { Component, OnDestroy, computed, signal } from '@angular/core';

type Phase = 'idle' | 'processing' | 'interrupted' | 'retrying' | 'result';
type Outcome = 'duplicate' | 'deduped' | null;

const STEP_IDS = ['job', 'processing', 'shutdown', 'retry', 'outcome'] as const;
type StepId = (typeof STEP_IDS)[number];

@Component({
  selector: 'app-idempotency-retry',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="gs-idempotency">
      <div class="container">
        <p class="lab-index">17 — IDEMPOTENCY &amp; RETRY</p>
        <h2 class="lab-title">When a retry meets a half-finished job</h2>
        <p class="lab-lede">
          A shutdown can interrupt a job after its side effect has already happened but before the caller ever
          hears back. Whatever retries that job next — a client, a queue, an orchestrator — has no way to know
          that, unless the request itself is protected from running twice.
        </p>

        <div class="lab-panel gs-scene ir-scene">
          <p class="lab-node">JOB #8472 &rarr; PROCESSING &rarr; SERVER SHUTDOWN &rarr; RETRY &rarr; ?</p>

          <div class="lab-btn-row" role="group" aria-label="Idempotency protection">
            <button
              type="button"
              class="lab-btn"
              [class.is-active]="!withKey()"
              [attr.aria-pressed]="!withKey()"
              [disabled]="isRunning()"
              (click)="setWithKey(false)"
            >
              Without idempotency key
            </button>
            <button
              type="button"
              class="lab-btn"
              [class.is-active]="withKey()"
              [attr.aria-pressed]="withKey()"
              [disabled]="isRunning()"
              (click)="setWithKey(true)"
            >
              With idempotency key
            </button>
          </div>

          <div class="ir-flow" role="list" aria-label="Job lifecycle">
            @for (s of steps; track s.id; let last = $last) {
              <div class="ir-step" role="listitem" [class]="'step-' + s.id" [class.is-active]="activeStep() === s.id" [class.is-done]="isStepDone(s.id)">
                <span class="ir-step-dot" aria-hidden="true"></span>
                <span class="mono">{{ s.label }}</span>
              </div>
              @if (!last) { <span class="lab-flow-arrow ir-arrow" aria-hidden="true">&rarr;</span> }
            }
          </div>

          <div class="ir-detail" aria-live="polite">
            @switch (phase()) {
              @case ('idle') {
                <p class="mono ir-line">idle — press "Run scenario" to charge job #8472</p>
              }
              @case ('processing') {
                <p class="mono ir-line">attempt {{ attempt() }}: charging the customer's card ($49.00)&hellip;</p>
                <div class="ir-bar-track"><div class="ir-bar-fill is-running" [style.width.%]="progress()"></div></div>
              }
              @case ('interrupted') {
                <p class="mono ir-line ir-line-warn">
                  SIGTERM received mid-request — the charge reached the payment processor, but the process was
                  killed before a response made it back to the caller. The caller only sees a dropped connection.
                </p>
              }
              @case ('retrying') {
                <p class="mono ir-line">no response ever arrived &rarr; caller assumes failure and retries the same job&hellip;</p>
                <div class="ir-bar-track"><div class="ir-bar-fill is-running" [style.width.%]="progress()"></div></div>
              }
              @case ('result') {
                @if (outcome() === 'duplicate') {
                  <p class="mono ir-line ir-line-bad">
                    DUPLICATE SIDE EFFECT — the retry has no idea attempt 1 already succeeded, so it charges the
                    card again. Customer charged twice: $49.00 &times; 2.
                  </p>
                } @else {
                  <p class="mono ir-line ir-line-good">
                    DEDUPLICATED — the retry carries the same idempotency key as attempt 1. The server recognizes
                    it, returns the original result, and never charges the card again.
                  </p>
                }
              }
            }
          </div>

          <div class="ir-charge-row">
            <span class="mono ir-charge-label">TIMES CHARGED:</span>
            <span class="ir-charge-value mono" [class.is-bad]="chargeCount() > 1">{{ chargeCount() }}</span>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="isRunning()" (click)="run()">
              {{ phase() === 'idle' ? 'Run scenario' : 'Run again' }}
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>
        </div>

        <p class="lab-note">
          Anything that can be retried — an HTTP request, a queued job, a scheduled task — needs a way to tell
          "this is a brand-new request" apart from "this is the same request I already handled." An idempotency
          key (a client-generated ID sent with the request) lets the server recognize a retry of work it already
          completed or has in flight, and return the original outcome instead of repeating the side effect. Without
          one, a shutdown that interrupts a job mid-flight turns every safe-looking retry into a potential
          duplicate charge, duplicate email, or duplicate order.
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

    .ir-flow { margin-top: 22px; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
    .ir-step {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      color: var(--text-faint);
      background: var(--surface);
      transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
    }
    .ir-step-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
    .ir-step.is-done { color: var(--text-muted); border-color: var(--border-strong); }
    .ir-step.is-active { color: var(--draining); border-color: var(--draining); background: color-mix(in srgb, var(--draining) 10%, var(--surface)); }
    .ir-step.step-shutdown.is-active { color: var(--stopped); border-color: var(--stopped); background: color-mix(in srgb, var(--stopped) 10%, var(--surface)); }
    .ir-step.step-outcome.is-active { color: var(--signal); border-color: var(--signal); background: color-mix(in srgb, var(--signal) 10%, var(--surface)); }
    .ir-arrow { color: var(--text-faint); }

    @media (max-width: 640px) {
      .ir-flow { flex-direction: column; align-items: stretch; }
      .ir-arrow { align-self: center; transform: rotate(90deg); }
    }

    .ir-detail { margin-top: 20px; min-height: 62px; }
    .ir-line { color: var(--text-muted); font-size: 0.8125rem; line-height: 1.6; }
    .ir-line-warn { color: var(--queue); }
    .ir-line-bad { color: var(--danger); }
    .ir-line-good { color: var(--running); }

    .ir-bar-track {
      margin-top: 10px;
      width: 100%;
      height: 12px;
      border-radius: 999px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      overflow: hidden;
    }
    .ir-bar-fill { height: 100%; transition: width 0.12s linear; }
    .ir-bar-fill.is-running { background: var(--draining); }

    .ir-charge-row { margin-top: 16px; display: flex; align-items: center; gap: 10px; }
    .ir-charge-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.08em; }
    .ir-charge-value { font-size: 1.125rem; color: var(--running); }
    .ir-charge-value.is-bad { color: var(--danger); }

    @media (prefers-reduced-motion: reduce) {
      .ir-bar-fill { transition: none; }
    }
  `,
})
export class IdempotencyRetry implements OnDestroy {
  protected readonly steps: { id: StepId; label: string }[] = [
    { id: 'job', label: 'JOB #8472' },
    { id: 'processing', label: 'PROCESSING' },
    { id: 'shutdown', label: 'SHUTDOWN' },
    { id: 'retry', label: 'RETRY' },
    { id: 'outcome', label: 'OUTCOME' },
  ];

  protected readonly withKey = signal(false);
  protected readonly phase = signal<Phase>('idle');
  protected readonly attempt = signal(1);
  protected readonly progress = signal(0);
  protected readonly chargeCount = signal(0);
  protected readonly outcome = signal<Outcome>(null);

  private timers: ReturnType<typeof setTimeout>[] = [];
  private progressInterval: ReturnType<typeof setInterval> | null = null;

  protected readonly isRunning = computed(() => this.phase() !== 'idle' && this.phase() !== 'result');

  protected readonly activeStep = computed<StepId | null>(() => {
    switch (this.phase()) {
      case 'idle':
        return 'job';
      case 'processing':
        return 'processing';
      case 'interrupted':
        return 'shutdown';
      case 'retrying':
        return 'retry';
      case 'result':
        return 'outcome';
      default:
        return null;
    }
  });

  protected isStepDone(id: StepId): boolean {
    const order = STEP_IDS;
    const active = this.activeStep();
    if (!active) return false;
    return order.indexOf(id) < order.indexOf(active);
  }

  protected setWithKey(v: boolean): void {
    if (this.isRunning()) return;
    this.withKey.set(v);
  }

  protected run(): void {
    this.clearTimers();
    this.phase.set('processing');
    this.attempt.set(1);
    this.progress.set(0);
    this.chargeCount.set(0);
    this.outcome.set(null);

    this.runProgress(1400, () => {
      // Interrupted partway through attempt 1 — the side effect already fired on the far side.
      this.chargeCount.set(1);
      this.phase.set('interrupted');
      this.progress.set(0);

      this.timers.push(
        setTimeout(() => {
          this.attempt.set(2);
          this.phase.set('retrying');
          this.runProgress(1200, () => {
            if (this.withKey()) {
              this.outcome.set('deduped');
            } else {
              this.chargeCount.update((v) => v + 1);
              this.outcome.set('duplicate');
            }
            this.phase.set('result');
          });
        }, 1100),
      );
    });
  }

  private runProgress(durationMs: number, onDone: () => void): void {
    const tickMs = 90;
    const steps = durationMs / tickMs;
    let step = 0;
    this.progressInterval = setInterval(() => {
      step += 1;
      this.progress.set(Math.min(100, (step / steps) * 100));
      if (step >= steps) {
        if (this.progressInterval) {
          clearInterval(this.progressInterval);
          this.progressInterval = null;
        }
        onDone();
      }
    }, tickMs);
  }

  protected reset(): void {
    this.clearTimers();
    this.phase.set('idle');
    this.attempt.set(1);
    this.progress.set(0);
    this.chargeCount.set(0);
    this.outcome.set(null);
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  private clearTimers(): void {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }
}
