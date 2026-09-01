import { Component, computed, signal } from '@angular/core';

const BUCKET_COUNT = 24;
const BUCKET_WIDTH_MS = 15; // each bucket spans 15ms, chart covers 0-360ms
const CHART_W = 640;
const CHART_H = 220;

interface Bucket {
  index: number;
  startMs: number;
  endMs: number;
  count: number;
}

interface Marker {
  label: string;
  p: number;
  ms: number;
  x: number;
}

@Component({
  selector: 'app-percentiles-lab',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section bs-scene" id="percentiles">
      <div class="container">
        <p class="lab-index">03 — P50 / P90 / P95 / P99</p>
        <h2 class="lab-title">Percentiles are positions in a distribution, not requests.</h2>
        <p class="lab-lede">
          This is the same shape of curve you saw form from the 100 request bars — many fast requests, a long
          thin tail of slow ones. Reshape it with the tail control and watch where each percentile marker lands.
        </p>

        <div class="lab-panel">
          <svg
            class="chart"
            [attr.viewBox]="'0 0 ' + chartW + ' ' + chartH"
            role="img"
            aria-label="Right-skewed histogram of request latency with P50, P90, P95 and P99 markers"
          >
            @for (b of histogram().buckets; track b.index) {
              <rect
                [attr.x]="barX(b.index)"
                [attr.y]="barY(b.count)"
                [attr.width]="barWidth()"
                [attr.height]="barHeight(b.count)"
                class="hist-bar"
              />
            }

            @for (m of markers(); track m.label) {
              <g>
                <line [attr.x1]="m.x" [attr.y1]="0" [attr.x2]="m.x" [attr.y2]="chartH - 24" class="marker-line" [class]="'marker-' + m.label" />
                <text [attr.x]="m.x" [attr.y]="chartH - 6" class="marker-label mono" text-anchor="middle">{{ m.label }}</text>
              </g>
            }
          </svg>

          <div class="lab-field tail-field">
            <label for="tail-slider">Tail weight — how heavy the slow tail is</label>
            <input
              id="tail-slider"
              type="range"
              min="0"
              max="100"
              step="1"
              [value]="tailWeight()"
              (input)="onTailInput($event)"
            />
          </div>

          <div class="marker-readout">
            @for (m of markers(); track m.label) {
              <div class="readout-item">
                <span class="readout-swatch" [class]="'marker-' + m.label"></span>
                <span class="mono">{{ m.label }}: {{ m.ms.toFixed(0) }}ms</span>
              </div>
            }
          </div>

          <p class="lab-note">
            <strong>P50:</strong> 50% of requests are faster than this value.
            <strong>P90:</strong> 90% are faster.
            <strong>P95:</strong> 95% are faster.
            <strong>P99:</strong> 99% are faster — this represents the experience of the slowest 1% of requests.
          </p>

          <p class="example-callout">
            Concrete scale: at 10,000 requests/minute, a P99 breaching 2 seconds means roughly
            <strong>100 requests every minute</strong> experience 2s+ latency — a small percentage that is still
            a lot of frustrated users.
          </p>
        </div>

        <p class="lab-note-warn lab-note">
          A percentile describes a <strong>position</strong> in the distribution of all requests — not "the 99th
          request" or a single request you could point to. It's the latency value below which a given percentage
          of all requests fall.
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

    .chart { width: 100%; height: auto; aspect-ratio: 640 / 220; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }

    .hist-bar { fill: var(--c-client); opacity: 0.55; }

    .marker-line { stroke-width: 2; }
    .marker-P50 { stroke: var(--ok); }
    .marker-P90 { stroke: var(--c-queue); }
    .marker-P95 { stroke: var(--warn); }
    .marker-P99 { stroke: var(--crit); }
    .marker-label { fill: var(--text-muted); font-size: 10px; }

    .tail-field { margin-top: 20px; max-width: 420px; }
    .tail-field input[type='range'] { width: 100%; }

    .marker-readout { display: flex; flex-wrap: wrap; gap: 14px 22px; margin-top: 18px; }
    .readout-item { display: inline-flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: 0.8125rem; }
    .readout-swatch { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }
    .readout-swatch.marker-P50 { background: var(--ok); }
    .readout-swatch.marker-P90 { background: var(--c-queue); }
    .readout-swatch.marker-P95 { background: var(--warn); }
    .readout-swatch.marker-P99 { background: var(--crit); }

    .example-callout { margin-top: 20px; padding: 14px 16px; background: var(--surface); border-left: 2px solid var(--accent-2-dim); border-radius: var(--radius-sm); color: var(--text-muted); font-size: 0.875rem; line-height: 1.6; }
    .example-callout strong { color: var(--text); }
  `,
})
export class PercentilesLab {
  protected readonly chartW = CHART_W;
  protected readonly chartH = CHART_H;

  protected readonly tailWeight = signal<number>(45); // 0-100

  protected readonly histogram = computed(() => {
    const t = this.tailWeight() / 100;
    const decayRate = 4 + t * 8; // heavier tail -> slower decay
    const buckets: Bucket[] = [];
    for (let i = 0; i < BUCKET_COUNT; i++) {
      const count = Math.max(1, Math.round(1000 * Math.exp(-i / decayRate)));
      buckets.push({
        index: i,
        startMs: i * BUCKET_WIDTH_MS,
        endMs: (i + 1) * BUCKET_WIDTH_MS,
        count,
      });
    }
    const total = buckets.reduce((sum, b) => sum + b.count, 0);
    let running = 0;
    const cumulative = buckets.map((b) => {
      running += b.count;
      return running / total;
    });
    return { buckets, total, cumulative };
  });

  protected readonly maxCount = computed(() => Math.max(...this.histogram().buckets.map((b) => b.count)));

  protected readonly markers = computed<Marker[]>(() => {
    const defs: { label: string; p: number }[] = [
      { label: 'P50', p: 0.5 },
      { label: 'P90', p: 0.9 },
      { label: 'P95', p: 0.95 },
      { label: 'P99', p: 0.99 },
    ];
    return defs.map((d) => {
      const ms = this.percentileMs(d.p);
      return { label: d.label, p: d.p, ms, x: this.msToX(ms) };
    });
  });

  onTailInput(ev: Event): void {
    this.tailWeight.set(+(ev.target as HTMLInputElement).value);
  }

  private percentileMs(p: number): number {
    const { buckets, cumulative } = this.histogram();
    for (let i = 0; i < buckets.length; i++) {
      if (cumulative[i] >= p) {
        const prevCum = i === 0 ? 0 : cumulative[i - 1];
        const bucket = buckets[i];
        const fracIntoBucket = (p - prevCum) / (cumulative[i] - prevCum || 1);
        return bucket.startMs + fracIntoBucket * BUCKET_WIDTH_MS;
      }
    }
    return buckets[buckets.length - 1].endMs;
  }

  private msToX(ms: number): number {
    const maxMs = BUCKET_COUNT * BUCKET_WIDTH_MS;
    return Math.min(this.chartW, (ms / maxMs) * this.chartW);
  }

  protected barWidth(): number {
    return (this.chartW / BUCKET_COUNT) * 0.8;
  }

  protected barX(index: number): number {
    return (this.chartW / BUCKET_COUNT) * index + (this.chartW / BUCKET_COUNT) * 0.1;
  }

  protected barHeight(count: number): number {
    const plotH = this.chartH - 24;
    return Math.max(1, (count / this.maxCount()) * plotH);
  }

  protected barY(count: number): number {
    const plotH = this.chartH - 24;
    return plotH - this.barHeight(count);
  }
}
