import { Component, OnDestroy, signal } from '@angular/core';

interface LogEntry { text: string; kind: 'info' | 'ok' | 'warn'; }

@Component({
  selector: 'app-duplicate-delivery-and-idempotency',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-idempotency">
      <div class="container">
        <p class="lab-index mono">10 — DUPLICATES ARE NORMAL</p>
        <h2 class="lab-title">Why the same event can arrive twice — and how to survive it</h2>
        <p class="lab-lede">
          A network failure right after your server processed the event, but before the provider saw your response,
          looks identical to "nothing happened" from the provider's side. It will retry. Toggle idempotency and
          replay the same scenario.
        </p>

        <div class="lab-panel">
          <div class="lab-toggle-row">
            <button type="button" class="lab-btn" [attr.aria-pressed]="idempotencyOn()" (click)="idempotencyOn.set(!idempotencyOn())">
              IDEMPOTENCY STORE: {{ idempotencyOn() ? 'ON' : 'OFF' }}
            </button>
            <button type="button" class="lab-btn lab-btn-primary" (click)="run()" [disabled]="running()">SIMULATE NETWORK FAILURE + RETRY</button>
          </div>

          <div class="log-panel mono" aria-live="polite">
            @for (l of log(); track $index) {
              <div class="log-line" [attr.data-kind]="l.kind">{{ l.text }}</div>
            }
          </div>

          <div class="stat-grid">
            <div class="stat-tile"><span class="stat-value mono">{{ ordersCreated() }}</span><span class="stat-label mono">ORDERS ACTUALLY CREATED</span></div>
            <div class="stat-tile"><span class="stat-value mono">{{ deliveries() }}</span><span class="stat-label mono">DELIVERY ATTEMPTS SEEN</span></div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .lab-toggle-row { display: flex; flex-wrap: wrap; gap: 10px; }
    .log-panel { margin-top: 20px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; min-height: 140px; display: flex; flex-direction: column; gap: 6px; }
    .log-line { font-size: 0.75rem; color: var(--text-muted); }
    .log-line[data-kind='ok'] { color: var(--success); }
    .log-line[data-kind='warn'] { color: var(--failure); }
    .stat-grid { margin-top: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
    .stat-tile { display: flex; flex-direction: column; gap: 6px; padding: 14px 16px; background: var(--surface-elevated); border: 1px solid var(--border); border-radius: var(--radius-sm); }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--text); }
    .stat-label { font-size: 0.625rem; letter-spacing: 0.06em; color: var(--text-faint); }
  `,
})
export class DuplicateDeliveryAndIdempotency implements OnDestroy {
  protected readonly idempotencyOn = signal(true);
  protected readonly log = signal<LogEntry[]>([]);
  protected readonly running = signal(false);
  protected readonly ordersCreated = signal(0);
  protected readonly deliveries = signal(0);
  private timers: ReturnType<typeof setTimeout>[] = [];
  private seenEventIds = new Set<string>();

  ngOnDestroy(): void { this.timers.forEach(clearTimeout); }

  protected run(): void {
    if (this.running()) return;
    this.running.set(true);
    this.log.set([]);
    const eventId = 'evt_3f9a2b';

    this.push(`Delivery #1 arrives — event ${eventId}`, 'info');
    this.deliveries.update((n) => n + 1);

    this.after(500, () => {
      this.push('Endpoint processes the event: creates the order, charges the card.', 'info');
      this.processEvent(eventId, false);
    });
    this.after(1300, () => {
      this.push('Response lost in transit — provider never sees your 200 OK.', 'warn');
    });
    this.after(2100, () => {
      this.push('Provider times out waiting, assumes failure, and retries.', 'warn');
    });
    this.after(2900, () => {
      this.push(`Delivery #2 arrives — same event ${eventId}`, 'info');
      this.deliveries.update((n) => n + 1);
      this.processEvent(eventId, true);
    });
    this.after(3700, () => {
      this.running.set(false);
    });
  }

  private processEvent(eventId: string, isRetry: boolean): void {
    if (this.idempotencyOn() && isRetry && this.seenEventIds.has(eventId)) {
      this.push('Idempotency store recognizes this event id already processed — returns the same safe result without repeating the side effect.', 'ok');
      return;
    }
    this.seenEventIds.add(eventId);
    this.ordersCreated.update((n) => n + 1);
    if (isRetry && !this.idempotencyOn()) {
      this.push('No idempotency check — the order is created a second time. A duplicate order now exists.', 'warn');
    } else {
      this.push('Order created and recorded as processed for this event id.', 'ok');
    }
  }

  private push(text: string, kind: LogEntry['kind']): void {
    this.log.update((l) => [...l, { text, kind }]);
  }

  private after(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }
}
