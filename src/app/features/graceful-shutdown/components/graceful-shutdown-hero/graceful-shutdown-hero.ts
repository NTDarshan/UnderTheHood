import { Component, OnDestroy, signal } from '@angular/core';

@Component({
  selector: 'app-graceful-shutdown-hero',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section hero-section gs-scene" id="gs-hero">
      <div class="bg-grid" aria-hidden="true"></div>
      <div class="container hero-inner">
        <p class="eyebrow mono">GRACEFUL SHUTDOWN</p>
        <h1 class="hero-title">What happens when a server needs to die?</h1>
        <p class="hero-lede">
          Graceful shutdown lets a backend stop safely — without unnecessarily abandoning users, work, or resources.
        </p>

        <div class="lab-panel hero-panel">
          <div class="topology">
            <div class="node node-clients">
              <span class="node-label mono">CLIENTS</span>
              <span class="node-sub mono">sending requests</span>
            </div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="node node-lb">
              <span class="node-label mono">LOAD BALANCER</span>
              <span class="node-sub mono">routing traffic</span>
            </div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="node node-server">
              <span class="node-label mono">API SERVER</span>
              <span class="status-row">
                <span class="pulse-dot" aria-hidden="true"></span>
                <span class="node-sub mono">HEALTHY &mdash; ACCEPTING TRAFFIC</span>
              </span>
            </div>
          </div>

          <div class="stat-grid" role="group" aria-label="Live server state">
            <div class="stat-tile">
              <span class="stat-value mono">{{ activeRequests() }}</span>
              <span class="stat-label mono">ACTIVE REQUESTS</span>
            </div>
            <div class="stat-tile">
              <span class="stat-value mono">{{ queuedRequests() }}</span>
              <span class="stat-label mono">QUEUED REQUESTS</span>
            </div>
            <div class="stat-tile">
              <span class="stat-value mono">{{ dbConnections() }}</span>
              <span class="stat-label mono">DB CONNECTIONS</span>
            </div>
            <div class="stat-tile">
              <span class="stat-value mono">{{ backgroundJobs() }}</span>
              <span class="stat-label mono">BACKGROUND JOBS</span>
            </div>
          </div>
        </div>

        <div class="cta-row">
          <a
            class="lab-btn lab-btn-primary"
            href="#gs-graceful-lab"
            (click)="scrollToSection($event, 'gs-graceful-lab')"
            >START THE SHUTDOWN</a
          >
          <a
            class="lab-btn lab-btn-danger"
            href="#gs-hard-lab"
            (click)="scrollToSection($event, 'gs-hard-lab')"
            >KILL IT IMMEDIATELY</a
          >
        </div>
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

    .hero-section { position: relative; padding-block: 96px 64px; overflow: hidden; border-top: none; }
    .hero-inner { position: relative; z-index: 1; }

    .eyebrow { font-size: 0.8125rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--running); margin-bottom: 16px; }
    .eyebrow::before { background: var(--running); box-shadow: 0 0 8px color-mix(in srgb, var(--running) 45%, transparent); }
    .hero-title { font-size: clamp(2.25rem, 1.6rem + 2.8vw, 3.75rem); max-width: 820px; }
    .hero-lede { margin-top: 18px; max-width: 640px; font-size: 1.0625rem; color: var(--text-muted); line-height: 1.65; }

    .hero-panel { margin-top: 40px; }

    .topology { display: flex; align-items: stretch; gap: 12px; flex-wrap: wrap; }
    .node {
      flex: 1;
      min-width: 150px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 20px 14px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      text-align: center;
    }
    .node-clients { border-color: var(--resource); }
    .node-lb { border-color: var(--queue); }
    .node-server { border-color: var(--running); box-shadow: 0 0 0 1px color-mix(in srgb, var(--running) 25%, transparent); }
    .node-label { font-size: 0.8125rem; color: var(--text); letter-spacing: 0.06em; font-weight: 700; }
    .node-sub { font-size: 0.6875rem; color: var(--text-faint); }

    .status-row { display: inline-flex; align-items: center; gap: 6px; }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--running);
      box-shadow: 0 0 8px color-mix(in srgb, var(--running) 60%, transparent);
      animation: pulse 1.6s ease-in-out infinite;
    }
    @media (prefers-reduced-motion: reduce) {
      .pulse-dot { animation: none; }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.3); }
    }

    .stat-grid {
      margin-top: 28px;
      padding-top: 24px;
      border-top: 1px solid var(--border);
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
    }
    .stat-tile {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 14px 16px;
      background: var(--surface-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
    }
    .stat-value { font-size: 1.75rem; font-weight: 700; color: var(--text); line-height: 1; }
    .stat-label { font-size: 0.625rem; letter-spacing: 0.08em; color: var(--text-faint); }

    .cta-row { margin-top: 32px; display: flex; flex-wrap: wrap; gap: 12px; }
  `,
})
export class GracefulShutdownHero implements OnDestroy {
  protected readonly activeRequests = signal(7);
  protected readonly queuedRequests = signal(3);
  protected readonly dbConnections = signal(4);
  protected readonly backgroundJobs = signal(2);

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Subtle live jitter so the hero feels like a running system, not a screenshot.
    this.timer = setInterval(() => {
      this.activeRequests.set(this.jitter(7, 3, 12));
      this.queuedRequests.set(this.jitter(3, 0, 6));
      this.dbConnections.set(this.jitter(4, 2, 8));
    }, 2200);
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  protected scrollToSection(event: Event, id: string): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private jitter(base: number, min: number, max: number): number {
    const delta = Math.round((Math.random() - 0.5) * 4);
    return Math.min(max, Math.max(min, base + delta));
  }
}
