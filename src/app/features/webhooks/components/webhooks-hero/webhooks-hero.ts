import { Component, OnDestroy, signal } from '@angular/core';

type DeliveryPhase = 'idle' | 'event' | 'signed' | 'sent' | 'received' | 'broken';

@Component({
  selector: 'app-webhooks-hero',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section hero-section wh-scene" id="wh-hero">
      <div class="bg-grid" aria-hidden="true"></div>
      <div class="container hero-inner">
        <p class="eyebrow mono">WEBHOOKS</p>
        <h1 class="hero-title">How does a server call YOU?</h1>
        <p class="hero-lede">
          A webhook flips the usual direction: instead of your code asking a provider for updates, the provider's
          server pushes an HTTP request into yours the moment something happens. Trigger an event below and watch
          the delivery travel.
        </p>

        <div class="lab-panel hero-panel">
          <div class="topology">
            <div class="node node-provider" [class.is-active]="phase() !== 'idle' && phase() !== 'broken'">
              <span class="node-label mono">PROVIDER</span>
              <span class="node-sub mono">{{ providerLabel() }}</span>
            </div>
            <span class="lab-flow-arrow" [class.is-live]="phase() === 'sent'">&rarr;</span>
            <div class="node node-internet">
              <span class="node-label mono">INTERNET</span>
              <span class="node-sub mono">public HTTPS POST</span>
            </div>
            <span class="lab-flow-arrow" [class.is-live]="phase() === 'sent'">&rarr;</span>
            <div class="node node-server" [class.is-active]="phase() === 'received'" [class.is-broken]="phase() === 'broken'">
              <span class="node-label mono">YOUR ENDPOINT</span>
              <span class="status-row">
                <span class="pulse-dot" [class.is-danger]="phase() === 'broken'" aria-hidden="true"></span>
                <span class="node-sub mono">{{ endpointLabel() }}</span>
              </span>
            </div>
          </div>

          <div class="log-line mono" aria-live="polite">{{ logLine() }}</div>

          <div class="stat-grid" role="group" aria-label="Delivery stats">
            <div class="stat-tile">
              <span class="stat-value mono">{{ eventsSent() }}</span>
              <span class="stat-label mono">EVENTS SENT</span>
            </div>
            <div class="stat-tile">
              <span class="stat-value mono">{{ delivered() }}</span>
              <span class="stat-label mono">DELIVERED</span>
            </div>
            <div class="stat-tile">
              <span class="stat-value mono">{{ broken() }}</span>
              <span class="stat-label mono">FAILED</span>
            </div>
          </div>
        </div>

        <div class="cta-row">
          <button type="button" class="lab-btn lab-btn-primary" (click)="triggerEvent()" [disabled]="isAnimating()">
            TRIGGER AN EVENT
          </button>
          <button type="button" class="lab-btn lab-btn-danger" (click)="breakDelivery()" [disabled]="isAnimating()">
            BREAK THE DELIVERY
          </button>
        </div>
        <p class="lab-note">
          A webhook is just: <strong>something happened on their server, so their server made an HTTP request to
          yours to tell you about it</strong> — no polling, no asking. Everything below this section is what has to
          go right (and what commonly goes wrong) between "something happened" and "your code safely reacted to it."
        </p>
      </div>
    </section>
  `,
  styles: `
    .wh-scene {
      --success: #4ade80;
      --pending: var(--accent);
      --retry: #fbbf24;
      --failure: var(--danger);
      --security: #a78bfa;
      --info: var(--accent-2);
    }

    .hero-section { position: relative; padding-block: 96px 64px; overflow: hidden; border-top: none; }
    .hero-inner { position: relative; z-index: 1; }

    .eyebrow { font-size: 0.8125rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--pending); margin-bottom: 16px; }
    .eyebrow::before { background: var(--pending); box-shadow: 0 0 8px color-mix(in srgb, var(--pending) 45%, transparent); }
    .hero-title { font-size: clamp(2.25rem, 1.6rem + 2.8vw, 3.75rem); max-width: 820px; }
    .hero-lede { margin-top: 18px; max-width: 660px; font-size: 1.0625rem; color: var(--text-muted); line-height: 1.65; }

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
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }
    .node-provider.is-active { border-color: var(--pending); box-shadow: 0 0 0 1px color-mix(in srgb, var(--pending) 25%, transparent); }
    .node-server.is-active { border-color: var(--success); box-shadow: 0 0 0 1px color-mix(in srgb, var(--success) 25%, transparent); }
    .node-server.is-broken { border-color: var(--failure); box-shadow: 0 0 0 1px color-mix(in srgb, var(--failure) 25%, transparent); }
    .node-label { font-size: 0.8125rem; color: var(--text); letter-spacing: 0.06em; font-weight: 700; }
    .node-sub { font-size: 0.6875rem; color: var(--text-faint); }

    .status-row { display: inline-flex; align-items: center; gap: 6px; }
    .pulse-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--success);
      box-shadow: 0 0 8px color-mix(in srgb, var(--success) 60%, transparent);
      animation: pulse 1.6s ease-in-out infinite;
    }
    .pulse-dot.is-danger { background: var(--failure); box-shadow: 0 0 8px color-mix(in srgb, var(--failure) 60%, transparent); }
    @media (prefers-reduced-motion: reduce) { .pulse-dot { animation: none; } }
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } }

    .lab-flow-arrow.is-live { color: var(--pending); animation: arrow-flash 0.6s ease-in-out infinite; }
    @media (prefers-reduced-motion: reduce) { .lab-flow-arrow.is-live { animation: none; } }
    @keyframes arrow-flash { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

    .log-line { margin-top: 18px; font-size: 0.75rem; color: var(--text-faint); min-height: 1.2em; }

    .stat-grid {
      margin-top: 20px; padding-top: 24px; border-top: 1px solid var(--border);
      display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px;
    }
    .stat-tile { display: flex; flex-direction: column; gap: 6px; padding: 14px 16px; background: var(--surface-elevated); border: 1px solid var(--border); border-radius: var(--radius-sm); }
    .stat-value { font-size: 1.75rem; font-weight: 700; color: var(--text); line-height: 1; }
    .stat-label { font-size: 0.625rem; letter-spacing: 0.08em; color: var(--text-faint); }

    .cta-row { margin-top: 32px; display: flex; flex-wrap: wrap; gap: 12px; }
  `,
})
export class WebhooksHero implements OnDestroy {
  protected readonly phase = signal<DeliveryPhase>('idle');
  protected readonly eventsSent = signal(0);
  protected readonly delivered = signal(0);
  protected readonly broken = signal(0);
  protected readonly isAnimating = signal(false);
  protected readonly logLine = signal('Waiting for the first event…');

  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }

  protected providerLabel(): string {
    switch (this.phase()) {
      case 'event': return 'order.created fired';
      case 'signed': return 'signing payload…';
      case 'sent': return 'POSTing to your URL';
      default: return 'idle — waiting for an event';
    }
  }

  protected endpointLabel(): string {
    switch (this.phase()) {
      case 'received': return '200 OK — acknowledged';
      case 'broken': return 'connection refused';
      default: return 'listening for POST /webhooks';
    }
  }

  protected triggerEvent(): void {
    if (this.isAnimating()) return;
    this.isAnimating.set(true);
    this.eventsSent.update((n) => n + 1);
    this.logLine.set('order.created event created on the provider…');
    this.phase.set('event');

    this.after(500, () => {
      this.phase.set('signed');
      this.logLine.set('Provider signs the payload with the shared webhook secret…');
    });
    this.after(1100, () => {
      this.phase.set('sent');
      this.logLine.set('HTTP POST travels across the public internet to your endpoint…');
    });
    this.after(1900, () => {
      this.phase.set('received');
      this.delivered.update((n) => n + 1);
      this.logLine.set('Your endpoint verifies the signature and returns 200 OK.');
    });
    this.after(3200, () => {
      this.phase.set('idle');
      this.logLine.set('Delivery complete. Trigger another event, or break one on purpose.');
      this.isAnimating.set(false);
    });
  }

  protected breakDelivery(): void {
    if (this.isAnimating()) return;
    this.isAnimating.set(true);
    this.eventsSent.update((n) => n + 1);
    this.phase.set('event');
    this.logLine.set('order.created event created on the provider…');

    this.after(500, () => {
      this.phase.set('sent');
      this.logLine.set('HTTP POST sent — but your endpoint is slow, down, or misconfigured…');
    });
    this.after(1600, () => {
      this.phase.set('broken');
      this.broken.update((n) => n + 1);
      this.logLine.set('Delivery failed. A well-built provider will retry this — your system needs to be ready for that.');
    });
    this.after(3200, () => {
      this.phase.set('idle');
      this.logLine.set('Trigger another event, or break one on purpose.');
      this.isAnimating.set(false);
    });
  }

  private after(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }
}
