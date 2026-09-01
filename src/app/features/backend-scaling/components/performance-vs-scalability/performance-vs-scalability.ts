import { Component, computed, signal } from '@angular/core';

interface Example {
  key: string;
  label: string;
  tag: string;
  latencyMs: number;
  latencyNote: string;
  servers: number[];
  throughput: number[];
  bottleneck: string;
  verdict: string;
}

const EXAMPLES: Example[] = [
  {
    key: 'fast-not-scalable',
    label: 'Fast but not scalable',
    tag: 'HIGH PERFORMANCE / LOW SCALABILITY',
    latencyMs: 12,
    latencyNote: 'Hand-tuned single server, aggressive caching, hot code paths.',
    servers: [1, 2, 4, 8],
    throughput: [520, 540, 555, 560],
    bottleneck: 'A single-writer database serializes every write — adding app servers just means more servers queueing on the same lock.',
    verdict: 'Great single-request latency, but throughput barely moves as you add servers. The bottleneck moved to the database, not the app tier.',
  },
  {
    key: 'scalable-inefficient',
    label: 'Scalable but inefficient',
    tag: 'LOW PERFORMANCE / HIGH SCALABILITY',
    latencyMs: 220,
    latencyNote: 'Unoptimized queries, no caching, wasteful per-request work.',
    servers: [1, 2, 4, 8],
    throughput: [50, 100, 200, 400],
    bottleneck: 'No shared bottleneck — each server does its own slow, wasteful work independently, so more servers means proportionally more total throughput.',
    verdict: 'Every request is slow, but throughput scales almost linearly with server count. Horizontal scaling works because nothing shared gets in the way.',
  },
  {
    key: 'fast-and-scalable',
    label: 'Fast AND scalable',
    tag: 'HIGH PERFORMANCE / HIGH SCALABILITY',
    latencyMs: 20,
    latencyNote: 'Optimized code path AND no shared serialization point.',
    servers: [1, 2, 4, 8],
    throughput: [500, 1000, 2000, 4000],
    bottleneck: 'Stateless app tier, sharded/replicated data layer — no single resource that every server has to fight over.',
    verdict: 'Low latency per request, and throughput doubles as servers double. This is the target: optimize the instance, then remove shared bottlenecks.',
  },
];

const CHART_W = 240;
const CHART_H = 100;

@Component({
  selector: 'app-performance-vs-scalability',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="performance-vs-scalability">
      <div class="container">
        <p class="lab-index">26 — PERFORMANCE VS SCALABILITY</p>
        <h2 class="lab-title">Fast and scalable are not the same axis.</h2>
        <p class="lab-lede">
          These two get conflated constantly. A system can be blazing fast and still fail to scale — or slow per
          request and still handle enormous load. Keep them as two separate questions.
        </p>

        <div class="lab-panel">
          <div class="def-grid">
            <div class="def-card">
              <p class="def-label mono pill pill-yes">PERFORMANCE</p>
              <p class="def-question">How efficiently does <strong>one instance</strong> perform?</p>
              <p class="def-example mono">e.g. 100ms → 60ms after optimizing a single server / query</p>
            </div>
            <div class="def-card">
              <p class="def-label mono pill pill-conditional">SCALABILITY</p>
              <p class="def-question">How does the system behave as <strong>workload grows</strong>?</p>
              <p class="def-example mono">e.g. 1 server → 10 servers handling proportionally more load</p>
            </div>
          </div>

          <div class="lab-btn-row example-tabs" role="tablist" aria-label="Example system">
            @for (ex of examples; track ex.key) {
              <button type="button" class="lab-btn" role="tab" [attr.aria-selected]="selected().key === ex.key"
                [class.is-active]="selected().key === ex.key" (click)="select(ex)">
                {{ ex.label }}
              </button>
            }
          </div>

          <div class="example-panel">
            <p class="example-tag mono">{{ selected().tag }}</p>

            <div class="example-grid">
              <div class="metric-card">
                <p class="metric-label mono">PERFORMANCE — LATENCY / REQUEST</p>
                <p class="metric-value mono">{{ selected().latencyMs }} ms</p>
                <p class="metric-note">{{ selected().latencyNote }}</p>
              </div>

              <div class="metric-card">
                <p class="metric-label mono">SCALABILITY — THROUGHPUT VS SERVERS</p>
                <svg class="chart-svg" [attr.viewBox]="'0 0 ' + chartW + ' ' + chartH" preserveAspectRatio="none">
                  <line x1="0" [attr.y1]="chartH - 1" [attr.x2]="chartW" [attr.y2]="chartH - 1" class="chart-baseline" />
                  @for (bar of bars(); track bar.servers) {
                    <rect [attr.x]="bar.x" [attr.y]="bar.y" [attr.width]="bar.width" [attr.height]="bar.height" class="chart-bar" />
                    <text [attr.x]="bar.x + bar.width / 2" [attr.y]="chartH - 6" class="chart-bar-label mono" text-anchor="middle">{{ bar.servers }}</text>
                  }
                </svg>
                <p class="metric-note chart-axis-note mono">servers running →</p>
              </div>
            </div>

            <p class="lab-note bottleneck-note">
              <strong>Why:</strong> {{ selected().bottleneck }}
            </p>
            <p class="lab-note-warn lab-note">
              {{ selected().verdict }}
            </p>
          </div>
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

    .def-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 640px) { .def-grid { grid-template-columns: 1fr 1fr; } }

    .def-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px; }
    .def-label { display: inline-flex; margin-bottom: 12px; }
    .def-question { font-size: 1rem; color: var(--text); line-height: 1.5; }
    .def-question strong { color: var(--accent-strong); }
    .def-example { margin-top: 10px; font-size: 0.75rem; color: var(--text-faint); }

    .example-tabs { margin-top: 28px; }

    .example-panel { margin-top: 20px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 20px; }
    .example-tag { color: var(--accent-2); letter-spacing: 0.08em; font-size: 0.6875rem; margin-bottom: 14px; }

    .example-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 640px) { .example-grid { grid-template-columns: 1fr 1fr; } }

    .metric-card { background: var(--surface-elevated); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; }
    .metric-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.06em; }
    .metric-value { font-size: 2rem; color: var(--c-compute); margin-top: 8px; }
    .metric-note { margin-top: 8px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.5; }

    .chart-svg { width: 100%; height: 100px; margin-top: 10px; }
    .chart-baseline { stroke: var(--border); stroke-width: 1; }
    .chart-bar { fill: var(--ok); }
    .chart-bar-label { fill: var(--text-faint); font-size: 9px; }
    .chart-axis-note { text-align: center; margin-top: 2px; color: var(--text-faint); }

    .bottleneck-note strong { color: var(--text); }
  `,
})
export class PerformanceVsScalability {
  protected readonly examples = EXAMPLES;
  protected readonly chartW = CHART_W;
  protected readonly chartH = CHART_H;

  protected readonly selected = signal<Example>(EXAMPLES[0]);

  select(ex: Example): void {
    this.selected.set(ex);
  }

  protected readonly bars = computed(() => {
    const ex = this.selected();
    const max = Math.max(...EXAMPLES.flatMap((e) => e.throughput));
    const n = ex.servers.length;
    const gap = 10;
    const barW = (this.chartW - gap * (n + 1)) / n;
    const usableH = this.chartH - 22;

    return ex.servers.map((s, i) => {
      const value = ex.throughput[i];
      const h = Math.max(2, (value / max) * usableH);
      return {
        servers: s,
        x: gap + i * (barW + gap),
        width: barW,
        y: usableH - h + 2,
        height: h,
      };
    });
  });
}
