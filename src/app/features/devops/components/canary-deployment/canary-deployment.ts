import { Component, OnDestroy, computed, signal } from '@angular/core';

interface CanaryStage {
  v1: number;
  v2: number;
  label: string;
}

const STAGES: CanaryStage[] = [
  { v1: 100, v2: 0, label: 'Baseline — all traffic on v1' },
  { v1: 95, v2: 5, label: 'First slice — 5% to v2' },
  { v1: 90, v2: 10, label: 'Widening — 10% to v2' },
  { v1: 70, v2: 30, label: 'Confidence building — 30% to v2' },
  { v1: 50, v2: 50, label: 'Even split — 50% to v2' },
  { v1: 0, v2: 100, label: 'Full rollout — 100% on v2' },
];

const ERROR_THRESHOLD = 8;

@Component({
  selector: 'app-canary-deployment',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section do-scene" id="do-canary">
      <div class="container">
        <p class="lab-index mono">01 — CANARY DEPLOYMENTS</p>
        <h2 class="lab-title">Ship to 5% of traffic before you ship to everyone</h2>
        <p class="lab-lede">
          A canary release gradually shifts a slice of real production traffic to a new version so regressions show
          up against a small blast radius — a handful of users, not everyone — before the rollout continues.
        </p>

        <div class="lab-panel">
          <div class="split-track" role="group" aria-label="Traffic split between v1 and v2">
            <div class="split-seg split-v1" [style.width.%]="stage().v1">
              @if (stage().v1 > 0) {
                <span class="split-label mono">v1 · {{ stage().v1 }}%</span>
              }
              <div class="packets" aria-hidden="true">
                @for (p of v1Packets(); track $index) {
                  <span class="packet packet-v1" [style.animation-delay.ms]="$index * 220"></span>
                }
              </div>
            </div>
            <div class="split-seg split-v2" [class.is-halted]="halted()" [style.width.%]="stage().v2">
              @if (stage().v2 > 0) {
                <span class="split-label mono">v2 · {{ stage().v2 }}%</span>
              }
              <div class="packets" aria-hidden="true">
                @for (p of v2Packets(); track $index) {
                  <span class="packet packet-v2" [class.is-error]="halted()" [style.animation-delay.ms]="$index * 220"></span>
                }
              </div>
            </div>
          </div>

          <p class="stage-label mono">{{ stage().label }}</p>

          <div class="lab-btn-row" role="group" aria-label="Advance or roll back the canary stage">
            <button type="button" class="lab-btn" (click)="back()" [disabled]="stageIndex() === 0 || halted()">
              &larr; BACK
            </button>
            <button type="button" class="lab-btn lab-btn-primary" (click)="advance()" [disabled]="stageIndex() === STAGES.length - 1 || halted()">
              ADVANCE ROLLOUT &rarr;
            </button>
          </div>

          <div class="error-panel">
            <div class="error-readout">
              <span class="error-label mono">v2 ERROR RATE</span>
              <div class="error-bar-track">
                <div class="error-bar-fill" [class.is-over]="errorRate() >= ERROR_THRESHOLD" [style.width.%]="errorRate()"></div>
                <div class="error-threshold-marker" [style.left.%]="ERROR_THRESHOLD"></div>
              </div>
              <span class="error-value mono" [class.is-over]="errorRate() >= ERROR_THRESHOLD">{{ errorRate() }}%</span>
            </div>

            <label class="toggle-row mono">
              <input type="checkbox" [checked]="simulateErrors()" (change)="toggleErrors($event)" [disabled]="halted()" />
              SIMULATE ELEVATED ERRORS ON v2
            </label>
          </div>

          @if (halted()) {
            <div class="halt-banner" role="alert">
              <span class="halt-title mono">ROLLOUT HALTED</span>
              <p class="halt-copy">
                If error rate increases, stop the rollout. v2's error rate crossed {{ ERROR_THRESHOLD }}%, so traffic
                was automatically reverted to v1 while the canary is still small.
              </p>
              <button type="button" class="lab-btn lab-btn-danger" (click)="resumeRollout()">RESET &amp; RESUME</button>
            </div>
          } @else {
            <p class="lab-note">
              Watch what happens if you flip on simulated errors while v2 is carrying traffic — the error readout
              climbs, and once it crosses the threshold the rollout halts itself and traffic reverts toward v1
              automatically, before the bad version ever reaches full traffic.
            </p>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .do-scene {
      --do-accent: var(--accent);
      --do-cyan: var(--accent-2);
      --do-violet: #a78bfa;
      --do-success: #4ade80;
      --do-warning: #fbbf24;
      --do-danger: var(--danger);
      --do-pending: #64748b;
    }

    .split-track {
      display: flex;
      height: 64px;
      border-radius: var(--radius-md);
      overflow: hidden;
      border: 1px solid var(--border);
    }
    .split-seg {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 0;
      transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
      overflow: hidden;
    }
    .split-v1 { background: color-mix(in srgb, var(--do-cyan) 18%, var(--surface)); border-right: 1px solid var(--border); }
    .split-v2 { background: color-mix(in srgb, var(--do-violet) 22%, var(--surface)); }
    .split-v2.is-halted { background: color-mix(in srgb, var(--do-danger) 22%, var(--surface)); }
    .split-label { position: relative; z-index: 1; font-size: 0.75rem; font-weight: 700; color: var(--text); letter-spacing: 0.04em; }

    .packets { position: absolute; inset: 0; overflow: hidden; }
    .packet {
      position: absolute;
      top: 50%;
      left: -10%;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      transform: translateY(-50%);
      animation: packet-flow 2.6s linear infinite;
    }
    .packet-v1 { background: var(--do-cyan); box-shadow: 0 0 6px color-mix(in srgb, var(--do-cyan) 60%, transparent); }
    .packet-v2 { background: var(--do-violet); box-shadow: 0 0 6px color-mix(in srgb, var(--do-violet) 60%, transparent); }
    .packet-v2.is-error { background: var(--do-danger); box-shadow: 0 0 6px color-mix(in srgb, var(--do-danger) 60%, transparent); }
    @keyframes packet-flow {
      from { left: -6%; }
      to { left: 106%; }
    }
    @media (prefers-reduced-motion: reduce) {
      .packet { animation: none; left: 50%; opacity: 0.7; }
    }

    .stage-label { margin-top: 14px; font-size: 0.8125rem; color: var(--text-muted); }

    .error-panel {
      margin-top: 28px;
      padding-top: 24px;
      border-top: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .error-readout { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .error-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.08em; min-width: 120px; }
    .error-bar-track {
      position: relative;
      flex: 1;
      min-width: 160px;
      height: 10px;
      border-radius: 999px;
      background: var(--surface);
      border: 1px solid var(--border);
      overflow: hidden;
    }
    .error-bar-fill {
      height: 100%;
      background: var(--do-warning);
      transition: width 0.3s ease, background 0.3s ease;
    }
    .error-bar-fill.is-over { background: var(--do-danger); }
    .error-threshold-marker {
      position: absolute;
      top: -2px;
      bottom: -2px;
      width: 2px;
      background: var(--text-faint);
    }
    .error-value { font-size: 0.8125rem; font-weight: 700; color: var(--text); min-width: 40px; text-align: right; }
    .error-value.is-over { color: var(--do-danger); }

    .toggle-row {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.75rem;
      letter-spacing: 0.04em;
      color: var(--text-muted);
      cursor: pointer;
      width: fit-content;
    }
    .toggle-row input { accent-color: var(--do-danger); width: 16px; height: 16px; }

    .halt-banner {
      margin-top: 20px;
      padding: 18px 20px;
      border-radius: var(--radius-md);
      border: 1px solid color-mix(in srgb, var(--do-danger) 45%, var(--border));
      background: color-mix(in srgb, var(--do-danger) 10%, var(--surface));
    }
    .halt-title {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: var(--do-danger);
    }
    .halt-copy { margin-top: 8px; font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; max-width: 620px; }
    .halt-banner .lab-btn { margin-top: 14px; }
  `,
})
export class CanaryDeployment implements OnDestroy {
  protected readonly STAGES = STAGES;
  protected readonly ERROR_THRESHOLD = ERROR_THRESHOLD;

  protected readonly stageIndex = signal(0);
  protected readonly errorRate = signal(1);
  protected readonly simulateErrors = signal(false);
  protected readonly halted = signal(false);

  protected readonly stage = computed(() => STAGES[this.stageIndex()]);

  protected readonly v1Packets = computed(() => this.packetsFor(this.stage().v1));
  protected readonly v2Packets = computed(() => this.packetsFor(this.stage().v2));

  private errorTimer: ReturnType<typeof setInterval> | null = null;

  ngOnDestroy(): void {
    this.clearErrorTimer();
  }

  protected advance(): void {
    if (this.halted() || this.stageIndex() >= STAGES.length - 1) return;
    this.stageIndex.update((i) => i + 1);
  }

  protected back(): void {
    if (this.halted() || this.stageIndex() <= 0) return;
    this.stageIndex.update((i) => i - 1);
  }

  protected toggleErrors(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.simulateErrors.set(checked);
    this.ensureErrorTimer();
  }

  protected resumeRollout(): void {
    this.halted.set(false);
    this.simulateErrors.set(false);
    this.errorRate.set(1);
    this.clearErrorTimer();
  }

  private ensureErrorTimer(): void {
    if (this.errorTimer) return;
    this.errorTimer = setInterval(() => {
      const simulating = this.simulateErrors();
      const current = this.errorRate();
      const next = simulating
        ? Math.min(20, current + 0.8 + Math.random() * 1.2)
        : Math.max(1, current - 1.5);
      this.errorRate.set(Math.round(next * 10) / 10);

      if (simulating && next >= ERROR_THRESHOLD && this.stage().v2 > 0 && !this.halted()) {
        this.halted.set(true);
        this.stageIndex.set(0);
      }

      if (!simulating && next <= 1) {
        this.clearErrorTimer();
      }
    }, 500);
  }

  private clearErrorTimer(): void {
    if (this.errorTimer) {
      clearInterval(this.errorTimer);
      this.errorTimer = null;
    }
  }

  private packetsFor(pct: number): number[] {
    const count = Math.max(pct > 0 ? 1 : 0, Math.round(pct / 12));
    return Array.from({ length: count });
  }
}
