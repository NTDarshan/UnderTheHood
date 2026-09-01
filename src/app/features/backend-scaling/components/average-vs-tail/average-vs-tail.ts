import { Component, computed, signal } from '@angular/core';

const SAMPLE_COUNT = 100;
const OUTLIER_VALUES = [900, 1500, 3000];

// Deterministic base latencies in the 40-80ms range — no Math.random(), so
// builds and screenshots stay reproducible.
const BASE_LATENCIES: number[] = Array.from({ length: SAMPLE_COUNT }, (_, i) => 40 + ((i * 37) % 41));

// Indices (spread evenly across the 100 samples) that become "slow requests"
// as the slow-request count is turned up.
const OUTLIER_INDICES: number[] = Array.from({ length: 20 }, (_, i) => (i * 5 + 2) % SAMPLE_COUNT);

function percentile(sorted: number[], p: number): number {
  const rank = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.min(sorted.length - 1, Math.max(0, rank))];
}

@Component({
  selector: 'app-average-vs-tail',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section bs-scene" id="average-misleading">
      <div class="container">
        <p class="lab-index">02 — WHY AVERAGES LIE</p>
        <h2 class="lab-title">100 requests. One average. A very different story underneath.</h2>
        <p class="lab-lede">
          Here are 100 real request latencies from the same endpoint. Look at the average first — then look at
          what it's hiding.
        </p>

        <div class="lab-panel">
          <div class="avg-callout">
            <p class="avg-label mono">AVERAGE LATENCY</p>
            <p class="avg-value mono">{{ average().toFixed(0) }} ms</p>
          </div>
          <p class="prompt-line">Would you call this system fast?</p>

          @if (!revealed()) {
            <button type="button" class="lab-btn lab-btn-primary" (click)="revealed.set(true)">
              Reveal the individual requests
            </button>
          } @else {
            <div class="strip" role="img" aria-label="100 request latencies as vertical bars, slow outliers highlighted">
              @for (v of latencies(); track $index) {
                <div
                  class="bar"
                  [class.is-slow]="v >= 900"
                  [style.height.%]="barHeight(v)"
                  [attr.title]="v + 'ms'"
                ></div>
              }
            </div>

            <div class="lab-field slow-field">
              <label for="slow-count">Number of slow requests ({{ slowCount() }} of 100)</label>
              <input
                id="slow-count"
                type="range"
                min="0"
                max="20"
                step="1"
                [value]="slowCount()"
                (input)="onSlowCountInput($event)"
              />
            </div>

            <div class="stat-row">
              <div class="metric">
                <p class="metric-label mono">AVERAGE</p>
                <p class="metric-value mono">{{ average().toFixed(0) }} ms</p>
              </div>
              <div class="metric">
                <p class="metric-label mono">P99 (TAIL LATENCY)</p>
                <p class="metric-value mono is-crit">{{ p99() }} ms</p>
              </div>
            </div>

            <p class="lab-note">
              Notice how little the average moves as slow requests are added — a handful of very slow requests
              barely shift a mean pulled down by 95+ fast ones. The
              <strong>P99</strong> — the value only the slowest 1% of requests exceed — moves dramatically instead.
              This is why engineers talk about <strong>tail latency</strong>: the experience of the worst-off
              requests, which the average actively conceals.
            </p>
          }
        </div>

        <p class="lab-note-warn lab-note">
          Not every request takes the average time. An average is a single summary number computed across many
          different individual latencies — some users always sit out on the tail.
        </p>
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

    .avg-callout { text-align: center; padding: 20px; }
    .avg-label { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--text-faint); margin-bottom: 8px; }
    .avg-value { font-size: 2.5rem; color: var(--ok); }

    .prompt-line { text-align: center; font-size: 1.0625rem; color: var(--text); font-weight: 600; margin-bottom: 20px; }

    .strip { display: flex; align-items: flex-end; gap: 2px; height: 140px; margin-top: 24px; padding: 8px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .bar { flex: 1; min-width: 2px; background: var(--c-client); opacity: 0.75; border-radius: 1px 1px 0 0; transition: height 0.35s ease, background 0.2s ease; }
    .bar.is-slow { background: var(--crit); opacity: 1; }

    .slow-field { margin-top: 20px; max-width: 420px; }
    .slow-field input[type='range'] { width: 100%; }

    .stat-row { display: flex; gap: 16px; margin-top: 24px; flex-wrap: wrap; }
    .metric { padding: 12px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); min-width: 140px; }
    .metric-label { font-size: 0.625rem; letter-spacing: 0.06em; color: var(--text-faint); margin-bottom: 6px; }
    .metric-value { font-size: 1.25rem; color: var(--text); }
    .metric-value.is-crit { color: var(--crit); }
  `,
})
export class AverageVsTail {
  protected readonly revealed = signal(false);
  protected readonly slowCount = signal(5);

  protected readonly latencies = computed(() => {
    const n = this.slowCount();
    const activeOutliers = new Set(OUTLIER_INDICES.slice(0, n));
    return BASE_LATENCIES.map((base, i) => {
      if (!activeOutliers.has(i)) return base;
      const outlierPos = OUTLIER_INDICES.indexOf(i);
      return OUTLIER_VALUES[outlierPos % OUTLIER_VALUES.length];
    });
  });

  protected readonly average = computed(() => {
    const values = this.latencies();
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  });

  protected readonly p99 = computed(() => {
    const sorted = [...this.latencies()].sort((a, b) => a - b);
    return percentile(sorted, 99);
  });

  onSlowCountInput(ev: Event): void {
    this.slowCount.set(+(ev.target as HTMLInputElement).value);
  }

  barHeight(v: number): number {
    // Square-root scale keeps the strip readable even with 3000ms outliers
    // next to 40ms typical requests.
    const maxV = Math.sqrt(3000);
    return Math.max(4, (Math.sqrt(v) / maxV) * 100);
  }
}
