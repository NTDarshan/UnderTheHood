import { Component, OnDestroy, signal } from '@angular/core';

type Step = 'desired' | 'observe' | 'compare' | 'act';

const STEP_ORDER: Step[] = ['desired', 'observe', 'compare', 'act'];
const STEP_MS = 2000;

@Component({
  selector: 'app-do-kubernetes-control-loop',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section do-scene" id="do-control-loop">
      <div class="container">
        <p class="lab-index mono">04 — THE CONTROL LOOP</p>
        <h2 class="lab-title">Kubernetes isn't a tool that runs containers. It's a control system.</h2>
        <p class="lab-lede">
          Nothing in Kubernetes "deploys once and stops." A controller sits in an infinite loop, continuously
          watching the API server, comparing what's running against what you asked for, and nudging reality back
          into line. That loop never turns off.
        </p>

        <div class="lab-panel">
          <div class="loop-row" role="img" [attr.aria-label]="ariaSummary()">
            <div class="loop-node is-desired" [class.is-active]="step() === 'desired'">
              <span class="loop-node-label mono">DESIRED STATE</span>
              <span class="loop-node-value mono">replicas: {{ desired() }}</span>
            </div>
            <span class="loop-arrow mono" [class.is-live]="step() === 'observe'">&rarr;</span>
            <div class="loop-node" [class.is-active]="step() === 'observe'">
              <span class="loop-node-label mono">OBSERVE</span>
              <span class="loop-node-value mono">actual: {{ actual() }}</span>
            </div>
            <span class="loop-arrow mono" [class.is-live]="step() === 'compare'">&rarr;</span>
            <div class="loop-node" [class.is-active]="step() === 'compare'">
              <span class="loop-node-label mono">COMPARE</span>
              <span class="loop-node-value mono">{{ drift() === 0 ? 'in sync' : 'drift: ' + drift() }}</span>
            </div>
            <span class="loop-arrow mono" [class.is-live]="step() === 'act'">&rarr;</span>
            <div class="loop-node" [class.is-active]="step() === 'act'">
              <span class="loop-node-label mono">ACT</span>
              <span class="loop-node-value mono">reconcile</span>
            </div>
          </div>
          <div class="loop-back mono" [class.is-live]="step() === 'act'">&#8630; loops back to OBSERVE, forever</div>

          <div class="lab-code" aria-live="polite">{{ logLine() }}</div>

          <div class="stat-grid" role="group" aria-label="Cluster state">
            <div class="stat-tile">
              <span class="stat-value mono">{{ desired() }}</span>
              <span class="stat-label mono">DESIRED REPLICAS</span>
            </div>
            <div class="stat-tile">
              <span class="stat-value mono">{{ actual() }}</span>
              <span class="stat-label mono">ACTUAL REPLICAS</span>
            </div>
            <div class="stat-tile">
              <span class="stat-value mono" [class.is-drift]="drift() !== 0">{{ drift() }}</span>
              <span class="stat-label mono">DRIFT</span>
            </div>
            <div class="stat-tile">
              <span class="stat-value mono">{{ drift() === 0 ? 'SYNCED' : 'RECONCILING' }}</span>
              <span class="stat-label mono">STATUS</span>
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="advanceStep()" [disabled]="playing()">
              Step &rarr;
            </button>
            <button type="button" class="lab-btn" [class.is-active]="playing()" (click)="togglePlay()">
              {{ playing() ? 'Pause' : 'Play loop' }}
            </button>
            <button type="button" class="lab-btn lab-btn-danger" (click)="killPod()">Simulate a pod crash</button>
            <button type="button" class="lab-btn" (click)="scaleDesired(1)">Desired +1</button>
            <button type="button" class="lab-btn" (click)="scaleDesired(-1)">Desired &minus;1</button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>
        </div>

        <p class="lab-note">
          <strong>The reframe:</strong> you never tell Kubernetes "start 3 pods." You tell it "3 pods is what I want
          to be true" — and a controller keeps watching, comparing, and acting to make that stay true, whether a
          pod crashes, a node dies, or you change your mind and edit the desired count. Kill a pod above and watch
          the very next loop notice the drift and correct it, with no human involved.
        </p>
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
      --do-pending: #60a5fa;
    }

    .loop-row {
      display: flex;
      align-items: stretch;
      gap: 10px;
      flex-wrap: wrap;
    }
    .loop-node {
      flex: 1;
      min-width: 130px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 18px 12px;
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      text-align: center;
      transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
    }
    .loop-node.is-desired {
      border-color: var(--do-violet);
      border-style: dashed;
    }
    .loop-node.is-active {
      border-color: var(--do-accent);
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--do-accent) 30%, transparent), 0 0 20px color-mix(in srgb, var(--do-accent) 20%, transparent);
      transform: translateY(-2px);
    }
    .loop-node-label { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em; color: var(--text); }
    .loop-node-value { font-size: 0.6875rem; color: var(--text-faint); }

    .loop-arrow { color: var(--text-faint); font-size: 0.9rem; align-self: center; transition: color 0.2s ease; }
    .loop-arrow.is-live { color: var(--do-accent); }

    .loop-back {
      margin-top: 10px;
      font-size: 0.6875rem;
      color: var(--text-faint);
      transition: color 0.2s ease;
    }
    .loop-back.is-live { color: var(--do-accent); }

    .stat-value.is-drift { color: var(--do-warning); }

    @media (prefers-reduced-motion: reduce) {
      .loop-node { transition: none; }
    }
  `,
})
export class KubernetesControlLoop implements OnDestroy {
  protected readonly desired = signal(3);
  protected readonly actual = signal(3);
  protected readonly step = signal<Step>('desired');
  protected readonly playing = signal(false);
  protected readonly logLine = signal(
    'Desired state declared: 3 replicas. Press Step or Play to start the reconciliation loop.',
  );
  protected readonly drift = () => this.desired() - this.actual();

  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnDestroy(): void {
    this.clearTimer();
  }

  protected ariaSummary(): string {
    return `desired ${this.desired()}, actual ${this.actual()}, current step ${this.step()}`;
  }

  protected advanceStep(): void {
    const idx = STEP_ORDER.indexOf(this.step());
    const next = STEP_ORDER[(idx + 1) % STEP_ORDER.length];
    this.step.set(next);

    const d = this.desired();
    const a = this.actual();

    switch (next) {
      case 'desired':
        this.logLine.set(`Desired state (the spec you wrote) says: ${d} replicas. This never changes on its own.`);
        break;
      case 'observe':
        this.logLine.set(`Observe: controller watches the API server — currently ${a} pod(s) actually running.`);
        break;
      case 'compare':
        this.logLine.set(
          a === d
            ? `Compare: actual (${a}) matches desired (${d}). No drift — nothing to do.`
            : `Compare: actual (${a}) does not match desired (${d}). Drift detected.`,
        );
        break;
      case 'act':
        if (a === d) {
          this.logLine.set('Act: state already matches spec — controller sleeps and observes again.');
        } else if (a < d) {
          this.actual.set(a + 1);
          this.logLine.set('Act: scheduling a new pod — actual was below desired.');
        } else {
          this.actual.set(a - 1);
          this.logLine.set('Act: terminating a pod — actual was above desired.');
        }
        break;
    }
  }

  protected togglePlay(): void {
    this.playing() ? this.pause() : this.play();
  }

  private play(): void {
    this.playing.set(true);
    this.clearTimer();
    this.timer = setInterval(() => this.advanceStep(), STEP_MS);
  }

  private pause(): void {
    this.playing.set(false);
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  protected killPod(): void {
    if (this.actual() > 0) {
      this.actual.update((n) => n - 1);
      this.logLine.set('A pod just died outside the control loop — reality has drifted from spec. Keep stepping to watch it get corrected.');
    }
  }

  protected scaleDesired(delta: number): void {
    this.desired.update((n) => Math.min(8, Math.max(0, n + delta)));
    this.logLine.set(`Desired state changed: you now want ${this.desired()} replicas. The loop will work toward it.`);
  }

  protected reset(): void {
    this.pause();
    this.desired.set(3);
    this.actual.set(3);
    this.step.set('desired');
    this.logLine.set('Desired state declared: 3 replicas. Press Step or Play to start the reconciliation loop.');
  }
}
