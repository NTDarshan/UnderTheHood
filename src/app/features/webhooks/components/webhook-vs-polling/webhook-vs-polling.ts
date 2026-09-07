import { Component, OnDestroy, signal } from '@angular/core';

@Component({
  selector: 'app-webhook-vs-polling',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-vs-polling">
      <div class="container">
        <p class="lab-index mono">02 — WEBHOOK VS POLLING</p>
        <h2 class="lab-title">Two ways to find out something happened</h2>
        <p class="lab-lede">
          Before webhooks existed, the only option was to keep asking. Run both side by side — polling repeatedly
          asks "did anything change yet?"; the webhook waits and gets told once, exactly when it matters.
        </p>

        <div class="lab-panel">
          <div class="race-grid">
            <div class="race-col">
              <p class="race-heading mono">POLLING</p>
              <div class="race-track" aria-live="polite">
                @for (req of pollRequests(); track $index) {
                  <span class="race-req mono" [class.is-hit]="req">{{ req ? '200 (changed)' : '200 (nothing new)' }}</span>
                }
              </div>
            </div>
            <div class="race-col">
              <p class="race-heading mono">WEBHOOK</p>
              <div class="race-track" aria-live="polite">
                @if (webhookFired()) {
                  <span class="race-req mono is-hit">POST /webhook (changed)</span>
                } @else {
                  <span class="race-req mono is-waiting">waiting…</span>
                }
              </div>
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="run()" [disabled]="running()">RUN THE RACE</button>
          </div>

          <div class="table-wrap">
            <table class="cmp-table mono">
              <thead>
                <tr><th></th><th>Polling</th><th>Webhook</th></tr>
              </thead>
              <tbody>
                <tr><td>Who initiates</td><td>Your client, repeatedly</td><td>The provider, once, when it happens</td></tr>
                <tr><td>Timing</td><td>Bounded by poll interval</td><td>Near-immediate</td></tr>
                <tr><td>Latency</td><td>Up to one full interval</td><td>Network + processing time only</td></tr>
                <tr><td>Unnecessary requests</td><td>Most requests find nothing new</td><td>None — only sent when something happened</td></tr>
                <tr><td>Complexity</td><td>Simple to build, easy to reason about</td><td>Requires a public endpoint, security, retries</td></tr>
                <tr><td>Reliability</td><td>Client controls retry entirely</td><td>Depends on provider retry behavior and your endpoint</td></tr>
              </tbody>
            </table>
          </div>
          <p class="lab-note">Neither is universally "better" — polling is still the right tool for reconciliation, current-state checks, and providers that don't support webhooks at all. That tradeoff comes back later in this chapter.</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .race-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
    @media (min-width: 720px) { .race-grid { grid-template-columns: 1fr 1fr; } }
    .race-heading { font-size: 0.75rem; color: var(--text-faint); letter-spacing: 0.08em; margin-bottom: 10px; }
    .race-track { display: flex; flex-wrap: wrap; gap: 8px; min-height: 40px; align-content: flex-start; }
    .race-req { font-size: 0.6875rem; padding: 6px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); color: var(--text-faint); background: var(--surface); }
    .race-req.is-hit { border-color: var(--success); color: var(--success); background: color-mix(in srgb, var(--success) 10%, var(--surface)); }
    .race-req.is-waiting { color: var(--text-faint); }
    .lab-btn-row { margin-top: 20px; }
    .table-wrap { margin-top: 24px; overflow-x: auto; }
    .cmp-table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
    .cmp-table th, .cmp-table td { text-align: left; padding: 10px 14px; border-bottom: 1px solid var(--border); white-space: nowrap; }
    .cmp-table th { color: var(--text-faint); font-weight: 600; }
    .cmp-table td:first-child { color: var(--text-muted); }
    .cmp-table td:nth-child(2), .cmp-table td:nth-child(3) { color: var(--text); white-space: normal; }
  `,
})
export class WebhookVsPolling implements OnDestroy {
  protected readonly pollRequests = signal<boolean[]>([]);
  protected readonly webhookFired = signal(false);
  protected readonly running = signal(false);
  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnDestroy(): void { this.timers.forEach(clearTimeout); }

  protected run(): void {
    if (this.running()) return;
    this.running.set(true);
    this.pollRequests.set([]);
    this.webhookFired.set(false);

    for (let i = 0; i < 6; i++) {
      this.timers.push(setTimeout(() => {
        this.pollRequests.update((list) => [...list, i === 5]);
      }, i * 500));
    }
    this.timers.push(setTimeout(() => this.webhookFired.set(true), 2600));
    this.timers.push(setTimeout(() => this.running.set(false), 3200));
  }
}
