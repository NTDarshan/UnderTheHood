import { Component, computed, signal } from '@angular/core';

const CAPACITY = 800; // simulated requests/sec a single API server can process
const BASE_LATENCY_MS = 9;
const MAX_DOTS = 18;

const PRESETS = [100, 500, 1000, 5000, 10000, 50000] as const;

type Status = 'ok' | 'warn' | 'crit';

@Component({
  selector: 'app-perf-hero',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section hero-section bs-scene" id="perf-landing">
      <div class="bg-grid" aria-hidden="true"></div>
      <div class="container hero-inner">
        <p class="eyebrow mono">BACKEND SCALING &amp; PERFORMANCE ENGINEERING</p>
        <h1 class="hero-title">Your backend works.</h1>
        <p class="hero-title-beat">Until it doesn't.</p>
        <p class="hero-lede">
          Learn what happens when traffic grows, latency rises, resources saturate, and one server is no longer
          enough.
        </p>

        <div class="lab-panel">
          <div class="stage">
            <div class="clients-cluster">
              <p class="node-label mono">CLIENTS</p>
              <div class="client-dots" aria-hidden="true">
                @for (n of clientMarkers; track n) {
                  <span class="client-dot"></span>
                }
              </div>
            </div>

            <div class="flow-lane" aria-hidden="true">
              @for (i of dotIndices(); track i) {
                <span
                  class="flow-dot"
                  [style.animationDuration.s]="dotDuration()"
                  [style.animationDelay.s]="(i / dotCount()) * dotDuration()"
                ></span>
              }
            </div>

            <div class="server-col">
              <div class="queue-bar-track" aria-hidden="true">
                <div class="queue-bar-fill" [style.height.%]="queueLevel() * 100" [class]="'is-' + status()"></div>
              </div>
              <div class="server-box" [class]="'is-' + status()">
                <p class="node-label mono">API SERVER</p>
                <p class="server-capacity mono">capacity ≈ {{ CAPACITY }} req/s</p>
                @if (isBottleneck()) {
                  <span class="pill bottleneck-pill">BOTTLENECK</span>
                }
              </div>
            </div>
          </div>

          <div class="traffic-control">
            <p class="node-label mono">INCOMING TRAFFIC</p>
            <div class="lab-btn-row">
              @for (p of presets; track p) {
                <button type="button" class="lab-btn" [class.is-active]="rps() === p" (click)="rps.set(p)">
                  {{ formatNumber(p) }}/s
                </button>
              }
            </div>
            <div class="lab-field rps-field">
              <label for="rps-slider">Fine-tune requests/sec</label>
              <input
                id="rps-slider"
                type="range"
                min="100"
                max="50000"
                step="100"
                [value]="rps()"
                (input)="onSlider($event)"
              />
            </div>
          </div>

          <div class="metrics-grid">
            <div class="metric">
              <p class="metric-label mono">P50 LATENCY</p>
              <p class="metric-value mono" [class]="'is-' + status()">{{ p50().toFixed(0) }} ms</p>
            </div>
            <div class="metric">
              <p class="metric-label mono">P90 LATENCY</p>
              <p class="metric-value mono" [class]="'is-' + status()">{{ p90().toFixed(0) }} ms</p>
            </div>
            <div class="metric">
              <p class="metric-label mono">P99 LATENCY</p>
              <p class="metric-value mono" [class]="'is-' + status()">{{ p99().toFixed(0) }} ms</p>
            </div>
            <div class="metric">
              <p class="metric-label mono">THROUGHPUT</p>
              <p class="metric-value mono">{{ formatNumber(throughput()) }} req/s</p>
            </div>
            <div class="metric">
              <p class="metric-label mono">CPU</p>
              <p class="metric-value mono" [class]="'is-' + status()">{{ cpuPct() }}%</p>
            </div>
            <div class="metric">
              <p class="metric-label mono">MEMORY</p>
              <p class="metric-value mono" [class]="'is-' + status()">{{ memPct() }}%</p>
            </div>
            <div class="metric">
              <p class="metric-label mono">DB CONNECTIONS</p>
              <p class="metric-value mono" [class]="'is-' + status()">{{ dbConn() }} / 100</p>
            </div>
            <div class="metric">
              <p class="metric-label mono">UTILIZATION</p>
              <p class="metric-value mono" [class]="'is-' + status()">{{ (utilization() * 100).toFixed(0) }}%</p>
            </div>
          </div>
        </div>

        <p class="takeaway">More traffic does not automatically mean more performance.</p>
      </div>
    </section>
  `,
  styles: `
    .bs-scene {
      --ok: #4ade80;
      --warn: var(--accent);
      --crit: var(--danger);
      --c-client: var(--accent-2);
      --c-compute: #60a5fa;
      --c-db: #a78bfa;
      --c-cache: #2dd4bf;
      --c-queue: #fbbf24;
    }

    .hero-section { position: relative; padding-block: 96px 64px; overflow: hidden; border-top: none; }
    .hero-inner { position: relative; z-index: 1; }

    .eyebrow { font-size: 0.8125rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent-2); margin-bottom: 16px; }
    .hero-title { font-size: clamp(2.25rem, 1.6rem + 2.8vw, 3.75rem); max-width: 900px; }
    .hero-title-beat { font-size: clamp(2.25rem, 1.6rem + 2.8vw, 3.75rem); color: var(--text-faint); margin-top: 2px; }
    .hero-lede { margin-top: 20px; max-width: 620px; font-size: 1.0625rem; color: var(--text-muted); line-height: 1.65; }

    .stage { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; min-height: 180px; }
    @media (max-width: 640px) { .stage { grid-template-columns: 1fr; justify-items: center; gap: 20px; } }

    .node-label { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--text-faint); text-transform: uppercase; margin-bottom: 8px; }

    .clients-cluster { text-align: center; }
    .client-dots { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; width: 60px; }
    .client-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--c-client); opacity: 0.75; }

    .flow-lane { position: relative; height: 6px; background: var(--border); border-radius: 999px; overflow: hidden; min-width: 120px; }
    .flow-dot { position: absolute; top: -3px; left: 0; width: 8px; height: 8px; border-radius: 50%; background: var(--c-client); box-shadow: 0 0 6px var(--glow-accent-2); animation-name: flow-across; animation-timing-function: linear; animation-iteration-count: infinite; }

    @keyframes flow-across {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(calc(100% - 8px)); opacity: 0.4; }
    }

    @media (prefers-reduced-motion: reduce) {
      .flow-dot { animation: none; left: 50%; }
    }

    .server-col { display: flex; align-items: flex-end; gap: 10px; }
    .queue-bar-track { width: 14px; height: 100px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); display: flex; align-items: flex-end; overflow: hidden; }
    .queue-bar-fill { width: 100%; transition: height 0.4s ease, background 0.4s ease; background: var(--c-queue); }
    .queue-bar-fill.is-ok { background: var(--c-queue); }
    .queue-bar-fill.is-warn { background: var(--warn); }
    .queue-bar-fill.is-crit { background: var(--crit); }

    .server-box { position: relative; padding: 18px 22px; background: var(--surface-elevated); border: 1px solid var(--border-strong); border-radius: var(--radius-md); text-align: center; transition: border-color 0.3s ease, box-shadow 0.3s ease; }
    .server-box.is-ok { border-color: var(--ok); }
    .server-box.is-warn { border-color: var(--warn); box-shadow: 0 0 16px var(--glow-accent); }
    .server-box.is-crit { border-color: var(--crit); box-shadow: 0 0 20px rgba(255, 93, 93, 0.35); }
    .server-capacity { font-size: 0.6875rem; color: var(--text-faint); }

    .bottleneck-pill { position: absolute; top: -12px; right: -8px; color: var(--crit); border-color: var(--crit); background: var(--surface-raised); }

    .traffic-control { margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border); }
    .rps-field { margin-top: 16px; max-width: 360px; }
    .rps-field input[type='range'] { width: 100%; }

    .metrics-grid { margin-top: 28px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    @media (min-width: 640px) { .metrics-grid { grid-template-columns: repeat(4, 1fr); } }
    .metric { padding: 12px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); }
    .metric-label { font-size: 0.625rem; letter-spacing: 0.06em; color: var(--text-faint); margin-bottom: 6px; }
    .metric-value { font-size: 1.0625rem; color: var(--text); }
    .metric-value.is-ok { color: var(--ok); }
    .metric-value.is-warn { color: var(--warn); }
    .metric-value.is-crit { color: var(--crit); }

    .takeaway { margin-top: 28px; font-size: 1.0625rem; color: var(--text); font-weight: 600; }
  `,
})
export class PerfHero {
  protected readonly CAPACITY = CAPACITY;
  protected readonly presets = PRESETS;
  protected readonly clientMarkers = [0, 1, 2, 3, 4, 5];

  protected readonly rps = signal<number>(500);

  protected readonly utilization = computed(() => Math.min(this.rps() / CAPACITY, 0.995));

  protected readonly p50 = computed(() => BASE_LATENCY_MS / (1 - this.utilization()));
  protected readonly p90 = computed(() => this.p50() * (1.8 + this.utilization() * 3));
  protected readonly p99 = computed(() => this.p50() * (3 + this.utilization() * 9));

  protected readonly throughput = computed(() => Math.min(this.rps(), CAPACITY));
  protected readonly cpuPct = computed(() => Math.round(Math.min(1, this.utilization()) * 100));
  protected readonly memPct = computed(() => Math.round(Math.min(100, 40 + this.utilization() * 55)));
  protected readonly dbConn = computed(() => Math.round(Math.min(1, this.utilization()) * 100));

  protected readonly queueLevel = computed(() => {
    const overflow = Math.max(0, this.rps() - CAPACITY) / CAPACITY;
    return Math.min(1, overflow);
  });

  protected readonly isBottleneck = computed(() => this.utilization() > 0.9);

  protected readonly status = computed<Status>(() => {
    const u = this.utilization();
    if (u >= 0.9) return 'crit';
    if (u >= 0.6) return 'warn';
    return 'ok';
  });

  protected readonly dotCount = computed(() => Math.max(3, Math.min(MAX_DOTS, Math.round(this.rps() / 3000) + 3)));
  protected readonly dotIndices = computed(() => Array.from({ length: this.dotCount() }, (_, i) => i));
  protected readonly dotDuration = computed(() => Math.max(0.35, 1.9 - this.utilization() * 1.4));

  onSlider(ev: Event): void {
    this.rps.set(+(ev.target as HTMLInputElement).value);
  }

  formatNumber(n: number): string {
    return n.toLocaleString('en-US');
  }
}
