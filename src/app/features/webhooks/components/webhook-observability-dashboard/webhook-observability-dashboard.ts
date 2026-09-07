import { Component, OnDestroy, signal } from '@angular/core';

@Component({
  selector: 'app-webhook-observability-dashboard',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-observability">
      <div class="container">
        <p class="lab-index mono">24 — OBSERVING THE PIPELINE</p>
        <h2 class="lab-title">If you can't see failure rate, you'll find out from a customer</h2>
        <p class="lab-lede">A production webhook dispatcher needs the same class of dashboard as any other critical pipeline.</p>

        <div class="lab-panel">
          <div class="metrics-grid">
            <div class="metric-tile"><span class="metric-value mono">{{ m().perMin }}</span><span class="metric-label mono">Deliveries / min</span></div>
            <div class="metric-tile"><span class="metric-value mono">{{ m().successRate }}%</span><span class="metric-label mono">Success rate</span></div>
            <div class="metric-tile" [class.is-bad]="m().failureRate > 8"><span class="metric-value mono">{{ m().failureRate }}%</span><span class="metric-label mono">Failure rate</span></div>
            <div class="metric-tile"><span class="metric-value mono">{{ m().retryRate }}%</span><span class="metric-label mono">Retry rate</span></div>
            <div class="metric-tile"><span class="metric-value mono">{{ m().p95 }}ms</span><span class="metric-label mono">p95 latency</span></div>
            <div class="metric-tile"><span class="metric-value mono">{{ m().p99 }}ms</span><span class="metric-label mono">p99 latency</span></div>
            <div class="metric-tile" [class.is-bad]="m().timeoutRate > 5"><span class="metric-value mono">{{ m().timeoutRate }}%</span><span class="metric-label mono">Timeout rate</span></div>
            <div class="metric-tile"><span class="metric-value mono">{{ m().queueDepth }}</span><span class="metric-label mono">Queue depth</span></div>
            <div class="metric-tile" [class.is-bad]="m().oldestPendingSec > 30"><span class="metric-value mono">{{ m().oldestPendingSec }}s</span><span class="metric-label mono">Oldest pending delivery</span></div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-danger" (click)="simulateIncident()">SIMULATE AN INCIDENT</button>
            <button type="button" class="lab-btn" (click)="reset()">RESET</button>
          </div>
          <p class="lab-note">Watch failure rate, timeout rate, and oldest-pending-delivery rise together during the simulated incident — that combination is usually the earliest reliable signal something downstream broke, well before customers start reporting missed events.</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    @media (min-width: 640px) { .metrics-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (min-width: 1000px) { .metrics-grid { grid-template-columns: repeat(9, 1fr); } }
    .metric-tile { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 8px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); transition: border-color 0.2s ease; }
    .metric-tile.is-bad { border-color: color-mix(in srgb, var(--failure) 50%, var(--border)); }
    .metric-value { font-size: 1.0625rem; color: var(--text); font-weight: 700; }
    .metric-tile.is-bad .metric-value { color: var(--failure); }
    .metric-label { font-size: 0.6875rem; color: var(--text-faint); text-align: center; }
    .lab-btn-row { margin-top: 20px; }
  `,
})
export class WebhookObservabilityDashboard implements OnDestroy {
  protected readonly m = signal({
    perMin: 420, successRate: 98, failureRate: 2, retryRate: 3, p95: 180, p99: 410, timeoutRate: 1, queueDepth: 12, oldestPendingSec: 4,
  });
  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnDestroy(): void { if (this.timer) clearInterval(this.timer); }

  protected simulateIncident(): void {
    if (this.timer) clearInterval(this.timer);
    let step = 0;
    this.timer = setInterval(() => {
      step++;
      this.m.set({
        perMin: 380 - step * 4,
        successRate: Math.max(60, 98 - step * 3),
        failureRate: Math.min(35, 2 + step * 3),
        retryRate: Math.min(40, 3 + step * 3),
        p95: 180 + step * 90,
        p99: 410 + step * 220,
        timeoutRate: Math.min(20, 1 + step * 2),
        queueDepth: 12 + step * 18,
        oldestPendingSec: 4 + step * 8,
      });
      if (step >= 8 && this.timer) { clearInterval(this.timer); this.timer = null; }
    }, 400);
  }

  protected reset(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.m.set({ perMin: 420, successRate: 98, failureRate: 2, retryRate: 3, p95: 180, p99: 410, timeoutRate: 1, queueDepth: 12, oldestPendingSec: 4 });
  }
}
