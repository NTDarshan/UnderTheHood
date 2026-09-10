import { Component, OnDestroy, signal } from '@angular/core';

interface Span {
  id: string;
  name: string;
  startMs: number;
  durationMs: number;
}

interface Hop {
  key: string;
  label: string;
  sub: string;
}

const HOPS: Hop[] = [
  { key: 'api', label: 'API', sub: 'gateway / router' },
  { key: 'service', label: 'SERVICE', sub: 'business logic' },
  { key: 'database', label: 'DATABASE', sub: 'query execution' },
  { key: 'external', label: 'EXTERNAL API', sub: 'third-party call' },
];

const TRACE: Span[] = [
  { id: 'api', name: 'API gateway — route + auth', startMs: 0, durationMs: 12 },
  { id: 'service', name: 'Service — handle request', startMs: 10, durationMs: 96 },
  { id: 'database', name: 'Database — SELECT orders', startMs: 22, durationMs: 34 },
  { id: 'external', name: 'External API — pricing lookup', startMs: 60, durationMs: 44 },
];

@Component({
  selector: 'app-observability-control-room',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section do-scene" id="do-observability">
      <div class="container">
        <p class="lab-index mono">04 — OBSERVABILITY CONTROL ROOM</p>
        <h2 class="lab-title">How do you know the backend is healthy?</h2>
        <p class="lab-lede">
          Three signal types answer that question together. <strong>Logs</strong> are discrete events — what
          happened, in detail. <strong>Metrics</strong> are aggregated numbers over time — how much, how often, how
          fast. <strong>Traces</strong> follow one request across every hop it touches, so you can see exactly where
          time went.
        </p>

        <div class="lab-panel">
          <div class="pillars-row" role="group" aria-label="The three pillars of observability">
            <div class="pillar">
              <span class="pillar-label mono">LOGS</span>
              <span class="pillar-sub">Discrete, timestamped events</span>
            </div>
            <div class="pillar">
              <span class="pillar-label mono">METRICS</span>
              <span class="pillar-sub">Aggregated numbers over time</span>
            </div>
            <div class="pillar">
              <span class="pillar-label mono">TRACES</span>
              <span class="pillar-sub">One request, every hop it touched</span>
            </div>
          </div>

          <div class="request-row" role="group" aria-label="A request traveling through the backend">
            @for (hop of HOPS; track hop.key; let last = $last) {
              <div class="hop" [class.is-active]="activeHop() === hop.key" [class.is-done]="isDone(hop.key)">
                <span class="hop-label mono">{{ hop.label }}</span>
                <span class="hop-sub">{{ hop.sub }}</span>
                <div class="hop-signals mono" aria-hidden="true">
                  <span class="signal-chip" [class.is-lit]="isDone(hop.key)">log</span>
                  <span class="signal-chip" [class.is-lit]="isDone(hop.key)">metric</span>
                  <span class="signal-chip" [class.is-lit]="isDone(hop.key)">span</span>
                </div>
              </div>
              @if (!last) {
                <span class="hop-arrow" [class.is-live]="activeHop() === hop.key">&rarr;</span>
              }
            }
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="sendRequest()" [disabled]="isRunning()">
              SEND A REQUEST
            </button>
            <button type="button" class="lab-btn" (click)="toggleInspect()" [disabled]="!requestComplete()">
              {{ inspecting() ? 'HIDE TRACE' : 'INSPECT THIS REQUEST' }}
            </button>
          </div>

          @if (inspecting() && requestComplete()) {
            <div class="waterfall" aria-label="Trace waterfall">
              <p class="waterfall-heading mono">TRACE trace-id: {{ traceId() }} &middot; total {{ totalDurationMs }}ms</p>
              @for (span of TRACE; track span.id) {
                <div class="waterfall-row">
                  <span class="waterfall-name mono">{{ span.name }}</span>
                  <div class="waterfall-track">
                    <div
                      class="waterfall-bar"
                      [class.is-slow]="span.durationMs > 60"
                      [style.left.%]="(span.startMs / totalDurationMs) * 100"
                      [style.width.%]="(span.durationMs / totalDurationMs) * 100"
                    ></div>
                  </div>
                  <span class="waterfall-duration mono">{{ span.durationMs }}ms</span>
                </div>
              }
              <p class="lab-note">
                The service span (96ms) contains the database (34ms) and external API (44ms) calls nested inside
                it — the waterfall makes it obvious the external pricing lookup is the biggest single contributor to
                total latency, something a log line alone would never show you.
              </p>
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
      --do-pending: #64748b;
    }

    .pillars-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 28px; }
    .pillar {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 14px 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
    }
    .pillar-label { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; color: var(--do-cyan); }
    .pillar-sub { font-size: 0.75rem; color: var(--text-faint); line-height: 1.4; }

    .request-row {
      display: flex;
      align-items: stretch;
      gap: 6px;
      flex-wrap: wrap;
      padding-top: 24px;
      border-top: 1px solid var(--border);
    }
    .hop {
      flex: 1;
      min-width: 130px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 16px 10px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      text-align: center;
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }
    .hop.is-active { border-color: var(--do-accent); box-shadow: 0 0 0 1px color-mix(in srgb, var(--do-accent) 30%, transparent), 0 0 16px color-mix(in srgb, var(--do-accent) 25%, transparent); }
    .hop.is-done { border-color: color-mix(in srgb, var(--do-success) 40%, var(--border)); }
    .hop-label { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.05em; color: var(--text); }
    .hop-sub { font-size: 0.6875rem; color: var(--text-faint); }
    .hop-signals { display: flex; gap: 4px; margin-top: 4px; }
    .signal-chip {
      font-size: 0.5625rem;
      padding: 2px 6px;
      border-radius: 999px;
      border: 1px solid var(--border-strong);
      color: var(--text-faint);
      opacity: 0.5;
      transition: opacity 0.2s ease, color 0.2s ease, border-color 0.2s ease;
    }
    .signal-chip.is-lit { opacity: 1; color: var(--do-success); border-color: color-mix(in srgb, var(--do-success) 45%, var(--border-strong)); }

    .hop-arrow { display: flex; align-items: center; color: var(--text-faint); font-size: 0.8125rem; padding: 0 2px; }
    .hop-arrow.is-live { color: var(--do-accent); animation: arrow-flash 0.6s ease-in-out infinite; }
    @keyframes arrow-flash { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
    @media (prefers-reduced-motion: reduce) { .hop-arrow.is-live { animation: none; } }

    .waterfall { margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border); }
    .waterfall-heading { font-size: 0.75rem; color: var(--text-faint); margin-bottom: 14px; }
    .waterfall-row {
      display: grid;
      grid-template-columns: minmax(140px, 1fr) 2fr 50px;
      align-items: center;
      gap: 10px;
      padding: 6px 0;
    }
    .waterfall-name { font-size: 0.75rem; color: var(--text-muted); }
    .waterfall-track { position: relative; height: 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; }
    .waterfall-bar { position: absolute; top: 0; bottom: 0; background: var(--do-cyan); border-radius: 2px; }
    .waterfall-bar.is-slow { background: var(--do-warning); }
    .waterfall-duration { font-size: 0.75rem; color: var(--text-faint); text-align: right; }
  `,
})
export class ObservabilityControlRoom implements OnDestroy {
  protected readonly HOPS = HOPS;
  protected readonly TRACE = TRACE;
  protected readonly totalDurationMs = Math.max(...TRACE.map((s) => s.startMs + s.durationMs));

  protected readonly activeHop = signal<string | null>(null);
  protected readonly requestComplete = signal(false);
  protected readonly inspecting = signal(false);
  protected readonly isRunning = signal(false);
  protected readonly traceId = signal(this.generateTraceId());

  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }

  protected isDone(hopKey: string): boolean {
    if (!this.requestComplete() && this.activeHop() === null) return false;
    const order = HOPS.findIndex((h) => h.key === hopKey);
    const activeOrder = this.activeHop() ? HOPS.findIndex((h) => h.key === this.activeHop()) : HOPS.length;
    return this.requestComplete() || order < activeOrder;
  }

  protected sendRequest(): void {
    if (this.isRunning()) return;
    this.isRunning.set(true);
    this.requestComplete.set(false);
    this.inspecting.set(false);
    this.traceId.set(this.generateTraceId());
    this.activeHop.set(null);

    let elapsed = 0;
    HOPS.forEach((hop, i) => {
      elapsed += 350;
      this.after(elapsed, () => this.activeHop.set(hop.key));
    });
    this.after(elapsed + 350, () => {
      this.activeHop.set(null);
      this.requestComplete.set(true);
      this.isRunning.set(false);
    });
  }

  protected toggleInspect(): void {
    if (!this.requestComplete()) return;
    this.inspecting.update((v) => !v);
  }

  private generateTraceId(): string {
    return Math.random().toString(16).slice(2, 10);
  }

  private after(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }
}
