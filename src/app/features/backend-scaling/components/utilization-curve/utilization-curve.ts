import { Component, computed, signal } from '@angular/core';

type ResourceKey = 'cpu' | 'memory' | 'db-connections' | 'thread-pool' | 'network' | 'disk';

interface ResourceDef {
  key: ResourceKey;
  label: string;
  baseLatencyMs: number;
}

const RESOURCES: ResourceDef[] = [
  { key: 'cpu', label: 'CPU', baseLatencyMs: 8 },
  { key: 'memory', label: 'Memory', baseLatencyMs: 6 },
  { key: 'db-connections', label: 'DB Connections', baseLatencyMs: 12 },
  { key: 'thread-pool', label: 'Thread Pool', baseLatencyMs: 10 },
  { key: 'network', label: 'Network', baseLatencyMs: 5 },
  { key: 'disk', label: 'Disk', baseLatencyMs: 15 },
];

const UTIL_PRESETS = [20, 40, 60, 80, 90, 95, 99];

const PLANE_W = 560;
const PLANE_H = 300;
const MAX_UTIL_FOR_CURVE = 0.985;
const CHART_LATENCY_MULTIPLE_CAP = 10; // clamp drawn curve at base * this multiple

@Component({
  selector: 'app-utilization-curve',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="utilization-curve">
      <div class="container">
        <p class="lab-index">05 — UTILIZATION &amp; THE LATENCY CURVE</p>
        <h2 class="lab-title">Latency doesn't rise in a straight line with utilization.</h2>
        <p class="lab-lede">
          It stays roughly flat for a long stretch — then, as a resource approaches saturation, it bends sharply
          upward. Pick a resource and drag utilization up to see where that bend happens.
        </p>

        <div class="lab-panel">
          <div class="lab-btn-row" role="group" aria-label="Resource to visualize">
            @for (r of resources; track r.key) {
              <button type="button" class="lab-btn" [class.is-active]="resource().key === r.key" (click)="setResource(r)">
                {{ r.label }}
              </button>
            }
          </div>

          <svg class="plane" [attr.viewBox]="'0 0 ' + planeW + ' ' + planeH">
            @for (gy of gridYs; track gy) {
              <line [attr.x1]="0" [attr.y1]="toSvgY(gy)" [attr.x2]="planeW" [attr.y2]="toSvgY(gy)" class="grid-line" />
            }
            <path [attr.d]="curvePath()" class="curve-path" />
            <line [attr.x1]="toSvgX(0.7)" [attr.y1]="0" [attr.x2]="toSvgX(0.7)" [attr.y2]="planeH" class="danger-zone-line" />
            <text [attr.x]="toSvgX(0.7) + 6" [attr.y]="14" class="danger-zone-label mono">~70-80% — headroom shrinks</text>
            <circle [attr.cx]="toSvgX(utilization() / 100)" [attr.cy]="markerY()" r="7" class="marker" />
            <line [attr.x1]="toSvgX(utilization() / 100)" [attr.y1]="markerY()" [attr.x2]="toSvgX(utilization() / 100)" [attr.y2]="planeH" class="marker-drop" />
          </svg>

          <div class="axis-labels mono">
            <span>0% utilization</span>
            <span>100% utilization</span>
          </div>

          <div class="lab-btn-row" role="group" aria-label="Utilization preset">
            @for (p of utilPresets; track p) {
              <button type="button" class="lab-btn" [class.is-active]="utilization() === p" (click)="utilization.set(p)">
                {{ p }}%
              </button>
            }
          </div>

          <div class="lab-field slider-field">
            <label for="util-slider">Fine-tune utilization</label>
            <input id="util-slider" type="range" min="1" max="99" step="1" [value]="utilization()" (input)="onSlide($event)" />
          </div>

          <div class="stat-row">
            <div class="stat">
              <span class="stat-label mono">{{ resource().label.toUpperCase() }} UTILIZATION</span>
              <span class="stat-value mono">{{ utilization() }}%</span>
            </div>
            <div class="stat">
              <span class="stat-label mono">MODELED LATENCY</span>
              <span class="stat-value mono" [class.stat-warn]="isWarnZone()" [class.stat-crit]="isCritZone()">
                {{ latencyMs().toFixed(1) }} ms
              </span>
            </div>
          </div>

          <p class="lab-note">
            <strong>High utilization isn't automatically bad.</strong> A resource sitting at 60-70% utilization is
            usually doing its job efficiently — you're getting good use out of the hardware without paying a
            latency penalty for it.
          </p>
          <p class="lab-note-warn lab-note">
            <strong>Operating permanently near saturation leaves little headroom</strong> and can cause latency to
            rise sharply — small increases in load past that point translate into large increases in wait time,
            because there's no slack left to absorb variance.
          </p>
        </div>
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

    .plane { width: 100%; height: auto; aspect-ratio: 560 / 300; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); margin-top: 22px; }

    .grid-line { stroke: var(--border); stroke-width: 1; }
    .curve-path { fill: none; stroke: var(--c-compute); stroke-width: 2.5; }
    .danger-zone-line { stroke: var(--warn); stroke-width: 1; stroke-dasharray: 4 4; opacity: 0.6; }
    .danger-zone-label { fill: var(--warn); font-size: 10px; }
    .marker { fill: var(--accent-strong); stroke: var(--bg); stroke-width: 2; filter: drop-shadow(0 0 6px var(--glow-accent)); }
    .marker-drop { stroke: var(--text-faint); stroke-width: 1; stroke-dasharray: 3 3; }

    .axis-labels { display: flex; justify-content: space-between; margin-top: 6px; font-size: 0.6875rem; color: var(--text-faint); }

    .slider-field { margin-top: 20px; max-width: 360px; }

    .stat-row { margin-top: 22px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; max-width: 480px; }
    .stat { display: flex; flex-direction: column; gap: 6px; padding: 12px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .stat-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.08em; }
    .stat-value { font-size: 1.25rem; color: var(--ok); transition: color 0.2s ease; }
    .stat-value.stat-warn { color: var(--warn); }
    .stat-value.stat-crit { color: var(--crit); }
  `,
})
export class UtilizationCurve {
  protected readonly planeW = PLANE_W;
  protected readonly planeH = PLANE_H;
  protected readonly resources = RESOURCES;
  protected readonly utilPresets = UTIL_PRESETS;
  protected readonly gridYs = [0, 0.25, 0.5, 0.75, 1];

  protected readonly resource = signal<ResourceDef>(RESOURCES[0]);
  protected readonly utilization = signal<number>(60); // percent, 1-99

  private latencyAt(base: number, utilFraction: number): number {
    const u = Math.min(utilFraction, MAX_UTIL_FOR_CURVE);
    return base / (1 - u);
  }

  protected readonly latencyMs = computed(() => this.latencyAt(this.resource().baseLatencyMs, this.utilization() / 100));

  protected readonly maxChartLatency = computed(() => this.resource().baseLatencyMs * CHART_LATENCY_MULTIPLE_CAP);

  protected readonly isWarnZone = computed(() => this.utilization() >= 70 && this.utilization() < 90);
  protected readonly isCritZone = computed(() => this.utilization() >= 90);

  protected toSvgX(utilFraction: number): number {
    return utilFraction * this.planeW;
  }

  protected toSvgY(fracFromTop: number): number {
    // fracFromTop 0 = top (max latency), 1 = bottom (zero latency)
    return fracFromTop * this.planeH;
  }

  private latencyToSvgY(latency: number): number {
    const clamped = Math.min(latency, this.maxChartLatency());
    const frac = clamped / this.maxChartLatency();
    return this.planeH - frac * this.planeH;
  }

  protected readonly curvePath = computed(() => {
    const base = this.resource().baseLatencyMs;
    const points: string[] = [];
    for (let u = 1; u <= 99; u++) {
      const lat = this.latencyAt(base, u / 100);
      const x = this.toSvgX(u / 100);
      const y = this.latencyToSvgY(lat);
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return `M ${points.join(' L ')}`;
  });

  protected readonly markerY = computed(() => this.latencyToSvgY(this.latencyMs()));

  setResource(r: ResourceDef): void {
    this.resource.set(r);
  }

  onSlide(ev: Event): void {
    this.utilization.set(+(ev.target as HTMLInputElement).value);
  }
}
