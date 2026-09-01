import { Component, signal } from '@angular/core';

type Step = 1 | 2 | 3;

interface Span {
  name: string;
  widthPct: number;
  offsetPct: number;
  crit: boolean;
}

const TRACE_SPANS: Span[] = [
  { name: 'HTTP handler', widthPct: 100, offsetPct: 0, crit: false },
  { name: 'auth check', widthPct: 8, offsetPct: 2, crit: false },
  { name: 'orders service', widthPct: 82, offsetPct: 12, crit: false },
  { name: 'database query', widthPct: 62, offsetPct: 18, crit: true },
  { name: 'serialize response', widthPct: 6, offsetPct: 88, crit: false },
];

@Component({
  selector: 'app-observability-console',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="observability-console">
      <div class="container">
        <p class="lab-index">33 &mdash; OBSERVABILITY: METRICS, LOGS, TRACES</p>
        <h2 class="lab-title">Metrics tell you something is wrong. Traces tell you where. Logs tell you why.</h2>
        <p class="lab-lede">
          Walk through one real investigation, click by click, exactly as an on-call engineer
          would move through it.
        </p>

        <div class="lab-panel">
          <div class="breadcrumb">
            <span class="crumb mono" [class.crumb-active]="step() >= 1" [class.crumb-done]="step() > 1">1. METRIC</span>
            <span class="crumb-arrow" aria-hidden="true">&rarr;</span>
            <span class="crumb mono" [class.crumb-active]="step() >= 2" [class.crumb-done]="step() > 2">2. TRACE</span>
            <span class="crumb-arrow" aria-hidden="true">&rarr;</span>
            <span class="crumb mono" [class.crumb-active]="step() >= 3">3. LOG</span>
          </div>

          @if (step() === 1) {
            <div class="pillar-panel">
              <p class="pillar-label mono">METRICS</p>
              <p class="pillar-desc">A dashboard alert fires. P99 latency on the orders endpoint has spiked.</p>
              <button type="button" class="metric-chart" (click)="goTo(2)" aria-label="P99 latency spike — click to investigate in traces">
                <svg viewBox="0 0 300 90" class="chart-svg" aria-hidden="true">
                  <polyline points="0,70 40,68 80,66 120,64 150,60 170,20 190,12 210,18 240,22 270,20 300,18"
                    fill="none" stroke="var(--crit)" stroke-width="2.5" />
                  <line x1="0" y1="70" x2="300" y2="70" stroke="var(--border-strong)" stroke-width="1" />
                </svg>
                <p class="chart-caption mono">P99 LATENCY ↑ &mdash; 180ms → 2,400ms &middot; click to investigate</p>
              </button>
            </div>
          }

          @if (step() === 2) {
            <div class="pillar-panel">
              <p class="pillar-label mono">TRACES</p>
              <p class="pillar-desc">One trace for a slow /orders request. Click the span that dominates the timeline.</p>
              <div class="waterfall">
                @for (span of spans; track span.name) {
                  <div class="wf-row">
                    <p class="wf-name mono">{{ span.name }}</p>
                    <div class="wf-track">
                      @if (span.crit) {
                        <button
                          type="button"
                          class="wf-bar wf-bar-crit"
                          [style.width.%]="span.widthPct"
                          [style.margin-left.%]="span.offsetPct"
                          (click)="goTo(3)"
                          aria-label="Database span — 1240ms — click to view logs"
                        ></button>
                      } @else {
                        <div class="wf-bar" [style.width.%]="span.widthPct" [style.margin-left.%]="span.offsetPct"></div>
                      }
                    </div>
                  </div>
                }
              </div>
              <p class="lab-note lab-note-warn">The database query span is highlighted — it accounts for most of the request's duration. Click it.</p>
            </div>
          }

          @if (step() === 3) {
            <div class="pillar-panel">
              <p class="pillar-label mono">LOGS</p>
              <p class="pillar-desc">The trace points at the database span. The logs from that span confirm why it was slow.</p>
              <pre class="lab-code log-line"><span class="tok-status-err">[WARN]</span> <span class="tok-key">slow query detected</span> &mdash; <span class="tok-method">1240ms</span> &mdash; <span class="tok-dim">SELECT * FROM orders WHERE customer_id = ? AND status = 'pending' ORDER BY created_at DESC</span></pre>
              <p class="lab-note"><strong>Root cause:</strong> a missing index on <span class="mono">(customer_id, status)</span> forces a full table scan under load.</p>
            </div>
          }

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" (click)="restart()">Restart investigation</button>
          </div>

          <p class="lab-lede closing-line">
            This is how engineers actually investigate a production incident &mdash; starting broad
            with metrics, narrowing to where with traces, then confirming why with logs.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      --ok: #4ade80;
      --warn: var(--accent);
      --crit: var(--danger);
      --c-client: var(--accent-2);
      --c-compute: #60a5fa;
      --c-db: #a78bfa;
      --c-cache: #2dd4bf;
      --c-queue: #fbbf24;
    }

    .breadcrumb { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .crumb {
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      color: var(--text-faint);
      padding: 6px 10px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
    }
    .crumb-active { color: var(--accent-strong); border-color: var(--accent-dim); }
    .crumb-done { color: var(--accent-2); border-color: var(--accent-2-dim); }
    .crumb-arrow { color: var(--text-faint); }

    .pillar-panel { margin-top: 24px; }
    .pillar-label { font-size: 0.6875rem; color: var(--accent-2); letter-spacing: 0.08em; }
    .pillar-desc { margin-top: 8px; font-size: 0.9375rem; color: var(--text-muted); max-width: 560px; }

    .metric-chart {
      margin-top: 18px;
      display: block;
      width: 100%;
      max-width: 500px;
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      padding: 16px;
      text-align: left;
      transition: border-color 0.15s ease;
    }
    .metric-chart:hover { border-color: var(--crit); }
    .chart-svg { width: 100%; height: auto; display: block; }
    .chart-caption { margin-top: 10px; font-size: 0.75rem; color: var(--crit); }

    .waterfall { margin-top: 18px; display: flex; flex-direction: column; gap: 10px; max-width: 600px; }
    .wf-row { display: grid; grid-template-columns: 140px 1fr; align-items: center; gap: 10px; }
    .wf-name { font-size: 0.6875rem; color: var(--text-muted); }
    .wf-track { position: relative; height: 20px; background: var(--surface); border-radius: var(--radius-sm); }
    .wf-bar { height: 100%; border-radius: var(--radius-sm); background: var(--c-compute); display: block; }
    .wf-bar-crit {
      background: var(--crit);
      box-shadow: 0 0 10px rgba(255, 93, 93, 0.4);
      border: none;
      cursor: pointer;
    }

    .log-line { margin-top: 18px; max-width: 640px; }

    .closing-line { margin-top: 28px; padding-top: 18px; border-top: 1px solid var(--border); }
  `,
})
export class ObservabilityConsole {
  protected readonly spans = TRACE_SPANS;
  protected readonly step = signal<Step>(1);

  goTo(step: Step): void {
    this.step.set(step);
  }

  restart(): void {
    this.step.set(1);
  }
}
