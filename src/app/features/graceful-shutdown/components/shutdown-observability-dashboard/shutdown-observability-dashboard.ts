import { Component, ElementRef, OnDestroy, ViewChild, signal } from '@angular/core';

interface Metrics {
  activeRequests: number;
  completedRequests: number;
  cancelledRequests: number;
  queueDepth: number;
  dbConnections: number;
  backgroundJobs: number;
  shutdownDurationMs: number;
  errors: number;
}

interface LogLine {
  t: string;
  text: string;
}

const START: Metrics = {
  activeRequests: 42,
  completedRequests: 0,
  cancelledRequests: 0,
  queueDepth: 18,
  dbConnections: 12,
  backgroundJobs: 6,
  shutdownDurationMs: 0,
  errors: 0,
};

const LOG_SCRIPT: { text: string; delay: number; apply: (m: Metrics) => Metrics }[] = [
  { text: 'Shutdown requested (SIGTERM received)', delay: 0, apply: (m) => ({ ...m }) },
  {
    text: 'Server marked unready — load balancer stops routing new traffic',
    delay: 500,
    apply: (m) => ({ ...m, queueDepth: Math.max(0, m.queueDepth - 6) }),
  },
  {
    text: 'Draining in-flight requests',
    delay: 1400,
    apply: (m) => ({
      ...m,
      activeRequests: Math.round(m.activeRequests * 0.35),
      completedRequests: m.completedRequests + Math.round(m.activeRequests * 0.6),
      cancelledRequests: m.cancelledRequests + Math.round(m.activeRequests * 0.05),
      queueDepth: 0,
    }),
  },
  {
    text: 'Stopping background workers and job consumers',
    delay: 1400,
    apply: (m) => ({
      ...m,
      backgroundJobs: Math.max(0, m.backgroundJobs - 4),
      activeRequests: Math.round(m.activeRequests * 0.4),
      completedRequests: m.completedRequests + Math.round(m.activeRequests * 0.6),
    }),
  },
  {
    text: 'Closing database connections and remaining resources',
    delay: 1400,
    apply: (m) => ({
      ...m,
      dbConnections: 0,
      backgroundJobs: 0,
      activeRequests: 0,
      completedRequests: m.completedRequests + m.activeRequests,
    }),
  },
  {
    text: 'Shutdown complete — process exiting cleanly',
    delay: 1000,
    apply: (m) => ({ ...m }),
  },
];

@Component({
  selector: 'app-shutdown-observability-dashboard',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="gs-observability">
      <div class="container">
        <p class="lab-index">21 — SHUTDOWN OBSERVABILITY</p>
        <h2 class="lab-title">Watch the metrics move while the server winds down.</h2>
        <p class="lab-lede">
          A shutdown isn't instantaneous, and it shouldn't be invisible either. A well-instrumented server exposes
          the same signals during shutdown that it does while running — so on-call engineers can tell "draining
          normally" from "stuck" instead of guessing.
        </p>

        <div class="gs-scene dash-scene lab-panel">
          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="simulate()" [disabled]="running()">
              {{ running() ? 'Shutting down…' : 'Simulate shutdown' }}
            </button>
            <button type="button" class="lab-btn" (click)="reset()" [disabled]="running()">Reset</button>
          </div>

          <div class="dash-grid">
            <div class="metrics-panel">
              <p class="panel-title mono">LIVE METRICS</p>
              <div class="metric-grid">
                <div class="metric">
                  <span class="metric-label mono">ACTIVE REQUESTS</span>
                  <span class="metric-value mono" [class.metric-warn]="metrics().activeRequests > 0 && phaseIdx() >= 2">{{ metrics().activeRequests }}</span>
                </div>
                <div class="metric">
                  <span class="metric-label mono">COMPLETED</span>
                  <span class="metric-value mono metric-good">{{ metrics().completedRequests }}</span>
                </div>
                <div class="metric">
                  <span class="metric-label mono">CANCELLED</span>
                  <span class="metric-value mono" [class.metric-bad]="metrics().cancelledRequests > 0">{{ metrics().cancelledRequests }}</span>
                </div>
                <div class="metric">
                  <span class="metric-label mono">QUEUE DEPTH</span>
                  <span class="metric-value mono">{{ metrics().queueDepth }}</span>
                </div>
                <div class="metric">
                  <span class="metric-label mono">DB CONNECTIONS</span>
                  <span class="metric-value mono">{{ metrics().dbConnections }}</span>
                </div>
                <div class="metric">
                  <span class="metric-label mono">BACKGROUND JOBS</span>
                  <span class="metric-value mono">{{ metrics().backgroundJobs }}</span>
                </div>
                <div class="metric">
                  <span class="metric-label mono">SHUTDOWN DURATION</span>
                  <span class="metric-value mono">{{ (metrics().shutdownDurationMs / 1000).toFixed(1) }}s</span>
                </div>
                <div class="metric">
                  <span class="metric-label mono">ERRORS</span>
                  <span class="metric-value mono" [class.metric-bad]="metrics().errors > 0">{{ metrics().errors }}</span>
                </div>
              </div>
            </div>

            <div class="log-panel">
              <p class="panel-title mono">SHUTDOWN LOG</p>
              <div class="log-scroll" #logScroll>
                @if (logs().length === 0) {
                  <p class="log-empty mono">Waiting for shutdown signal…</p>
                }
                @for (line of logs(); track $index) {
                  <p class="log-line mono"><span class="log-ts">{{ line.t }}</span> {{ line.text }}</p>
                }
              </div>
            </div>
          </div>
        </div>

        <p class="lab-note">
          Notice the ordering: active requests drop while completed climbs — most in-flight work finishes normally
          during the drain window. A small cancelled count is the honest cost of a bounded grace period; the goal is
          minimizing that number, not pretending it can always be zero.
        </p>
      </div>
    </section>
  `,
  styles: `
    .gs-scene {
      --running: #4ade80;
      --draining: var(--accent);
      --stopped: var(--danger);
      --idle: #64748b;
      --signal: #a78bfa;
      --resource: #60a5fa;
      --queue: #fbbf24;
      --cancelled: #f472b6;
    }

    .dash-scene { display: flex; flex-direction: column; gap: 20px; }

    .dash-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }
    @media (min-width: 900px) { .dash-grid { grid-template-columns: 1.3fr 1fr; } }

    .metrics-panel, .log-panel {
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
      padding: 16px;
    }

    .panel-title {
      font-size: 0.6875rem;
      letter-spacing: 0.1em;
      color: var(--text-faint);
      margin: 0 0 14px;
    }

    .metric-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    @media (min-width: 480px) and (max-width: 899px) { .metric-grid { grid-template-columns: repeat(4, 1fr); } }

    .metric {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 10px 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--surface-raised);
    }
    .metric-label { font-size: 0.625rem; letter-spacing: 0.05em; color: var(--text-faint); }
    .metric-value { font-size: 1.25rem; color: var(--text); transition: color 0.2s ease; }
    .metric-good { color: var(--running); }
    .metric-warn { color: var(--draining); }
    .metric-bad { color: var(--cancelled); }

    .log-scroll {
      height: 220px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .log-empty { color: var(--text-faint); font-size: 0.8125rem; }
    .log-line {
      font-size: 0.75rem;
      color: var(--text-muted);
      line-height: 1.5;
      animation: gs-log-in 0.3s ease;
    }
    .log-ts { color: var(--signal); margin-right: 6px; }

    @keyframes gs-log-in {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (prefers-reduced-motion: reduce) {
      .log-line { animation: none; }
    }
  `,
})
export class ShutdownObservabilityDashboard implements OnDestroy {
  @ViewChild('logScroll') private logScrollRef?: ElementRef<HTMLDivElement>;

  protected readonly metrics = signal<Metrics>({ ...START });
  protected readonly logs = signal<LogLine[]>([]);
  protected readonly running = signal(false);
  protected readonly phaseIdx = signal(0);

  private timeouts: ReturnType<typeof setTimeout>[] = [];
  private startedAt = 0;
  private durationTimer: ReturnType<typeof setInterval> | null = null;

  ngOnDestroy(): void {
    this.clearAll();
  }

  protected simulate(): void {
    if (this.running()) return;
    this.reset();
    this.running.set(true);
    this.startedAt = performance.now();

    this.durationTimer = setInterval(() => {
      this.metrics.update((m) => ({ ...m, shutdownDurationMs: performance.now() - this.startedAt }));
    }, 100);

    let cumulativeDelay = 0;
    LOG_SCRIPT.forEach((step, idx) => {
      cumulativeDelay += step.delay;
      const t = setTimeout(() => {
        this.phaseIdx.set(idx);
        this.metrics.update((m) => step.apply(m));
        this.logs.update((l) => [...l, { t: this.timestamp(), text: step.text }]);
        setTimeout(() => this.scrollLogToBottom(), 0);
        if (idx === LOG_SCRIPT.length - 1) {
          this.running.set(false);
          if (this.durationTimer) {
            clearInterval(this.durationTimer);
            this.durationTimer = null;
          }
        }
      }, cumulativeDelay);
      this.timeouts.push(t);
    });
  }

  protected reset(): void {
    this.clearAll();
    this.running.set(false);
    this.phaseIdx.set(0);
    this.metrics.set({ ...START });
    this.logs.set([]);
  }

  private scrollLogToBottom(): void {
    const el = this.logScrollRef?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  private timestamp(): string {
    const elapsed = (performance.now() - this.startedAt) / 1000;
    return `[+${elapsed.toFixed(1)}s]`;
  }

  private clearAll(): void {
    this.timeouts.forEach((t) => clearTimeout(t));
    this.timeouts = [];
    if (this.durationTimer) {
      clearInterval(this.durationTimer);
      this.durationTimer = null;
    }
  }
}
