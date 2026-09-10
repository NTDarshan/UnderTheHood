import { Component, OnDestroy, computed, signal } from '@angular/core';

type Phase = 'healthy' | 'cascading' | 'active' | 'rolling-back' | 'recovered';

interface CascadeStep {
  at: number;
  latency: number;
  errorRate: number;
  success: number;
  log: string;
}

const CASCADE: CascadeStep[] = [
  { at: 400, latency: 180, errorRate: 0, success: 98, log: 'DB read latency climbing (42ms → 180ms)…' },
  { at: 1100, latency: 420, errorRate: 2, success: 94, log: 'Requests to /api/orders queueing behind slow DB calls.' },
  { at: 1800, latency: 780, errorRate: 9, success: 85, log: 'Timeout threshold (500ms) exceeded — requests begin timing out.' },
  { at: 2500, latency: 950, errorRate: 21, success: 68, log: 'Error rate climbing — retries are adding further load on the DB.' },
  { at: 3200, latency: 1120, errorRate: 34, success: 52, log: 'Users affected: checkout and order-history pages failing.' },
];

const RECOVERY: CascadeStep[] = [
  { at: 300, latency: 620, errorRate: 18, success: 70, log: 'Traffic draining from the previous release…' },
  { at: 900, latency: 240, errorRate: 6, success: 89, log: 'Error rate falling as the rollback completes…' },
  { at: 1500, latency: 58, errorRate: 0, success: 99, log: 'Latency and error rate back to baseline.' },
];

const LOG_LINES = [
  '14:22:03.101 WARN  orders-api   db pool exhausted (18/20 connections in use)',
  '14:22:03.640 ERROR orders-api   query timeout after 500ms',
  '14:22:03.812 SLOW  postgres     SELECT * FROM orders WHERE customer_id = $1 -- 4821ms (seq scan, missing index on customer_id)',
  '14:22:04.203 ERROR orders-api   504 Gateway Timeout returned to client',
  '14:22:04.980 WARN  orders-api   retry storm: 312 retries/s on GET /api/orders',
];

const TRACE_SPANS = [
  { name: 'HTTP handler: GET /api/orders', pct: 100, tone: 'neutral' as const },
  { name: 'auth middleware', pct: 3, tone: 'neutral' as const },
  { name: 'order lookup — DB query', pct: 88, tone: 'danger' as const },
  { name: 'serialize response', pct: 4, tone: 'neutral' as const },
];

@Component({
  selector: 'app-incident-simulation',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section do-scene incident-scene" id="incident-simulation">
      <div class="container">
        <p class="lab-index mono">23 — WHEN PRODUCTION MISBEHAVES</p>
        <h2 class="lab-title">Run an incident, end to end</h2>
        <p class="lab-lede">
          A slow database is one of the most common production incidents. Trigger it below and watch how a single
          slow dependency cascades into timeouts, errors, and affected users — then use the same tools a real
          on-call engineer reaches for to find the cause and roll it back.
        </p>

        <div class="lab-panel">
          <div class="topology" role="group" aria-label="System topology">
            <div class="node" [class.is-warn]="phase() === 'cascading' || phase() === 'active'" [class.is-danger]="errorRatePct() > 20">
              <span class="node-label mono">API</span>
              <span class="node-sub mono">{{ requestLabel() }}</span>
            </div>
            <span class="lab-flow-arrow" [class.is-live]="phase() === 'cascading' || phase() === 'active'">&rarr;</span>
            <div class="node node-db" [class.is-warn]="latencyMs() > 150" [class.is-danger]="latencyMs() > 700">
              <span class="node-label mono">DATABASE</span>
              <span class="node-sub mono">{{ latencyMs() }}ms avg query time</span>
            </div>
          </div>

          <div class="gauge-row">
            <div class="gauge-tile">
              <div class="gauge-track" aria-hidden="true">
                <div class="gauge-fill" [class.is-danger]="successPct() < 90" [style.width.%]="successPct()"></div>
              </div>
              <div class="gauge-meta mono"><span>REQUEST SUCCESS</span><span [class.is-danger]="successPct() < 90">{{ successPct() }}%</span></div>
            </div>
            <div class="gauge-tile">
              <div class="gauge-track" aria-hidden="true">
                <div class="gauge-fill is-error" [style.width.%]="errorRatePct()"></div>
              </div>
              <div class="gauge-meta mono"><span>ERROR RATE</span><span [class.is-danger]="errorRatePct() > 10">{{ errorRatePct() }}%</span></div>
            </div>
          </div>

          <p class="status-line mono" aria-live="polite">{{ statusLine() }}</p>

          @if (phase() === 'active' || phase() === 'rolling-back') {
            <p class="mttr mono">MTTR CLOCK: {{ mttrSeconds() }}s</p>
          }

          <div class="lab-btn-row">
            @if (phase() === 'healthy') {
              <button type="button" class="lab-btn lab-btn-danger" (click)="triggerIncident()">TRIGGER INCIDENT</button>
            }
            @if (phase() === 'active') {
              <button type="button" class="lab-btn" [class.is-active]="investigating()" (click)="investigate()">INVESTIGATE</button>
              <button type="button" class="lab-btn" [attr.aria-pressed]="logsOpen()" (click)="toggle('logs')">VIEW LOGS</button>
              <button type="button" class="lab-btn" [attr.aria-pressed]="metricsOpen()" (click)="toggle('metrics')">VIEW METRICS</button>
              <button type="button" class="lab-btn" [attr.aria-pressed]="traceOpen()" (click)="toggle('trace')">OPEN TRACE</button>
              <button type="button" class="lab-btn lab-btn-primary" [disabled]="!canRollback()" (click)="rollback()">ROLLBACK</button>
            }
            @if (phase() === 'recovered') {
              <button type="button" class="lab-btn" (click)="reset()">RESET SCENARIO</button>
            }
          </div>

          @if (phase() === 'active' && !canRollback()) {
            <p class="lab-note">Look at at least one diagnostic panel (logs, metrics, or trace) before you roll back — shipping a fix blind is how incidents turn into re-incidents.</p>
          }

          @if (logsOpen()) {
            <div class="diagnostic-panel">
              <h4 class="diagnostic-heading mono">LOGS — orders-api</h4>
              <div class="lab-code">
                @for (line of logLines; track line) {
                  <div [class.tok-status-err]="line.includes('SLOW') || line.includes('ERROR')">{{ line }}</div>
                }
              </div>
            </div>
          }

          @if (metricsOpen()) {
            <div class="diagnostic-panel">
              <h4 class="diagnostic-heading mono">METRICS — last {{ latencyHistory().length }} samples</h4>
              <div class="sparkline" role="img" aria-label="Latency over time, rising">
                @for (v of latencyHistory(); track $index) {
                  <div class="spark-bar" [style.height.%]="sparkHeight(v)"></div>
                }
              </div>
              <div class="stat-grid">
                <div class="stat-tile"><span class="stat-value mono">{{ latencyMs() }}ms</span><span class="stat-label mono">P50 LATENCY</span></div>
                <div class="stat-tile"><span class="stat-value mono">{{ errorRatePct() }}%</span><span class="stat-label mono">ERROR RATE</span></div>
                <div class="stat-tile"><span class="stat-value mono">{{ successPct() }}%</span><span class="stat-label mono">SUCCESS RATE</span></div>
              </div>
            </div>
          }

          @if (traceOpen()) {
            <div class="diagnostic-panel">
              <h4 class="diagnostic-heading mono">TRACE — span waterfall</h4>
              <div class="waterfall">
                @for (span of traceSpans; track span.name) {
                  <div class="waterfall-row">
                    <span class="waterfall-label mono">{{ span.name }}</span>
                    <div class="waterfall-track">
                      <div class="waterfall-bar" [class.is-danger]="span.tone === 'danger'" [style.width.%]="span.pct"></div>
                    </div>
                  </div>
                }
              </div>
              <p class="lab-note">Almost all of the request's time is spent inside a single database query — that's the signature of a slow-query incident, not a code regression.</p>
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

    .topology { display: flex; align-items: stretch; gap: 12px; flex-wrap: wrap; }
    .node {
      flex: 1; min-width: 150px; display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 8px; padding: 20px 14px; background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius-md); text-align: center; transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }
    .node.is-warn { border-color: var(--do-warning); }
    .node.is-danger { border-color: var(--do-danger); box-shadow: 0 0 0 1px color-mix(in srgb, var(--do-danger) 25%, transparent); }
    .node-label { font-size: 0.8125rem; color: var(--text); letter-spacing: 0.06em; font-weight: 700; }
    .node-sub { font-size: 0.6875rem; color: var(--text-faint); }
    .lab-flow-arrow.is-live { color: var(--do-warning); animation: arrow-flash 0.6s ease-in-out infinite; }
    @media (prefers-reduced-motion: reduce) { .lab-flow-arrow.is-live { animation: none; } }
    @keyframes arrow-flash { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

    .gauge-row { margin-top: 24px; display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 640px) { .gauge-row { grid-template-columns: 1fr 1fr; } }
    .gauge-track { height: 8px; border-radius: 999px; background: var(--surface); border: 1px solid var(--border); overflow: hidden; }
    .gauge-fill { height: 100%; background: var(--do-success); transition: width 0.5s ease; }
    .gauge-fill.is-danger { background: var(--do-danger); }
    .gauge-fill.is-error { background: var(--do-warning); }
    .gauge-meta { display: flex; justify-content: space-between; margin-top: 6px; font-size: 0.6875rem; color: var(--text-faint); }
    .gauge-meta .is-danger { color: var(--do-danger); font-weight: 700; }

    .status-line { margin-top: 20px; padding-top: 18px; border-top: 1px solid var(--border); font-size: 0.8125rem; color: var(--text-muted); min-height: 1.2em; }
    .mttr { margin-top: 8px; font-size: 0.75rem; color: var(--do-warning); }

    .diagnostic-panel { margin-top: 20px; padding-top: 20px; border-top: 1px dashed var(--border); }
    .diagnostic-heading { margin: 0 0 12px; font-size: 0.75rem; letter-spacing: 0.08em; color: var(--text-faint); }
    .lab-code .tok-status-err { color: var(--do-danger); }

    .sparkline { display: flex; align-items: flex-end; gap: 4px; height: 64px; margin-bottom: 16px; }
    .spark-bar { flex: 1; min-width: 6px; background: linear-gradient(180deg, var(--do-warning), var(--do-danger)); border-radius: 2px 2px 0 0; transition: height 0.3s ease; }

    .waterfall { display: flex; flex-direction: column; gap: 10px; }
    .waterfall-row { display: grid; grid-template-columns: 1fr; gap: 6px; }
    @media (min-width: 640px) { .waterfall-row { grid-template-columns: 220px 1fr; align-items: center; gap: 12px; } }
    .waterfall-label { font-size: 0.6875rem; color: var(--text-muted); }
    .waterfall-track { height: 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; }
    .waterfall-bar { height: 100%; background: var(--do-cyan); border-radius: var(--radius-sm); transition: width 0.4s ease; }
    .waterfall-bar.is-danger { background: var(--do-danger); }
  `,
})
export class IncidentSimulation implements OnDestroy {
  protected readonly phase = signal<Phase>('healthy');
  protected readonly latencyMs = signal(42);
  protected readonly errorRatePct = signal(0);
  protected readonly successPct = signal(99);
  protected readonly statusLine = signal('All systems healthy. Baseline DB latency: 42ms.');
  protected readonly mttrSeconds = signal(0);
  protected readonly investigating = signal(false);
  protected readonly logsOpen = signal(false);
  protected readonly metricsOpen = signal(false);
  protected readonly traceOpen = signal(false);
  protected readonly viewedLogs = signal(false);
  protected readonly viewedMetrics = signal(false);
  protected readonly viewedTrace = signal(false);
  protected readonly latencyHistory = signal<number[]>([42]);

  protected readonly canRollback = computed(() => this.viewedLogs() || this.viewedMetrics() || this.viewedTrace());
  protected readonly logLines = LOG_LINES;
  protected readonly traceSpans = TRACE_SPANS;

  private timers: ReturnType<typeof setTimeout>[] = [];
  private mttrInterval: ReturnType<typeof setInterval> | null = null;

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
    if (this.mttrInterval) clearInterval(this.mttrInterval);
  }

  protected requestLabel(): string {
    if (this.phase() === 'healthy') return 'serving traffic normally';
    if (this.phase() === 'active') return `${this.errorRatePct()}% of requests failing`;
    if (this.phase() === 'rolling-back') return 'recovering…';
    return 'serving traffic normally';
  }

  protected sparkHeight(v: number): number {
    return Math.max(6, Math.min(100, Math.round((v / 1200) * 100)));
  }

  protected triggerIncident(): void {
    if (this.phase() !== 'healthy') return;
    this.phase.set('cascading');
    this.statusLine.set('Anomaly detected: database read latency rising…');

    for (const step of CASCADE) {
      this.after(step.at, () => {
        this.latencyMs.set(step.latency);
        this.errorRatePct.set(step.errorRate);
        this.successPct.set(step.success);
        this.statusLine.set(step.log);
        this.latencyHistory.update((h) => [...h, step.latency].slice(-14));
      });
    }

    this.after(3600, () => {
      this.phase.set('active');
      this.statusLine.set('INCIDENT ACTIVE — on-call paged. Investigate before rolling back.');
      this.mttrInterval = setInterval(() => this.mttrSeconds.update((n) => n + 1), 1000);
    });
  }

  protected investigate(): void {
    if (this.phase() !== 'active') return;
    this.investigating.set(true);
    this.statusLine.set('On-call engineer investigating — check logs, metrics, and the trace to find the root cause.');
  }

  protected toggle(panel: 'logs' | 'metrics' | 'trace'): void {
    if (this.phase() !== 'active') return;
    if (panel === 'logs') { this.logsOpen.update((v) => !v); this.viewedLogs.set(true); }
    if (panel === 'metrics') { this.metricsOpen.update((v) => !v); this.viewedMetrics.set(true); }
    if (panel === 'trace') { this.traceOpen.update((v) => !v); this.viewedTrace.set(true); }
  }

  protected rollback(): void {
    if (this.phase() !== 'active' || !this.canRollback()) return;
    if (this.mttrInterval) { clearInterval(this.mttrInterval); this.mttrInterval = null; }
    this.phase.set('rolling-back');
    this.statusLine.set('Rolling back to the last known-good deploy…');

    for (const step of RECOVERY) {
      this.after(step.at, () => {
        this.latencyMs.set(step.latency);
        this.errorRatePct.set(step.errorRate);
        this.successPct.set(step.success);
        this.statusLine.set(step.log);
        this.latencyHistory.update((h) => [...h, step.latency].slice(-14));
      });
    }

    this.after(2000, () => {
      this.phase.set('recovered');
      this.statusLine.set('Incident resolved. Rolled back cleanly — next stop: a blameless postmortem.');
    });
  }

  protected reset(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    if (this.mttrInterval) { clearInterval(this.mttrInterval); this.mttrInterval = null; }
    this.phase.set('healthy');
    this.latencyMs.set(42);
    this.errorRatePct.set(0);
    this.successPct.set(99);
    this.statusLine.set('All systems healthy. Baseline DB latency: 42ms.');
    this.mttrSeconds.set(0);
    this.investigating.set(false);
    this.logsOpen.set(false);
    this.metricsOpen.set(false);
    this.traceOpen.set(false);
    this.viewedLogs.set(false);
    this.viewedMetrics.set(false);
    this.viewedTrace.set(false);
    this.latencyHistory.set([42]);
  }

  private after(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }
}
