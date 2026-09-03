import { Component, OnDestroy, computed, signal } from '@angular/core';

type SimMode = 'idle' | 'traffic' | 'deploying' | 'graceful-shutdown' | 'hard-stop' | 'stopped' | 'paused';
type InstanceState = 'up' | 'draining' | 'down';

interface Instance {
  id: number;
  state: InstanceState;
  activeRequests: number;
}

const TICK_MS = 300;

@Component({
  selector: 'app-shutdown-playground-simulator',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section gs-scene playground-scene" id="gs-playground">
      <div class="container">
        <p class="lab-index">31 — THE SHUTDOWN PLAYGROUND</p>
        <h2 class="lab-title">SHUTDOWN PLAYGROUND</h2>
        <p class="lab-lede">
          Every dial from this chapter, in one simulator. Tune the workload and the safety features, start traffic,
          then trigger a deployment or a shutdown and watch the fleet react in real time.
        </p>

        <div class="lab-panel pg-controls-panel">
          <h3 class="panel-heading">Control panel</h3>
          <div class="pg-controls-grid">
            <label class="lab-field">
              <span>Request rate: {{ requestRate() }} req/s</span>
              <input type="range" min="1" max="200" step="1" [value]="requestRate()" (input)="requestRate.set(+$any($event.target).value)" />
            </label>

            <label class="lab-field">
              <span>Active requests cap: {{ activeRequestsCap() }}</span>
              <input type="range" min="5" max="300" step="5" [value]="activeRequestsCap()" (input)="activeRequestsCap.set(+$any($event.target).value)" />
            </label>

            <label class="lab-field">
              <span>Database latency: {{ dbLatencyMs() }} ms</span>
              <input type="range" min="5" max="2000" step="5" [value]="dbLatencyMs()" (input)="dbLatencyMs.set(+$any($event.target).value)" />
            </label>

            <label class="lab-field">
              <span>External API latency: {{ externalLatencyMs() }} ms</span>
              <input type="range" min="5" max="3000" step="5" [value]="externalLatencyMs()" (input)="externalLatencyMs.set(+$any($event.target).value)" />
            </label>

            <label class="lab-field">
              <span>Background job count: {{ jobCount() }}</span>
              <input type="range" min="0" max="50" step="1" [value]="jobCount()" (input)="jobCount.set(+$any($event.target).value)" />
            </label>

            <label class="lab-field">
              <span>Queue depth: {{ queueDepth() }}</span>
              <input type="range" min="0" max="500" step="5" [value]="queueDepth()" (input)="queueDepth.set(+$any($event.target).value)" />
            </label>

            <label class="lab-field">
              <span>Shutdown timeout: {{ shutdownTimeoutSec() }} s</span>
              <input type="range" min="1" max="60" step="1" [value]="shutdownTimeoutSec()" (input)="shutdownTimeoutSec.set(+$any($event.target).value)" />
            </label>

            <label class="lab-field">
              <span>Server instances: {{ instanceCount() }}</span>
              <input type="range" min="1" max="8" step="1" [value]="instanceCount()" [disabled]="isBusy()" (input)="setInstanceCount(+$any($event.target).value)" />
            </label>
          </div>

          <div class="pg-toggle-row">
            <button type="button" class="lab-btn" [attr.aria-pressed]="cancellationEnabled()" (click)="cancellationEnabled.set(!cancellationEnabled())">
              Cancellation: {{ cancellationEnabled() ? 'ON' : 'OFF' }}
            </button>
            <button type="button" class="lab-btn" [attr.aria-pressed]="readinessEnabled()" (click)="readinessEnabled.set(!readinessEnabled())">
              Readiness checks: {{ readinessEnabled() ? 'ON' : 'OFF' }}
            </button>
          </div>

          <div class="lab-btn-row pg-action-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="mode() === 'traffic'" (click)="startTraffic()">START TRAFFIC</button>
            <button type="button" class="lab-btn" [disabled]="!isLiveMode()" (click)="triggerDeployment()">TRIGGER DEPLOYMENT</button>
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="!isLiveMode()" (click)="gracefulShutdown()">GRACEFUL SHUTDOWN</button>
            <button type="button" class="lab-btn lab-btn-danger" [disabled]="!isLiveMode()" (click)="hardStop()">HARD STOP</button>
            <button type="button" class="lab-btn" [disabled]="!isBusy() && mode() !== 'paused'" (click)="togglePause()">
              {{ mode() === 'paused' ? 'RESUME' : 'PAUSE' }}
            </button>
            <button type="button" class="lab-btn" (click)="resetAll()">RESET</button>
          </div>

          <div class="pg-mode-line mono" aria-live="polite">
            MODE: <span [attr.data-mode]="mode()" class="pg-mode-value">{{ modeLabel() }}</span>
          </div>
        </div>

        <div class="lab-panel pg-fleet-panel">
          <h3 class="panel-heading">Live fleet</h3>
          <div class="pg-fleet-grid" role="list" aria-label="Server instances">
            @for (inst of instances(); track inst.id) {
              <div class="pg-instance" [attr.data-state]="inst.state" role="listitem">
                <span class="pg-instance-label mono">i-{{ inst.id }}</span>
                <div class="pg-instance-bar">
                  <div class="pg-instance-bar-fill" [style.width.%]="instanceLoadPct(inst)"></div>
                </div>
                <span class="pg-instance-count mono">{{ inst.activeRequests }} req</span>
                <span class="pill pg-instance-pill"
                      [class.pill-yes]="inst.state === 'up'"
                      [class.pill-conditional]="inst.state === 'draining'"
                      [class.pill-no]="inst.state === 'down'">
                  {{ inst.state.toUpperCase() }}
                </span>
              </div>
            }
          </div>
        </div>

        <div class="lab-panel pg-metrics-panel">
          <h3 class="panel-heading">Live metrics</h3>
          <div class="pg-metrics-grid">
            <div class="pg-metric"><span class="pg-metric-value mono">{{ metrics().active }}</span><span class="pg-metric-label mono">Active requests</span></div>
            <div class="pg-metric"><span class="pg-metric-value mono">{{ metrics().completed }}</span><span class="pg-metric-label mono">Completed</span></div>
            <div class="pg-metric" [class.pg-metric-bad]="metrics().failed > 0"><span class="pg-metric-value mono">{{ metrics().failed }}</span><span class="pg-metric-label mono">Failed</span></div>
            <div class="pg-metric"><span class="pg-metric-value mono">{{ metrics().cancelled }}</span><span class="pg-metric-label mono">Cancelled</span></div>
            <div class="pg-metric"><span class="pg-metric-value mono">{{ metrics().queueDepthLive }}</span><span class="pg-metric-label mono">Queue depth</span></div>
            <div class="pg-metric"><span class="pg-metric-value mono">{{ metrics().dbConnections }}</span><span class="pg-metric-label mono">DB connections</span></div>
            <div class="pg-metric"><span class="pg-metric-value mono">{{ metrics().jobsRemaining }}</span><span class="pg-metric-label mono">Jobs</span></div>
            <div class="pg-metric"><span class="pg-metric-value mono">{{ (metrics().shutdownDurationMs / 1000).toFixed(1) }}s</span><span class="pg-metric-label mono">Shutdown duration</span></div>
            <div class="pg-metric" [class.pg-metric-bad]="metrics().errors > 0"><span class="pg-metric-value mono">{{ metrics().errors }}</span><span class="pg-metric-label mono">Errors</span></div>
          </div>
        </div>

        @if (mode() === 'stopped') {
          <p class="lab-note">
            Run finished. {{ metrics().completed }} completed, {{ metrics().failed }} failed,
            {{ metrics().cancelled }} cancelled, over {{ (metrics().shutdownDurationMs / 1000).toFixed(1) }}s of
            shutdown. Try the same load with cancellation or readiness checks disabled to see how the numbers move.
          </p>
        }
      </div>
    </section>
  `,
  styles: `
    .playground-scene {
      --running: #4ade80;
      --draining: var(--accent);
      --stopped: var(--danger);
      --idle: #64748b;
      --signal: #a78bfa;
      --resource: #60a5fa;
      --queue: #fbbf24;
      --cancelled: #f472b6;
    }

    .panel-heading { margin: 0 0 4px; font-size: 1.125rem; color: var(--text); }

    .pg-controls-grid { margin-top: 18px; display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 640px) { .pg-controls-grid { grid-template-columns: 1fr 1fr; } }
    @media (min-width: 1000px) { .pg-controls-grid { grid-template-columns: repeat(4, 1fr); } }
    .pg-controls-grid input[type='range'] { accent-color: var(--accent); width: 100%; }

    .pg-toggle-row { margin-top: 18px; display: flex; flex-wrap: wrap; gap: 10px; }
    .pg-action-row { margin-top: 10px; }

    .pg-mode-line { margin-top: 16px; font-size: 0.8125rem; color: var(--text-faint); letter-spacing: 0.04em; }
    .pg-mode-value { font-weight: 700; color: var(--idle); }
    .pg-mode-value[data-mode='traffic'] { color: var(--running); }
    .pg-mode-value[data-mode='deploying'] { color: var(--resource); }
    .pg-mode-value[data-mode='graceful-shutdown'] { color: var(--draining); }
    .pg-mode-value[data-mode='hard-stop'] { color: var(--stopped); }
    .pg-mode-value[data-mode='paused'] { color: var(--queue); }
    .pg-mode-value[data-mode='stopped'] { color: var(--text-muted); }

    .pg-fleet-grid { margin-top: 18px; display: grid; grid-template-columns: 1fr; gap: 12px; }
    @media (min-width: 560px) { .pg-fleet-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 900px) { .pg-fleet-grid { grid-template-columns: repeat(4, 1fr); } }

    .pg-instance {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 14px 10px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      transition: border-color 0.3s ease, opacity 0.3s ease, transform 0.3s ease;
    }
    .pg-instance[data-state='up'] { border-color: color-mix(in srgb, var(--running) 40%, var(--border)); }
    .pg-instance[data-state='draining'] { border-color: color-mix(in srgb, var(--draining) 55%, var(--border)); }
    .pg-instance[data-state='down'] { border-color: color-mix(in srgb, var(--stopped) 40%, var(--border)); opacity: 0.55; transform: scale(0.97); }

    .pg-instance-label { font-size: 0.75rem; color: var(--text-muted); }
    .pg-instance-bar { width: 100%; height: 6px; border-radius: 999px; background: var(--surface-elevated); overflow: hidden; }
    .pg-instance-bar-fill { height: 100%; background: var(--running); transition: width 0.25s ease, background 0.25s ease; }
    .pg-instance[data-state='draining'] .pg-instance-bar-fill { background: var(--draining); }
    .pg-instance[data-state='down'] .pg-instance-bar-fill { background: var(--stopped); width: 0 !important; }
    .pg-instance-count { font-size: 0.6875rem; color: var(--text-faint); }
    .pg-instance-pill { width: fit-content; }

    .pg-metrics-grid { margin-top: 18px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    @media (min-width: 640px) { .pg-metrics-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (min-width: 1000px) { .pg-metrics-grid { grid-template-columns: repeat(9, 1fr); } }

    .pg-metric {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 12px 8px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      transition: border-color 0.2s ease;
    }
    .pg-metric-bad { border-color: color-mix(in srgb, var(--stopped) 50%, var(--border)); }
    .pg-metric-value { font-size: 1.125rem; color: var(--text); font-weight: 700; }
    .pg-metric-bad .pg-metric-value { color: var(--stopped); }
    .pg-metric-label { font-size: 0.625rem; color: var(--text-faint); text-align: center; letter-spacing: 0.02em; }

    @media (prefers-reduced-motion: reduce) {
      .pg-instance { transition: none; }
      .pg-instance-bar-fill { transition: none; }
    }
  `,
})
export class ShutdownPlaygroundSimulator implements OnDestroy {
  // Controls
  protected readonly requestRate = signal(40);
  protected readonly activeRequestsCap = signal(80);
  protected readonly dbLatencyMs = signal(40);
  protected readonly externalLatencyMs = signal(120);
  protected readonly jobCount = signal(6);
  protected readonly queueDepth = signal(20);
  protected readonly shutdownTimeoutSec = signal(15);
  protected readonly instanceCount = signal(3);
  protected readonly cancellationEnabled = signal(true);
  protected readonly readinessEnabled = signal(true);

  // Sim state
  protected readonly mode = signal<SimMode>('idle');
  protected readonly instances = signal<Instance[]>([]);

  protected readonly metrics = signal({
    active: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
    queueDepthLive: 0,
    dbConnections: 0,
    jobsRemaining: 0,
    shutdownDurationMs: 0,
    errors: 0,
  });

  private timer: ReturnType<typeof setInterval> | null = null;
  private shutdownStartedAt = 0;
  private modeBeforePause: SimMode | null = null;

  protected readonly isLiveMode = computed(() => this.mode() === 'traffic' || this.mode() === 'deploying');
  protected readonly isBusy = computed(() => {
    const m = this.mode();
    return m === 'traffic' || m === 'deploying' || m === 'graceful-shutdown' || m === 'hard-stop' || m === 'paused';
  });

  constructor() {
    this.instances.set(this.buildInstances(this.instanceCount()));
    this.metrics.update((m) => ({ ...m, jobsRemaining: this.jobCount(), queueDepthLive: this.queueDepth() }));
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  protected modeLabel(): string {
    switch (this.mode()) {
      case 'idle':
        return 'IDLE';
      case 'traffic':
        return 'TRAFFIC RUNNING';
      case 'deploying':
        return 'ROLLING DEPLOYMENT';
      case 'graceful-shutdown':
        return 'GRACEFUL SHUTDOWN';
      case 'hard-stop':
        return 'HARD STOP';
      case 'paused':
        return 'PAUSED';
      case 'stopped':
        return 'STOPPED';
    }
  }

  protected instanceLoadPct(inst: Instance): number {
    const cap = Math.max(1, this.activeRequestsCap() / Math.max(1, this.instanceCount()));
    return Math.min(100, (inst.activeRequests / cap) * 100);
  }

  protected setInstanceCount(n: number): void {
    this.instanceCount.set(n);
    if (!this.isBusy()) {
      this.instances.set(this.buildInstances(n));
    }
  }

  private buildInstances(count: number): Instance[] {
    return Array.from({ length: count }, (_, i) => ({ id: i + 1, state: 'up' as InstanceState, activeRequests: 0 }));
  }

  protected startTraffic(): void {
    if (this.mode() === 'traffic') return;
    this.instances.set(this.buildInstances(this.instanceCount()));
    this.metrics.set({
      active: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      queueDepthLive: this.queueDepth(),
      dbConnections: 0,
      jobsRemaining: this.jobCount(),
      shutdownDurationMs: 0,
      errors: 0,
    });
    this.mode.set('traffic');
    this.startTimer();
  }

  protected triggerDeployment(): void {
    if (!this.isLiveMode()) return;
    this.mode.set('deploying');
    // Rolling: cycle instances down (draining) then back up one at a time.
    let i = 0;
    const rollNext = () => {
      if (this.mode() !== 'deploying') return;
      const insts = this.instances();
      if (i >= insts.length) {
        this.mode.set('traffic');
        return;
      }
      const targetId = insts[i].id;
      this.instances.update((list) => list.map((x) => (x.id === targetId ? { ...x, state: 'draining' } : x)));
      setTimeout(() => {
        if (this.mode() !== 'deploying') return;
        this.instances.update((list) => list.map((x) => (x.id === targetId ? { ...x, state: 'up', activeRequests: 0 } : x)));
        i++;
        rollNext();
      }, 1200);
    };
    rollNext();
  }

  protected gracefulShutdown(): void {
    if (!this.isLiveMode()) return;
    this.mode.set('graceful-shutdown');
    this.shutdownStartedAt = Date.now();
    this.instances.update((list) => list.map((x) => ({ ...x, state: 'draining' as InstanceState })));

    const timeoutMs = this.shutdownTimeoutSec() * 1000;
    setTimeout(() => {
      if (this.mode() === 'graceful-shutdown') {
        this.finishShutdown(false);
      }
    }, timeoutMs);
  }

  protected hardStop(): void {
    if (!this.isLiveMode()) return;
    this.mode.set('hard-stop');
    this.shutdownStartedAt = Date.now();
    this.instances.update((list) => list.map((x) => ({ ...x, state: 'down' as InstanceState, activeRequests: 0 })));
    const activeCount = this.metrics().active;
    this.metrics.update((m) => ({
      ...m,
      failed: m.failed + activeCount,
      errors: m.errors + activeCount,
      active: 0,
      jobsRemaining: 0,
      dbConnections: 0,
      queueDepthLive: 0,
      shutdownDurationMs: 50,
    }));
    setTimeout(() => this.mode.set('stopped'), 200);
  }

  protected togglePause(): void {
    if (this.mode() === 'paused') {
      if (this.modeBeforePause) {
        this.mode.set(this.modeBeforePause);
        this.modeBeforePause = null;
      }
      return;
    }
    if (!this.isBusy()) return;
    this.modeBeforePause = this.mode();
    this.mode.set('paused');
  }

  protected resetAll(): void {
    this.clearTimer();
    this.mode.set('idle');
    this.modeBeforePause = null;
    this.instances.set(this.buildInstances(this.instanceCount()));
    this.metrics.set({
      active: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      queueDepthLive: this.queueDepth(),
      dbConnections: 0,
      jobsRemaining: this.jobCount(),
      shutdownDurationMs: 0,
      errors: 0,
    });
  }

  private finishShutdown(hard: boolean): void {
    const remainingActive = this.metrics().active;
    this.metrics.update((m) => ({
      ...m,
      cancelled: hard ? m.cancelled : m.cancelled + (this.cancellationEnabled() ? 0 : remainingActive),
      failed: hard ? m.failed + remainingActive : m.failed + (this.cancellationEnabled() ? remainingActive : 0),
      active: 0,
      jobsRemaining: 0,
      dbConnections: 0,
      queueDepthLive: 0,
      shutdownDurationMs: Date.now() - this.shutdownStartedAt,
    }));
    this.instances.update((list) => list.map((x) => ({ ...x, state: 'down' as InstanceState, activeRequests: 0 })));
    this.mode.set('stopped');
  }

  private startTimer(): void {
    this.clearTimer();
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  private clearTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick(): void {
    const mode = this.mode();
    if (mode === 'idle' || mode === 'paused' || mode === 'stopped') return;

    const m = this.metrics();
    const insts = this.instances();
    const readyInstances = insts.filter((i) => i.state === 'up' || (mode === 'graceful-shutdown' && i.state === 'draining'));

    if (mode === 'graceful-shutdown') {
      // Drain: no new requests accepted, existing ones complete at a rate driven by latency; jobs finish; when
      // everything is done, exit early (before the timeout).
      const completionRate = Math.max(1, Math.round((readyInstances.length * 3000) / Math.max(20, this.dbLatencyMs() + this.externalLatencyMs())));
      const completedNow = Math.min(m.active, completionRate);
      const jobsDoneNow = Math.min(m.jobsRemaining, Math.max(1, Math.round(readyInstances.length / 2)));

      this.metrics.set({
        ...m,
        active: m.active - completedNow,
        completed: m.completed + completedNow,
        jobsRemaining: m.jobsRemaining - jobsDoneNow,
        queueDepthLive: Math.max(0, m.queueDepthLive - Math.round(m.queueDepthLive * 0.3)),
        dbConnections: Math.max(0, Math.round((m.active - completedNow) * 0.2)),
        shutdownDurationMs: Date.now() - this.shutdownStartedAt,
      });

      if (m.active - completedNow <= 0 && m.jobsRemaining - jobsDoneNow <= 0) {
        this.finishShutdown(false);
      }
      return;
    }

    // Traffic / deploying: generate load and process it against capacity.
    const arriving = Math.max(0, Math.round((this.requestRate() * TICK_MS) / 1000));
    const capacity = readyInstances.length * 8;
    const spaceLeft = Math.max(0, this.activeRequestsCap() - m.active);
    const accepted = Math.min(arriving, spaceLeft, this.queueDepth() > 0 ? arriving : capacity);
    const overflow = Math.max(0, arriving - accepted);

    const serviceRate = Math.max(1, Math.round((readyInstances.length * 4000) / Math.max(20, this.dbLatencyMs() + this.externalLatencyMs())));
    const completedNow = Math.min(m.active + accepted, serviceRate);
    const deployRisk = mode === 'deploying' && readyInstances.length < insts.length;
    const readinessPenalty = this.readinessEnabled() ? 1 : 4;
    const failedNow = deployRisk ? Math.round(overflow * 0.1 * readinessPenalty) : 0;

    const nextActive = Math.max(0, m.active + accepted - completedNow);

    this.metrics.set({
      ...m,
      active: nextActive,
      completed: m.completed + completedNow,
      failed: m.failed + failedNow,
      queueDepthLive: Math.min(this.queueDepth(), Math.max(0, m.queueDepthLive + Math.round(overflow * 0.5) - 2)),
      dbConnections: Math.min(this.dbLatencyMs() > 0 ? 50 : 0, Math.round(nextActive * 0.3)),
      errors: m.errors + failedNow,
    });

    // Spread active requests across up instances for the live diagram.
    const up = insts.filter((i) => i.state === 'up');
    if (up.length > 0) {
      const per = Math.round(nextActive / up.length);
      this.instances.update((list) =>
        list.map((i) => (i.state === 'up' ? { ...i, activeRequests: per } : { ...i, activeRequests: 0 })),
      );
    }
  }
}
