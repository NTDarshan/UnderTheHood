import { Component, computed, signal } from '@angular/core';

type Tone = 'ok' | 'warn' | 'crit';

interface Metric {
  label: string;
  value: string;
  tone: Tone;
}

const TRAFFIC_PRESETS = [100, 500, 1_000, 5_000, 10_000, 50_000] as const;

// -- capacity / latency model constants -------------------------------------
const SERVER_CAPACITY = 450; // req/s a single API server can absorb before saturating
const DB_BASE_CAPACITY = 700; // req/s the primary DB can serve at dbSpeed = 1x, 0 replicas
const DB_HIT_SHARE = 0.65; // fraction of a synchronous request that touches the DB
const CDN_OFFLOAD = 0.25; // fraction of traffic a CDN absorbs before the LB
const ASYNC_ROUTE_SHARE = 0.35; // fraction of traffic diverted to the queue when enabled
const WORKER_RATE = 40; // req/s one worker can drain from the queue
const CONN_THROUGHPUT = 9; // req/s one pooled DB connection can sustain at dbSpeed = 1x
const MAX_VISIBLE_BOXES = 10;

@Component({
  selector: 'app-full-system-lab',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="full-system-lab">
      <div class="container">
        <p class="lab-index">28 — THE COMPLETE PERFORMANCE ENGINEERING LAB</p>
        <h2 class="lab-title">One system. Every lever. Break it, then fix it on purpose.</h2>
        <p class="lab-lede">
          100 users, one API server, one database, nothing else. Push the traffic slider until the system
          buckles, then reach for the specific architecture piece that actually addresses the bottleneck you're
          watching — not every piece at once.
        </p>

        <div class="lab-panel rig">
          <!-- ================= ARCHITECTURE CANVAS ================= -->
          <div class="canvas-wrap">
            <svg class="canvas" viewBox="0 0 980 460" preserveAspectRatio="xMidYMid meet">
              <!-- edges -->
              <line class="edge" [class.edge-off]="!cdnEnabled()" x1="70" y1="230" x2="168" y2="230" />
              <line class="edge" x1="168" y1="230" x2="266" y2="230" [class.edge-off]="!cdnEnabled()" />
              <line class="edge" [class.edge-off]="apiServers() < 2" x1="266" y1="230" x2="360" y2="230" />
              <line class="edge" x1="360" y1="230" x2="452" y2="230" />
              <line class="edge" [class.edge-off]="!cacheEnabled()" x1="560" y1="180" x2="640" y2="150" />
              <line class="edge" x1="560" y1="230" x2="700" y2="230" [class.edge-off]="!cacheEnabled()" />
              <line class="edge-branch" [class.edge-off]="!queueSystemEnabled() && !routeToQueue()" x1="560" y1="280" x2="640" y2="330" />
              <line class="edge-branch" [class.edge-off]="!queueSystemEnabled()" x1="700" y1="330" x2="770" y2="330" />
              @for (r of replicaBoxes(); track $index; let i = $index) {
                <line class="edge-thin" x1="835" y1="245" x2="835" [attr.y2]="300 + i * 46" />
              }

              <!-- USERS -->
              <g class="node node-client">
                <rect x="20" y="205" width="70" height="50" rx="8" />
                <text x="55" y="234" class="node-label">USERS</text>
                <text x="55" y="248" class="node-sub mono">{{ fmt(traffic()) }}/s</text>
              </g>

              <!-- CDN -->
              <g class="node node-client" [class.node-ghost]="!cdnEnabled()">
                <rect x="98" y="205" width="70" height="50" rx="8" />
                <text x="133" y="234" class="node-label">CDN</text>
                <text x="133" y="248" class="node-sub mono">{{ cdnEnabled() ? 'edge cache' : 'off' }}</text>
              </g>

              <!-- LOAD BALANCER -->
              <g class="node node-compute" [class.node-ghost]="apiServers() < 2">
                <rect x="196" y="205" width="70" height="50" rx="8" />
                <text x="231" y="230" class="node-label">LOAD</text>
                <text x="231" y="244" class="node-label">BALANCER</text>
              </g>

              <!-- API SERVERS cluster -->
              <g>
                @for (s of apiBoxes(); track $index; let i = $index) {
                  <g class="node node-compute node-small">
                    <rect [attr.x]="360" [attr.y]="90 + i * 30" width="92" height="24" rx="5" />
                    <text [attr.x]="406" [attr.y]="90 + i * 30 + 16" class="node-label-sm">API {{ i + 1 }}</text>
                  </g>
                }
                @if (apiOverflow() > 0) {
                  <text x="406" [attr.y]="90 + apiBoxes().length * 30 + 16" class="node-sub mono overflow-label">
                    +{{ apiOverflow() }} more
                  </text>
                }
              </g>

              <!-- CACHE -->
              <g class="node node-cache" [class.node-ghost]="!cacheEnabled()">
                <rect x="562" y="125" width="80" height="50" rx="8" />
                <text x="602" y="154" class="node-label">CACHE</text>
                <text x="602" y="168" class="node-sub mono">{{ cacheEnabled() ? cacheHitRate() + '% hit' : 'off' }}</text>
              </g>

              <!-- DATABASE PRIMARY -->
              <g class="node node-db">
                <rect x="700" y="205" width="90" height="55" rx="8" />
                <text x="745" y="228" class="node-label">DATABASE</text>
                <text x="745" y="242" class="node-label">PRIMARY</text>
                <text x="745" y="256" class="node-sub mono">{{ dbSpeed().toFixed(1) }}x</text>
              </g>

              <!-- REPLICAS -->
              @for (r of replicaBoxes(); track $index; let i = $index) {
                <g class="node node-db node-small">
                  <rect x="800" [attr.y]="300 + i * 46" width="90" height="34" rx="6" />
                  <text x="845" [attr.y]="300 + i * 46 + 21" class="node-label-sm">REPLICA {{ i + 1 }}</text>
                </g>
              }
              @if (replicaBoxes().length === 0) {
                <g class="node node-db node-ghost node-small">
                  <rect x="800" y="300" width="90" height="34" rx="6" />
                  <text x="845" y="321" class="node-label-sm">REPLICAS: 0</text>
                </g>
              }

              <!-- QUEUE -->
              <g class="node node-queue" [class.node-ghost]="!queueSystemEnabled()">
                <rect x="640" y="308" width="70" height="46" rx="8" />
                <text x="675" y="332" class="node-label">QUEUE</text>
                <text x="675" y="345" class="node-sub mono">{{ queueSystemEnabled() ? queueDepth() + ' deep' : 'off' }}</text>
              </g>

              <!-- WORKERS -->
              <g class="node node-queue" [class.node-ghost]="!queueSystemEnabled() || workerCount() === 0">
                <rect x="778" y="308" width="80" height="46" rx="8" />
                <text x="818" y="328" class="node-label">WORKERS</text>
                <text x="818" y="343" class="node-sub mono">x{{ queueSystemEnabled() ? workerCount() : 0 }}</text>
              </g>

              @if (rateLimitEnabled()) {
                <g class="ratelimit-badge">
                  <rect x="20" y="270" width="148" height="26" rx="13" />
                  <text x="94" y="287" class="node-sub mono">CAP {{ fmt(rateLimitCeiling()) }}/s</text>
                </g>
              }
            </svg>
            <p class="canvas-hint mono">dim outlines = capacity not yet added to this system</p>
          </div>

          <!-- ================= CONTROL PANEL ================= -->
          <div class="controls">
            <div class="control-block">
              <p class="block-title mono">TRAFFIC</p>
              <div class="lab-field">
                <label for="traffic-slider">Requests / sec — {{ fmt(traffic()) }}</label>
                <input id="traffic-slider" type="range" min="100" max="50000" step="100" [value]="traffic()" (input)="setTraffic($event)" />
              </div>
              <div class="lab-btn-row preset-row">
                @for (p of presets; track p) {
                  <button type="button" class="lab-btn" [class.is-active]="traffic() === p" (click)="traffic.set(p)">{{ fmt(p) }}</button>
                }
              </div>
            </div>

            <div class="control-block">
              <p class="block-title mono">CAPACITY DIALS</p>
              <div class="lab-field">
                <label for="db-speed">Database speed — {{ dbSpeed().toFixed(1) }}x</label>
                <input id="db-speed" type="range" min="0.5" max="3" step="0.1" [value]="dbSpeed()" (input)="setDbSpeed($event)" />
              </div>
              <div class="lab-field">
                <label for="cache-hit">Cache hit rate — {{ cacheHitRate() }}% {{ cacheEnabled() ? '' : '(cache off)' }}</label>
                <input id="cache-hit" type="range" min="0" max="99" step="1" [value]="cacheHitRate()" (input)="setCacheHitRate($event)" [disabled]="!cacheEnabled()" />
              </div>
              <div class="stepper-row">
                <span class="stepper-label mono">API servers</span>
                <div class="stepper">
                  <button type="button" class="lab-btn" (click)="stepApiServers(-1)" [disabled]="apiServers() <= 1">−</button>
                  <span class="stepper-val mono">{{ apiServers() }}</span>
                  <button type="button" class="lab-btn" (click)="stepApiServers(1)" [disabled]="apiServers() >= 16">+</button>
                </div>
              </div>
              <div class="stepper-row">
                <span class="stepper-label mono">Pool size / server</span>
                <div class="stepper">
                  <button type="button" class="lab-btn" (click)="stepPoolSize(-5)" [disabled]="poolSize() <= 5">−</button>
                  <span class="stepper-val mono">{{ poolSize() }}</span>
                  <button type="button" class="lab-btn" (click)="stepPoolSize(5)" [disabled]="poolSize() >= 100">+</button>
                </div>
              </div>
              <div class="stepper-row">
                <span class="stepper-label mono">Worker count {{ queueSystemEnabled() ? '' : '(no queue yet)' }}</span>
                <div class="stepper">
                  <button type="button" class="lab-btn" (click)="stepWorkers(-1)" [disabled]="workerCount() <= 0">−</button>
                  <span class="stepper-val mono">{{ workerCount() }}</span>
                  <button type="button" class="lab-btn" (click)="stepWorkers(1)" [disabled]="workerCount() >= 32">+</button>
                </div>
              </div>
              <div class="stepper-row">
                <span class="stepper-label mono">Queue capacity</span>
                <div class="stepper">
                  <button type="button" class="lab-btn" (click)="stepQueueCap(-50)" [disabled]="queueCapacity() <= 50">−</button>
                  <span class="stepper-val mono">{{ queueCapacity() }}</span>
                  <button type="button" class="lab-btn" (click)="stepQueueCap(50)" [disabled]="queueCapacity() >= 2000">+</button>
                </div>
              </div>
            </div>

            <div class="control-block">
              <p class="block-title mono">ARCHITECTURE TOGGLES</p>
              <div class="lab-btn-row toggle-row">
                <button type="button" class="lab-btn" (click)="stepApiServers(1)" [disabled]="apiServers() >= 16">+ Add server</button>
                <button type="button" class="lab-btn" [class.is-active]="cacheEnabled()" (click)="cacheEnabled.set(!cacheEnabled())">Enable cache</button>
                <button type="button" class="lab-btn" [class.is-active]="cdnEnabled()" (click)="cdnEnabled.set(!cdnEnabled())">Enable CDN</button>
                <button type="button" class="lab-btn" [class.is-active]="queueSystemEnabled()" (click)="toggleQueueSystem()">Add workers</button>
                <button type="button" class="lab-btn" [class.is-active]="routeToQueue()" (click)="routeToQueue.set(!routeToQueue())">Move work to queue</button>
                <button type="button" class="lab-btn" [class.is-active]="rateLimitEnabled()" (click)="rateLimitEnabled.set(!rateLimitEnabled())">Enable rate limiting</button>
              </div>
              <div class="lab-field ceiling-field" [class.field-disabled]="!rateLimitEnabled()">
                <label for="rl-ceiling">Rate limit ceiling — {{ fmt(rateLimitCeiling()) }}/s</label>
                <input id="rl-ceiling" type="range" min="100" max="50000" step="100" [value]="rateLimitCeiling()" (input)="setCeiling($event)" [disabled]="!rateLimitEnabled()" />
              </div>
              <div class="stepper-row">
                <span class="stepper-label mono">Read replicas</span>
                <div class="stepper">
                  <button type="button" class="lab-btn" (click)="stepReplicas(-1)" [disabled]="replicas() <= 0">−</button>
                  <span class="stepper-val mono">{{ replicas() }}</span>
                  <button type="button" class="lab-btn" (click)="stepReplicas(1)" [disabled]="replicas() >= 3">+</button>
                </div>
              </div>
              <button type="button" class="lab-btn lab-btn-danger reset-btn" (click)="reset()">Reset system</button>
            </div>
          </div>
        </div>

        <!-- ================= METRICS DASHBOARD ================= -->
        <div class="metrics-grid">
          @for (m of metrics(); track m.label) {
            <div class="metric-cell" [class]="'tone-' + m.tone">
              <p class="metric-label mono">{{ m.label }}</p>
              <p class="metric-value mono">{{ m.value }}</p>
            </div>
          }
        </div>

        <p class="lab-note" [class.lab-note-warn]="overallTone() === 'crit'">
          <strong>Bottleneck read:</strong> {{ bottleneckReading() }}
        </p>

        <p class="lab-note">
          <strong>There is no single magic scaling button</strong> — every lever above solves a different
          bottleneck. Adding API servers helps only until the database saturates; adding cache only helps if the
          hit rate is genuinely high; queueing only helps once there are enough workers to drain it. Read the
          dashboard, find the constraint, pull the one lever that addresses it.
        </p>
      </div>
    </section>
  `,
  styles: `
    :host {
      --ok: #4ade80;
      --warn: var(--accent);
      --crit: var(--danger);
      --c-client: var(--accent-2);
      --c-compute: #60a5fa;
      --c-db: #a78bfa;
      --c-cache: #2dd4bf;
      --c-queue: #fbbf24;
      display: block;
    }

    .rig { display: flex; flex-direction: column; gap: 28px; }
    @media (min-width: 1100px) {
      .rig { flex-direction: row; align-items: flex-start; }
      .canvas-wrap { flex: 1.5; }
      .controls { flex: 1; }
    }

    .canvas-wrap { display: flex; flex-direction: column; gap: 8px; }
    .canvas { width: 100%; height: auto; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .canvas-hint { font-size: 0.6875rem; color: var(--text-faint); text-align: center; }

    .edge { stroke: var(--border-strong); stroke-width: 2; }
    .edge-thin { stroke: var(--border-strong); stroke-width: 1.5; opacity: 0.6; }
    .edge-branch { stroke: var(--c-queue); stroke-width: 2; stroke-dasharray: 5 4; }
    .edge-off { stroke: var(--border); stroke-dasharray: 3 4; opacity: 0.4; }

    .node rect { fill: var(--surface-elevated); stroke-width: 1.5; transition: opacity 0.25s ease, filter 0.25s ease; }
    .node-label { fill: var(--text); font-family: var(--font-mono); font-size: 10px; font-weight: 700; text-anchor: middle; letter-spacing: 0.03em; }
    .node-label-sm { fill: var(--text); font-family: var(--font-mono); font-size: 8.5px; font-weight: 700; text-anchor: middle; }
    .node-sub { fill: var(--text-faint); font-size: 8.5px; text-anchor: middle; }
    .overflow-label { fill: var(--text-faint); text-anchor: middle; }

    .node-client rect { stroke: var(--c-client); }
    .node-compute rect { stroke: var(--c-compute); }
    .node-db rect { stroke: var(--c-db); }
    .node-cache rect { stroke: var(--c-cache); }
    .node-queue rect { stroke: var(--c-queue); }

    .node-ghost rect { fill: transparent; opacity: 0.35; stroke-dasharray: 4 3; }
    .node-ghost .node-label, .node-ghost .node-sub, .node-ghost .node-label-sm { opacity: 0.45; }

    .ratelimit-badge rect { fill: color-mix(in srgb, var(--danger) 14%, var(--surface-elevated)); stroke: var(--danger); stroke-width: 1; }
    .ratelimit-badge text { fill: var(--danger); text-anchor: middle; }

    .controls { display: flex; flex-direction: column; gap: 22px; }
    .control-block { display: flex; flex-direction: column; gap: 14px; padding-top: 4px; }
    .control-block + .control-block { border-top: 1px solid var(--border); padding-top: 18px; }
    .block-title { font-size: 0.6875rem; letter-spacing: 0.1em; color: var(--text-faint); }

    .preset-row { margin-top: 4px; }
    .toggle-row { margin-top: 0; }

    .stepper-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .stepper-label { font-size: 0.75rem; color: var(--text-muted); }
    .stepper { display: flex; align-items: center; gap: 8px; }
    .stepper .lab-btn { padding: 6px 12px; }
    .stepper-val { min-width: 2.5ch; text-align: center; color: var(--text); }

    .ceiling-field.field-disabled { opacity: 0.45; }
    .reset-btn { align-self: flex-start; margin-top: 4px; }

    .metrics-grid {
      margin-top: 28px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1px;
      background: var(--border);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    @media (min-width: 640px) { .metrics-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (min-width: 900px) { .metrics-grid { grid-template-columns: repeat(6, 1fr); } }

    .metric-cell { background: var(--surface-raised); padding: 14px 12px; display: flex; flex-direction: column; gap: 6px; }
    .metric-label { font-size: 0.625rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-faint); }
    .metric-value { font-size: 1.0625rem; font-weight: 700; color: var(--text); }
    .metric-cell.tone-warn .metric-value { color: var(--warn); }
    .metric-cell.tone-crit .metric-value { color: var(--crit); }
    .metric-cell.tone-ok .metric-value { color: var(--ok); }
  `,
})
export class FullSystemLab {
  protected readonly presets = TRAFFIC_PRESETS;

  // -- controls --
  protected readonly traffic = signal(100);
  protected readonly dbSpeed = signal(1);
  protected readonly cacheHitRate = signal(85);
  protected readonly apiServers = signal(1);
  protected readonly poolSize = signal(20);
  protected readonly workerCount = signal(0);
  protected readonly queueCapacity = signal(500);

  // -- architecture toggles --
  protected readonly cdnEnabled = signal(false);
  protected readonly cacheEnabled = signal(false);
  protected readonly replicas = signal(0);
  protected readonly rateLimitEnabled = signal(false);
  protected readonly rateLimitCeiling = signal(5000);
  protected readonly queueSystemEnabled = signal(false);
  protected readonly routeToQueue = signal(false);

  protected readonly apiBoxes = computed(() =>
    Array.from({ length: Math.min(this.apiServers(), MAX_VISIBLE_BOXES) }, (_, i) => i),
  );
  protected readonly apiOverflow = computed(() => Math.max(0, this.apiServers() - MAX_VISIBLE_BOXES));
  protected readonly replicaBoxes = computed(() => Array.from({ length: this.replicas() }, (_, i) => i));

  // -- the reactive numeric model --
  protected readonly model = computed(() => {
    const rawTraffic = this.traffic();
    const accepted = this.rateLimitEnabled() ? Math.min(rawTraffic, this.rateLimitCeiling()) : rawTraffic;
    const rejected = Math.max(0, rawTraffic - accepted);

    const afterCdn = accepted * (this.cdnEnabled() ? 1 - CDN_OFFLOAD : 1);

    const asyncEnabled = this.routeToQueue();
    const asyncTraffic = asyncEnabled ? afterCdn * ASYNC_ROUTE_SHARE : 0;
    const syncTraffic = afterCdn - asyncTraffic;

    const servers = this.apiServers();
    const perServerLoad = syncTraffic / servers;
    const apiUtilization = perServerLoad / SERVER_CAPACITY;

    const dbBoundTraffic = syncTraffic * DB_HIT_SHARE;
    const effectiveDbTraffic = this.cacheEnabled()
      ? dbBoundTraffic * (1 - this.cacheHitRate() / 100)
      : dbBoundTraffic;

    const dbCapacity = DB_BASE_CAPACITY * this.dbSpeed() * (1 + 0.55 * this.replicas());
    const poolCapacity = servers * this.poolSize() * CONN_THROUGHPUT * this.dbSpeed();
    const dbUtilization = Math.max(effectiveDbTraffic / dbCapacity, effectiveDbTraffic / poolCapacity);

    const u = Math.min(0.995, Math.max(apiUtilization, dbUtilization));
    const bound = dbUtilization >= apiUtilization ? 'db' : 'api';

    const p50 = 18 / (1 - u);
    const p95 = 40 * Math.pow(1 / (1 - u), 1.5);
    const p99 = 70 * Math.pow(1 / (1 - u), 2.1);

    const overloadError = u >= 0.9 ? Math.min(60, (u - 0.9) * 600) : 0;

    const workerCapacityRps = this.queueSystemEnabled() ? this.workerCount() * WORKER_RATE : 0;
    const queueUtil = workerCapacityRps > 0 ? asyncTraffic / workerCapacityRps : asyncTraffic > 0 ? 999 : 0;
    const queueDepthRaw = queueUtil < 1 ? (queueUtil / (1 - queueUtil)) * 5 : this.queueCapacity();
    const queueDepth = Math.round(Math.min(this.queueCapacity(), Math.max(0, queueDepthRaw)));
    const queueOverflowing = asyncTraffic > 0 && queueUtil >= 1;
    const queueDropRps = queueOverflowing ? asyncTraffic - workerCapacityRps : 0;
    const queueErrorContribution = rawTraffic > 0 ? (queueDropRps / rawTraffic) * 100 : 0;

    const errorRate = Math.min(95, overloadError + queueErrorContribution);

    const cpu = clamp(12 + apiUtilization * 82, 1, 99);
    const memory = clamp(20 + apiUtilization * 55, 1, 99);
    const dbCpu = clamp(8 + dbUtilization * 90, 1, 99);
    const dbConnections = Math.round(
      Math.min(effectiveDbTraffic / (CONN_THROUGHPUT * this.dbSpeed()), servers * this.poolSize()),
    );

    const throughput = Math.max(0, accepted - accepted * (errorRate / 100));

    return {
      accepted,
      rejected,
      throughput,
      p50,
      p95,
      p99,
      cpu,
      memory,
      dbCpu,
      dbConnections,
      errorRate,
      queueDepth,
      queueOverflowing,
      u,
      bound,
    };
  });

  protected readonly queueDepth = computed(() => this.model().queueDepth);

  protected readonly overallTone = computed<Tone>(() => {
    const u = this.model().u;
    if (u >= 0.9 || this.model().errorRate >= 2) return 'crit';
    if (u >= 0.7 || this.model().errorRate > 0) return 'warn';
    return 'ok';
  });

  protected readonly metrics = computed<Metric[]>(() => {
    const m = this.model();
    return [
      { label: 'Requests/sec (accepted)', value: fmt(m.accepted), tone: toneFor(m.rejected, 1, 500) },
      { label: 'Throughput', value: fmt(m.throughput), tone: 'ok' },
      { label: 'P50 latency', value: `${m.p50.toFixed(0)}ms`, tone: toneFor(m.p50, 60, 200) },
      { label: 'P95 latency', value: `${m.p95.toFixed(0)}ms`, tone: toneFor(m.p95, 150, 500) },
      { label: 'P99 latency', value: `${m.p99.toFixed(0)}ms`, tone: toneFor(m.p99, 300, 900) },
      { label: 'CPU', value: `${m.cpu.toFixed(0)}%`, tone: toneFor(m.cpu, 70, 90) },
      { label: 'Memory', value: `${m.memory.toFixed(0)}%`, tone: toneFor(m.memory, 70, 90) },
      { label: 'DB CPU', value: `${m.dbCpu.toFixed(0)}%`, tone: toneFor(m.dbCpu, 70, 90) },
      { label: 'DB connections', value: `${m.dbConnections}`, tone: 'ok' },
      {
        label: 'Cache hit rate',
        value: this.cacheEnabled() ? `${this.cacheHitRate()}%` : 'n/a',
        tone: this.cacheEnabled() ? toneFor(100 - this.cacheHitRate(), 30, 60) : 'ok',
      },
      { label: 'Queue depth', value: this.queueSystemEnabled() ? `${m.queueDepth}` : 'n/a', tone: m.queueOverflowing ? 'crit' : 'ok' },
      { label: 'Error rate', value: `${m.errorRate.toFixed(1)}%`, tone: toneFor(m.errorRate, 0.5, 2) },
    ];
  });

  protected readonly bottleneckReading = computed(() => {
    const m = this.model();
    if (m.rejected > 0 && this.rateLimitEnabled()) {
      return `Rate limiting is rejecting ${fmt(m.rejected)} req/sec outright to protect the system — latency stays flat, but that traffic is refused, not served.`;
    }
    if (m.queueOverflowing) {
      return `The queue is filling faster than ${this.workerCount()} worker(s) can drain it — add workers, or stop routing more work to the queue than it can process.`;
    }
    if (this.overallTone() === 'crit' && m.bound === 'db') {
      return `The database is the constraint (DB CPU ${m.dbCpu.toFixed(0)}%, ${m.dbConnections} connections in use). More API servers will not help — try cache, replicas, or a faster DB.`;
    }
    if (this.overallTone() === 'crit' && m.bound === 'api') {
      return `The API tier itself is saturated. Adding servers (or a load balancer to spread load across them) is the correct lever here.`;
    }
    if (this.overallTone() === 'warn') {
      return `Utilization is climbing but not critical yet — headroom exists, but this system is close to its current ceiling.`;
    }
    return `The system is comfortably under capacity. Push traffic higher to find the real ceiling.`;
  });

  toneOf(): Tone {
    return this.overallTone();
  }

  protected fmt(v: number): string {
    return fmt(v);
  }

  setTraffic(e: Event): void {
    this.traffic.set(+(e.target as HTMLInputElement).value);
  }

  setDbSpeed(e: Event): void {
    this.dbSpeed.set(+(e.target as HTMLInputElement).value);
  }

  setCacheHitRate(e: Event): void {
    this.cacheHitRate.set(+(e.target as HTMLInputElement).value);
  }

  setCeiling(e: Event): void {
    this.rateLimitCeiling.set(+(e.target as HTMLInputElement).value);
  }

  stepApiServers(delta: number): void {
    this.apiServers.update((v) => clamp(v + delta, 1, 16));
  }

  stepPoolSize(delta: number): void {
    this.poolSize.update((v) => clamp(v + delta, 5, 100));
  }

  stepWorkers(delta: number): void {
    this.workerCount.update((v) => clamp(v + delta, 0, 32));
  }

  stepQueueCap(delta: number): void {
    this.queueCapacity.update((v) => clamp(v + delta, 50, 2000));
  }

  stepReplicas(delta: number): void {
    this.replicas.update((v) => clamp(v + delta, 0, 3));
  }

  toggleQueueSystem(): void {
    const next = !this.queueSystemEnabled();
    this.queueSystemEnabled.set(next);
    if (next && this.workerCount() === 0) {
      this.workerCount.set(4);
    }
  }

  reset(): void {
    this.traffic.set(100);
    this.dbSpeed.set(1);
    this.cacheHitRate.set(85);
    this.apiServers.set(1);
    this.poolSize.set(20);
    this.workerCount.set(0);
    this.queueCapacity.set(500);
    this.cdnEnabled.set(false);
    this.cacheEnabled.set(false);
    this.replicas.set(0);
    this.rateLimitEnabled.set(false);
    this.rateLimitCeiling.set(5000);
    this.queueSystemEnabled.set(false);
    this.routeToQueue.set(false);
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function fmt(v: number): string {
  return Math.round(v).toLocaleString('en-US');
}

function toneFor(value: number, warnAt: number, critAt: number): Tone {
  if (value >= critAt) return 'crit';
  if (value >= warnAt) return 'warn';
  return 'ok';
}
