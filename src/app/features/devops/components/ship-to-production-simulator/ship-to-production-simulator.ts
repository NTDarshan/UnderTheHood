import { Component, OnDestroy, computed, signal } from '@angular/core';

type RunPhase =
  | 'idle'
  | 'committed'
  | 'ci-running'
  | 'tests-running'
  | 'building-image'
  | 'pushing-image'
  | 'deploying'
  | 'pods-healthy'
  | 'traffic-flowing'
  | 'healthy';

type Strategy = 'rolling' | 'blue-green' | 'canary';

interface Pod {
  id: number;
  status: 'healthy' | 'starting' | 'crashed' | 'draining';
  version: 'v1' | 'v2';
}

interface StepDef {
  phase: RunPhase;
  zone: 'dev' | 'ci' | 'cluster' | 'traffic';
  log: string;
  delay: number;
}

const RUN_STEPS: StepDef[] = [
  { phase: 'committed', zone: 'dev', log: 'git commit -m "fix: paginate order history" — pushed to main.', delay: 500 },
  { phase: 'ci-running', zone: 'ci', log: 'CI pipeline triggered — checking out commit a3f9c1e…', delay: 900 },
  { phase: 'tests-running', zone: 'ci', log: 'Running unit + integration tests (142 passed, 0 failed)…', delay: 1100 },
  { phase: 'building-image', zone: 'ci', log: 'Building container image orders-api:a3f9c1e…', delay: 1000 },
  { phase: 'pushing-image', zone: 'ci', log: 'Pushing image to registry.internal/orders-api:a3f9c1e…', delay: 900 },
  { phase: 'deploying', zone: 'cluster', log: 'Kubernetes deployment updated — rolling out new pods…', delay: 1200 },
  { phase: 'pods-healthy', zone: 'cluster', log: 'New pods passed readiness probes — marked healthy.', delay: 1000 },
  { phase: 'traffic-flowing', zone: 'traffic', log: 'Load balancer routing live traffic to the new version…', delay: 900 },
  { phase: 'healthy', zone: 'traffic', log: 'Production healthy. Metrics nominal.', delay: 800 },
];

const ZONE_ORDER: RunPhase[] = [
  'idle', 'committed', 'ci-running', 'tests-running', 'building-image',
  'pushing-image', 'deploying', 'pods-healthy', 'traffic-flowing', 'healthy',
];

@Component({
  selector: 'app-ship-to-production-simulator',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section do-scene ship-scene" id="ship-to-production-simulator">
      <div class="container">
        <p class="lab-index mono">27 — THE FULL JOURNEY</p>
        <h2 class="lab-title">Ship a backend to production</h2>
        <p class="lab-lede">
          Everything in this chapter, running at once. Commit code and watch it travel through CI, into a container,
          onto a cluster, and into live traffic — then poke at a healthy production system the way it actually
          breaks (and heals).
        </p>

        <div class="lab-panel">
          @if (phase() === 'idle') {
            <div class="launch-row">
              <button type="button" class="lab-btn lab-btn-primary lab-btn-lg" (click)="ship()">SHIP A BACKEND TO PRODUCTION</button>
            </div>
          } @else {
            <div class="zones">
              <div class="zone" [class.is-active]="isZoneActive('dev')">
                <p class="zone-label mono">DEVELOPER / GIT</p>
                <div class="zone-body">
                  <span class="zone-icon mono">{{ phaseIndex() >= 1 ? '✓ a3f9c1e committed' : '…' }}</span>
                </div>
              </div>
              <div class="zone" [class.is-active]="isZoneActive('ci')">
                <p class="zone-label mono">CI</p>
                <div class="zone-body">
                  <span class="zone-icon mono">{{ ciLabel() }}</span>
                </div>
              </div>
              <div class="zone" [class.is-active]="isZoneActive('cluster')">
                <p class="zone-label mono">REGISTRY / KUBERNETES</p>
                <div class="zone-body pods-row">
                  @for (pod of pods(); track pod.id) {
                    <span class="pod-chip" [attr.data-status]="pod.status" [attr.data-version]="pod.version">
                      <span class="pod-dot" aria-hidden="true"></span>{{ pod.version }}
                    </span>
                  }
                  @if (pods().length === 0) {
                    <span class="zone-icon mono">no pods scheduled yet</span>
                  }
                </div>
              </div>
              <div class="zone" [class.is-active]="isZoneActive('traffic')">
                <p class="zone-label mono">TRAFFIC / METRICS</p>
                <div class="zone-body">
                  @if (phaseIndex() >= 7) {
                    <div class="metrics-row mono">
                      <span [class.is-danger]="errorRatePct() > 5">req/s {{ reqPerSec() }}</span>
                      <span [class.is-danger]="errorRatePct() > 5">err {{ errorRatePct() }}%</span>
                      <span [class.is-danger]="p95Latency() > 300">p95 {{ p95Latency() }}ms</span>
                    </div>
                  } @else {
                    <span class="zone-icon mono">no traffic yet</span>
                  }
                </div>
              </div>
            </div>

            <p class="status-line mono" aria-live="polite">{{ logLine() }}</p>

            @if (phase() === 'healthy') {
              <div class="lab-btn-row">
                <button type="button" class="lab-btn lab-btn-danger" [disabled]="eventBusy()" (click)="crashPod()">ONE POD CRASHES</button>
                <button type="button" class="lab-btn lab-btn-danger" [disabled]="eventBusy()" (click)="slowDatabase()">DATABASE BECOMES SLOW</button>
                <button type="button" class="lab-btn lab-btn-primary" [disabled]="eventBusy() || deployingV2()" (click)="toggleDeployPicker()">DEPLOY V2</button>
                <button type="button" class="lab-btn" (click)="reset()">RESET SIMULATION</button>
              </div>

              @if (dbSlowActive()) {
                <p class="incident-note mono">DB latency elevated — traffic/metrics zone shows cascading effects. It will self-resolve shortly.</p>
              }

              @if (showDeployPicker() && !deployingV2()) {
                <div class="strategy-picker">
                  <p class="picker-heading mono">CHOOSE A ROLLOUT STRATEGY</p>
                  <div class="lab-btn-row">
                    <button type="button" class="lab-btn" [class.is-active]="strategy() === 'rolling'" (click)="strategy.set('rolling')">ROLLING</button>
                    <button type="button" class="lab-btn" [class.is-active]="strategy() === 'blue-green'" (click)="strategy.set('blue-green')">BLUE-GREEN</button>
                    <button type="button" class="lab-btn" [class.is-active]="strategy() === 'canary'" (click)="strategy.set('canary')">CANARY</button>
                  </div>
                  <button type="button" class="lab-btn lab-btn-primary" style="margin-top: 12px;" (click)="deployV2()">DEPLOY v2 — {{ strategy().toUpperCase() }}</button>
                </div>
              }

              @if (deployingV2()) {
                <div class="strategy-picker">
                  <p class="picker-heading mono">{{ strategy().toUpperCase() }} ROLLOUT — {{ v2Pct() }}% ON v2</p>
                  <div class="rollout-track"><div class="rollout-fill" [style.width.%]="v2Pct()"></div></div>
                  <p class="status-line mono" style="border-top: none; padding-top: 8px; margin-top: 8px;">{{ rolloutLine() }}</p>
                </div>
              }
            }

            <div class="lab-code log-panel">
              @for (line of history(); track $index) {
                <div>{{ line }}</div>
              }
            </div>
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
      --do-pending: #fbbf24;
    }

    .launch-row { display: flex; justify-content: center; padding: 32px 0; }
    .lab-btn-lg { padding: 16px 28px; font-size: 0.9375rem; }

    .zones { display: grid; grid-template-columns: 1fr; gap: 12px; }
    @media (min-width: 800px) { .zones { grid-template-columns: repeat(4, 1fr); } }
    .zone {
      padding: 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md);
      min-height: 92px; transition: border-color 0.3s ease, box-shadow 0.3s ease; opacity: 0.55;
    }
    .zone.is-active { opacity: 1; border-color: var(--do-accent); box-shadow: 0 0 0 1px color-mix(in srgb, var(--do-accent) 25%, transparent); }
    .zone-label { font-size: 0.625rem; letter-spacing: 0.08em; color: var(--text-faint); margin-bottom: 10px; }
    .zone-body { min-height: 32px; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
    .zone-icon { font-size: 0.75rem; color: var(--text-muted); }

    .pods-row { gap: 6px; }
    .pod-chip {
      display: inline-flex; align-items: center; gap: 5px; font-size: 0.6875rem; font-family: var(--font-mono);
      padding: 4px 8px; border-radius: 999px; border: 1px solid var(--border-strong); color: var(--text-muted);
    }
    .pod-chip[data-version='v2'] { border-color: color-mix(in srgb, var(--do-violet) 50%, var(--border-strong)); color: var(--do-violet); }
    .pod-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--do-success); }
    .pod-chip[data-status='starting'] .pod-dot { background: var(--do-warning); animation: pod-pulse 1s ease-in-out infinite; }
    .pod-chip[data-status='crashed'] .pod-dot { background: var(--do-danger); }
    .pod-chip[data-status='crashed'] { border-color: color-mix(in srgb, var(--do-danger) 50%, var(--border-strong)); color: var(--do-danger); }
    .pod-chip[data-status='draining'] .pod-dot { background: var(--text-faint); }
    @media (prefers-reduced-motion: reduce) { .pod-chip[data-status='starting'] .pod-dot { animation: none; } }
    @keyframes pod-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

    .metrics-row { display: flex; gap: 14px; font-size: 0.75rem; color: var(--text-muted); }
    .metrics-row .is-danger { color: var(--do-danger); font-weight: 700; }

    .status-line { margin-top: 20px; padding-top: 18px; border-top: 1px solid var(--border); font-size: 0.8125rem; color: var(--text-muted); min-height: 1.2em; }
    .incident-note { margin-top: 10px; font-size: 0.75rem; color: var(--do-danger); }

    .strategy-picker { margin-top: 20px; padding: 18px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .picker-heading { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--text-faint); margin: 0 0 12px; }
    .rollout-track { height: 8px; border-radius: 999px; background: var(--surface-elevated); border: 1px solid var(--border); overflow: hidden; }
    .rollout-fill { height: 100%; background: linear-gradient(90deg, var(--do-cyan), var(--do-violet)); transition: width 0.4s ease; }

    .log-panel { margin-top: 20px; max-height: 160px; overflow-y: auto; font-size: 0.75rem; }
  `,
})
export class ShipToProductionSimulator implements OnDestroy {
  protected readonly phase = signal<RunPhase>('idle');
  protected readonly logLine = signal('');
  protected readonly history = signal<string[]>([]);
  protected readonly pods = signal<Pod[]>([]);
  protected readonly eventBusy = signal(false);
  protected readonly dbSlowActive = signal(false);
  protected readonly showDeployPicker = signal(false);
  protected readonly deployingV2 = signal(false);
  protected readonly strategy = signal<Strategy>('rolling');
  protected readonly v2Pct = signal(0);
  protected readonly rolloutLine = signal('');

  protected readonly reqPerSec = signal(340);
  protected readonly errorRatePct = signal(0);
  protected readonly p95Latency = signal(85);

  protected readonly phaseIndex = computed(() => ZONE_ORDER.indexOf(this.phase()));

  private timers: ReturnType<typeof setTimeout>[] = [];
  private metricsInterval: ReturnType<typeof setInterval> | null = null;
  private nextPodId = 1;

  ngOnDestroy(): void {
    this.clearAllTimers();
  }

  protected isZoneActive(zone: StepDef['zone']): boolean {
    if (this.phase() === 'idle') return false;
    if (this.phase() === 'healthy' || this.deployingV2() || this.dbSlowActive()) {
      return zone === 'traffic' || zone === 'cluster';
    }
    const step = RUN_STEPS.find((s) => s.phase === this.phase());
    return step?.zone === zone;
  }

  protected ciLabel(): string {
    const i = this.phaseIndex();
    if (i < 1) return 'waiting…';
    if (i === 1) return 'pipeline started…';
    if (i === 2) return 'running tests…';
    if (i === 3) return 'building image…';
    if (i === 4) return 'pushing to registry…';
    return '✓ image a3f9c1e in registry';
  }

  protected ship(): void {
    this.clearAllTimers();
    this.phase.set('idle');
    this.history.set([]);
    this.pods.set([]);
    this.nextPodId = 1;
    this.v2Pct.set(0);
    this.deployingV2.set(false);
    this.showDeployPicker.set(false);
    this.dbSlowActive.set(false);
    this.reqPerSec.set(340);
    this.errorRatePct.set(0);
    this.p95Latency.set(85);

    let cumulative = 0;
    for (const step of RUN_STEPS) {
      cumulative += step.delay;
      this.after(cumulative, () => {
        this.phase.set(step.phase);
        this.logLine.set(step.log);
        this.pushHistory(step.log);
        if (step.phase === 'deploying') {
          this.pods.set([
            { id: this.nextPodId++, status: 'starting', version: 'v1' },
            { id: this.nextPodId++, status: 'starting', version: 'v1' },
            { id: this.nextPodId++, status: 'starting', version: 'v1' },
          ]);
        }
        if (step.phase === 'pods-healthy') {
          this.pods.update((list) => list.map((p) => ({ ...p, status: 'healthy' as const })));
        }
        if (step.phase === 'healthy') {
          this.startMetricsJitter();
        }
      });
    }
  }

  protected crashPod(): void {
    if (this.eventBusy() || this.pods().length === 0) return;
    this.eventBusy.set(true);
    const target = this.pods()[0];
    this.pods.update((list) => list.map((p) => (p.id === target.id ? { ...p, status: 'crashed' as const } : p)));
    this.pushHistory(`Pod ${target.id} crashed — liveness probe failed.`);
    this.errorRatePct.set(8);
    this.p95Latency.update((v) => v + 60);

    this.after(1200, () => {
      this.pushHistory('Kubernetes detected the missing replica — scheduling a replacement pod.');
      this.pods.update((list) => list.map((p) => (p.id === target.id ? { ...p, status: 'starting' as const } : p)));
    });
    this.after(2400, () => {
      this.pods.update((list) => list.map((p) => (p.id === target.id ? { ...p, status: 'healthy' as const } : p)));
      this.pushHistory(`Pod ${target.id} rescheduled and passed readiness checks. Capacity restored.`);
      this.errorRatePct.set(0);
      this.p95Latency.set(85);
      this.eventBusy.set(false);
    });
  }

  protected slowDatabase(): void {
    if (this.eventBusy()) return;
    this.eventBusy.set(true);
    this.dbSlowActive.set(true);
    this.pushHistory('Database read latency spiking — requests begin queueing behind slow queries.');
    this.p95Latency.set(640);
    this.errorRatePct.set(14);
    this.reqPerSec.update((v) => Math.round(v * 0.7));

    this.after(2200, () => {
      this.pushHistory('DB connection pool recovered — latency and error rate draining back to baseline.');
      this.p95Latency.set(180);
      this.errorRatePct.set(3);
    });
    this.after(3600, () => {
      this.p95Latency.set(85);
      this.errorRatePct.set(0);
      this.reqPerSec.set(340);
      this.dbSlowActive.set(false);
      this.pushHistory('Metrics back to baseline. This is the same cascade a slow query always causes — the earlier incident section walks through it end to end.');
      this.eventBusy.set(false);
    });
  }

  protected toggleDeployPicker(): void {
    this.showDeployPicker.update((v) => !v);
  }

  protected deployV2(): void {
    if (this.deployingV2()) return;
    this.showDeployPicker.set(false);
    this.deployingV2.set(true);
    this.v2Pct.set(0);
    const strat = this.strategy();

    if (strat === 'rolling') {
      this.rolloutLine.set('Rolling: new v2 pods replace v1 pods one at a time, keeping capacity steady throughout.');
      this.pushHistory('Rolling deploy started — replacing pods one at a time.');
      this.stepRollout([25, 50, 75, 100], 700);
    } else if (strat === 'blue-green') {
      this.rolloutLine.set('Blue-green: a full v2 fleet starts alongside v1, then traffic cuts over all at once.');
      this.pushHistory('Blue-green deploy started — standing up a parallel v2 environment.');
      this.after(1400, () => { this.v2Pct.set(0); this.rolloutLine.set('v2 fleet is healthy and idle, receiving no traffic yet…'); });
      this.after(2400, () => { this.stepRollout([100], 200); this.rolloutLine.set('Cutting traffic over to v2 — instant switch.'); });
    } else {
      this.rolloutLine.set('Canary: a small slice of traffic goes to v2 first, and grows only if metrics stay healthy.');
      this.pushHistory('Canary deploy started — routing 10% of traffic to v2.');
      this.stepRollout([10, 30, 60, 100], 800);
    }

    this.after(strat === 'blue-green' ? 3200 : 4200, () => {
      this.pods.set([
        { id: this.nextPodId++, status: 'healthy', version: 'v2' },
        { id: this.nextPodId++, status: 'healthy', version: 'v2' },
        { id: this.nextPodId++, status: 'healthy', version: 'v2' },
      ]);
      this.deployingV2.set(false);
      this.rolloutLine.set('');
      this.pushHistory(`v2 fully rolled out via ${strat} — production now serving v2 exclusively.`);
    });
  }

  private stepRollout(pcts: number[], stepDelay: number): void {
    let cumulative = 0;
    for (const pct of pcts) {
      cumulative += stepDelay;
      this.after(cumulative, () => this.v2Pct.set(pct));
    }
  }

  protected reset(): void {
    this.clearAllTimers();
    this.phase.set('idle');
    this.history.set([]);
    this.pods.set([]);
    this.logLine.set('');
    this.eventBusy.set(false);
    this.dbSlowActive.set(false);
    this.showDeployPicker.set(false);
    this.deployingV2.set(false);
    this.v2Pct.set(0);
  }

  private startMetricsJitter(): void {
    if (this.metricsInterval) clearInterval(this.metricsInterval);
    this.metricsInterval = setInterval(() => {
      if (this.dbSlowActive() || this.eventBusy()) return;
      this.reqPerSec.set(320 + Math.round(Math.random() * 40));
      this.p95Latency.set(75 + Math.round(Math.random() * 25));
    }, 2000);
  }

  private pushHistory(line: string): void {
    this.history.update((h) => [...h, line].slice(-30));
  }

  private after(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }

  private clearAllTimers(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }
}
