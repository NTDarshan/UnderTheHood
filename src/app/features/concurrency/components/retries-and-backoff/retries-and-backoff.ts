import { Component, OnDestroy, computed, signal } from '@angular/core';

const TOTAL_REQUESTS = 100;
const SIM_SECONDS = 10;
const STEP_MS = 450;
const SERVICE_CAPACITY = 150; // req/sec the service can absorb before things get worse

type Mode = 'naive' | 'backoff';

@Component({
  selector: 'app-retries-and-backoff',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="retries-and-backoff">
      <div class="container">
        <p class="lab-index">35 — RETRIES &amp; CONCURRENCY</p>
        <h2 class="lab-title">Retries and concurrency</h2>
        <p class="lab-lede">
          {{ totalRequests }} requests hit a service that starts erroring. How the failed requests retry decides
          whether the service gets a chance to recover — or gets buried under an amplifying retry storm.
        </p>

        <div class="lab-panel">
          <div class="lab-btn-row" role="group" aria-label="Retry strategy">
            <button type="button" class="lab-btn" [class.is-active]="mode() === 'naive'" [attr.aria-pressed]="mode() === 'naive'" (click)="setMode('naive')">
              Naive retry (retry immediately)
            </button>
            <button type="button" class="lab-btn" [class.is-active]="mode() === 'backoff'" [attr.aria-pressed]="mode() === 'backoff'" (click)="setMode('backoff')">
              Backoff + jitter
            </button>
          </div>

          <div class="lab-field retry-limit-field">
            <label for="retry-limit">Retry limit (max attempts before giving up)</label>
            <input id="retry-limit" type="range" min="1" max="8" step="1" [value]="retryLimit()" (input)="setRetryLimit($event)" />
            <span class="mono field-readout">{{ retryLimit() }} attempts</span>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="run()" [disabled]="running()">
              {{ running() ? 'Simulating...' : 'Simulate outage' }}
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <div class="chart" role="img" aria-label="Requests per second hitting the service over simulated time">
            <div class="chart-capacity-line" [style.bottom.%]="capacityLinePct()">
              <span class="mono capacity-label">service capacity ~{{ serviceCapacity }}/s</span>
            </div>
            <div class="chart-bars">
              @for (v of series(); track $index) {
                <div class="bar-col">
                  <div
                    class="bar"
                    [class.is-storm]="v > serviceCapacity"
                    [style.height.%]="barHeightPct(v)"
                  ></div>
                  <span class="mono bar-label">{{ v.toFixed(0) }}</span>
                </div>
              }
            </div>
          </div>
          <p class="mono axis-label">seconds since outage began &rarr;</p>

          <div class="stat-row">
            <div class="stat">
              <span class="stat-label mono">ORIGINAL REQUESTS</span>
              <span class="stat-value mono">{{ totalRequests }}</span>
            </div>
            <div class="stat">
              <span class="stat-label mono">PEAK LOAD ON SERVICE</span>
              <span class="stat-value mono" [class.stat-crit]="peakLoad() > serviceCapacity">{{ peakLoad().toFixed(0) }}/s</span>
            </div>
            <div class="stat">
              <span class="stat-label mono">TOTAL ATTEMPTS SENT</span>
              <span class="stat-value mono">{{ totalAttempts().toFixed(0) }}</span>
            </div>
          </div>

          @if (peakLoad() > serviceCapacity) {
            <p class="lab-note-warn lab-note">
              Peak load of {{ peakLoad().toFixed(0) }} req/sec is above the service's ~{{ serviceCapacity }} req/sec
              capacity — the retries themselves are now the majority of the traffic hitting a service that is
              already struggling, making the outage worse and longer.
            </p>
          }
        </div>

        <p class="lab-note">
          Uncontrolled retries can turn a brief blip into a full outage: every failed request immediately firing
          another request multiplies load on a service that is already struggling. Exponential backoff spreads
          retries out over growing delays, jitter prevents every client from retrying in lockstep, and a retry
          limit makes sure a request eventually gives up instead of retrying forever.
        </p>
      </div>
    </section>
  `,
  styles: `
    .retry-limit-field { margin-top: 18px; max-width: 420px; }
    .field-readout { color: var(--text-muted); font-size: 0.75rem; }

    .chart {
      position: relative;
      margin-top: 24px;
      height: 220px;
      padding: 10px 10px 0;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
    }
    .chart-bars {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: flex-end;
      gap: 6px;
      height: 100%;
      padding-bottom: 22px;
    }
    .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; gap: 4px; }
    .bar {
      width: 100%;
      max-width: 28px;
      border-radius: 3px 3px 0 0;
      background: var(--c-cpu);
      transition: height 0.2s ease, background 0.2s ease;
      min-height: 2px;
    }
    .bar.is-storm { background: var(--blocked); }
    .bar-label { font-size: 0.625rem; color: var(--text-faint); }

    .chart-capacity-line {
      position: absolute;
      left: 0;
      right: 0;
      border-top: 1px dashed var(--waiting);
      z-index: 0;
    }
    .capacity-label {
      position: absolute;
      right: 6px;
      top: -16px;
      font-size: 0.625rem;
      color: var(--waiting);
      white-space: nowrap;
    }

    .axis-label { margin: 6px 0 0; color: var(--text-faint); font-size: 0.6875rem; text-align: center; }

    .stat-row { margin-top: 22px; display: grid; grid-template-columns: repeat(1, 1fr); gap: 12px; }
    @media (min-width: 640px) { .stat-row { grid-template-columns: repeat(3, 1fr); } }
    .stat { display: flex; flex-direction: column; gap: 6px; padding: 12px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .stat-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.08em; }
    .stat-value { font-size: 1.125rem; color: var(--running); }
    .stat-value.stat-crit { color: var(--blocked); }
  `,
})
export class RetriesAndBackoff implements OnDestroy {
  protected readonly totalRequests = TOTAL_REQUESTS;
  protected readonly serviceCapacity = SERVICE_CAPACITY;

  protected readonly mode = signal<Mode>('naive');
  protected readonly retryLimit = signal(4);
  protected readonly running = signal(false);
  protected readonly series = signal<number[]>([]);

  private intervalId: ReturnType<typeof setInterval> | null = null;

  protected readonly peakLoad = computed(() => (this.series().length ? Math.max(...this.series()) : 0));
  protected readonly totalAttempts = computed(() => this.series().reduce((sum, v) => sum + v, 0));

  private readonly maxChartValue = computed(() => {
    const peak = this.peakLoad();
    return Math.max(this.serviceCapacity * 1.4, peak * 1.05, 200);
  });

  protected barHeightPct(v: number): number {
    return Math.min(100, (v / this.maxChartValue()) * 100);
  }

  protected capacityLinePct(): number {
    return Math.min(96, (this.serviceCapacity / this.maxChartValue()) * 100);
  }

  ngOnDestroy(): void {
    this.clearInterval();
  }

  protected setMode(m: Mode): void {
    if (this.running()) return;
    this.mode.set(m);
    this.series.set([]);
  }

  protected setRetryLimit(ev: Event): void {
    if (this.running()) return;
    this.retryLimit.set(+(ev.target as HTMLInputElement).value);
  }

  protected reset(): void {
    this.clearInterval();
    this.running.set(false);
    this.series.set([]);
  }

  protected run(): void {
    this.clearInterval();
    this.series.set([]);
    this.running.set(true);

    const full = this.buildSeries();
    let i = 0;
    this.intervalId = setInterval(() => {
      i += 1;
      this.series.set(full.slice(0, i));
      if (i >= full.length) {
        this.clearInterval();
        this.running.set(false);
      }
    }, STEP_MS);
  }

  private clearInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /** Illustrative, deterministic-ish model of load-on-service per simulated second. */
  private buildSeries(): number[] {
    const limit = this.retryLimit();
    const values: number[] = [];

    if (this.mode() === 'naive') {
      let v = this.totalRequests;
      for (let s = 0; s < SIM_SECONDS; s++) {
        values.push(v);
        if (s + 1 < limit) {
          v = v * 2; // every still-failing request retries immediately, plus new arrivals pile on
        } else {
          v = Math.max(0, Math.round(v * 0.35)); // requests exhaust their retry limit and give up
        }
      }
    } else {
      for (let s = 0; s < SIM_SECONDS; s++) {
        let v: number;
        if (s === 0) {
          v = this.totalRequests;
        } else {
          const spread = Math.max(2, limit);
          const base = this.totalRequests / spread;
          const jitter = (this.seededJitter(s) - 0.5) * base * 0.6;
          const decay = s > limit + 2 ? 0.4 : 1;
          v = Math.max(0, Math.round((base + jitter) * decay));
        }
        values.push(v);
      }
    }

    return values;
  }

  /** Deterministic pseudo-random jitter in [0, 1), stable across re-renders for a given index. */
  private seededJitter(seed: number): number {
    const x = Math.sin(seed * 12.9898 + this.retryLimit() * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }
}
