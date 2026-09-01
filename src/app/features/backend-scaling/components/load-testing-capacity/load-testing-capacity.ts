import { Component, computed, signal } from '@angular/core';

interface Sample {
  t: number; // 0..1 fraction of test duration
  traffic: number; // req/s offered
  latencyMs: number;
  throughput: number; // req/s actually served
  errorPct: number;
  cpuPct: number;
}

const CAPACITY_RPS = 600;
const BASE_LATENCY_MS = 35;
const SAMPLE_COUNT = 60;
const ANIMATION_MS = 5200;
const RAMP_FRACTION = 0.7; // ramp for first 70% of the test, hold steady after

const DURATION_OPTIONS = [10, 30, 60] as const;

const CHARTS: { key: keyof Pick<Sample, 'traffic' | 'latencyMs' | 'throughput' | 'errorPct' | 'cpuPct'>; label: string; unit: string; color: string }[] = [
  { key: 'traffic', label: 'Traffic', unit: 'req/s', color: 'var(--c-client)' },
  { key: 'latencyMs', label: 'Latency', unit: 'ms', color: 'var(--c-compute)' },
  { key: 'throughput', label: 'Throughput', unit: 'req/s', color: 'var(--ok)' },
  { key: 'errorPct', label: 'Errors', unit: '%', color: 'var(--crit)' },
  { key: 'cpuPct', label: 'CPU', unit: '%', color: 'var(--c-queue)' },
];

const CHART_W = 260;
const CHART_H = 72;

@Component({
  selector: 'app-load-testing-capacity',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="load-testing-capacity">
      <div class="container">
        <p class="lab-index">25 — LOAD TESTING &amp; CAPACITY PLANNING</p>
        <h2 class="lab-title">Don't guess your capacity. Ramp traffic and watch it break.</h2>
        <p class="lab-lede">
          Push simulated users at the system and watch traffic, latency, throughput, errors and CPU move together
          on a shared timeline. Somewhere past a certain point, the system stops absorbing load gracefully —
          that point is your real capacity ceiling.
        </p>

        <div class="lab-panel">
          <p class="part-label mono">PART A — LOAD TEST</p>

          <div class="controls-grid">
            <div class="lab-field">
              <label for="users">Virtual users ({{ users() }})</label>
              <input id="users" type="range" min="10" max="5000" step="10" [value]="users()" [disabled]="running()"
                (input)="onUsers($event)" />
            </div>
            <div class="lab-field">
              <label for="duration">Test duration</label>
              <select id="duration" [disabled]="running()" (change)="onDuration($event)">
                @for (d of durationOptions; track d) {
                  <option [value]="d" [selected]="duration() === d">{{ d }}s</option>
                }
              </select>
            </div>
            <div class="lab-field">
              <label>Target offered load</label>
              <span class="readout mono">~{{ targetRps() }} req/s</span>
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="running()" (click)="runTest()">
              {{ running() ? 'RUNNING…' : 'Run test' }}
            </button>
            <button type="button" class="lab-btn" [disabled]="!hasRun() || running()" (click)="reset()">Reset</button>
          </div>

          <div class="charts-grid">
            @for (chart of charts; track chart.key) {
              <div class="chart-card">
                <div class="chart-head">
                  <span class="chart-label mono">{{ chart.label }}</span>
                  <span class="chart-value mono" [style.color]="chart.color">{{ latestValue(chart.key) }}{{ chart.unit === '%' ? '%' : '' }}</span>
                </div>
                <svg class="chart-svg" [attr.viewBox]="'0 0 ' + chartW + ' ' + chartH" preserveAspectRatio="none">
                  <line x1="0" [attr.y1]="chartH - 1" [attr.x2]="chartW" [attr.y2]="chartH - 1" class="chart-baseline" />
                  <path [attr.d]="chartPath(chart.key)" class="chart-path" [style.stroke]="chart.color" />
                </svg>
                <span class="chart-unit mono">{{ chart.unit }}</span>
              </div>
            }
          </div>

          @if (capacityFound()) {
            <div class="capacity-callout mono">
              CAPACITY LIMIT: ~{{ capacityRps }} req/s — errors and latency both broke away from baseline past this point.
            </div>
          }

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" [disabled]="!hasRun()" [class.is-active]="showReveal()" (click)="showReveal.set(!showReveal())">
              Where did the system fail first?
            </button>
          </div>

          @if (showReveal()) {
            <p class="lab-note reveal is-visible">
              <strong>Latency moved first.</strong> As offered load approached the capacity ceiling, response time
              started climbing well before the error rate did — queueing shows up as delay before it shows up as
              rejected requests. Watch latency, not just error counts, as your early warning signal.
            </p>
          }

          <p class="lab-note-warn lab-note">
            <strong>Ramp, don't spike.</strong> A trustworthy load test ramps traffic up steadily and holds a
            steady state, mirroring how real traffic actually grows. An instant spike to max load tells you how
            the system handles a thundering herd, not what its sustainable capacity is.
          </p>
          <p class="lab-note closing-line mono">Measure before production.</p>
        </div>

        <div class="lab-panel calc-panel">
          <p class="part-label mono">PART B — CAPACITY PLANNING CALCULATOR</p>
          <p class="lab-lede calc-lede">
            One server handles <strong>{{ perServerRps() }} req/sec</strong>. You need
            <strong>{{ requiredRps() }} req/sec</strong>.
          </p>

          <div class="controls-grid">
            <div class="lab-field">
              <label for="required-rps">Required throughput (req/s)</label>
              <input id="required-rps" type="range" min="500" max="5000" step="100" [value]="requiredRps()" (input)="onRequired($event)" />
            </div>
            <div class="lab-field">
              <label for="per-server">Per-server capacity (req/s)</label>
              <input id="per-server" type="range" min="100" max="1000" step="25" [value]="perServerRps()" (input)="onPerServer($event)" />
            </div>
            <div class="lab-field">
              <label for="headroom">Headroom target ({{ headroomPct() }}% utilization)</label>
              <input id="headroom" type="range" min="50" max="95" step="5" [value]="headroomPct()" (input)="onHeadroom($event)" />
            </div>
          </div>

          <div class="calc-breakdown">
            <div class="calc-row">
              <span class="calc-key mono">Theoretical (100% utilization)</span>
              <span class="calc-val mono">{{ theoreticalServers() }} servers</span>
            </div>
            <div class="calc-row">
              <span class="calc-key mono">+ Headroom overhead</span>
              <span class="calc-val mono">+{{ plannedServers() - theoreticalServers() }} servers</span>
            </div>
            <div class="calc-row calc-row-total">
              <span class="calc-key mono">= Planned capacity ({{ headroomPct() }}% target)</span>
              <span class="calc-val mono calc-total">{{ plannedServers() }} servers</span>
            </div>
          </div>

          <p class="lab-note">
            Running every server at 100% leaves no room for a traffic spike, a slow deploy, or a single node
            failing over. Planning for <strong>{{ headroomPct() }}%</strong> target utilization means
            <strong>{{ plannedServers() }} servers</strong> instead of the theoretical
            {{ theoreticalServers() }} — the difference is your safety margin.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      --ok: #4ade80; --warn: var(--accent); --crit: var(--danger);
      --c-client: var(--accent-2); --c-compute: #60a5fa; --c-db: #a78bfa; --c-cache: #2dd4bf; --c-queue: #fbbf24;
      display: block;
    }

    .part-label { color: var(--text-faint); letter-spacing: 0.12em; font-size: 0.75rem; margin-bottom: 4px; }

    .controls-grid { display: grid; grid-template-columns: 1fr; gap: 16px; margin-top: 18px; }
    @media (min-width: 640px) { .controls-grid { grid-template-columns: repeat(3, 1fr); } }

    .readout { color: var(--accent-strong); font-size: 1rem; }

    .charts-grid { display: grid; grid-template-columns: 1fr; gap: 14px; margin-top: 26px; }
    @media (min-width: 560px) { .charts-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 960px) { .charts-grid { grid-template-columns: repeat(5, 1fr); } }

    .chart-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 12px; display: flex; flex-direction: column; gap: 6px; }
    .chart-head { display: flex; justify-content: space-between; align-items: baseline; }
    .chart-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.06em; text-transform: uppercase; }
    .chart-value { font-size: 0.9375rem; }
    .chart-svg { width: 100%; height: 48px; }
    .chart-baseline { stroke: var(--border); stroke-width: 1; }
    .chart-path { fill: none; stroke-width: 2; }
    .chart-unit { font-size: 0.625rem; color: var(--text-faint); }

    .capacity-callout {
      margin-top: 20px; padding: 12px 16px; border: 1px solid var(--crit); border-radius: var(--radius-md);
      background: color-mix(in srgb, var(--crit) 10%, var(--surface)); color: var(--crit); font-size: 0.8125rem;
    }

    .closing-line { color: var(--accent-strong); font-size: 0.9375rem; margin-top: 22px; }

    .calc-panel { margin-top: 40px; }
    .calc-lede { margin-top: 6px; color: var(--text-muted); }
    .calc-lede strong { color: var(--text); }

    .calc-breakdown { margin-top: 22px; display: flex; flex-direction: column; gap: 2px; max-width: 460px; }
    .calc-row { display: flex; justify-content: space-between; padding: 10px 14px; background: var(--surface); border: 1px solid var(--border); }
    .calc-row:first-child { border-radius: var(--radius-md) var(--radius-md) 0 0; }
    .calc-row-total { border-radius: 0 0 var(--radius-md) var(--radius-md); background: var(--surface-elevated); border-color: var(--border-strong); }
    .calc-key { color: var(--text-muted); font-size: 0.8125rem; }
    .calc-val { color: var(--text); font-size: 0.875rem; }
    .calc-total { color: var(--accent-strong); font-size: 1rem; font-weight: 700; }
  `,
})
export class LoadTestingCapacity {
  protected readonly capacityRps = CAPACITY_RPS;
  protected readonly durationOptions = DURATION_OPTIONS;
  protected readonly charts = CHARTS;
  protected readonly chartW = CHART_W;
  protected readonly chartH = CHART_H;

  // Part A state
  protected readonly users = signal(200);
  protected readonly duration = signal<number>(30);
  protected readonly running = signal(false);
  protected readonly hasRun = signal(false);
  protected readonly samples = signal<Sample[]>([]);
  protected readonly showReveal = signal(false);

  protected readonly targetRps = computed(() => Math.round(this.users() * 0.2));

  protected readonly capacityFound = computed(() => {
    const s = this.samples();
    if (s.length === 0) return false;
    const maxError = Math.max(...s.map((x) => x.errorPct));
    const maxTraffic = Math.max(...s.map((x) => x.traffic));
    return maxError >= 2 && maxTraffic >= CAPACITY_RPS * 0.85;
  });

  private timer: ReturnType<typeof setInterval> | null = null;

  onUsers(ev: Event): void {
    this.users.set(+(ev.target as HTMLInputElement).value);
  }

  onDuration(ev: Event): void {
    this.duration.set(+(ev.target as HTMLSelectElement).value);
  }

  runTest(): void {
    if (this.running()) return;
    this.running.set(true);
    this.hasRun.set(true);
    this.showReveal.set(false);
    this.samples.set([]);

    const target = this.targetRps();
    let i = 0;

    this.timer = setInterval(() => {
      i++;
      const frac = i / SAMPLE_COUNT;
      const rampFrac = Math.min(frac / RAMP_FRACTION, 1);
      const traffic = Math.round(target * rampFrac);
      const sample = this.computeSample(frac, traffic);
      this.samples.update((arr) => [...arr, sample]);

      if (i >= SAMPLE_COUNT) {
        this.stopTimer();
        this.running.set(false);
      }
    }, ANIMATION_MS / SAMPLE_COUNT);
  }

  private computeSample(t: number, traffic: number): Sample {
    const u = Math.min(traffic / CAPACITY_RPS, 1.6);
    const uClamped = Math.min(u, 0.985);
    const latencyMs = u <= 1
      ? BASE_LATENCY_MS / (1 - uClamped)
      : (BASE_LATENCY_MS / (1 - 0.985)) * (1 + (u - 1) * 6);

    const errorPct = u <= 0.9 ? 0 : Math.min(95, (u - 0.9) * (u - 0.9) * 900);
    const throughput = Math.round(traffic * (1 - errorPct / 100));
    const cpuPct = Math.min(100, Math.round(u * 100 * 1.02));

    return { t, traffic, latencyMs: Math.round(latencyMs), throughput, errorPct: Math.round(errorPct * 10) / 10, cpuPct };
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  reset(): void {
    this.stopTimer();
    this.running.set(false);
    this.hasRun.set(false);
    this.samples.set([]);
    this.showReveal.set(false);
  }

  private maxOf(key: keyof Sample): number {
    const s = this.samples();
    if (s.length === 0) return 1;
    const values = s.map((x) => x[key] as number);
    return Math.max(1, ...values);
  }

  protected chartPath(key: 'traffic' | 'latencyMs' | 'throughput' | 'errorPct' | 'cpuPct'): string {
    const s = this.samples();
    if (s.length === 0) return `M 0 ${this.chartH} L ${this.chartW} ${this.chartH}`;
    const max = key === 'errorPct' || key === 'cpuPct' ? 100 : this.maxOf(key);
    const points = s.map((sample, idx) => {
      const x = (idx / (SAMPLE_COUNT - 1)) * this.chartW;
      const val = sample[key] as number;
      const y = this.chartH - (Math.min(val, max) / max) * (this.chartH - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M ${points.join(' L ')}`;
  }

  protected latestValue(key: 'traffic' | 'latencyMs' | 'throughput' | 'errorPct' | 'cpuPct'): number {
    const s = this.samples();
    if (s.length === 0) return 0;
    return s[s.length - 1][key] as number;
  }

  // Part B state
  protected readonly requiredRps = signal(2000);
  protected readonly perServerRps = signal(500);
  protected readonly headroomPct = signal(65);

  protected readonly theoreticalServers = computed(() => Math.ceil(this.requiredRps() / this.perServerRps()));

  protected readonly plannedServers = computed(() =>
    Math.ceil(this.requiredRps() / (this.perServerRps() * (this.headroomPct() / 100)))
  );

  onRequired(ev: Event): void {
    this.requiredRps.set(+(ev.target as HTMLInputElement).value);
  }

  onPerServer(ev: Event): void {
    this.perServerRps.set(+(ev.target as HTMLInputElement).value);
  }

  onHeadroom(ev: Event): void {
    this.headroomPct.set(+(ev.target as HTMLInputElement).value);
  }
}
